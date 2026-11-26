import assert from 'node:assert/strict';
import test from 'node:test';
import { mapJudgeHistory, mapParadigm } from '../src/tabroom/judge-evidence.ts';
import { createJudgeProjectionScope, projectJudgeHistory, projectParadigms } from '../src/tabroom/judge-warehouse-projection.ts';

const observedAt = '2026-01-02T00:00:00.000Z';
const people = [{ tabroomPersonId: 1, personId: 'p1' }, { tabroomPersonId: 2, personId: 'p2' }];
const evidence = (id: string) => ({ id, observedAt });

function candidate(id: string, judge: number, vote: unknown, result: unknown, panelId = 'panel') {
  const judgePersonId = 'p' + judge;
  const mapped = mapJudgeHistory([{ payload: { tournament: 12, vote, result }, evidence: evidence(id) }],
    judge, people, [{ rowEvidenceId: id, tournamentSourceId: 12, judgePersonId, panelId, evidenceId: id + '-link' }],
    { tournament: 'tournament', vote: 'vote', result: 'result' });
  if (mapped.status !== 'mapped') assert.fail('Expected mapped history');
  return {
    observation: mapped.assignments[0].observations[0], judgeId: 'judge-' + judge,
    assignmentEvidenceIds: [id + '-identity'] as const,
    voteEvidenceIds: [id + '-vote'] as const,
    resultEvidenceIds: [id + '-result'] as const,
  };
}

function scope(active: readonly string[], withheld: readonly string[] = []) {
  return createJudgeProjectionScope({
    purpose: 'synthetic-test', cutoff: observedAt, mappingVersion: 'synthetic-1',
    fixtureEvidenceIds: active.flatMap(id =>
      ['', '-link', '-identity', '-vote', '-result', '-date'].map(suffix => id + suffix))
      .filter(id => !withheld.includes(id)),
  });
}

test('counts each Person/panel and panel result once, preserving dissent and distinct flights', () => {
  const dissent = candidate('a', 1, 'aff', 'neg');
  const second = candidate('b', 2, 'neg', 'neg');
  const repeated = { ...candidate('c', 1, 'aff', 'neg'), judgeId: 'other-scoped-judge' };
  const flight = candidate('d', 1, 'neg', null, 'panel-2');
  const pinned = scope(['a', 'b', 'c', 'd']);
  const unique = projectJudgeHistory([dissent, second, repeated, flight], pinned);
  assert.deepEqual(projectJudgeHistory([flight, second, dissent, repeated, dissent], pinned), unique);
  assert.equal(unique.assignments.length, 3);
  assert.equal(unique.panelResults.length, 2);
  assert.equal(unique.assignments[0].sources.length, 2);
  assert.equal(unique.assignments[0].individualVote.value, 'aff');
  assert.equal(unique.panelResults[0].value, 'neg');
  assert.equal(unique.panelResults[1].status, 'missing');
});

test('never infers a result from ballots and keeps missing, unrecognized and conflicts separate', () => {
  const first = candidate('a', 1, 'aff', undefined);
  const second = candidate('b', 2, 'neg', 'unknown');
  const third = candidate('c', 2, 'abstained', 'neg');
  const fourth = candidate('d', 1, 'neg', 'aff');
  const pinned = scope(['a', 'b', 'c', 'd']);
  assert.equal(projectJudgeHistory([first], pinned).panelResults[0].status, 'missing');
  assert.equal(projectJudgeHistory([first, second], pinned).panelResults[0].status, 'unrecognized');
  assert.equal(projectJudgeHistory([third], pinned).assignments[0].individualVote.status, 'unrecognized');
  const conflict = projectJudgeHistory([first, second, third, fourth], pinned);
  assert.equal(conflict.panelResults[0].status, 'conflicting');
  assert.equal(conflict.assignments[0].individualVote.status, 'conflicting');
  assert.equal(conflict.assignments[1].individualVote.value, 'neg');
  assert.throws(() => projectJudgeHistory([first, candidate('a', 1, 'neg', undefined)], pinned),
    /Conflicting history observation/);
});

test('filters lineage before reconciliation and excludes observations after the cutoff', () => {
  const publicRow = candidate('a', 1, 'aff', 'neg');
  const privateRow = candidate('b', 2, 'neg', 'aff');
  const later = candidate('c', 2, 'neg', 'aff');
  const late = { ...later, observation: { ...later.observation,
    evidence: { ...later.observation.evidence, observedAt: '2026-01-03T00:00:00.000Z' } } };
  const pinned = scope(['a', 'b', 'c'], ['b-link']);
  assert.deepEqual(projectJudgeHistory([publicRow, privateRow, late], pinned),
    projectJudgeHistory([publicRow], pinned));
  const result = projectJudgeHistory([publicRow], scope(['a'], ['a-result']));
  assert.equal(result.panelResults[0].status, 'missing');
  assert.equal(result.assignments[0].individualVote.value, 'aff');
  assert.deepEqual(result.assignments[0].individualVote.observations[0].evidenceIds,
    ['a', 'a-identity', 'a-link', 'a-vote']);
});

test('keeps only eligible paradigm revisions and field lineage at the cutoff', () => {
  const mapped = mapParadigm({ id: 1, paradigm: 'Example', date: '2026-01-01' },
    1, people, evidence('a'), 'date');
  if (mapped.status !== 'mapped') assert.fail('Expected mapped paradigm');
  const row = { revision: mapped.revision, identityEvidenceIds: ['a-identity'] as const,
    reviewDateEvidenceIds: ['a-date'] as const };
  const privateRevision = { ...row, revision: { ...row.revision, text: 'Other',
    evidence: evidence('b') }, identityEvidenceIds: ['b-identity'] as const };
  const projected = projectParadigms([row, row, privateRevision], 'p1', scope(['a', 'b'], ['a-date', 'b-identity']));
  assert.equal(projected.revisions.length, 1);
  assert.equal(projected.revisions[0].sourceReviewDate, null);
  assert.deepEqual(projected.revisions[0].textEvidenceIds, ['a', 'a-identity']);
  assert.equal(projected.latest.status, 'mapped');
  assert.equal(projectParadigms([row], 'p1', scope(['a'])).revisions[0].sourceReviewDate, '2026-01-01');
});

test('rejects serving, unknown mappings and caller-forged scopes even for empty inputs', () => {
  const request = {
    purpose: 'synthetic-test' as const, cutoff: observedAt,
    mappingVersion: 'synthetic-1', fixtureEvidenceIds: ['a'],
  };
  assert.throws(() => createJudgeProjectionScope({ ...request, purpose: 'serving' }), /unavailable/);
  assert.throws(() => createJudgeProjectionScope({ ...request, mappingVersion: 'unverified' }), /unavailable/);
  assert.throws(() => createJudgeProjectionScope({ ...request, cutoff: '2026-01-02' }), /cutoff/);
  const forged = { ...scope(['a']), eligibleEvidenceIds: new Set(['a']) };
  assert.throws(() => projectJudgeHistory([], forged), /issued synthetic scope/);
  assert.throws(() => projectParadigms([], 'p1', forged), /issued synthetic scope/);
});

test('snapshots fixture eligibility and suppresses a field with an empty runtime evidence list', () => {
  const ids = new Set(['a', 'a-link', 'a-identity', 'a-result']);
  const pinned = createJudgeProjectionScope({
    purpose: 'synthetic-test', cutoff: observedAt, mappingVersion: 'synthetic-1', fixtureEvidenceIds: ids,
  });
  ids.add('a-vote');
  const row = candidate('a', 1, 'aff', 'neg');
  const empty = [] as unknown as readonly [string];
  const projected = projectJudgeHistory([{ ...row, resultEvidenceIds: empty }], pinned);
  assert.equal(projected.eligibility, 'synthetic-only');
  assert.equal(projected.assignments[0].individualVote.status, 'missing');
  assert.equal(projected.panelResults[0].status, 'missing');
});
