import type { Capture, Json, Observation, Scope } from './adapter.ts';

function id(value: unknown) {
  return typeof value === 'string' && value.length ? value
    : typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : null;
}

function label(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function rows(value: unknown, path: string) {
  return (Array.isArray(value) ? value : []).flatMap((row, index) =>
    row && typeof row === 'object' && !Array.isArray(row)
      ? [{ row: row as Json, path: path + '/' + index }]
      : []);
}

function observation(capture: Capture, method: Observation['source_method'], source_id: string, source_path: string): Observation {
  return {
    source: 'tabroom', source_method: method, source_id, source_path,
    fetched_at: capture.snapshot.fetched_at, snapshot_id: capture.snapshot.id,
  };
}

export function normalize(scope: Scope, rest?: Capture, invite?: Capture, bulk?: Capture) {
  const issues: { resource: 'bulk' | 'tournament'; state: 'failed' | 'conflict'; reason: string }[] = [];
  const t = 'tabroom:tournament:' + scope.tournament;
  const observed = (capture: Capture | undefined, method: Observation['source_method']) => capture ? {
    name: label(capture.data.name),
    start: label(capture.data.start),
    end: label(capture.data.end),
    provenance: observation(capture, method, scope.tournament, ''),
  } : null;
  const restTournament = observed(rest, 'REST');
  const bulkTournament = observed(bulk, 'bulk');
  const restName = restTournament?.name;
  const bulkName = bulkTournament?.name;
  if (restName && bulkName && restName !== bulkName) {
    issues.push({ resource: 'tournament', state: 'conflict', reason: 'Tournament names disagree' });
  }
  const tournament = restTournament || bulkTournament ? {
    id: t,
    name: restName ?? bulkName ?? null,
    start: restTournament?.start ?? bulkTournament?.start ?? null,
    end: restTournament?.end ?? bulkTournament?.end ?? null,
    observations: [restTournament, bulkTournament].filter(value => value !== null),
  } : null;

  const ref = (entity: string, sourceId: string) => t + ':' + entity + ':' + sourceId;
  const evidence = (sourceId: string, path: string) => observation(bulk!, 'bulk', sourceId, path);
  const categories = rows(bulk?.data.categories, '/categories');
  const scopedEvents = categories.flatMap(category =>
    rows(category.row.events, category.path + '/events').flatMap(event => {
      const eventId = id(event.row.id);
      const rounds = rows(event.row.rounds, event.path + '/rounds');
      if (!eventId || (scope.event && eventId !== scope.event) ||
          (scope.round && !rounds.some(round => id(round.row.id) === scope.round))) return [];
      return [{ ...event, eventId, rounds, judges: rows(category.row.judges, category.path + '/judges') }];
    }));
  const events = scopedEvents.map(({ row, path, eventId }) => ({
    id: ref('event', eventId), tournamentId: t, name: label(row.name), provenance: evidence(eventId, path),
  }));
  const schools = rows(bulk?.data.schools, '/schools').flatMap(school => {
    const schoolId = id(school.row.id);
    if (!schoolId) return [];
    return [{ ...school, record: {
      id: ref('school', schoolId), tournamentId: t, name: label(school.row.name), provenance: evidence(schoolId, school.path),
    } }];
  });
  const students = schools.flatMap(school =>
    rows(school.row.students, school.path + '/students').flatMap(({ row, path }) => {
      const studentId = id(row.id);
      if (!studentId) return [];
      return [{
        id: ref('student', studentId), schoolId: school.record.id,
        chapterId: id(row.chapter), provenance: evidence(studentId, path),
      }];
    }));
  const entries = schools.flatMap(school => rows(school.row.entries, school.path + '/entries').flatMap(({ row, path }) => {
    const entryId = id(row.id);
    const eventId = id(row.event);
    if (!entryId || !eventId || !events.some(event => event.id === ref('event', eventId))) return [];
    const schoolId = !id(row.school) || id(row.school) === id(school.row.id) ? school.record.id : null;
    const roster = Array.isArray(row.students) ? row.students.flatMap((value, index) => {
      const studentId = id(value);
      if (!studentId) return [];
      const studentRef = ref('student', studentId);
      return [{
        sourceStudentId: studentId,
        studentId: schoolId && students.filter(student =>
          student.id === studentRef && student.schoolId === schoolId).length === 1 ? studentRef : null,
        provenance: evidence(entryId, path + '/students/' + index),
      }];
    }) : null;
    return [{
      id: ref('entry', entryId), eventId: ref('event', eventId),
      schoolId, roster, code: label(row.code), provenance: evidence(entryId, path),
    }];
  }));
  const timeslots = rows(bulk?.data.timeslots, '/timeslots').flatMap(({ row, path }) => {
    const timeslotId = id(row.id);
    if (!timeslotId) return [];
    return [{
      id: ref('timeslot', timeslotId), tournamentId: t, name: label(row.name),
      start: label(row.start), end: label(row.end), provenance: evidence(timeslotId, path),
    }];
  });
  const rounds = scopedEvents.flatMap(event => event.rounds.flatMap(round => {
    const roundId = id(round.row.id);
    if (!roundId || (scope.round && roundId !== scope.round)) return [];
    return [{ ...round, judges: event.judges, record: {
      id: ref('round', roundId), eventId: ref('event', event.eventId),
      label: label(round.row.label), provenance: evidence(roundId, round.path),
    } }];
  }));
  if (bulk && ((scope.event && !events.length) || (scope.round && !rounds.length))) {
    issues.push({ resource: 'bulk', state: 'failed', reason: 'Requested event or round missing from export' });
  }
  const judges = new Map<string, { id: string; tournamentId: string; provenance: Observation[] }>();
  const persons = new Map<string, { id: string; provenance: Observation[] }>();
  const associations = new Map<string, Map<string, Observation[]>>();
  for (const event of scopedEvents) {
    for (const { row, path } of event.judges) {
      const judge = id(row.id);
      if (!judge || judges.has(judge)) continue;
      judges.set(judge, { id: ref('judge', judge), tournamentId: t, provenance: [evidence(judge, path)] });
    }
  }
  const debates = rounds.flatMap(round => rows(round.row.sections, round.path + '/sections').flatMap(({ row, path }) => {
    const panel = id(row.id);
    if (!panel || (id(row.round) && id(row.round) !== round.record.provenance.source_id)) return [];
    const debateId = round.record.id + ':panel:' + panel;
    const assignments = new Map<string, Observation[]>();
    const ballots = rows(row.ballots, path + '/ballots').flatMap(({ row, path }) => {
      const ballot = id(row.id);
      const entry = id(row.entry);
      if (!ballot || !entry || (id(row.panel) && id(row.panel) !== panel) ||
          entries.filter(record => record.id === ref('entry', entry) && record.eventId === round.record.eventId).length !== 1) return [];
      const judge = id(row.judge);
      const person = id(row.judge_person);
      const provenance = evidence(ballot, path);
      if (judge) {
        if (!judges.has(judge)) judges.set(judge, { id: ref('judge', judge), tournamentId: t, provenance: [] });
        judges.get(judge)!.provenance.push(provenance);
        if (!assignments.has(judge)) assignments.set(judge, []);
        assignments.get(judge)!.push(provenance);
        if (person) {
          const personId = 'tabroom:person:' + person;
          if (!persons.has(person)) persons.set(person, { id: personId, provenance: [] });
          persons.get(person)!.provenance.push(provenance);
          if (!associations.has(judge)) associations.set(judge, new Map());
          const links = associations.get(judge)!;
          if (!links.has(personId)) links.set(personId, []);
          links.get(personId)!.push(provenance);
        }
      }
      return [{
        id: debateId + ':ballot:' + ballot, debateId, entryId: ref('entry', entry),
        judgeId: judge ? ref('judge', judge) : null,
        sourceSide: row.side ?? null, sourceScore: row.score ?? null,
        sourceScores: Array.isArray(row.scores) ? row.scores : null, provenance,
      }];
    });
    const entryIds = [...new Set(ballots.map(ballot => ballot.entryId))];
    return [{
      id: debateId, roundId: round.record.id, flight: id(row.flight), room: label(row.room),
      provenance: evidence(panel, path), entryIds, ballots,
      matchup: entryIds.length === 2 ? 'observed' as const : 'unresolved' as const,
      winningEntryId: null, outcome: 'unresolved' as const,
      assignments: [...assignments].map(([judge, provenance]) => ({
        debateId, judgeId: ref('judge', judge), provenance,
      })),
    }];
  }));
  const tournamentJudges = [...judges].map(([judge, record]) => {
    const personObservations = [...(associations.get(judge) ?? [])].map(([personId, provenance]) => ({ personId, provenance }));
    if (personObservations.length > 1) {
      issues.push({ resource: 'bulk', state: 'conflict', reason: 'Tournament judge has conflicting person associations' });
    }
    return { ...record, personId: personObservations.length === 1 ? personObservations[0].personId : null, personObservations };
  });
  return {
    tournament, invitation: observed(invite, 'REST'), events,
    schools: schools.map(school => school.record), entries, students, timeslots, rounds: rounds.map(round => round.record),
    debates, tournamentJudges, persons: [...persons.values()], issues,
  };
}
