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

test('checked-in profiles reproduce the pinned public sample and preserve coverage and evidence', () => {
  const manifest: RetainedManifest = JSON.parse(read(''));
  const profiles: JudgeProfile[] = ['175248', '19665', '775310'].map(personId =>
    deriveJudgeProfile(report, report.people.find(row => row.personId === personId)!, manifest, coverage));
  assert.equal(JSON.stringify(profiles, null, 2) + '\n', read('-judge-profiles'));
  const [snu, gap, undated] = profiles;
  assert.deepEqual([snu, gap, undated].map(p => p.identity.personId), ['175248', '19665', '775310']);
  for (const profile of [snu, gap, undated]) {
    const activity = report.people.find(row => row.personId === profile.identity.personId)!;
    assert.equal(profile.identity.displayName.label, 'Name unresolved from public evidence');
    assert.equal(profile.atAGlance.panelAssignmentCount, activity.panelAssignmentCount);
    assert.deepEqual(profile.evidence, { judgeLinks: activity.judgeLinks, eventHistory: activity.eventHistory });
  }
  assert.deepEqual(snu.atAGlance.snuExposure, { panelCount: 2, roundCount: 2 });
  assert.equal(gap.coverage.assignedJudgeIdsAbsentFromSeasonRosters, 1);
  assert.equal(gap.identity.displayName.status, 'unresolved');
  assert.equal(gap.identity.displayName.reason, 'no-observed-roster-join');
  assert.equal(undated.atAGlance.firstAssignmentDate, null);
  assert.equal(undated.atAGlance.mostRecentAssignmentDate, null);
  assert.equal(undated.recentPanels[0].assignmentDate, null);
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
        judges: [{ id: judgeId, name: 'Synthetic Judge' }],
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
      nameEvidence: { ...rosterEvidence, pointer: rosterEvidence.pointer + '/name' },
      ballotEvidence: [ballotEvidence],
    }],
  });
  assert.equal(derive('9999', link.judgeId).identity.displayName.status, 'unresolved');
  assert.equal(derive(activity.personId, '9999').identity.displayName.status, 'unresolved');
  assert.throws(() => derive(activity.personId, link.judgeId, true), /capture digest mismatch/);
});
