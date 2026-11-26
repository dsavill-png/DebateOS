import { interpretDebateQuery } from './debate.ts';
import { normalizeSearchText, searchArguments, type SearchCorpus, type SearchFilter, type SearchGrants, type SearchIntent, type SearchRequest, type SearchResponse, type SearchResult } from './search.ts';

type UnifiedRequest = Omit<SearchRequest, 'intent'> & { filter?: SearchFilter };

export function searchAll(request: UnifiedRequest, corpus: SearchCorpus, grants: SearchGrants): SearchResponse {
  const query = normalizeSearchText(request.query);
  const debate = interpretDebateQuery(request.query);
  const literalFile = /\.(?:docx?|pdf|txt|md)$/i.test(request.query.trim());
  const exactFile = corpus.documents.some(document => grants.documentIds.has(document.id)
    && normalizeSearchText(document.title.replace(/\.[^.]+$/, '')) === query);
  const fileRequest = literalFile || exactFile && !debate.family || /^(?:open|find|where is|show me) (?:the )?(?:file|folder|document)\b/i.test(request.query)
    || /\b(?:folder|file|document)\s*$/i.test(request.query) && !debate.response;
  const unitRequest = /\b(?:cards?|evidence|sources?)\b/i.test(request.query)
    || debate.response || debate.role && debate.role !== 'plan text';
  const preferred: SearchIntent = fileRequest && !request.facetOverride ? 'document'
    : !unitRequest && Boolean(debate.family) && !request.facetOverride ? 'argument' : 'card';
  const limit = request.limit ?? 12;
  const modes: SearchIntent[] = request.filter && request.filter !== 'all'
    ? request.filter === 'document' ? ['document', 'argument'] : [request.filter] : ['card', 'argument', 'document'];
  const documentQuery = fileRequest ? request.query.trim()
    .replace(/^(?:open|find|where is|show me)\s+(?:the\s+)?/i, '')
    .replace(/^(?:file|folder|document)\s+(?:called\s+|named\s+)?/i, '')
    .replace(/\s+(?:file|folder|document)$/i, '') : request.query;
  const resultSets = modes.map(intent => [intent, searchArguments({
    ...request, query: intent === 'document' ? documentQuery : request.query, intent, limit,
  }, corpus, grants)] as const);
  const interpretation = (resultSets.find(([intent]) => intent === preferred) ?? resultSets[0])[1].interpretation;
  const seen = new Set<string>();
  const candidates = resultSets.flatMap(([, result]) => result.results);
  const available = new Map(corpus.documents.filter(document => grants.documentIds.has(document.id)).map(document => [document.id, document]));
  if (modes.includes('document')) {
    for (const argument of candidates.filter(result => result.kind === 'argument' && result.match === 'compatible')) {
      if (argument.kind !== 'argument') continue;
      for (const source of argument.sources) {
        const document = available.get(source.documentId);
        if (document) candidates.push({ kind: 'document', id: document.id, match: 'metadata', coverage: document.coverage, source });
      }
    }
  }
  const merged = candidates.filter(result => {
    const key = `${result.kind}:${result.id}`;
    if (seen.has(key) || (request.filter && request.filter !== 'all' && request.filter !== result.kind)) return false;
    seen.add(key);
    return true;
  });
  const quality = (result: SearchResult) => {
    if (result.kind === 'document' && normalizeSearchText(result.source.title) === normalizeSearchText(documentQuery)) return 5;
    if (result.kind === preferred && (result.match === 'compatible' || result.kind === 'document')) return 4;
    if (result.match === 'compatible') return 3;
    if (result.kind === 'document') return 2;
    return result.match === 'unknown' ? 1 : 0;
  };
  return { interpretation, preferredKind: preferred, results: merged.sort((a, b) => quality(b) - quality(a)
    || Number(b.kind === preferred) - Number(a.kind === preferred)).slice(0, limit) };
}
