'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { SearchIntent, SearchFacet, SearchResponse, SearchResult, SourceLocation } from '../../argument-search/search';
import styles from './search.module.css';

const searchModes: { id: SearchIntent; label: string; hint: string }[] = [
  { id: 'card', label: 'Cards', hint: 'Find evidence for a specific claim.' },
  { id: 'argument', label: 'Arguments', hint: 'Find a family of related evidence.' },
  { id: 'document', label: 'Documents', hint: 'Find a file by name or folder.' },
];
const examples = ['Impact defense for Indo-Pakistan war', 'Answers to anti-Blackness is ontological (K Answers file)', 'Economic decline impact defense', 'Link for Midterms DA'];
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
    <details><summary>{result.sources.length} source {result.sources.length === 1 ? 'document' : 'documents'}</summary>
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
  const [mode, setMode] = useState<SearchIntent>('card');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<Results | null>(null);
  const [submitted, setSubmitted] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);

  async function run(value: string, intent = mode, facetOverride?: SearchFacet) {
    if (!value.trim()) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSubmitted(value.trim());
    setPending(true);
    setResponse(null);
    setError('');
    try {
      const res = await fetch('/api/arguments/search', {
        method: 'POST', cache: 'no-store', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: value.trim(), intent, facetOverride, limit: 12 }),
      });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Sign in with the account that owns this preview.'
          : 'The evidence index is unavailable. Try again shortly.');
        return;
      }
      setResponse(await res.json() as Results);
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
    <header className={styles.top}>
      <div className={styles.topInner}><a href="/arguments" className={styles.wordmark}><span className={styles.mark} aria-hidden="true">D</span>DebateOS</a><span className={styles.topLabel}>Private coach preview</span></div>
    </header>
    <main className={styles.main}>
      <h1>Evidence Search</h1>
      <p className={styles.lede}>Find debate cards, arguments, and their original Dropbox documents.</p>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <div className={styles.asideTitle}>Search for</div>
          <div role="group" aria-label="Search type" className={styles.modes}>
            {searchModes.map(item => <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => {
              setMode(item.id);
              if (query.trim() && submitted) void run(query, item.id);
            }}>
              <strong>{item.label}</strong><span>{item.hint}</span>
            </button>)}
          </div>
          <p className={styles.collection}><strong>Collection</strong>2026–27 Arms Sales<br />Selected shared prep</p>
        </aside>
        <section className={styles.work} aria-label="Evidence search">
          <form onSubmit={submit} className={styles.form}>
            <label htmlFor="query">What are you looking for?</label>
            <div className={styles.controls}>
              <input required id="query" value={query} maxLength={200} onChange={event => setQuery(event.target.value)}
                placeholder={mode === 'document' ? 'Search a file name or folder' : 'Search a claim, e.g. No US-China War'} />
              <button type="submit" disabled={!query.trim()}>Search</button>
            </div>
          </form>
          <div className={styles.examples} aria-label="Example searches">
            {examples.map(example => <button type="button" key={example} onClick={() => { setQuery(example); setMode('card'); void run(example, 'card'); }}>{example}</button>)}
          </div>
          <div className={styles.results}>
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
                <button type="button" key={facet} onClick={() => void run(submitted, mode, facet)}>{facetNames[facet]}</button>)}</div>
            </div>}
            {(response?.interpretation.debate?.role || response?.interpretation.debate?.response) && !response.results.some(result => result.kind === 'card' && result.match === 'compatible')
              && mode === 'card' && <p className={styles.empty}>No verified card directly matched this request in the current collection.</p>}
            {response?.results.map(result => <Result key={`${result.kind}:${result.id}`} result={result} />)}
            {response && response.results.length === 0 && <p className={styles.empty}>Try a shorter query or search Documents by file name.</p>}
            {response && <p className={styles.snapshot}>Index checked {response.status.snapshot} · {response.status.documents} documents · {response.status.cards.toLocaleString('en-US')} card candidates</p>}
          </div>
        </section>
      </div>
    </main>
  </div>;
}
