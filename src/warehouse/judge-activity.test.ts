import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sha256, spec, type Snapshot } from '../tabroom/adapter.ts';
import { deriveJudgeActivity } from './judge-activity.ts';
import type { ManifestSource, RetainedManifest } from './persist-season-manifest.ts';
import { manifestDigest } from './season-coverage.ts';

function event(id: number, division: string, day: string, ballots: object[]) {
  return { id, name: division, rounds: [{
    id: 1, start_time: day + ' 09:00:00',
    sections: [{ id: 1, ballots }, { id: 2, ballots: [] }],
  }] };
}

function replayFixture(addSecondPanel = false) {
  const manifest: RetainedManifest = {
    scopeId: 'synthetic', revision: 1, predecessor: null, approval: 'test', discovery: [], tournaments: [],
  };
  const captures = new Map<string, { bytes: Uint8Array; snapshot: Snapshot }>();
  for (const id of ['1', '2']) {
    const events = id === '1' ? [
      event(11, 'Open', '2025-11-01', [
        { id: 41, entry: 101, judge: 10, judge_person: 8 },
        { id: 42, entry: 102, judge: 10, judge_person: 8 },
        { id: 43, entry: 101, judge: 12 },
        { id: 44, entry: 102, judge: 13, judge_person: 8 },
      ]),
      event(12, 'JV', '2025-11-02', [{ id: 51, entry: 103, judge: 10 }]),
    ] : [event(11, 'Open', '2026-02-01', [{ id: 61, entry: 101, judge: 10, judge_person: 8 }])];
    if (addSecondPanel && id === '1') {
      events[0].rounds[0].sections[1].ballots.push({ id: 45, entry: 101, judge: 10 });
    }
    const bytes = Buffer.from(JSON.stringify({
      id, public: true, categories: [{ judges: [{ id: 10 }, { id: 99, person: 900 }], events }],
      schools: [
        { id: 30, name: 'Southern Nazarene University', chapter: 78199, entries: [{ id: 101, event: 11 }] },
        { id: 31, name: 'Other School', entries: [{ id: 102, event: 11 }, { id: 103, event: 12, school: 30 }] },
        { id: 32, name: 'No panel evidence', entries: [{ id: 104, event: 11 }] },
      ],
    }));
    const bulk: ManifestSource = {
      id: 'capture-' + id, sha256: sha256(bytes), url: 'https://example.test/' + id,
      fetchedAt: '2026-11-23T01:00:00Z', status: 200, mediaType: 'application/json', authorization: 'anonymous public',
    };
    manifest.tournaments.push({
      id, bulk, invite: bulk, bulkAttempt: null,
      events: events.map(row => ({
        id: String(row.id), division: row.name, decision: 'included', rationale: 'fixture', type: 'policy',
        evidence: { source: bulk.id, pointer: '/categories/0/events' },
      })),
    });
    captures.set(bulk.id, { bytes, snapshot: {
      id: bulk.id, path: bulk.url, fetched_at: bulk.fetchedAt, status: bulk.status,
      media_type: bulk.mediaType, sha256: bulk.sha256, scope: { tournament: id },
      spec, parser_version: 1, visibility: 'anonymous public',
    } });
  }
  const pin = { scopeId: manifest.scopeId, revision: 1, sha256: manifestDigest(manifest) };
  return { run: () => deriveJudgeActivity(manifest, pin, captures), manifest, pin, captures };
}

test('resolves only explicit assigned people, retaining scoped links, roster status and coverage', () => {
  const { run } = replayFixture();
  const report = run();
  assert.deepEqual(report.people.map(row => row.personId), ['8']);
  const [person] = report.people;
  assert.deepEqual(person.judgeLinks.map(row => [row.tournamentId, row.judgeId]), [['1', '10'], ['1', '13'], ['2', '10']]);
  assert.equal(person.judgeLinks[0].personEvidence.length, 2);
  assert.equal(report.derivationVersion, 2);
  assert.equal(person.assignmentObservationCount, 4);
  assert.equal(person.panelAssignmentCount, 3);
  assert.equal(person.eventHistory[0].assignments.length, 2);
  assert.equal(person.repeatedAcrossTournaments, true);
  assert.equal(person.repeatedAcrossEvents, true);
  assert.equal(person.tournamentCount, 2);
  assert.equal(person.eventDivisionCount, 3);
  assert.equal(person.firstAssignmentDate, '2025-11-01');
  assert.equal(person.mostRecentAssignmentDate, '2026-02-01');
  assert.deepEqual(person.divisionDistribution, [
    { division: 'Open', eventCount: 2, assignmentObservationCount: 3, panelAssignmentCount: 2 },
    { division: 'JV', eventCount: 1, assignmentObservationCount: 1, panelAssignmentCount: 1 },
  ]);
  assert.deepEqual(person.rosterStatus, {
    assignedJudgeIdsObservedOnSeasonRosters: 2, assignedJudgeIdsAbsentFromSeasonRosters: 1,
  });
  assert.equal(report.coverage.aggregate.rosterOnly, 2);
  assert.deepEqual(report.coverage.aggregate.unlinkedJudgeIds, ['tabroom:tournament:1:judge:12']);
  assert.equal(report.coverage.aggregate.assignmentCoverageUnknown, 3);
  assert.ok(report.coverage.events.every(row => row.panelsWithoutAssignments === 1));
});

test('counts distinct panels within one round while retaining both same-panel judge IDs', () => {
  const { run } = replayFixture(true);
  const [person] = run().people;
  const [event] = person.eventHistory;
  assert.deepEqual(event.assignments.map(row => [row.roundId, row.panelId, row.judgeId]), [
    ['1', '1', '10'], ['1', '1', '13'], ['1', '2', '10'],
  ]);
  assert.equal(person.assignmentObservationCount, 5);
  assert.equal(person.panelAssignmentCount, 4);
  assert.deepEqual(person.divisionDistribution[0], {
    division: 'Open', eventCount: 2, assignmentObservationCount: 4, panelAssignmentCount: 3,
  });
  assert.deepEqual(person.schoolExposure.explicitSnu, { panelCount: 3, roundCount: 2 });
});

test('requires validated panel-entry and entry-school evidence, deduplicating school panels and rounds', () => {
  const { run } = replayFixture();
  const [person] = run().people;
  const exposure = person.schoolExposure;
  assert.equal(exposure.schoolCount, 2);
  assert.deepEqual(exposure.explicitSnu, { panelCount: 2, roundCount: 2 });
  assert.equal(exposure.panelsWithUnresolvedSchoolCoverage, 2);
  assert.deepEqual(exposure.schools.map(row => [row.schoolKey, row.panelCount, row.roundCount]), [
    ['tabroom:chapter:78199', 2, 2], ['tabroom:tournament:1:school:31', 1, 1],
  ]);
  const [open, jv] = person.eventHistory;
  const [school] = open.assignments[0].schoolObservations;
  assert.equal(school.schoolEvidence.pointer, '/schools/0');
  assert.equal(school.entryEvidence.pointer, '/schools/0/entries/0');
  assert.ok(school.panelEntryEvidence.length);
  assert.equal(jv.assignments[0].schoolObservations.length, 0);
  assert.equal(jv.assignments[0].unresolvedEntryEvidence.length, 1);
});

test('activity replay is deterministic and rejects a mismatched manifest pin and capture', () => {
  const { run, manifest, pin, captures } = replayFixture();
  assert.equal(JSON.stringify(run()), JSON.stringify(run()));
  assert.throws(() => deriveJudgeActivity(manifest, { ...pin, sha256: 'bad' }, captures), /Manifest pin mismatch/);
  assert.throws(() => deriveJudgeActivity(manifest, pin, new Map()), /Missing or mismatched pinned export/);
});

const capturesDirectory = process.env.JUDGE_ACTIVITY_CAPTURES_DIRECTORY;
test('pinned Phase A archive replays byte-for-byte and matches its published coverage', {
  skip: !capturesDirectory && 'Set JUDGE_ACTIVITY_CAPTURES_DIRECTORY to the extracted Phase A archive',
  timeout: 120_000,
}, () => {
  const base = 'docs/coverage/college-policy-2025-26-r1';
  const published = JSON.parse(readFileSync(base + '-summary.json', 'utf8'));
  const replay = () => execFileSync(process.execPath, [
    'src/warehouse/run-judge-activity.ts', base + '.json', capturesDirectory!, published.pin.sha256,
  ], { maxBuffer: 128 * 1024 * 1024, timeout: 55_000 });
  const first = replay();
  assert.ok(first.equals(replay()), 'pinned replay bytes differ');
  const report = JSON.parse(first.toString('utf8')) as ReturnType<typeof deriveJudgeActivity>;
  assert.equal(report.derivationVersion, 2);
  assert.equal(report.people.length, 401);
  assert.equal(report.people.reduce((sum, row) => sum + row.assignmentObservationCount, 0), 8868);
  assert.equal(report.people.reduce((sum, row) => sum + row.panelAssignmentCount, 0), 8868);
  assert.ok(report.people.every(row => row.assignmentObservationCount === row.panelAssignmentCount));
  assert.equal(report.people.filter(row => row.schoolExposure.explicitSnu.panelCount > 0).length, 99);
  for (const [key, expected] of Object.entries(published.aggregate)) {
    const observed = report.coverage.aggregate[key as keyof typeof report.coverage.aggregate];
    assert.equal(Array.isArray(observed) ? observed.length : observed, expected, key);
  }
  assert.deepEqual(report.coverage.aggregate.unlinkedJudgeIds, ['tabroom:tournament:36669:judge:2587546']);
  assert.equal(report.people.reduce((sum, row) => sum + row.rosterStatus.assignedJudgeIdsAbsentFromSeasonRosters, 0), 3);
  const samples = JSON.parse(readFileSync(base + '-judge-activity-samples.json', 'utf8')) as typeof report;
  assert.equal(samples.derivationVersion, report.derivationVersion);
  assert.deepEqual(samples.people, samples.people.map(sample => report.people.find(row => row.personId === sample.personId)));
});
