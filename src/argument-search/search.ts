export type SearchIntent = 'card' | 'argument' | 'document';
const warFacets = ['war-unlikely', 'war-likely', 'war-impacts', 'escalation'] as const;
export const searchFacets = [...warFacets, 'alliance-erosion', 'alliance-resilience', 'escalation-unlikely', 'escalation-likely', 'impact-defense', 'impact-offense', 'link', 'link-defense', 'uniqueness', 'internal-link', 'impact'] as const;
export type SearchFacet = typeof searchFacets[number];
export type Coverage = 'card-candidates' | 'unparsed' | 'stale';
type Match = 'compatible' | 'unknown' | 'opposing' | 'different-function' | 'metadata';

export interface Claim {
  subject: 'us-china-war' | 'japan-alliance' | 'taiwan-escalation' | 'economic-decline' | 'midterms-da';
  facet: SearchFacet;
}

export interface SearchRequest {
  query: string;
  intent: SearchIntent;
  facetOverride?: SearchFacet;
  limit?: number;
}

export interface SearchDocument {
  id: string;
  title: string;
  folderPath: string;
  revision: string | null;
  coverage: Coverage;
  openUrl?: string;
  subject?: Claim['subject'];
}

export interface SearchCard {
  id: string;
  documentId: string;
  sourceRevision: string;
  extraction: 'original-docx' | 'connector-text' | 'synthetic';
  tag: string;
  citation: string;
  evidence: string;
  paragraphRange: readonly [start: number, end: number];
  claim?: Claim;
  classification: 'unreviewed' | 'reviewed' | 'synthetic';
  condition?: string;
  classificationBasis?: 'tag-and-excerpt' | 'tag' | 'benchmark' | 'file-section';
  duplicateGroup?: string;
  sectionHeadings?: readonly string[];
}

export interface SearchArgument {
  id: string;
  name: string;
  aliases: readonly string[];
  documentIds: readonly string[];
  review: 'unreviewed' | 'reviewed' | 'synthetic';
  claim?: Claim;
}

export interface SearchCorpus {
  documents: readonly SearchDocument[];
  cards: readonly SearchCard[];
  arguments: readonly SearchArgument[];
}

export interface SourceLocation {
  documentId: string;
  title: string;
  folderPath: string;
  openUrl?: string;
}

export type SearchResult =
  | { kind: 'document'; id: string; match: 'metadata'; coverage: Coverage; source: SourceLocation }
  | { kind: 'argument'; id: string; match: Match; name: string; review: SearchArgument['review']; sources: SourceLocation[] }
  | {
    kind: 'card';
    id: string;
    match: Match;
    condition?: string;
    sources: (SourceLocation & { cardId: string })[];
    preview: Pick<SearchCard, 'tag' | 'citation' | 'extraction' | 'classification' | 'sourceRevision' | 'paragraphRange' | 'classificationBasis'> & { excerpt: string };
  };

export interface SearchResponse {
  interpretation: {
    subject: Claim['subject'] | null;
    facet: SearchFacet | null;
    clarificationChoices: readonly SearchFacet[];
  };
  results: SearchResult[];
}

export interface SearchGrants {
  documentIds: ReadonlySet<string>;
  argumentIds: ReadonlySet<string>;
}

const facetPatterns: Record<typeof warFacets[number], RegExp> = {
  'war-unlikely': /\b(no|unlikely|avoidable|deterred|wont|won t|will not|does not|de escalation)\b/,
  'war-likely': /\b(likely|inevitable|imminent|will happen|will go to war)\b/,
  'war-impacts': /\b(impacts?|consequences?|extinction|catastrophic)\b/,
  'escalation': /\b(escalation|escalates|miscalculation)\b/,
};

export function normalizeSearchText(text: string) {
  return text.toLowerCase()
    .replace(/\bu\s*\.\s*s\.?(?=\W|$)|\bunited states\b/g, 'us')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

function interpret(query: string, request: SearchRequest): SearchResponse['interpretation'] {
  let subject: Claim['subject'] | null = null;
  let choices: readonly SearchFacet[] = [];
  let matchedFacets: readonly SearchFacet[] = [];
  const claimText = query.replace(/\bnot (likely|inevitable|imminent)\b/g, 'unlikely');
  if (/\b(econ(?:omic)? decline|econ(?:omic)? collapse|(?:economic )?recession|economic downturn|growth slowdown)\b/.test(query)) {
    subject = 'economic-decline';
    choices = ['impact-defense', 'impact-offense'];
    if (/\b(impact (?:defense|defence|takeouts?)|no (?:impact|war)|peaceful|does(?:n t| not) cause war)\b/.test(query)) matchedFacets = ['impact-defense'];
    else if (/\b(impact(?:s| offense| turn)?|causes war|extinction)\b/.test(query)) matchedFacets = ['impact-offense'];
  } else if (/\bmid ?terms?\b/.test(query) && /\b(da|disadvantage|link|uq|uniqueness|impact)\b/.test(query)) {
    subject = 'midterms-da';
    choices = ['link', 'link-defense', 'uniqueness', 'internal-link', 'impact'];
    if (/\b(no link|link (?:defen[cs]e|turns?))\b/.test(query)) matchedFacets = ['link-defense'];
    else if (/\binternal links?\b/.test(query)) matchedFacets = ['internal-link'];
    else if (/\blinks?\b/.test(query)) matchedFacets = ['link'];
    else if (/\b(uq|uniqueness)\b/.test(query)) matchedFacets = ['uniqueness'];
    else if (/\bimpacts?\b/.test(query)) matchedFacets = ['impact'];
  } else if (/\bus\b/.test(query) && /\bchina\b/.test(query) && /\b(war|conflict|escalation)\b/.test(query)) {
    subject = 'us-china-war';
    choices = warFacets;
    matchedFacets = warFacets.filter(facet => facetPatterns[facet].test(claimText));
  } else if (/\bjapan\b/.test(query) && /\balliance\b/.test(query)) {
    subject = 'japan-alliance';
    choices = ['alliance-erosion', 'alliance-resilience'];
    matchedFacets = [
      ...(/\b(erosion|fractur\w*|collapse|credibility|weakens?)\b/.test(query) ? ['alliance-erosion' as const] : []),
      ...(/\b(resilien\w*|strong|holds|strengthens?)\b/.test(query) ? ['alliance-resilience' as const] : []),
    ];
  } else if (/\btaiwan\b/.test(query) && /\bescalat\w*\b/.test(query)) {
    subject = 'taiwan-escalation';
    choices = ['escalation-unlikely', 'escalation-likely'];
    matchedFacets = [
      ...(facetPatterns['war-unlikely'].test(claimText) ? ['escalation-unlikely' as const] : []),
      ...(facetPatterns['war-likely'].test(claimText) ? ['escalation-likely' as const] : []),
    ];
  }
  if (!subject || request.intent === 'document') return { subject, facet: null, clarificationChoices: [] };
  const override = request.facetOverride;
  const facet = override && choices.includes(override) ? override : matchedFacets.length === 1 ? matchedFacets[0] : null;
  return { subject, facet, clarificationChoices: facet ? [] : choices };
}

const stopWords = new Set(['a', 'an', 'and', 'about', 'for', 'in', 'is', 'of', 'on', 'the', 'to']);
const matchPriority: Record<Match, number> = {
  compatible: 5,
  unknown: 4,
  metadata: 3,
  opposing: 2,
  'different-function': 1,
};

function textRelevance(query: string, terms: readonly string[], fields: readonly string[]) {
  if (!query) return 0;
  const normalized = fields.map(normalizeSearchText);
  if (normalized.includes(query)) return 3;
  if (normalized.some(field => ` ${field} `.includes(` ${query} `))) return 2;
  const words = new Set(normalized.join(' ').split(' '));
  const overlap = terms.filter(term => words.has(term)).length;
  if (terms.length > 0 && overlap === terms.length) return 1;
  return terms.length >= 3 && overlap >= Math.max(2, Math.ceil(terms.length * 0.65)) ? overlap / terms.length / 2 : 0;
}

function classify(facet: SearchFacet | null, claim?: Claim): Match {
  if (!facet || !claim) return 'unknown';
  if (facet === claim.facet) return 'compatible';
  const opposing = [
    ['war-unlikely', 'war-likely'],
    ['alliance-erosion', 'alliance-resilience'],
    ['escalation-unlikely', 'escalation-likely'],
    ['impact-defense', 'impact-offense'],
    ['link', 'link-defense'],
  ];
  if (opposing.some(pair => pair.includes(facet) && pair.includes(claim.facet))) return 'opposing';
  return 'different-function';
}

function location(document: SearchDocument): SourceLocation {
  return { documentId: document.id, title: document.title, folderPath: document.folderPath, ...(document.openUrl ? { openUrl: document.openUrl } : {}) };
}

interface RankedResult {
  result: SearchResult;
  relevance: number;
  conditional?: boolean;
  supportingContext?: boolean;
  duplicateKey?: string;
}

/** The caller resolves current grants server-side. An empty grant set serves no records. */
export function searchArguments(
  request: SearchRequest,
  corpus: SearchCorpus,
  grants: SearchGrants,
): SearchResponse {
  const query = normalizeSearchText(request.query);
  const interpretation = interpret(query, request);
  if (!query || grants.documentIds.size === 0) return { interpretation, results: [] };

  const structuredTopic = interpretation.subject === 'economic-decline' || interpretation.subject === 'midterms-da';
  const retrievalQuery = structuredTopic && request.intent !== 'document'
    ? query.replace(/\b(?:for|disadvantage|da|defen[cs]e|offense|internal|impact|links?|uniqueness|uq)\b/g, ' ').replace(/ +/g, ' ').trim()
    : query;
  const terms = [...new Set(retrievalQuery.split(' ').filter(term => !stopWords.has(term)))];
  const extraTerms = terms.filter(term => interpretation.subject === 'midterms-da' && !/^midterms?$/.test(term));
  const documents = new Map(corpus.documents
    .filter(document => grants.documentIds.has(document.id))
    .map(document => [document.id, document]));
  const candidates: RankedResult[] = [];

  if (request.intent !== 'argument') {
    for (const document of documents.values()) {
      const relevance = textRelevance(retrievalQuery, terms, [document.title, document.folderPath]);
      const subjectMatches = interpretation.subject && document.subject === interpretation.subject;
      if (relevance || (subjectMatches && request.intent === 'card')) {
        candidates.push({
          relevance,
          result: { kind: 'document', id: document.id, match: 'metadata', coverage: document.coverage, source: location(document) },
        });
      }
    }
  }

  if (request.intent === 'argument') {
    for (const argument of corpus.arguments) {
      if (!grants.argumentIds.has(argument.id)) continue;
      const sources = [...new Set(argument.documentIds)].flatMap(id => {
        const source = documents.get(id);
        return source ? [location(source)] : [];
      });
      if (sources.length === 0) continue;
      const relevance = textRelevance(retrievalQuery, terms, [argument.name, ...argument.aliases]);
      const subjectMatches = interpretation.subject && argument.claim?.subject === interpretation.subject;
      if (relevance || subjectMatches) {
        candidates.push({
          relevance,
          result: { kind: 'argument', id: argument.id, name: argument.name, review: argument.review,
            match: classify(interpretation.facet, subjectMatches ? argument.claim : undefined), sources },
        });
      }
    }
  }

  if (request.intent === 'card') {
    for (const card of corpus.cards) {
      const document = documents.get(card.documentId);
      if (!document || document.coverage !== 'card-candidates' || !document.revision
        || document.revision !== card.sourceRevision || card.extraction === 'connector-text') continue;
      const [start, end] = card.paragraphRange;
      if (!card.tag.trim() || !card.citation.trim() || !card.evidence.trim()
        || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) continue;

      const cardContext = [card.tag, ...(card.sectionHeadings ?? [])];
      const relevance = textRelevance(retrievalQuery, terms, [card.tag])
        + extraTerms.filter(term => cardContext.some(field => normalizeSearchText(field).split(' ').includes(term))).length * 4;
      const subjectMatches = interpretation.subject && card.claim?.subject === interpretation.subject;
      if (!relevance && !subjectMatches) continue;
      if (structuredTopic && interpretation.facet && !subjectMatches) continue;
      const match = classify(interpretation.facet, subjectMatches ? card.claim : undefined);
      candidates.push({
        relevance,
        conditional: Boolean(card.condition),
        supportingContext: Boolean(card.sectionHeadings?.some(heading => normalizeSearchText(heading) === 'shell')),
        duplicateKey: card.duplicateGroup
          ? JSON.stringify([card.duplicateGroup, card.claim?.facet, card.condition, match]) : undefined,
        result: {
          kind: 'card', id: card.id, match, condition: card.condition,
          sources: [{ ...location(document), cardId: card.id }],
          preview: {
            tag: card.tag, citation: card.citation, excerpt: card.evidence.slice(0, 360),
            extraction: card.extraction, classification: card.classification,
            sourceRevision: card.sourceRevision, paragraphRange: card.paragraphRange, classificationBasis: card.classificationBasis,
          },
        },
      });
    }
  }

  candidates.sort((a, b) => matchPriority[b.result.match] - matchPriority[a.result.match]
    || Number(Boolean(a.conditional)) - Number(Boolean(b.conditional))
    || b.relevance - a.relevance
    || Number(Boolean(b.supportingContext)) - Number(Boolean(a.supportingContext))
    || a.result.id.localeCompare(b.result.id, 'en'));
  const groups = new Map<string, Extract<SearchResult, { kind: 'card' }>>();
  const results: SearchResult[] = [];
  for (const { result, duplicateKey } of candidates) {
    if (duplicateKey && result.kind === 'card') {
      const primary = groups.get(duplicateKey);
      if (primary) {
        primary.sources.push(...result.sources);
        continue;
      }
      groups.set(duplicateKey, result);
    }
    results.push(result);
  }

  const limit = request.limit ?? 10;
  return { interpretation, results: results.slice(0, Number.isInteger(limit) ? Math.max(0, Math.min(limit, 50)) : 10) };
}
