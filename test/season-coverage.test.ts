import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { spec, type Snapshot } from '../src/tabroom/adapter.ts';
import { manifestDigest, measureCoverage, type Manifest } from '../src/warehouse/season-coverage.ts';

function fixture() {
  const captures = new Map<string, { snapshot: Snapshot; bytes: Uint8Array }>();
  const makeTournament = (id: string, divisions: (number | null)[][][]) => {
    const entries = divisions.map((_, index) => ({ id: index + 1, event: index + 1 }));
    const events = divisions.map((assignments, index) => ({
      id: index + 1,
      rounds: [{ id: 1, sections: [{ id: 1, ballots: assignments.map(([judge, person], ballot) => ({
        id: ballot + 1, entry: index + 1, judge, judge_person: person,
      })) }] }],
    }));
    const bytes = Buffer.from(JSON.stringify({
      id, public: 'true', schools: [{ id: 1, entries }],
      categories: [{ id: 1, judges: [{ id: 1 }, { id: 9 }], events }],
    }));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    captures.set(id, { bytes, snapshot: {
      id, sha256, path: 'fixture', fetched_at: '2026-11-23T00:00:00Z', status: 200,
      media_type: 'application/json', scope: { tournament: id }, spec,
      parser_version: 1, visibility: 'anonymous public',
    } });
    return {
      id, bulk: { id, sha256 },
      events: events.map(event => ({ id: String(event.id), division: 'Division ' + event.id, decision: 'included' as const })),
    };
  };
  const manifest: Manifest = { scopeId: 'fixture', revision: 1, tournaments: [
    makeTournament('1', [[[1, 100], [1, 100], [2, null], [3, 301]], [[1, 100], [3, 302]]]),
    makeTournament('2', [[[1, 100]]]),
    { id: '3', bulk: null, events: [{ id: '1', division: 'Open', decision: 'included' }] },
  ] };
  const pin = { scopeId: manifest.scopeId, revision: manifest.revision, sha256: manifestDigest(manifest) };
  return { manifest, pin, captures };
}

test('pins the revision, decisions and export bytes', () => {
  const { manifest, pin, captures } = fixture();
  assert.throws(() => measureCoverage({ ...manifest, revision: 2 }, pin, captures), /Manifest pin mismatch/);
  const changed = structuredClone(manifest);
  changed.tournaments[0].events[0].decision = 'excluded';
  assert.throws(() => measureCoverage(changed, pin, captures), /Manifest pin mismatch/);
  captures.get('1')!.bytes = Buffer.from('{}');
  assert.throws(() => measureCoverage(manifest, pin, captures), /mismatched pinned export/);
});

test('deduplicates scoped judges and persons while retaining roster and coverage gaps', () => {
  const { manifest, pin, captures } = fixture();
  const { aggregate, events } = measureCoverage(manifest, pin, captures);
  assert.equal(aggregate.assigned, 4);
  assert.equal(aggregate.rostered, 4);
  assert.equal(aggregate.rosterOnly, 2);
  assert.equal(aggregate.linkedJudges, 2);
  assert.equal(aggregate.linkedPeople, 1);
  assert.equal(aggregate.unlinked, 1);
  assert.equal(aggregate.conflicting, 1);
  assert.equal(aggregate.duplicatePersonIds[0].judges.length, 2);
  assert.equal(aggregate.duplicatePeopleAcrossEvents[0].events.length, 3);
  assert.equal(aggregate.exportsAvailable, 3);
  assert.equal(aggregate.assignmentCoverageUnknown, 1);
  assert.equal(events[0].assigned, 3);
  assert.equal(events[1].conflicting, 1);
  assert.equal(events[3].exportAvailable, false);
});
