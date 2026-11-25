import assert from 'node:assert/strict';
import test from 'node:test';
import { searchArguments, type SearchCard, type SearchCorpus, type SearchDocument, type SearchFacet } from './search.ts';

const subject = 'us-china-war';
const fixtureEvidence = 'Synthetic fixture text for exercising the preview contract.';
const scope = 'Synthetic sources';
const query = 'No US-China War';

function document(id: string, title: string, coverage: SearchDocument['coverage'] = 'card-candidates'): SearchDocument {
  return { id, title, folderPath: `${scope}/${id}`, revision: 'fixture-r2', coverage, subject };
}

function card(id: string, tag: string, facet: SearchFacet, options: Partial<SearchCard> = {}): SearchCard {
  return {
    id,
    documentId: id,
    tag,
    citation: 'Synthetic fixture citation',
    evidence: fixtureEvidence,
    paragraphRange: [3, 5],
    claim: { subject, facet },
    sourceRevision: 'fixture-r2',
    extraction: 'synthetic',
    classification: 'synthetic',
    ...options,
  };
}

// Every record is synthetic. These fixtures are test data, never evidence.
const corpus: SearchCorpus = {
  documents: [
    document('defense', 'Deterrence'),
    document('copy', 'Deterrence duplicate'),
    document('restricted', 'Restricted fixture'),
    document('conditional', 'Conditional defense'),
    document('likelihood', 'US-China War Forecast'),
    document('impact', 'No US-China War — Impact Answers'),
    document('unparsed', 'US-China War Reading List', 'unparsed'),
    document('stale', 'US-China War Archive', 'stale'),
    document('old-revision', 'US-China War Older Revision'),
    document('connector', 'US-China War Connector Extraction'),
    document('invalid-range', 'US-China War Candidate Bounds'),
  ],
  cards: [
    card('defense', 'Deterrence prevents a direct conflict', 'war-unlikely', { duplicateGroup: 'deterrence' }),
    card('copy', 'Deterrence prevents a direct conflict', 'war-unlikely', { duplicateGroup: 'deterrence' }),
    card('restricted', query, 'war-unlikely', { duplicateGroup: 'deterrence', evidence: 'Restricted fixture body' }),
    card('conditional', 'Direct war is avoidable outside a Taiwan scenario', 'war-unlikely', { condition: 'Outside a Taiwan scenario' }),
    card('likelihood', 'US-China war is imminent', 'war-likely'),
    card('impact', 'No US-China War answers — war ends in catastrophe', 'war-impacts'),
    card('stale', 'Stale preview must stay hidden', 'war-unlikely'),
    card('old-revision', 'Older revision preview must stay hidden', 'war-unlikely', { sourceRevision: 'fixture-r1' }),
    card('connector', 'Connector preview must stay hidden', 'war-unlikely', { extraction: 'connector-text' }),
    card('invalid-range', 'Invalid range preview must stay hidden', 'war-unlikely', { paragraphRange: [5, 3] }),
  ],
  arguments: [
    { id: 'defense-family', name: 'Deterrence', aliases: ['Conflict prevention'], documentIds: ['defense', 'restricted'],
      claim: { subject, facet: 'war-unlikely' }, review: 'synthetic' },
    { id: 'restricted-family', name: 'Restricted registry fixture', aliases: [query], documentIds: ['defense'],
      claim: { subject, facet: 'war-unlikely' }, review: 'synthetic' },
  ],
};

const grants = {
  documentIds: new Set(corpus.documents.map(source => source.id).filter(id => id !== 'restricted')),
  argumentIds: new Set(['defense-family']),
};

test('claim-aware ranking corrects a keyword baseline that favors the impact card', () => {
  const controls = corpus.cards.filter(source => ['defense', 'likelihood', 'impact'].includes(source.id));
  const keywords = query.toLowerCase().match(/\w+/g)!;
  const keywordScore = (source: SearchCard) => {
    const document = corpus.documents.find(item => item.id === source.documentId)!;
    return keywords.filter(word => `${source.tag} ${document.title}`.toLowerCase().match(/\w+/g)?.includes(word)).length;
  };
  assert.equal(controls.toSorted((a, b) => keywordScore(b) - keywordScore(a))[0].id, 'impact');

  const { interpretation, results } = searchArguments({ query, intent: 'card', limit: 50 }, corpus, grants);
  assert.deepEqual(interpretation, { subject, facet: 'war-unlikely', clarificationChoices: [] });
  const cards = results.filter(result => result.kind === 'card');
  assert.deepEqual(cards.map(result => [result.id, result.match]), [
    ['copy', 'compatible'], ['conditional', 'compatible'],
    ['likelihood', 'opposing'], ['impact', 'different-function'],
  ]);
  assert.equal(cards[0].preview.excerpt, fixtureEvidence);
  assert.equal(cards[0].preview.extraction, 'synthetic');
  assert.equal(cards[1].condition, 'Outside a Taiwan scenario');
});

test('likelihood, impacts and a clarification select different results', () => {
  for (const [phrase, expected] of [
    ['U.S.-China war is likely', 'likelihood'],
    ['US-China war impacts', 'impact'],
    ['United States China war is not likely', 'copy'],
  ]) {
    assert.equal(searchArguments({ query: phrase, intent: 'card' }, corpus, grants).results[0].id, expected);
  }

  const ambiguous = searchArguments({ query: 'US-China War', intent: 'card' }, corpus, grants);
  assert.deepEqual(ambiguous.interpretation.clarificationChoices, ['war-unlikely', 'war-likely', 'war-impacts', 'escalation']);
  assert.ok(ambiguous.results.every(result => result.match !== 'compatible'));
  const clarified = searchArguments({ query: 'US-China War', intent: 'card', facetOverride: 'war-impacts' }, corpus, grants);
  assert.equal(clarified.results[0].id, 'impact');
});

test('source grants apply before grouping and limits, and an empty grant is denied', () => {
  const { results } = searchArguments({ query, intent: 'card', limit: 1 }, corpus, grants);
  assert.equal(results.length, 1);
  assert.ok(results[0].kind === 'card');
  assert.deepEqual(results[0].sources.map(source => source.cardId), ['copy', 'defense']);
  assert.doesNotMatch(JSON.stringify(results), /restricted/i);
  assert.deepEqual(searchArguments({ query, intent: 'card' }, corpus, {
    documentIds: new Set(), argumentIds: new Set(),
  }).results, []);
});

test('document intent and stale or incomplete evidence return eligible metadata', () => {
  const documentSearch = searchArguments({ query: 'US-China War Reading List', intent: 'document' }, corpus, grants);
  assert.equal(documentSearch.results.length, 1);
  assert.deepEqual(documentSearch.results[0], {
    kind: 'document', id: 'unparsed', match: 'metadata', coverage: 'unparsed',
    source: { documentId: 'unparsed', title: 'US-China War Reading List', folderPath: `${scope}/unparsed` },
  });

  const { results } = searchArguments({ query, intent: 'card', limit: 50 }, corpus, grants);
  for (const id of ['stale', 'unparsed', 'old-revision', 'connector', 'invalid-range']) {
    assert.deepEqual(results.filter(result => result.id === id).map(result => result.kind), ['document']);
  }
});

test('registry aliases return only explicitly eligible arguments and source locations', () => {
  const alias = searchArguments({ query: 'Conflict prevention', intent: 'argument' }, corpus, grants);
  assert.equal(alias.results[0].id, 'defense-family');
  const { results } = searchArguments({ query, intent: 'argument' }, corpus, grants);
  assert.equal(results.length, 1);
  assert.ok(results[0].kind === 'argument');
  assert.deepEqual(results[0].sources.map(source => source.documentId), ['defense']);
});

test('a card preview preserves an exact excerpt and citation', () => {
  const evidence = 'Mixed CASE\n'.repeat(60);
  const fixture = card('defense', 'Deterrence', 'war-unlikely', { evidence });
  const { results } = searchArguments({ query, intent: 'card' }, { ...corpus, cards: [fixture] }, grants);
  assert.ok(results[0].kind === 'card');
  assert.equal(results[0].preview.excerpt, evidence.slice(0, 360));
  assert.equal(results[0].preview.citation, fixture.citation);
  assert.deepEqual(results[0].preview.paragraphRange, [3, 5]);
});
