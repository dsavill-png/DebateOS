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
