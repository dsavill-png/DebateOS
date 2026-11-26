import { isDeepStrictEqual } from 'node:util';
import {
  appendParadigmRevision, paradigmAsOf,
  type Evidence, type HistoryObservation, type ParadigmRevision, type Side,
} from './judge-evidence.ts';

// IDs refer to warehouse_evidence rows (capture, parser, pointer and policy).
// The caller pins the mapping and supplies verified, audience-eligible evidence
// at the build cutoff, including capture policy and applicable grant checks.
export type ProjectionScope = Readonly<{
  cutoff: string;
  mappingVersion: string;
  eligibleEvidenceIds: ReadonlySet<string>;
}>;

type References = readonly [string, ...string[]];

type HistoryCandidate = Readonly<{
  observation: HistoryObservation;
  // Scope and identity must be verified by the caller against these keys.
  judgeId: string;
  assignmentEvidenceIds: References;
  voteEvidenceIds?: References;
  // Explicit panel result evidence, independent of the individual ballot.
  resultEvidenceIds?: References;
}>;

type ParadigmCandidate = Readonly<{
  revision: ParadigmRevision;
  identityEvidenceIds: References;
  reviewDateEvidenceIds?: References;
}>;

type SideObservation = Readonly<{
  value: Side | null;
  unrecognized: boolean;
  evidenceIds: readonly string[];
}>;

function eligible(scope: ProjectionScope, capture: Evidence, references: readonly string[]) {
  return capture.observedAt <= scope.cutoff &&
    scope.eligibleEvidenceIds.has(capture.id) &&
    references.every(id => scope.eligibleEvidenceIds.has(id));
}

function resolveDecision(observations: readonly SideObservation[]) {
  const known = new Set(observations.flatMap(row => row.value === null ? [] : [row.value]));
  const value = known.size === 1 ? [...known][0] : null;
  const status = known.size > 1 ? 'conflicting' : value ? 'observed'
    : observations.some(row => row.unrecognized) ? 'unrecognized' : 'missing';
  return { status, value, observations };
}

function fieldEvidence(row: Evidence, references: References | undefined, scope: ProjectionScope) {
  return references && eligible(scope, row, references)
    ? [...new Set([row.id, ...references])].sort() : undefined;
}

export function projectJudgeHistory(candidates: readonly HistoryCandidate[], scope: ProjectionScope) {
  const byPanel = new Map<string, {
    assignments: Map<string, { sources: Map<string, { judgeId: string; evidenceId: string; evidenceIds: Set<string> }>;
      votes: Map<string, SideObservation> }>;
    results: Map<string, SideObservation>;
  }>();
  // Immutable row replay is keyed before counting, after assignment eligibility.
  const observations = new Map<string, HistoryObservation>();
  for (const { observation, judgeId, assignmentEvidenceIds, voteEvidenceIds, resultEvidenceIds } of candidates) {
    const { personId, panelId, evidence } = observation;
    const linkEvidenceIds = [...new Set([...assignmentEvidenceIds, ...observation.linkEvidenceIds])];
    if (!eligible(scope, evidence, linkEvidenceIds)) continue;
    const previous = observations.get(evidence.id);
    const comparable = { ...observation, linkEvidenceIds: [] };
    if (previous && !isDeepStrictEqual(previous, comparable)) {
      throw new Error('Conflicting history observation for the same evidence');
    }
    observations.set(evidence.id, comparable);
    const panel = byPanel.get(panelId) ?? { assignments: new Map(), results: new Map() };
    byPanel.set(panelId, panel);
    const assignment = panel.assignments.get(personId) ?? { sources: new Map(), votes: new Map() };
    panel.assignments.set(personId, assignment);
    const sourceKey = JSON.stringify([judgeId, evidence.id]);
    const source = assignment.sources.get(sourceKey) ?? {
      judgeId, evidenceId: evidence.id, evidenceIds: new Set([evidence.id]),
    };
    assignment.sources.set(sourceKey, source);
    for (const id of linkEvidenceIds) source.evidenceIds.add(id);

    const voteLineage = fieldEvidence(evidence, voteEvidenceIds, scope);
    if (voteLineage) {
      addDecisionEvidence(assignment.votes, evidence.id, observation.individualVote,
        observation.voteUnrecognized, [...linkEvidenceIds, ...voteLineage]);
    }
    const resultLineage = fieldEvidence(evidence, resultEvidenceIds, scope);
    if (resultLineage) {
      addDecisionEvidence(panel.results, evidence.id, observation.panelResult,
        observation.resultUnrecognized, [...linkEvidenceIds, ...resultLineage]);
    }
  }
  return {
    mappingVersion: scope.mappingVersion,
    assignments: [...byPanel].sort().flatMap(([panelId, panel]) =>
      [...panel.assignments].sort().map(([personId, assignment]) => ({
        personId, panelId,
        sources: [...assignment.sources].sort().map(([, source]) => ({
          ...source, evidenceIds: [...source.evidenceIds].sort(),
        })),
        individualVote: resolveDecision([...assignment.votes].sort().map(([, vote]) => vote)),
      }))),
    panelResults: [...byPanel].sort().map(([panelId, panel]) => ({
      panelId, ...resolveDecision([...panel.results].sort().map(([, result]) => result)),
    })),
  };
}

function addDecisionEvidence(
  decisions: Map<string, SideObservation>, evidenceId: string, value: Side | null,
  unrecognized: boolean, evidenceIds: readonly string[],
) {
  const previous = decisions.get(evidenceId);
  decisions.set(evidenceId, {
    value, unrecognized, evidenceIds: [...new Set([...evidenceIds, ...(previous?.evidenceIds ?? [])])].sort(),
  });
}

export function projectParadigms(candidates: readonly ParadigmCandidate[], personId: string, scope: ProjectionScope) {
  let revisions: readonly ParadigmRevision[] = [];
  const lineage = new Map<string, { textEvidenceIds: Set<string>; reviewDateEvidenceIds: Set<string> }>();
  // Merge eligible lineage before masking an optional review date, so repeated
  // imports with different supporting references still represent one revision.
  for (const { revision, identityEvidenceIds, reviewDateEvidenceIds } of candidates) {
    if (revision.personId !== personId || !eligible(scope, revision.evidence, identityEvidenceIds)) continue;
    revisions = appendParadigmRevision(revisions, revision);
    const id = revision.evidence.id;
    const links = lineage.get(id) ?? { textEvidenceIds: new Set([id]), reviewDateEvidenceIds: new Set() };
    lineage.set(id, links);
    for (const ref of identityEvidenceIds) links.textEvidenceIds.add(ref);
    const dateLineage = fieldEvidence(revision.evidence, reviewDateEvidenceIds, scope);
    if (dateLineage && revision.sourceReviewDate !== null) {
      for (const ref of [...identityEvidenceIds, ...dateLineage]) links.reviewDateEvidenceIds.add(ref);
    }
  }
  const eligibleRevisions = revisions.map(revision => {
    const links = lineage.get(revision.evidence.id)!;
    return {
      ...revision, sourceReviewDate: links.reviewDateEvidenceIds.size ? revision.sourceReviewDate : null,
      textEvidenceIds: [...links.textEvidenceIds].sort(),
      reviewDateEvidenceIds: [...links.reviewDateEvidenceIds].sort(),
    };
  }).sort((a, b) => a.evidence.id.localeCompare(b.evidence.id, 'en'));
  return {
    mappingVersion: scope.mappingVersion,
    revisions: eligibleRevisions,
    latest: paradigmAsOf(eligibleRevisions, personId, scope.cutoff),
  };
}
