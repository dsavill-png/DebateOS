import assert from 'node:assert/strict';
import test from 'node:test';
import { makeSearchSnapshot, runSnapshotSearch } from './snapshot.ts';
import type { SearchCard } from './search.ts';

function fixture(id: string, tag: string, evidence: string): SearchCard {
  return { id, documentId: 'doc', sourceRevision: 'r2', extraction: 'original-docx', classification: 'unreviewed',
    tag, evidence, citation: 'Synthetic source', paragraphRange: [3, 5] };
}

const corpus = {
  documents: [{ id: 'doc', title: 'Synthetic source.docx', folderPath: 'Fixtures', revision: 'r2', coverage: 'card-candidates' as const }],
  arguments: [],
  cards: [
    fixture('nuclear', 'No US-China war', 'China maintains a no first use pledge for nuclear weapons.'),
    fixture('defense', 'No China war', 'The US and China can keep the peace. Their restraints include crisis communication.'),
    fixture('japan', 'Policy changes fracture the Japan-US alliance', 'The alliance depends on confidence in US defense commitments.'),
    fixture('taiwan', 'China won’t escalate Taiwan war', 'Taiwan faces high costs and its leaders are unlikely to trigger escalation.'),
  ],
};

const snapshot = makeSearchSnapshot(corpus, '2026-11-25', { doc: 'https://www.dropbox.com/home/example' });

test('snapshot ranking handles paraphrases and preserves the exact source excerpt', () => {
  for (const [query, id] of [
    ['No US-China War', 'defense'], ['Japan alliance erosion', 'japan'], ['Taiwan conflict escalation unlikely', 'taiwan'],
  ]) {
    const result = runSnapshotSearch(snapshot, { query, intent: 'card' })?.results[0];
    assert.equal(result?.id, id);
    assert.equal(result?.match, 'compatible');
    assert.ok(result.kind === 'card');
    assert.equal(result.preview.excerpt, corpus.cards.find(card => card.id === id)?.evidence);
    assert.equal(result.sources[0].openUrl, 'https://www.dropbox.com/home/example');
    assert.equal(result.preview.classification, 'unreviewed');
  }
  assert.equal(snapshot.corpus.cards[0].claim, undefined);
});

test('argument results retain sources and malformed search input is rejected', () => {
  const result = runSnapshotSearch(snapshot, { query: 'Japan alliance erosion', intent: 'argument' })?.results[0];
  assert.ok(result?.kind === 'argument');
  assert.equal(result.review, 'unreviewed');
  assert.equal(result.sources.length, 1);
  assert.equal(runSnapshotSearch(snapshot, { query: 'x', intent: 'anything' }), null);
  assert.equal(runSnapshotSearch(snapshot, { query: 'x', intent: 'card', limit: '5' }), null);
  assert.equal(runSnapshotSearch(snapshot, { query: '', intent: 'card' }), null);
  assert.equal(runSnapshotSearch(snapshot, { query: 'x', intent: 'card', facetOverride: 'everything' }), null);
});

test('debate terminology separates impact defense from offense and a DA link from other positions', () => {
  const economic = fixture('economic', 'Economic decline does not cause war', 'Diversionary conflict does not follow from a recession.');
  const offense = fixture('offense', 'Economic decline guarantees extinction', 'A downturn raises the risk of war.');
  const election = { ...fixture('link', 'The plan flips the election', 'Voters respond to foreign policy.'), documentId: 'midterms', sectionHeadings: ['Shell'] };
  const uniqueness = { ...election, id: 'uq', tag: 'Democrats lead now', sectionHeadings: ['Uniqueness', 'AT UQ outweighs link'] };
  const internal = { ...election, id: 'internal', tag: 'Dem win stops a program', sectionHeadings: ['Shell', '1NC DA normal UQ'] };
  const answer = { ...election, id: 'answer', tag: 'Ad spending, not arms sales', sectionHeadings: ['2AC Midterms DA'] };
  const variant = makeSearchSnapshot({
    ...corpus,
    documents: [...corpus.documents, { ...corpus.documents[0], id: 'midterms', title: 'Midterms DA.docx' }],
    cards: [economic, offense, election, uniqueness, internal, answer],
  }, '2026-11-25', {});
  for (const [query, expected, facet] of [
    ['Economic decline impact defense', 'economic', 'impact-defense'],
    ['Recession impact takeout', 'economic', 'impact-defense'],
    ['Link for midterms DA', 'link', 'link'],
    ['Midterms DA uniqueness', 'uq', 'uniqueness'],
    ['No link to midterms DA', 'answer', 'link-defense'],
  ]) {
    const response = runSnapshotSearch(variant, { query, intent: 'card' });
    assert.equal(response?.interpretation.facet, facet);
    assert.equal(response?.results[0]?.id, expected);
    assert.equal(response?.results[0]?.match, 'compatible');
  }
  assert.equal(variant.corpus.cards.find(card => card.id === 'internal')?.claim?.facet, 'internal-link');
});
