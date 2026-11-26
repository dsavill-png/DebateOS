import assert from 'node:assert/strict';
import test from 'node:test';
import { interpretDebateQuery, matchDebateRecord } from './debate.ts';

const studentQueries = [
  ['1AC Nigeria inherency', 'inherency', 'policy-aff'],
  ['Ukraine 1AC plan text', 'plan text', 'policy-aff'],
  ['Japan 1AC alliance advantage', 'advantage', 'policy-aff'],
  ['Harms for Nigeria aff', 'harms', undefined],
  ['Solvency for the Leahy Law 1AC', 'solvency', 'policy-aff'],
  ['case neg Ukraine no solvency', 'solvency deficit', 'case-neg'],
  ['2AC impact defense for Indo-Pakistan war', 'impact defense', undefined],
  ['!D IndoPak war', 'impact defense', undefined],
  ['Recession impact takeout', 'impact defense', undefined],
  ['Economic decline impact turn', 'impact turn', undefined],
  ['Middle powers impact offense', 'impact', undefined],
  ['1AR timeframe against the DA', 'weighing', 'disadvantage'],
  ['Link for midterms DA', 'link', 'disadvantage'],
  ['2NC uniqueness for elections DA', 'uniqueness', 'disadvantage'],
  ['non-unique politics disad', 'non-uniqueness', 'disadvantage'],
  ['2AC no link to the elections DA', 'link defense', 'disadvantage'],
  ['Link turn for the DIB DA', 'link turn', 'disadvantage'],
  ['DA internal link defense', 'internal link defense', 'disadvantage'],
  ['DA internal link', 'internal link', 'disadvantage'],
  ['Impact for the DIB DA', 'impact', 'disadvantage'],
  ['CP text for conditions', 'plan text', 'counterplan'],
  ['Conditions CP solvency deficit', 'solvency deficit', 'counterplan'],
  ['Conditions CP solvency advocate', 'solvency', 'counterplan'],
  ['Net benefit to the process CP', 'net benefit', 'counterplan'],
  ['Functional competition for a process CP', 'competition', 'counterplan'],
  ['2AC perm do the CP', 'permutation', 'counterplan'],
  ['Cap K permutation answers', 'permutation answer', 'kritik'],
  ['Cap K link against a performance aff', 'link', 'kritik'],
  ['Cap K alternative', 'alternative', 'kritik'],
  ['Cap K alt solvency', 'alternative solvency', 'kritik'],
  ['Cap K alt fails', 'alternative solvency deficit', 'kritik'],
  ['Non-topical aff method', 'method', 'critical-aff'],
  ['ROTB for performance affs', 'role of the ballot', 'framework'],
  ['Role of the judge in framework', 'role of the judge', 'framework'],
  ['Limits for T USFG', 'standards', 'topicality'],
  ['Acheson extra T violation', 'violation', 'topicality'],
  ['2AC counterinterp for T substantial', 'counter-interpretation', 'topicality'],
  ['2AC reasonability for topicality', 'reasonability', 'topicality'],
  ['Competing interps for topicality', 'competing interpretations', 'topicality'],
  ['TVA against a K aff', 'topical version', 'topicality'],
  ['Fairness voters on framework', 'voters', 'framework'],
  ['2AC condo bad', 'conditionality', 'theory'],
  ['Multi actor fiat theory', 'fiat', 'theory'],
  ['Presumption against a K aff', 'presumption', 'presumption'],
  ['Framework answers against performance affs', undefined, 'framework'],
] as const;

test('interprets 45 NDT/CEDA-style student search prompts', () => {
  for (const [prompt, role, family] of studentQueries) {
    const result = interpretDebateQuery(prompt);
    assert.equal(result.role, role, prompt);
    assert.equal(result.family, family, prompt);
  }
  assert.deepEqual(interpretDebateQuery('Impact defense for Indo Pakistan war').topics, ['india', 'pakistan', 'war']);
  assert.equal(interpretDebateQuery('2AC condo bad').side, 'aff');
  assert.equal(interpretDebateQuery('Cap K link against a performance aff').targetFamily, 'critical-aff');
});

test('ranking distinguishes defense, offense, and mere topic overlap', () => {
  const q = interpretDebateQuery('Impact defense for Indo Pakistan war');
  const result = (tag: string, sectionHeadings: string[] = []) =>
    matchDebateRecord(q, { tag, sectionHeadings }, 'Country answers', 'Case Neg');
  assert.equal(result('Mediation caps Indo-Pak conflict', ['AT Indo-Pak War'])?.compatible, true);
  assert.equal(result('India-Pakistan war causes extinction')?.compatible, false);
  assert.equal(result('South Korea trade barriers'), null);
});

test('the same topic can have distinct DA, CP, kritik and framework components', () => {
  const q = (query: string, title: string, heading: string, tag: string) =>
    matchDebateRecord(interpretDebateQuery(query), { tag, sectionHeadings: [heading] }, title, 'Files');
  assert.equal(q('Link for elections DA', 'Elections DA', 'Link', 'Voters react to policy changes')?.compatible, true);
  assert.equal(q('Link for elections DA', 'Elections DA', 'Uniqueness', 'Polls favor the incumbent')?.compatible, false);
  assert.equal(q('Conditions CP solvency deficit', 'Conditions CP', 'Solvency deficits', 'Monitoring fails')?.compatible, true);
  assert.equal(q('Cap K alt solvency', 'Cap K', 'Alt solvency', 'Organizing builds durable power')?.compatible, true);
  assert.equal(q('T USFG limits', 'T USFG', 'Standards', 'Predictability improves clash')?.compatible, true);
});

test('natural-language claim answers inherit source context without treating the claim as a requested endorsement', () => {
  const input = 'I need answers to anti blackness is ontological (K answers file)';
  const query = interpretDebateQuery(input);
  assert.equal(query.sourceHint, 'k answers');
  assert.deepEqual(query.topics, ['antiblackness', 'ontology']);
  const direct = { tag: 'Blackness is not ontological. Violence is contingent.', sectionHeadings: ['Specific K Answers', 'Afro-Pessimism / Anti-Blackness', '2AC'] };
  const opposing = { tag: 'Anti-Blackness is ontological', sectionHeadings: ['Afropessimism', '1NC'] };
  const adjacent = { tag: 'The alternative fails under capitalism', sectionHeadings: ['Afropessimism', '2AC'] };
  assert.equal(matchDebateRecord(query, direct, 'Kritiks Blocks', 'Shared')?.compatible, true);
  assert.equal(matchDebateRecord(query, opposing, 'Afropessimism K', 'Shared')?.compatible, false);
  assert.equal(matchDebateRecord(query, adjacent, 'Kritiks Blocks', 'Shared'), null);
  const noHint = matchDebateRecord(interpretDebateQuery('answers to anti-Blackness is ontology'), direct, 'Kritiks Blocks', 'Shared');
  assert.ok(noHint?.compatible);
  assert.ok(Number.isFinite(noHint.score));
});
