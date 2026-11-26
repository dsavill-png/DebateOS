'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { SearchFilter, SearchFacet, SearchResponse, SearchResult, SourceLocation } from '../../argument-search/search';
import styles from './search.module.css';

const filters: { id: SearchFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'argument', label: 'Arguments' },
  { id: 'card', label: 'Cards' },
  { id: 'document', label: 'Documents' },
];
const examples = ['Conditions CP against Israel AFF', 'Impact defense for Indo-Pakistan war', 'Answers to anti-Blackness is ontological', 'Link for Midterms DA'];
const facetNames: Record<SearchFacet, string> = {
  'war-unlikely': 'War unlikely',
  'war-likely': 'War likely',
  'war-impacts': 'War impacts',
  escalation: 'Escalation mechanisms',
  'alliance-erosion': 'Alliance erosion',
  'alliance-resilience': 'Alliance resilience',
  'escalation-unlikely': 'Escalation unlikely',
  'escalation-likely': 'Escalation likely',
  'impact-defense': 'Impact defense',
  'impact-offense': 'Impact offense',
  link: 'DA link',
  'link-defense': 'Link defense',
  uniqueness: 'Uniqueness',
  'internal-link': 'Internal link',
  impact: 'Impact',
};
const matchNames: Record<SearchResult['match'], string> = {
  compatible: 'Matches claim',
  unknown: 'Text match',
  opposing: 'Opposing claim',
  'different-function': 'Different evidence function',
  metadata: 'Document match',
};
const coverageNames = { 'card-candidates': 'Card previews available', unparsed: 'Document metadata', stale: 'Preview pending revision check' };

type Results = SearchResponse & { status: { documents: number; cards: number; snapshot: string } };

function Source({ source, showTitle = true }: { source: SourceLocation; showTitle?: boolean }) {
  return <div className={styles.source}>
    <div>
      {showTitle && <strong>{source.title}</strong>}
      <span>{source.folderPath}</span>
    </div>
    {source.openUrl && <a href={source.openUrl} target="_blank" rel="noreferrer">Open in Dropbox</a>}
  </div>;
}

function Result({ result }: { result: SearchResult }) {
  if (result.kind === 'document') return <article className={styles.result}>
    <div className={styles.resultLabels}><span>Document</span><span>{coverageNames[result.coverage]}</span></div>
    <h2>{result.source.title}</h2>
    <Source source={result.source} showTitle={false} />
  </article>;
  if (result.kind === 'argument') return <article className={styles.result}>
    <div className={styles.resultLabels}><span>Argument</span><span>{result.review === 'reviewed' ? 'Coach reviewed' : 'Suggested family'}</span></div>
    <h2>{result.name}</h2>
    {result.section?.length ? <p className={styles.recordStatus}>{result.section.join(' › ')}</p> : null}
    {result.supportingCards?.length ? <details><summary>{result.supportingCards.length} supporting cards</summary>
      {result.supportingCards.map(card => <div key={card.id} className={styles.support}>
        <strong>{card.preview.tag}</strong><p className={styles.citation}>{card.preview.citation}</p>
        <p className={styles.excerpt}>{card.preview.excerpt}</p>
      </div>)}
    </details> : null}
    <details open={Boolean(result.section?.length)}><summary>{result.sources.length} source {result.sources.length === 1 ? 'document' : 'documents'}</summary>
      {result.sources.map(source => <Source key={source.documentId} source={source} />)}
    </details>
  </article>;
  return <article className={styles.result}>
    <div className={styles.resultLabels}><span>Card</span><span className={result.match === 'compatible' ? styles.positive : undefined}>{matchNames[result.match]}</span></div>
    <h2>{result.preview.tag}</h2>
    <p className={styles.citation}>{result.preview.citation}</p>
    {result.condition && <p className={styles.condition}>{result.condition}</p>}
    <details>
      <summary>Evidence preview</summary>
      <p className={styles.excerpt}>{result.preview.excerpt}</p>
      <p className={styles.recordStatus}>Original DOCX extraction · {result.preview.classification === 'reviewed' ? 'Coach reviewed' : result.preview.classificationBasis ? result.preview.classificationBasis === 'file-section' ? 'Role from file section' : 'Automated claim label' : 'Unreviewed card candidate'}</p>
      {result.section?.length ? <p className={styles.recordStatus}>{result.section.join(' › ')}</p> : null}
      <p className={styles.recordStatus}>Paragraphs {result.preview.paragraphRange.join('–')} · Revision {result.preview.sourceRevision}</p>
      {result.sources.slice(1).map(source => <Source key={source.cardId} source={source} />)}
    </details>
    <Source source={result.sources[0]} />
  </article>;
}

export function EvidenceSearch() {
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [facet, setFacet] = useState<SearchFacet>();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<Results | null>(null);
  const [submitted, setSubmitted] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);

  async function run(value: string, nextFilter: SearchFilter = 'all', facetOverride?: SearchFacet) {
    if (!value.trim()) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSubmitted(value.trim());
    setFilter(nextFilter);
    setFacet(facetOverride);
    setPending(true);
    setResponse(null);
    setError('');
    try {
      const res = await fetch('/api/arguments/search', {
        method: 'POST', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: value.trim(), filter: nextFilter, facetOverride, limit: 12 }),
      });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Sign in with the account that owns this preview.'
          : 'The evidence index is unavailable. Try again shortly.');
        return;
      }
      const data = await res.json() as Results;
      if (!controller.signal.aborted) setResponse(data);
    } catch {
      if (!controller.signal.aborted) setError('Search could not connect. Try again.');
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(query);
  }

  return <div className={styles.shell}>
    <a className={styles.skip} href="#debate-search">Skip to search</a>
    <header className={styles.top}>
      <div className={styles.topInner}>
        <a href="/arguments" className={styles.wordmark}>DebateOS</a>
        <a href="https://www.snu.edu/debate" className={styles.program}>SNU Debate</a>
      </div>
    </header>
    <main id="debate-search">
      <div className={styles.banner}>
        <div className={styles.bannerInner}>
          <h1>Evidence Search</h1>
          <p className={styles.lede}>Find debate positions, evidence cards, and original Dropbox files.</p>
        </div>
      </div>
      <div className={styles.layout}>
        <section className={styles.work} aria-label="Evidence search">
          <form onSubmit={submit} className={styles.form}>
            <label htmlFor="query">What are you looking for?</label>
            <div className={styles.controls}>
              <input required id="query" value={query} maxLength={200} onChange={event => setQuery(event.target.value)}
                placeholder="Search an argument, claim, or file name" />
              <button type="submit" disabled={!query.trim()}>Search</button>
            </div>
          </form>
          <div className={styles.examples} aria-label="Example searches">
            {examples.map(example => <button type="button" key={example} onClick={() => { setQuery(example); void run(example); }}>{example}</button>)}
          </div>
          <div className={styles.results}>
            {submitted && <div role="group" aria-label="Filter results" className={styles.filters}>
              {filters.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id}
                onClick={() => { if (filter !== item.id) void run(submitted, item.id, facet); }}>{item.label}</button>)}
            </div>}
            <div aria-live="polite" className={styles.resultStatus}>
              {pending && <p>Searching…</p>}
              {error && <p role="alert">{error}</p>}
              {response && <p><strong>{response.results.length} {response.results.length === 1 ? 'result' : 'results'}</strong> for “{submitted}”
                {(response.interpretation.facet || response.interpretation.debate?.role || response.interpretation.debate?.response) && <span className={styles.facet}>{
                  response.interpretation.facet ? facetNames[response.interpretation.facet] : response.interpretation.debate?.role ?? 'Answers to a claim'
                }</span>}</p>}
            </div>
            {response && response.interpretation.clarificationChoices.length > 0 && <div className={styles.clarify}>
              <strong>Which claim do you need?</strong>
              <div className={styles.examples}>{response.interpretation.clarificationChoices.map(facet =>
                <button type="button" key={facet} onClick={() => void run(submitted, filter, facet)}>{facetNames[facet]}</button>)}</div>
            </div>}
            {(response?.interpretation.facet || response?.interpretation.debate?.role || response?.interpretation.debate?.response) && !response.results.some(result => result.kind === 'card' && result.match === 'compatible')
              && response.results.length > 0 && (filter === 'card' || filter === 'all' && response.preferredKind === 'card') && <p className={styles.empty}>No verified card directly matched this request in the current collection.</p>}
            {response?.preferredKind === 'argument' && filter === 'all' && response.results.length > 0
              && !response.results.some(result => result.kind === 'argument' && result.match === 'compatible')
              && <p className={styles.empty}>No indexed position matched. Related cards and documents appear below.</p>}
            {response?.results.map(result => <Result key={`${result.kind}:${result.id}`} result={result} />)}
            {response && response.results.length === 0 && <p className={styles.empty}>No matches in this collection. Try a shorter query or a file name.</p>}
            {response && <p className={styles.snapshot}>Index checked {response.status.snapshot} · {response.status.documents} documents · {response.status.cards.toLocaleString('en-US')} card candidates</p>}
          </div>
        </section>
      </div>
    </main>
  </div>;
}
