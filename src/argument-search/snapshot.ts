import { searchAll } from './unified.ts';
import { suggestClaim } from './classify.ts';
import { searchArguments, searchFacets, type SearchArgument, type SearchCorpus, type SearchFacet, type SearchFilter, type SearchIntent } from './search.ts';

export type SearchSnapshot = {
  schema: 1;
  checkedOn: string;
  corpus: SearchCorpus;
};

const families: Record<SearchFacet, string> = {
  'war-unlikely': 'US-China war likelihood defense',
  'war-likely': 'US-China war likelihood',
  'war-impacts': 'US-China war impacts',
  escalation: 'US-China war escalation',
  'alliance-erosion': 'Japan alliance erosion',
  'alliance-resilience': 'Japan alliance resilience',
  'escalation-unlikely': 'Taiwan escalation unlikely',
  'escalation-likely': 'Taiwan escalation likely',
  'impact-defense': 'Economic decline impact defense',
  'impact-offense': 'Economic decline impacts',
  link: 'Midterms DA links',
  'link-defense': 'Midterms DA link defense',
  uniqueness: 'Midterms DA uniqueness',
  'internal-link': 'Midterms DA internal links',
  impact: 'Midterms DA impacts',
};

export function makeSearchSnapshot(corpus: SearchCorpus, checkedOn: string, links: Record<string, string>): SearchSnapshot {
  const documents = corpus.documents.map(({ id, title, folderPath, revision, coverage }) => {
    const suppliedLink = links[id];
    const openUrl = ['https://www.dropbox.com/home/', 'https://www.dropbox.com/preview/', 'https://www.dropbox.com/preview?']
      .some(prefix => suppliedLink?.startsWith(prefix)) ? suppliedLink : undefined;
    return { id, title, folderPath, revision, coverage, openUrl };
  });
  const documentsById = new Map(documents.map(document => [document.id, document]));
  const cards = corpus.cards.map(card => card.classification === 'reviewed' ? card : ({
    ...card, ...suggestClaim(card, documentsById.get(card.documentId)?.title),
  }));
  const argumentsByFacet = new Map<SearchFacet, SearchArgument>();
  for (const card of cards) {
    if (!card.claim) continue;
    const facet = card.claim.facet;
    const previous = argumentsByFacet.get(facet);
    const name = families[facet];
    const documentIds = [...new Set([...(previous?.documentIds ?? []), card.documentId])];
    argumentsByFacet.set(facet, {
      id: facet, name, aliases: facet === 'war-unlikely' ? ['No US-China War'] : [],
      claim: card.claim, documentIds, review: 'unreviewed',
    });
  }
  return { schema: 1, checkedOn, corpus: { documents, cards, arguments: [...new Map([...argumentsByFacet.values(), ...corpus.arguments].map(argument => [argument.id, argument])).values()] } };
}

export function runSnapshotSearch(snapshot: SearchSnapshot, input: unknown) {
  if (typeof input !== 'object' || input === null) return null;
  const { query, intent, filter, facetOverride, limit } = input as Record<string, unknown>;
  if (typeof query !== 'string' || !query.trim() || query.length > 200
    || (intent !== undefined && !['card', 'argument', 'document'].includes(String(intent)))) return null;
  if (filter !== undefined && !['all', 'card', 'argument', 'document'].includes(String(filter))) return null;
  if (facetOverride !== undefined && !searchFacets.includes(facetOverride as SearchFacet)) return null;
  if (limit !== undefined && (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 25)) return null;

  const { corpus } = snapshot;
  const grants = {
    documentIds: new Set(corpus.documents.map(source => source.id)),
    argumentIds: new Set(corpus.arguments.map(argument => argument.id)),
  };
  const request = { query, facetOverride: facetOverride as SearchFacet | undefined, limit: limit ?? 12 };
  const response = intent === undefined
    ? searchAll({ ...request, filter: filter as SearchFilter | undefined }, corpus, grants)
    : searchArguments({ ...request, intent: intent as SearchIntent }, corpus, grants);
  return { ...response, status: { snapshot: snapshot.checkedOn, documents: corpus.documents.length, cards: corpus.cards.length } };
}
