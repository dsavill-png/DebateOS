import { isDeepStrictEqual } from 'node:util';

export type Evidence = Readonly<{
  id: string;
  observedAt: string; // Canonical UTC ISO instant from the capture.
}>;

type PersonLink = Readonly<{ tabroomPersonId: number; personId: string }>;
type Side = 'aff' | 'neg';

function canonicalPerson(sourceId: number, links: readonly PersonLink[]) {
  const matches = new Set(links.filter(link => link.tabroomPersonId === sourceId)
    .map(link => link.personId));
  if (matches.size > 1) return { status: 'ambiguous-person' as const };
  const personId = matches.values().next().value;
  return personId ? { status: 'linked' as const, personId }
    : { status: 'unlinked-person' as const };
}

function sourceId(value: unknown): number | null {
  const id = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value;
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : null;
}

function dateOnly(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? value : null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function field(value: unknown, key: string): unknown {
  const row = record(value);
  return Object.hasOwn(row, key) ? row[key] : undefined;
}

export type ParadigmRevision = Readonly<{
  personId: string;
  text: string;
  sourceReviewDate: string | null;
  evidence: Evidence;
}>;

export function mapParadigm(
  payload: unknown,
  expectedPersonId: number,
  links: readonly PersonLink[],
  evidence: Evidence,
  reviewDateField: string,
) {
  if (sourceId(field(payload, 'id')) !== expectedPersonId) return { status: 'identity-mismatch' as const };
  const person = canonicalPerson(expectedPersonId, links);
  if (person.status !== 'linked') return person;
  const text = field(payload, 'paradigm');
  if (typeof text !== 'string') return { status: 'missing-text' as const };
  const reviewDate = field(payload, reviewDateField);
  const revision: ParadigmRevision = {
    personId: person.personId, text, sourceReviewDate: dateOnly(reviewDate), evidence,
  };
  return { status: 'mapped' as const, revision, reviewDateStatus:
    revision.sourceReviewDate ? 'present' : reviewDate == null ? 'missing' : 'invalid' };
}

export function appendParadigmRevision(
  revisions: readonly ParadigmRevision[], revision: ParadigmRevision,
): readonly ParadigmRevision[] {
  const existing = revisions.find(row =>
    row.personId === revision.personId && row.evidence.id === revision.evidence.id);
  if (!existing) return [...revisions, revision];
  if (existing.text !== revision.text || existing.sourceReviewDate !== revision.sourceReviewDate ||
      existing.evidence.observedAt !== revision.evidence.observedAt) {
    throw new Error('Conflicting paradigm revision for the same evidence');
  }
  return revisions;
}

export function paradigmAsOf(
  eligible: readonly ParadigmRevision[], personId: string, cutoff: string,
) {
  const candidates = eligible.filter(row => row.personId === personId && row.evidence.observedAt <= cutoff);
  const latest = candidates.reduce((time, row) => time < row.evidence.observedAt ? row.evidence.observedAt : time, '');
  const tied = candidates.filter(row => row.evidence.observedAt === latest)
    .sort((a, b) => a.evidence.id.localeCompare(b.evidence.id, 'en'));
  const revision = tied[0];
  if (!revision) return { status: 'missing' as const };
  if (tied.some(row => row.text !== revision.text || row.sourceReviewDate !== revision.sourceReviewDate)) {
    return { status: 'conflicting' as const };
  }
  return { status: 'mapped' as const, revision };
}

type HistoryFields = Readonly<{
  tournament: string;
  event?: string;
  round?: string;
  vote?: string;
  result?: string;
}>;

// Each link must be explicitly evidenced against the specific source row.
type PanelLink = Readonly<{
  rowEvidenceId: string;
  tournamentSourceId: number;
  judgePersonId: string;
  panelId: string;
  evidenceId: string;
}>;

type HistoryObservation = Readonly<{
  personId: string;
  panelId: string;
  linkEvidenceIds: readonly string[];
  tournamentSourceId: number;
  eventLabel: string | null;
  roundLabel: string | null;
  individualVote: Side | null;
  panelResult: Side | null;
  evidence: Evidence;
}>;

const label = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;
const side = (value: unknown): Side | null => {
  const normalized = label(value)?.trim().toLowerCase();
  return normalized === 'aff' || normalized === 'neg' ? normalized : null;
};

export function mapJudgeHistory(
  rows: readonly Readonly<{ payload: unknown; evidence: Evidence }>[],
  verifiedRecordPersonId: number,
  people: readonly PersonLink[],
  panels: readonly PanelLink[],
  fields: HistoryFields,
) {
  const person = canonicalPerson(verifiedRecordPersonId, people);
  if (person.status !== 'linked') return person;
  const byPanel = new Map<string, HistoryObservation[]>();
  const gaps: { evidenceId: string; reason: 'missing-tournament' | 'unlinked-panel' | 'ambiguous-panel' }[] = [];
  const panelLinks = new Map<string, PanelLink[]>();
  for (const link of panels) {
    const matches = panelLinks.get(link.rowEvidenceId) ?? [];
    matches.push(link);
    panelLinks.set(link.rowEvidenceId, matches);
  }
  const seen = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const earlier = seen.get(row.evidence.id);
    if (earlier) {
      if (earlier.evidence.observedAt !== row.evidence.observedAt ||
          !isDeepStrictEqual(earlier.payload, row.payload)) {
        throw new Error('Conflicting history row for the same evidence');
      }
      continue;
    }
    seen.set(row.evidence.id, row);
    const tournamentSourceId = sourceId(field(row.payload, fields.tournament));
    if (!tournamentSourceId) {
      gaps.push({ evidenceId: row.evidence.id, reason: 'missing-tournament' });
      continue;
    }
    const links = (panelLinks.get(row.evidence.id) ?? []).filter(link =>
      link.tournamentSourceId === tournamentSourceId && link.judgePersonId === person.personId);
    const panelIds = new Set(links.map(link => link.panelId));
    const link = links[0];
    if (!link || panelIds.size !== 1) {
      gaps.push({ evidenceId: row.evidence.id, reason: link ? 'ambiguous-panel' : 'unlinked-panel' });
      continue;
    }
    const observations = byPanel.get(link.panelId) ?? [];
    observations.push({
      personId: person.personId, panelId: link.panelId, tournamentSourceId,
      linkEvidenceIds: [...new Set(links.map(candidate => candidate.evidenceId))].sort(),
      eventLabel: label(fields.event && field(row.payload, fields.event)),
      roundLabel: label(fields.round && field(row.payload, fields.round)),
      individualVote: side(fields.vote && field(row.payload, fields.vote)),
      panelResult: side(fields.result && field(row.payload, fields.result)),
      evidence: row.evidence,
    });
    byPanel.set(link.panelId, observations);
  }
  return {
    status: 'mapped' as const, gaps,
    assignments: [...byPanel].map(([panelId, observations]) => ({
      personId: person.personId, panelId, observations,
      individualVote: resolveSide(observations.map(row => row.individualVote)),
      panelResult: resolveSide(observations.map(row => row.panelResult)),
      level: null, competitionDate: null,
    })),
  };
}

function resolveSide(sides: readonly (Side | null)[]) {
  const known = new Set(sides.filter(side => side !== null));
  if (known.size > 1) return { status: 'conflicting' as const, value: null };
  const value = known.values().next().value;
  return value ? { status: 'observed' as const, value } : { status: 'missing' as const, value: null };
}
