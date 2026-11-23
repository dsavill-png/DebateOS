import { createHash } from 'node:crypto';
import type { Capture, Snapshot } from '../tabroom/adapter.ts';
import { normalize } from '../tabroom/normalize.ts';

type Decision = 'included' | 'excluded' | 'unresolved';
export type Manifest = {
  scopeId: string;
  revision: number;
  tournaments: {
    id: string;
    bulk: { id: string; sha256: string } | null;
    events: { id: string; division: string; decision: Decision }[];
  }[];
};

export function manifestDigest(manifest: Manifest) {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

type Evidence = {
  roster: Set<string>;
  assigned: Set<string>;
  links: Map<string, Set<string>>;
};

function evidence(): Evidence {
  return { roster: new Set(), assigned: new Set(), links: new Map() };
}

function addLink(target: Evidence, judge: string, person: string) {
  if (!target.links.has(judge)) target.links.set(judge, new Set());
  target.links.get(judge)!.add(person);
}

function counts(target: Evidence, seasonLinks: Evidence['links']) {
  const people = new Map<string, Set<string>>();
  const unlinked: string[] = [];
  const conflicts: { judge: string; people: string[] }[] = [];
  let linkedJudges = 0;
  for (const judge of [...target.assigned].sort()) {
    const candidates = [...(seasonLinks.get(judge) ?? [])].sort();
    if (!candidates.length) unlinked.push(judge);
    else if (candidates.length > 1) conflicts.push({ judge, people: candidates });
    else {
      linkedJudges++;
      if (!people.has(candidates[0])) people.set(candidates[0], new Set());
      people.get(candidates[0])!.add(judge);
    }
  }
  return {
    rostered: target.roster.size, assigned: target.assigned.size, linkedJudges,
    linkedPeople: people.size, unlinked: unlinked.length, conflicting: conflicts.length,
    rosterOnly: [...target.roster].filter(judge => !target.assigned.has(judge)).length,
    assignedNotRostered: [...target.assigned].filter(judge => !target.roster.has(judge)).length,
    unlinkedJudgeIds: unlinked, conflictingMappings: conflicts,
    duplicatePersonIds: [...people].filter(([, judges]) => judges.size > 1)
      .map(([person, judges]) => ({ person, judges: [...judges] })),
  };
}

export type IncludedEventObservation = {
  tournamentId: string;
  eventId: string;
  division: string;
  bulk: Capture;
  batch: ReturnType<typeof normalize>;
};

export function measureCoverage(
  manifest: Manifest,
  pin: { scopeId: string; revision: number; sha256: string },
  captures: ReadonlyMap<string, { snapshot: Snapshot; bytes: Uint8Array }>,
  observe?: (event: IncludedEventObservation) => void,
) {
  if (manifest.scopeId !== pin.scopeId || manifest.revision !== pin.revision ||
      manifestDigest(manifest) !== pin.sha256) throw new Error('Manifest pin mismatch');

  const season = evidence();
  const personEvents = new Map<string, Set<string>>();
  const rows = manifest.tournaments.flatMap(tournament => {
    const retained = tournament.bulk ? captures.get(tournament.bulk.id) : undefined;
    if (tournament.bulk && (!retained ||
        createHash('sha256').update(retained.bytes).digest('hex') !== tournament.bulk.sha256)) {
      throw new Error('Missing or mismatched pinned export for ' + tournament.id);
    }
    const bulk: Capture | undefined = retained && {
      snapshot: retained.snapshot,
      data: JSON.parse(Buffer.from(retained.bytes).toString('utf8')),
    };
    if (bulk && (bulk.snapshot.visibility !== 'anonymous public' ||
        bulk.snapshot.id !== tournament.bulk?.id || bulk.snapshot.sha256 !== tournament.bulk.sha256 ||
        bulk.snapshot.scope.tournament !== tournament.id || bulk.snapshot.status !== 200 ||
        !bulk.snapshot.media_type.includes('application/json') || String(bulk.data.id) !== tournament.id ||
        ![true, 'true'].includes(bulk.data.public as boolean | string))) {
      throw new Error('Ineligible or mismatched export for ' + tournament.id);
    }

    return tournament.events.filter(event => event.decision === 'included').map(event => {
      const scoped = evidence();
      const batch = bulk && normalize({ tournament: tournament.id, event: event.id }, undefined, undefined, bulk);
      if (bulk && batch) observe?.({ tournamentId: tournament.id, eventId: event.id, division: event.division, bulk, batch });
      for (const judge of batch?.tournamentJudges ?? []) {
        if (judge.provenance.some(row => row.source_path.includes('/judges/'))) {
          scoped.roster.add(judge.id);
          season.roster.add(judge.id);
        }
        for (const link of judge.personObservations) addLink(season, judge.id, link.personId);
      }
      for (const panel of batch?.debates ?? []) {
        for (const { judgeId } of panel.assignments) {
          scoped.assigned.add(judgeId);
          season.assigned.add(judgeId);
        }
      }
      const panelCount = batch?.debates.length ?? 0;
      const panelsWithoutAssignments = batch?.debates.filter(panel => !panel.assignments.length).length ?? 0;
      const exportAvailable = batch?.events.length === 1;
      return {
        tournament: tournament.id, event: event.id, division: event.division,
        exportAvailable, panelCount, panelsWithoutAssignments, scoped,
        assignmentCoverageUnknown: !panelCount || panelsWithoutAssignments > 0,
      };
    });
  });

  const events = rows.map(({ scoped, ...row }) => {
    for (const judge of scoped.assigned) {
      const links = season.links.get(judge);
      if (links?.size !== 1) continue;
      const [person] = links;
      if (!personEvents.has(person)) personEvents.set(person, new Set());
      personEvents.get(person)!.add(row.tournament + '/' + row.event);
    }
    return { ...row, ...counts(scoped, season.links) };
  });
  const decisions = manifest.tournaments.flatMap(tournament => tournament.events);
  return {
    pin,
    aggregate: {
      tournaments: new Set(events.map(row => row.tournament)).size,
      included: events.length,
      excluded: decisions.filter(event => event.decision === 'excluded').length,
      unresolved: decisions.filter(event => event.decision === 'unresolved').length,
      exportsAvailable: events.filter(row => row.exportAvailable).length,
      eventsWithoutObservedAssignments: events.filter(row => !row.assigned).length,
      assignmentCoverageUnknown: events.filter(row => row.assignmentCoverageUnknown).length,
      ...counts(season, season.links),
      duplicatePeopleAcrossEvents: [...personEvents].filter(([, events]) => events.size > 1)
        .map(([person, events]) => ({ person, events: [...events] })),
    },
    events,
  };
}


