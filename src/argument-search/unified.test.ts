import assert from 'node:assert/strict';
import test from 'node:test';
import { runSnapshotSearch, type SearchSnapshot } from './snapshot.ts';
import type { SearchCard } from './search.ts';

const card: SearchCard = { id: 'leverage', documentId: 'jamaica', sourceRevision: 'r2', extraction: 'synthetic',
  tag: 'Assistance conditions change behavior', citation: 'Synthetic fixture', evidence: 'Conditions preserve leverage.',
  paragraphRange: [8, 11], classification: 'synthetic', sectionHeadings: ['Counterplans', 'Conditions CP'], argumentRole: 'solvency' };
const snapshot: SearchSnapshot = { schema: 1, checkedOn: 'fixture', corpus: {
  documents: [
    { id: 'jamaica', title: 'Jamaica - NEG.docx', folderPath: 'Neg Prep / Jamaica', revision: 'r2',
      coverage: 'card-candidates', openUrl: 'https://www.dropbox.com/home/example' },
    { id: 'stale', title: 'Old NEG.docx', folderPath: 'Neg Prep', revision: 'new', coverage: 'stale' },
  ],
  cards: [card, { ...card, id: 'stale-card', documentId: 'stale' }],
  arguments: [{ id: 'conditions', name: 'Conditions CP vs. Jamaica', aliases: ['Jamaica Conditionality Counterplan'],
    family: 'counterplan', documentIds: ['jamaica', 'stale'], cardIds: ['leverage', 'stale-card'],
    section: ['Counterplans', 'Conditions CP'], review: 'synthetic' }],
} };

test('a single search prioritizes an argument, its verified supporting card, or the original file', () => {
  const position = runSnapshotSearch(snapshot, { query: 'Conditions CP against Jamaica AFF' });
  assert.equal(position?.results[0]?.kind, 'argument');
  const result = position?.results[0];
  assert.ok(result?.kind === 'argument');
  assert.deepEqual(result.section, ['Counterplans', 'Conditions CP']);
  assert.deepEqual(result.supportingCards?.map(card => card.id), ['leverage']);
  assert.ok(position.results.some(result => result.kind === 'document' && result.id === 'jamaica'));
  const evidence = runSnapshotSearch(snapshot, { query: 'Solvency cards for Jamaica Conditions CP' });
  assert.equal(evidence?.results[0]?.id, 'leverage');
  assert.equal(evidence?.results[0]?.match, 'compatible');
  const file = runSnapshotSearch(snapshot, { query: 'Find the Jamaica - NEG file' });
  assert.equal(file?.results[0]?.kind, 'document');
  assert.equal(file?.results[0]?.id, 'jamaica');
});

test('post-search filters preserve a linked file or restrict to the chosen kind', () => {
  const query = 'Conditions CP against Jamaica AFF';
  const files = runSnapshotSearch(snapshot, { query, filter: 'document' });
  assert.ok(files);
  assert.ok(files.results.some(result => result.id === 'jamaica'));
  assert.ok(files.results.every(result => result.kind === 'document'));
  const argumentsOnly = runSnapshotSearch(snapshot, { query, filter: 'argument' });
  assert.deepEqual(argumentsOnly?.results.map(result => result.id), ['conditions']);
  assert.equal(runSnapshotSearch(snapshot, { query, filter: 'bad' }), null);
  assert.deepEqual(runSnapshotSearch(snapshot, { query: 'unicorn cloud treaty' })?.results, []);
});

test('document fallback stays available when a file has no parsed evidence', () => {
  const result = runSnapshotSearch(snapshot, { query: 'Old NEG.docx' })?.results[0];
  assert.equal(result?.kind, 'document');
  assert.ok(result.kind === 'document');
  assert.equal(result.coverage, 'stale');
});
