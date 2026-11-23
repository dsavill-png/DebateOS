import type { Json, Observation } from '../tabroom/adapter.ts';
import type { RetainedManifest } from './persist-season-manifest.ts';
import { measureCoverage, type IncludedEventObservation } from './season-coverage.ts';

type EvidenceRef = { snapshotId: string; pointer: string };
type SchoolResolution = {
  schoolKey: string;
  tournamentSchoolId: string;
  chapterId: string | null;
  name: string | null;
  explicitSnu: boolean;
  schoolEvidence: EvidenceRef;
  entryEvidence: EvidenceRef;
  panelEntryEvidence: EvidenceRef[];
};
type Assignment = {
  roundId: string;
  panelId: string;
  judgeId: string;
  roundStartRaw: string | null;
  assignmentDate: string | null;
  rosterEvidence: EvidenceRef[];
  roundEvidence: EvidenceRef;
  panelEvidence: EvidenceRef;
  assignmentEvidence: EvidenceRef[];
  schoolObservations: SchoolResolution[];
  unresolvedEntryEvidence: EvidenceRef[];
  panelEntryCoverage: 'two-observed-entries' | 'partial-or-ambiguous';
};

const evidence = (row: Observation): EvidenceRef => ({ snapshotId: row.snapshot_id, pointer: row.source_path });
const unique = <T>(rows: T[]) => rows.length === 1 ? rows[0] : undefined;
const raw = (root: Json, row: Observation): Json => row.source_path.split('/').slice(1)
  .reduce<unknown>((value, segment) => (value as Json)[segment], root) as Json;
const sourceId = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
  ? String(value) : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? value : null;

function observedDate(start: string | null) {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.exec(start ?? '');
  if (!match || match[1].startsWith('0000')) return null;
  const date = new Date(match[1] + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === match[1] ? match[1] : null;
}

function collectEvent({ bulk, batch }: IncludedEventObservation) {
  const assignments: { scopedJudge: string; assignment: Assignment }[] = [];
  const judges = new Map(batch.tournamentJudges.map(judge => [judge.id, judge]));
  const rounds = new Map(batch.rounds.map(round => [round.provenance.source_path, round]));
  for (const panel of batch.debates) {
    if (!panel.assignments.length) continue;
    const round = rounds.get(panel.provenance.source_path.split('/sections/')[0])!;
    const sourceStart = raw(bulk.data, round.provenance).start_time;
    const roundStartRaw = typeof sourceStart === 'string' ? sourceStart : null;
    const assignmentDate = observedDate(roundStartRaw);
    const schoolObservations: SchoolResolution[] = [];
    const unresolvedEntryEvidence: EvidenceRef[] = [];
    for (const entryId of panel.entryIds) {
      const panelEntryEvidence = panel.ballots.filter(ballot => ballot.entryId === entryId)
        .map(ballot => evidence(ballot.provenance));
      const entry = unique(batch.entries.filter(row => row.id === entryId && row.eventId === round.eventId));
      const school = unique(batch.schools.filter(row => row.id === entry?.schoolId));
      if (!entry || !school || panel.entryIds.length > 2) {
        unresolvedEntryEvidence.push(...panelEntryEvidence);
        continue;
      }
      const chapterId = sourceId(raw(bulk.data, school.provenance).chapter);
      schoolObservations.push({
        schoolKey: chapterId ? 'tabroom:chapter:' + chapterId : school.id,
        tournamentSchoolId: school.provenance.source_id,
        chapterId,
        name: school.name,
        explicitSnu: school.name?.trim().toLowerCase() === 'southern nazarene university',
        schoolEvidence: evidence(school.provenance),
        entryEvidence: evidence(entry.provenance),
        panelEntryEvidence,
      });
    }
    for (const observed of panel.assignments) {
      const judge = judges.get(observed.judgeId)!;
      assignments.push({ scopedJudge: judge.id, assignment: {
        roundId: round.provenance.source_id,
        panelId: panel.provenance.source_id,
        judgeId: judge.id.split(':').at(-1)!,
        roundStartRaw,
        assignmentDate,
        rosterEvidence: judge.provenance.filter(row => row.source_path.includes('/judges/')).map(evidence),
        roundEvidence: evidence(round.provenance),
        panelEvidence: evidence(panel.provenance),
        assignmentEvidence: observed.provenance.map(evidence),
        schoolObservations,
        unresolvedEntryEvidence,
        panelEntryCoverage: panel.entryIds.length === 2 ? 'two-observed-entries' : 'partial-or-ambiguous',
      } });
    }
  }
  return { assignments, judges: batch.tournamentJudges, event: unique(batch.events) };
}

export function deriveJudgeActivity(
  manifest: RetainedManifest,
  pin: Parameters<typeof measureCoverage>[1],
  captures: Parameters<typeof measureCoverage>[2],
) {
  const observed = new Map<string, ReturnType<typeof collectEvent>>();
  const coverage = measureCoverage(manifest, pin, captures, event => {
    observed.set(event.tournamentId + '/' + event.eventId, collectEvent(event));
  });
  const peopleByJudge = new Map<string, Map<string, EvidenceRef[]>>();
  const rosterByJudge = new Map<string, Map<string, EvidenceRef>>();
  for (const event of observed.values()) {
    for (const judge of event.judges) {
      const candidates = peopleByJudge.get(judge.id) ?? new Map<string, EvidenceRef[]>();
      for (const link of judge.personObservations) {
        const refs = candidates.get(link.personId) ?? [];
        refs.push(...link.provenance.map(evidence));
        candidates.set(link.personId, refs);
      }
      peopleByJudge.set(judge.id, candidates);
      const roster = rosterByJudge.get(judge.id) ?? new Map<string, EvidenceRef>();
      for (const ref of judge.provenance.filter(row => row.source_path.includes('/judges/')).map(evidence)) {
        roster.set(JSON.stringify(ref), ref);
      }
      rosterByJudge.set(judge.id, roster);
    }
  }

  type History = {
    tournamentId: string;
    tournamentName: string | null;
    tournamentStart: string | null;
    eventId: string;
    eventName: string | null;
    division: string;
    membershipEvidence: RetainedManifest['tournaments'][number]['events'][number]['evidence'];
    eventEvidence: EvidenceRef;
    assignments: Assignment[];
  };
  const histories = new Map<string, History[]>();
  for (const tournament of manifest.tournaments) {
    for (const event of tournament.events.filter(row => row.decision === 'included')) {
      const batch = observed.get(tournament.id + '/' + event.id);
      if (!batch?.event) continue;
      const assignmentsByPerson = new Map<string, Assignment[]>();
      for (const { scopedJudge, assignment } of batch.assignments) {
        const candidates = peopleByJudge.get(scopedJudge)!;
        if (candidates.size !== 1) continue;
        const [person] = candidates.keys();
        const assignments = assignmentsByPerson.get(person) ?? [];
        assignments.push(assignment);
        assignmentsByPerson.set(person, assignments);
      }
      for (const [person, assignments] of assignmentsByPerson) {
        const history = histories.get(person) ?? [];
        history.push({
          tournamentId: tournament.id, tournamentName: tournament.name ?? null,
          tournamentStart: tournament.start ?? null, eventId: event.id, eventName: batch.event.name,
          division: event.division, membershipEvidence: event.evidence,
          eventEvidence: evidence(batch.event.provenance), assignments,
        });
        histories.set(person, history);
      }
    }
  }

  const people = [...histories.keys()].sort().map(person => {
    const eventHistory = histories.get(person)!;
    const assignments = eventHistory.flatMap(event => event.assignments);
    const dates = assignments.flatMap(row => row.assignmentDate ? [row.assignmentDate] : []).sort();
    const tournamentIds = [...new Set(eventHistory.map(row => row.tournamentId))];
    const judgeLinks = new Map<string, { tournamentId: string; judgeId: string; personEvidence: EvidenceRef[]; seasonRosterEvidence: EvidenceRef[] }>();
    const divisions = new Map<string, { division: string; eventCount: number; assignmentObservationCount: number; panelAssignmentCount: number }>();
    const schoolCounts = new Map<string, {
      schoolKey: string; names: Set<string>; panels: Set<string>; rounds: Set<string>; explicitSnu: boolean;
    }>();
    let panelsWithUnresolvedSchoolCoverage = 0;
    const panels = new Set<string>();
    const snuPanels = new Set<string>();
    const snuRounds = new Set<string>();
    for (const event of eventHistory) {
      const division = divisions.get(event.division) ?? {
        division: event.division, eventCount: 0, assignmentObservationCount: 0, panelAssignmentCount: 0,
      };
      division.eventCount++;
      division.assignmentObservationCount += event.assignments.length;
      divisions.set(event.division, division);
      const unresolved = new Set<string>();
      for (const assignment of event.assignments) {
        const key = 'tabroom:tournament:' + event.tournamentId + ':judge:' + assignment.judgeId;
        judgeLinks.set(key, {
          tournamentId: event.tournamentId, judgeId: assignment.judgeId,
          personEvidence: peopleByJudge.get(key)!.get(person)!,
          seasonRosterEvidence: [...rosterByJudge.get(key)!.values()],
        });
        const round = JSON.stringify([event.tournamentId, event.eventId, assignment.roundId]);
        const panel = JSON.stringify([round, assignment.panelId]);
        // The sets are scoped to this person. Only the first observation counts toward experience.
        if (!panels.has(panel)) {
          panels.add(panel);
          division.panelAssignmentCount++;
        }
        if (assignment.panelEntryCoverage !== 'two-observed-entries' || assignment.unresolvedEntryEvidence.length) {
          unresolved.add(panel);
        }
        for (const school of assignment.schoolObservations) {
          const count = schoolCounts.get(school.schoolKey) ?? {
            schoolKey: school.schoolKey, names: new Set<string>(), panels: new Set<string>(),
            rounds: new Set<string>(), explicitSnu: false,
          };
          if (school.name) count.names.add(school.name);
          count.panels.add(panel);
          count.rounds.add(round);
          if (school.explicitSnu) {
            count.explicitSnu = true;
            snuPanels.add(panel);
            snuRounds.add(round);
          }
          schoolCounts.set(school.schoolKey, count);
        }
      }
      panelsWithUnresolvedSchoolCoverage += unresolved.size;
    }
    const schools = [...schoolCounts.values()].map(({ names, panels, rounds, ...school }) => ({
      ...school, names: [...names].sort(), panelCount: panels.size, roundCount: rounds.size,
    }));
    const links = [...judgeLinks.values()];
    return {
      provider: 'tabroom' as const, personId: person.slice('tabroom:person:'.length),
      judgeLinks: links, tournamentIds, tournamentCount: tournamentIds.length,
      eventDivisionCount: eventHistory.length,
      assignmentObservationCount: assignments.length, panelAssignmentCount: panels.size,
      firstAssignmentDate: dates[0] ?? null, mostRecentAssignmentDate: dates.at(-1) ?? null,
      assignmentsWithoutDate: assignments.length - dates.length,
      divisionDistribution: [...divisions.values()],
      repeatedAcrossTournaments: tournamentIds.length > 1, repeatedAcrossEvents: eventHistory.length > 1,
      rosterStatus: {
        assignedJudgeIdsObservedOnSeasonRosters: links.filter(link => link.seasonRosterEvidence.length).length,
        assignedJudgeIdsAbsentFromSeasonRosters: links.filter(link => !link.seasonRosterEvidence.length).length,
      },
      schoolExposure: {
        schoolCount: schools.length, schools, panelsWithUnresolvedSchoolCoverage,
        explicitSnu: { panelCount: snuPanels.size, roundCount: snuRounds.size },
      },
      eventHistory,
    };
  });

  return {
    derivationVersion: 2 as const,
    parserVersion: 1 as const,
    manifest: coverage.pin,
    evidenceCutoff: [...manifest.discovery, ...manifest.tournaments.flatMap(row =>
      [row.invite, row.bulk, row.bulkAttempt].filter(source => source !== null))]
      .map(source => source.fetchedAt).sort().at(-1) ?? null,
    coverage,
    people,
  };
}

export type JudgeActivityReport = ReturnType<typeof deriveJudgeActivity>;
export type JudgeActivity = JudgeActivityReport['people'][number];
