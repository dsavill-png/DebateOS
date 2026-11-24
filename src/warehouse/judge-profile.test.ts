import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { sha256 } from '../tabroom/adapter.ts';
import type { JudgeActivityReport } from './judge-activity.ts';
import { deriveJudgeProfile, type JudgeProfile } from './judge-profile.ts';
import type { RetainedManifest } from './persist-season-manifest.ts';
import { manifestDigest } from './season-coverage.ts';

const directory = new URL('../../docs/coverage/', import.meta.url);
const read = (suffix: string) => readFileSync(new URL('college-policy-2025-26-r1' + suffix + '.json', directory), 'utf8');
const report: Pick<JudgeActivityReport, 'manifest' | 'evidenceCutoff' | 'derivationVersion' | 'people'> =
  JSON.parse(read('-judge-activity-samples'));
const coverage: JudgeActivityReport['coverage']['events'] = JSON.parse(read('-summary')).events;

test('checked-in profiles preserve pinned activity and explicit verified-name artifacts', () => {
  const manifest: RetainedManifest = JSON.parse(read(''));
  const derived: JudgeProfile[] = ['175248', '19665', '775310'].map(personId =>
    deriveJudgeProfile(report, report.people.find(row => row.personId === personId)!, manifest, coverage));
  const committed: JudgeProfile[] = JSON.parse(read('-judge-profiles'));
  assert.deepEqual(committed.map(p => p.identity.personId), ['175248', '19665', '775310']);
  assert.deepEqual(committed.map(p => p.identity.displayName.label), ['Michael Scott', 'LaToya Green', 'Arya Persaud']);

  for (let i = 0; i < committed.length; i++) {
    const expected = derived[i];
    const actual = committed[i];
    assert.equal(actual.identity.provider, expected.identity.provider);
    assert.equal(actual.identity.personId, expected.identity.personId);
    assert.equal(actual.identity.displayName.status, 'verified');
    assert.equal(expected.identity.displayName.status, 'unresolved');
    assert.equal(expected.identity.displayName.reason, 'capture-bytes-not-provided');
    const { identity: _actualIdentity, ...actualRest } = actual;
    const { identity: _expectedIdentity, ...expectedRest } = expected;
    assert.deepEqual(actualRest, expectedRest);
  }

  const [snu, gap, undated] = committed;
  assert.deepEqual(snu.atAGlance.snuExposure, { panelCount: 2, roundCount: 2 });
  assert.equal(gap.coverage.assignedJudgeIdsAbsentFromSeasonRosters, 1);
  assert.equal(undated.atAGlance.firstAssignmentDate, null);
  assert.equal(undated.atAGlance.mostRecentAssignmentDate, null);
  assert.equal(undated.recentPanels[0].assignmentDate, null);
});

const captureDirectory = process.env.JUDGE_PROFILE_CAPTURES_DIRECTORY;
test('extracted pinned archive reproduces the checked-in verified names', { skip: !captureDirectory }, () => {
  const manifest: RetainedManifest = JSON.parse(read(''));
  const committed: JudgeProfile[] = JSON.parse(read('-judge-profiles'));
  const profiles: JudgeProfile[] = ['175248', '19665', '775310'].map(personId =>
    deriveJudgeProfile(
      report,
      report.people.find(row => row.personId === personId)!,
      manifest,
      coverage,
      tournamentId => {
        try {
          return readFileSync(`${captureDirectory}/${tournamentId}-bulk.json`);
        } catch {
          return undefined;
        }
      },
    ));
  assert.equal(JSON.stringify(profiles, null, 2) + '\n', JSON.stringify(committed, null, 2) + '\n');
});

test('a pinned roster name requires the same scoped judge and explicit ballot person ID', () => {
  const manifest: RetainedManifest = JSON.parse(read(''));
  const activity = structuredClone(report.people[0]);
  const link = activity.judgeLinks[0];
  activity.judgeLinks = [link];
  const source = manifest.tournaments.find(row => row.id === link.tournamentId)!.bulk!;
  const ballotEvidence = { snapshotId: source.id, pointer: '/categories/0/events/0/rounds/0/sections/0/ballots/0' };
  const rosterEvidence = { snapshotId: source.id, pointer: '/categories/0/judges/0' };
  link.personEvidence = [ballotEvidence];
  link.seasonRosterEvidence = [rosterEvidence];

  function derive(personId: string, judgeId: string, corrupt = false) {
    const body = {
      id: link.tournamentId,
      categories: [{
        judges: [{ id: judgeId, first: 'Synthetic', last: 'Judge' }],
        events: [{ rounds: [{ sections: [{ ballots: [{ judge: link.judgeId, judge_person: personId }] }] }] }],
      }],
    };
    const bytes = Buffer.from(JSON.stringify(body));
    source.sha256 = sha256(bytes);
    const pinned = { ...report, manifest: { ...report.manifest, sha256: manifestDigest(manifest) } };
    return deriveJudgeProfile(pinned, activity, manifest, coverage, () => corrupt ? Buffer.from('{}') : bytes);
  }

  assert.deepEqual(derive(activity.personId, link.judgeId).identity.displayName, {
    status: 'verified', label: 'Synthetic Judge', evidence: [{
      name: 'Synthetic Judge', tournamentId: link.tournamentId, judgeId: link.judgeId,
      sourceUrl: source.url, capturedAt: source.fetchedAt, sha256: source.sha256,
      rosterEvidence,
      ballotEvidence: [ballotEvidence],
    }],
  });
  assert.equal(derive('9999', link.judgeId).identity.displayName.status, 'unresolved');
  assert.equal(derive(activity.personId, '9999').identity.displayName.status, 'unresolved');
  assert.throws(() => derive(activity.personId, link.judgeId, true), /capture digest mismatch/);
});
