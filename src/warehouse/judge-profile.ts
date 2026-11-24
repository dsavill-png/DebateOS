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

function resolveName(
  activity: JudgeActivity, manifest: RetainedManifest, readCapture: ReadCapture,
) {
  const evidence = activity.judgeLinks.flatMap(link => {
    if (!link.seasonRosterEvidence.length) return [];
    const source = manifest.tournaments.find(tournament => tournament.id === link.tournamentId)?.bulk;
    if (!source || source.authorization !== 'anonymous public' || source.status !== 200 ||
      source.url !== 'https://www.tabroom.com/api/download_data.mhtml?tourn_id=' + link.tournamentId) return [];
    const bytes = readCapture(link.tournamentId);
    if (!bytes) return [];
    if (sha256(bytes) !== source.sha256) throw new Error('Public capture digest mismatch for ' + link.tournamentId);
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (String(rowAt(body, '')?.id) !== link.tournamentId) return [];

    const ballotEvidence = link.personEvidence.filter(ref => {
      if (ref.snapshotId !== source.id || !/^\/categories\/\d+\/events\/\d+\/rounds\/\d+\/sections\/\d+\/ballots\/\d+$/.test(ref.pointer)) return false;
      const ballot = rowAt(body, ref.pointer);
      return String(ballot?.judge) === link.judgeId && String(ballot?.judge_person) === activity.personId;
    });
    if (!ballotEvidence.length) return [];

    return link.seasonRosterEvidence.flatMap(ref => {
      if (ref.snapshotId !== source.id || !/^\/categories\/\d+\/judges\/\d+$/.test(ref.pointer)) return [];
      const roster = rowAt(body, ref.pointer);
      if (String(roster?.id) !== link.judgeId || typeof roster?.name !== 'string' || !roster.name.trim()) return [];
      return [{
        name: roster.name.trim(), tournamentId: link.tournamentId, judgeId: link.judgeId,
        sourceUrl: source.url, capturedAt: source.fetchedAt, sha256: source.sha256,
        nameEvidence: { ...ref, pointer: ref.pointer + '/name' }, ballotEvidence,
      }];
    });
  });

  const names = [...new Set(evidence.map(row => row.name))];
  if (names.length === 1) return { status: 'verified' as const, label: names[0], evidence };
  return {
    status: 'unresolved' as const,
    label: 'Name unresolved from public evidence',
    reason: names.length > 1 ? 'conflicting-public-names' :
      activity.judgeLinks.some(link => link.seasonRosterEvidence.length) ?
        'name-not-verified-at-roster-reference' : 'no-observed-roster-join',
  };
}

type RecentPanel = {
  tournamentId: string; tournamentName: string; eventId: string; eventName: string; division: string;
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
