import { sha256, type Json } from '../tabroom/adapter.ts';
import type { JudgeActivity, JudgeActivityReport } from './judge-activity.ts';
import type { RetainedManifest } from './persist-season-manifest.ts';
import { manifestDigest } from './season-coverage.ts';

type ActivityInput = Pick<JudgeActivityReport, 'manifest' | 'evidenceCutoff' | 'derivationVersion'>;
type EvidenceRef = JudgeActivity['judgeLinks'][number]['personEvidence'][number];
type EventCoverage = JudgeActivityReport['coverage']['events'][number];
type ReadCapture = (tournamentId: string) => Uint8Array | undefined;

function rowAt(body: unknown, pointer: string): Json | undefined {
  const row = pointer.split('/').slice(1).reduce<unknown>((value, key) =>
    value && typeof value === 'object' && Object.hasOwn(value, key) ? (value as Json)[key] : undefined, body);
  return row && typeof row === 'object' && !Array.isArray(row) ? row as Json : undefined;
}

function objectRow(value: unknown): Json | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : undefined;
}

export function composedName(row: Json, firstKey: string, lastKey: string) {
  const direct = row.name;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const firstValue = row[firstKey];
  const lastValue = row[lastKey];
  const first = typeof firstValue === 'string' ? firstValue.trim() : '';
  const last = typeof lastValue === 'string' ? lastValue.trim() : '';
  const name = [first, last].filter(Boolean).join(' ').trim();
  return name || null;
}

function namedRosterRows(body: unknown, judgeId: string) {
  const root = objectRow(body);
  const categories = Array.isArray(root?.categories) ? root.categories : [];
  const rows: { name: string; pointer: string }[] = [];
  for (const [categoryIndex, rawCategory] of categories.entries()) {
    const category = objectRow(rawCategory);
    const judges = Array.isArray(category?.judges) ? category.judges : [];
    for (const [judgeIndex, rawJudge] of judges.entries()) {
      const judge = objectRow(rawJudge);
      if (!judge || String(judge.id) !== judgeId) continue;
      const name = composedName(judge, 'first', 'last');
      if (name) rows.push({ name, pointer: `/categories/${categoryIndex}/judges/${judgeIndex}` });
    }
  }
  return rows;
}

function resolveName(
  activity: JudgeActivity, manifest: RetainedManifest, readCapture: ReadCapture,
) {
  let captureAvailable = false;
  let explicitIdentityChain = false;
  const evidence = activity.judgeLinks.flatMap(link => {
    const source = manifest.tournaments.find(tournament => tournament.id === link.tournamentId)?.bulk;
    if (!source || source.authorization !== 'anonymous public' || source.status !== 200 ||
      source.url !== 'https://www.tabroom.com/api/download_data.mhtml?tourn_id=' + link.tournamentId) return [];
    const bytes = readCapture(link.tournamentId);
    if (!bytes) return [];
    captureAvailable = true;
    if (sha256(bytes) !== source.sha256) throw new Error('Public capture digest mismatch for ' + link.tournamentId);
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (String(rowAt(body, '')?.id) !== link.tournamentId) return [];

    const ballotEvidence = link.personEvidence.filter(ref => {
      if (ref.snapshotId !== source.id || !/^\/categories\/\d+\/events\/\d+\/rounds\/\d+\/sections\/\d+\/ballots\/\d+$/.test(ref.pointer)) return false;
      const ballot = rowAt(body, ref.pointer);
      return String(ballot?.judge) === link.judgeId && String(ballot?.judge_person) === activity.personId;
    });
    if (!ballotEvidence.length) return [];
    explicitIdentityChain = true;

    const ballotNames = new Set(ballotEvidence.flatMap(ref => {
      const ballot = rowAt(body, ref.pointer);
      if (!ballot) return [];
      const name = composedName(ballot, 'judge_first', 'judge_last');
      return name ? [name] : [];
    }));

    return namedRosterRows(body, link.judgeId).flatMap(roster => {
      if (ballotNames.size && !ballotNames.has(roster.name)) return [];
      return [{
        name: roster.name, tournamentId: link.tournamentId, judgeId: link.judgeId,
        sourceUrl: source.url, capturedAt: source.fetchedAt, sha256: source.sha256,
        rosterEvidence: { snapshotId: source.id, pointer: roster.pointer },
        ballotEvidence,
      }];
    });
  });

  const names = [...new Set(evidence.map(row => row.name))];
  if (names.length === 1) return { status: 'verified' as const, label: names[0], evidence };
  return {
    status: 'unresolved' as const,
    label: 'Name unresolved from public evidence',
    reason: names.length > 1 ? 'conflicting-public-names' :
      !captureAvailable ? 'capture-bytes-not-provided' :
        explicitIdentityChain ? 'no-named-roster-row-for-scoped-judge' : 'no-explicit-public-identity-chain',
  };
}

type RecentPanel = {
  tournamentId: string; tournamentName: string | null; eventId: string; eventName: string | null; division: string;
  roundId: string; panelId: string; assignmentDate: string | null; schools: string[];
  schoolCoverageUnresolved: boolean; evidence: EvidenceRef[];
};

function recentPanels(history: JudgeActivity['eventHistory']) {
  const panels = new Map<string, RecentPanel>();
  for (const event of history) {
    for (const assignment of event.assignments) {
      const key = JSON.stringify([event.tournamentId, event.eventId, assignment.roundId, assignment.panelId]);
      const panel: RecentPanel = panels.get(key) ?? {
        tournamentId: event.tournamentId, tournamentName: event.tournamentName,
        eventId: event.eventId, eventName: event.eventName, division: event.division,
        roundId: assignment.roundId, panelId: assignment.panelId, assignmentDate: assignment.assignmentDate,
        schools: [], schoolCoverageUnresolved: false, evidence: [],
      };
      for (const school of assignment.schoolObservations) {
        if (school.name && !panel.schools.includes(school.name)) panel.schools.push(school.name);
      }
      panel.schoolCoverageUnresolved ||= assignment.panelEntryCoverage !== 'two-observed-entries' ||
        assignment.unresolvedEntryEvidence.length > 0 || assignment.schoolObservations.some(school => !school.name);
      panel.evidence.push(...assignment.assignmentEvidence);
      panels.set(key, panel);
    }
  }
  return [...panels.values()].sort((a, b) => (b.assignmentDate ?? '').localeCompare(a.assignmentDate ?? '')).slice(0, 3);
}

export function deriveJudgeProfile(
  report: ActivityInput, activity: JudgeActivity, manifest: RetainedManifest, coverage: EventCoverage[],
  readCapture: ReadCapture = () => undefined,
) {
  if (manifestDigest(manifest) !== report.manifest.sha256) throw new Error('Activity manifest pin mismatch');
  return {
    kind: 'derived-public-judge-profile' as const,
    source: { manifest: report.manifest, evidenceCutoff: report.evidenceCutoff, activityVersion: report.derivationVersion },
    identity: {
      provider: activity.provider, personId: activity.personId,
      displayName: resolveName(activity, manifest, readCapture),
    },
    atAGlance: {
      panelAssignmentCount: activity.panelAssignmentCount,
      tournamentCount: activity.tournamentCount,
      divisions: activity.divisionDistribution.map(row => row.division),
      firstAssignmentDate: activity.firstAssignmentDate,
      mostRecentAssignmentDate: activity.mostRecentAssignmentDate,
      assignmentsWithoutDate: activity.assignmentsWithoutDate,
      snuExposure: activity.schoolExposure.explicitSnu,
    },
    coverage: {
      caveat: 'Counts describe activity observed in the pinned public exports. Missing observations can reflect gaps in discovery or publication.',
      assignedJudgeIdsAbsentFromSeasonRosters: activity.rosterStatus.assignedJudgeIdsAbsentFromSeasonRosters,
      panelsWithUnresolvedSchoolCoverage: activity.schoolExposure.panelsWithUnresolvedSchoolCoverage,
      events: activity.eventHistory.map(event => {
        const observed = coverage.find(row => row.tournament === event.tournamentId && row.event === event.eventId);
        return { tournamentId: event.tournamentId, eventId: event.eventId,
          assignmentCoverageUnknown: observed?.assignmentCoverageUnknown ?? true };
      }),
    },
    recentPanels: recentPanels(activity.eventHistory),
    evidence: { judgeLinks: activity.judgeLinks, eventHistory: activity.eventHistory },
  };
}

export type JudgeProfile = ReturnType<typeof deriveJudgeProfile>;
