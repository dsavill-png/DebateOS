import assert from 'node:assert/strict';
import test from 'node:test';
import { appendParadigmRevision, mapJudgeHistory, mapParadigm, paradigmAsOf } from '../src/tabroom/judge-evidence.ts';

const people = [{ tabroomPersonId: 42, personId: 'synthetic-person' }];
const evidence = (id: string, day = '02') => ({ id, observedAt: '2026-01-' + day + 'T00:00:00.000Z' });
const earlier = { id: '42', paradigm: 'Explain the link', reviewed: '2025-12-01' };
const later = { id: 42, paradigm: 'Explain the impact', reviewed: '2025-12-01' };

test('preserves immutable paradigm revisions, review date and as-of observation time', () => {
  const a = mapParadigm(earlier, 42, people, evidence('a'), 'reviewed');
  const b = mapParadigm(later, 42, people, evidence('b', '03'), 'reviewed');
  assert.equal(a.status, 'mapped');
  assert.equal(b.status, 'mapped');
  if (a.status !== 'mapped' || b.status !== 'mapped') assert.fail('Missing revision');
  const initial = appendParadigmRevision([], a.revision);
  const versions = appendParadigmRevision(initial, b.revision);
  assert.equal(initial.length, 1);
  assert.equal(versions.length, 2);
  assert.equal(appendParadigmRevision(versions, { ...a.revision }), versions);
  assert.throws(() => appendParadigmRevision(versions, { ...a.revision, text: 'Conflict' }), /Conflicting paradigm/);
  assert.deepEqual(paradigmAsOf(versions, people[0].personId, evidence('a').observedAt),
    { status: 'mapped', revision: a.revision });
  assert.deepEqual(paradigmAsOf(versions, people[0].personId, evidence('b', '03').observedAt),
    { status: 'mapped', revision: b.revision });
  const tied = { ...b.revision, evidence: evidence('c', '03'), text: 'Other text' };
  assert.equal(paradigmAsOf([...versions, tied], people[0].personId, tied.evidence.observedAt).status,
    'conflicting');
});

test('distinguishes missing text, invalid review date and ambiguous identity', () => {
  assert.equal(mapParadigm({}, 42, people, evidence('a'), 'reviewed').status, 'identity-mismatch');
  assert.equal(mapParadigm({ id: 42 }, 42, people, evidence('a'), 'reviewed').status, 'missing-text');
  const invalid = mapParadigm({ ...earlier, reviewed: '2026-02-30' }, 42, people, evidence('a'), 'reviewed');
  assert.equal(invalid.status, 'mapped');
  if (invalid.status !== 'mapped') assert.fail('Missing revision');
  assert.equal(invalid.revision.sourceReviewDate, null);
  assert.equal(invalid.reviewDateStatus, 'invalid');
  assert.equal(mapParadigm(earlier, 42, [...people, { ...people[0], personId: 'other' }],
    evidence('a'), 'reviewed').status, 'ambiguous-person');
});

const fields = { tournament: 'tourn', event: 'event', round: 'round', vote: 'vote', result: 'result' };
const payload = { tourn: '13', event: 'Open', round: 'Round 1', vote: 'Aff', result: 'Neg' };
const historyRow = (id: string, row: unknown = payload) => ({ payload: row, evidence: evidence(id) });
const panelLink = (id: string, panelId: string) => ({
  rowEvidenceId: id, tournamentSourceId: 13, judgePersonId: people[0].personId,
  panelId, evidenceId: 'join-' + id,
});

test('deduplicates replayed evidence and separates flights and split-panel decisions', () => {
  const first = historyRow('a');
  const rows = [first, historyRow('b'), historyRow('c', { tourn: 13, round: 'Round 1' })];
  const links = [panelLink('a', 'panel-1'), panelLink('b', 'panel-1'), panelLink('c', 'panel-2')];
  const mapped = mapJudgeHistory(rows, 42, people, links, fields);
  assert.deepEqual(mapJudgeHistory([...rows, first], 42, people, links, fields), mapped);
  if (mapped.status !== 'mapped') assert.fail('History requires an explicit canonical identity');
  assert.equal(mapped.assignments.length, 2);
  const [firstPanel, secondPanel] = mapped.assignments;
  assert.equal(firstPanel.personId, people[0].personId);
  assert.equal(firstPanel.observations.length, 2);
  assert.deepEqual(firstPanel.individualVote, { status: 'observed', value: 'aff' });
  assert.deepEqual(firstPanel.panelResult, { status: 'observed', value: 'neg' });
  assert.deepEqual(secondPanel.individualVote, { status: 'missing', value: null });
  assert.equal(secondPanel.level, null);
  assert.equal(secondPanel.competitionDate, null);
});

test('reports unresolved links and keeps conflicts scoped to the affected decision', () => {
  const rows = [historyRow('a'), historyRow('b', { ...payload, vote: 'Neg' }), historyRow('c'),
    historyRow('d', {}), historyRow('e')];
  const mapped = mapJudgeHistory(rows, 42, people,
    [panelLink('a', 'p'), panelLink('b', 'p'), panelLink('e', 'p'), panelLink('e', 'q')], fields);
  if (mapped.status !== 'mapped') assert.fail('Missing assignment');
  assert.deepEqual(mapped.gaps.map(gap => gap.reason), ['unlinked-panel', 'missing-tournament', 'ambiguous-panel']);
  assert.deepEqual(mapped.assignments[0].individualVote, { status: 'conflicting', value: null });
  assert.deepEqual(mapped.assignments[0].panelResult, { status: 'observed', value: 'neg' });
  assert.equal(mapJudgeHistory(rows, 42, [...people, { ...people[0], personId: 'other' }], [], fields).status,
    'ambiguous-person');
  assert.throws(() => mapJudgeHistory([rows[0], historyRow('a', {})], 42, people, [], fields),
    /Conflicting history row/);
});
