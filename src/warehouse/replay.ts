import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';
import { sha256, type Json, type Observation, type Snapshot, type TabroomAdapter } from '../tabroom/adapter.ts';
import * as schema from './schema.ts';

type Batch = Awaited<ReturnType<TabroomAdapter['import']>>;
type ReplayCapture = { bytes: Uint8Array; originalDigest?: string };

const publicPolicy = {
  authorization: 'public', purpose: 'tournament evidence', audience: 'public', retention: 'public-evidence',
};

function at(root: unknown, pointer: string): unknown {
  return pointer === '' ? root : pointer.slice(1).split('/').reduce<unknown>((value, key) =>
    value && typeof value === 'object' && Object.hasOwn(value, key) ? (value as Json)[key] : undefined, root);
}

function record(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
}

function fields(value: unknown, keys: readonly string[]): Json {
  const row = record(value);
  return Object.fromEntries(keys.flatMap(key => {
    const field = row[key];
    return field === null || ['string', 'number', 'boolean'].includes(typeof field) ? [[key, field]] : [];
  }));
}

const entityFields: Record<string, readonly string[]> = {
  tournament: ['id', 'name', 'start', 'end', 'public'],
  invitation: ['id', 'name', 'start', 'end', 'public'],
  category: ['id', 'name', 'abbr'],
  event: ['id', 'name', 'abbr', 'type'],
  school: ['id', 'name', 'code', 'chapter'],
  student: ['id', 'chapter'],
  entry: ['id', 'event', 'school', 'code', 'active', 'waitlist', 'dropped'],
  timeslot: ['id', 'name', 'start', 'end'],
  round: ['id', 'name', 'label', 'type', 'published'],
  panel: ['id', 'round', 'flight', 'room', 'letter', 'bye'],
  judge: ['id', 'judge', 'active', 'hired'],
};

function sourceId(value: unknown): string | null {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return null;
}

function collection(value: unknown, pointer: string) {
  return Array.isArray(value) ? value.map((raw, i) => ({ raw, row: record(raw), pointer: pointer + '/' + i })) : [];
}

type Identity = AnyPgTable & { id: AnyPgColumn; provider: AnyPgColumn; sourceId: AnyPgColumn };

export async function replayPublicTabroom(
  db: NodePgDatabase,
  batch: Batch,
  retained: ReadonlyMap<string, ReplayCapture>,
) {
  return db.transaction(async tx => {
    const inputs = new Map<string, { snapshot: Snapshot; root: unknown }>();
    for (const snapshot of batch.snapshots) {
      const capture = retained.get(snapshot.id);
      if (!capture || sha256(capture.bytes) !== snapshot.sha256 || snapshot.visibility !== 'anonymous public') {
        throw new Error('Replay capture is missing, ineligible or has a mismatched digest');
      }
      const method = snapshot.path.includes('download_data.mhtml') ? 'bulk' : 'REST';
      const metadata = { spec: snapshot.spec, originalDigest: capture.originalDigest ?? null };
      await tx.insert(schema.captures).values({
        id: snapshot.id, provider: 'tabroom', method, route: snapshot.path, scope: snapshot.scope,
        fetchedAt: snapshot.fetched_at, status: snapshot.status, mediaType: snapshot.media_type,
        digest: snapshot.sha256, metadata, ...publicPolicy,
      }).onConflictDoNothing();
      const [stored] = await tx.select().from(schema.captures).where(eq(schema.captures.id, snapshot.id));
      if (stored.authorization !== 'public' || stored.audience !== 'public' || stored.grant !== null ||
          stored.digest !== snapshot.sha256 || stored.route !== snapshot.path) {
        throw new Error('Replay capture conflicts with stored lineage');
      }
      let root: unknown;
      if (snapshot.status >= 200 && snapshot.status < 300) {
        try { root = JSON.parse(Buffer.from(capture.bytes).toString('utf8')); } catch { /* Invalid captures retain metadata. */ }
      }
      inputs.set(snapshot.id, { snapshot, root });
      await observe(snapshot.id, '', 'capture', null, undefined, null,
        snapshot.status === 401 ? 'unauthorized' : snapshot.status === 403 ? 'forbidden' :
          snapshot.status === 404 ? 'ambiguous-not-found' : snapshot.status >= 500 || snapshot.status === 429 ? 'transient-failure' :
          root === undefined ? 'invalid' : 'observed');
    }

    async function identify(table: Identity, keys: Record<string, string>): Promise<string> {
      const values = { provider: 'tabroom', ...keys };
      await tx.insert(table).values(values).onConflictDoNothing();
      const columns = table as unknown as Record<string, AnyPgColumn>;
      const [row] = await tx.select({ id: sql<string>`${table.id}` }).from(table)
        .where(and(...Object.entries(values).map(([key, value]) => eq(columns[key], value))));
      return row.id;
    }

    async function observe(snapshot: string, pointer: string, role: string, subject: string | null,
      value: unknown, rawId: unknown, state = value === undefined ? 'omitted' : Array.isArray(value) && !value.length ? 'empty' : 'observed',
      verification = 'observed') {
      const input = inputs.get(snapshot);
      if (!input) throw new Error('Observation references an unavailable snapshot');
      await tx.insert(schema.evidence).values({
        snapshot, parser: input.snapshot.parser_version, pointer, role, subject,
        sourceId: rawId, value, verification, state, ...publicPolicy,
      }).onConflictDoNothing();
    }

    function raw(p: Observation) {
      return at(inputs.get(p.snapshot_id)?.root, p.source_path);
    }

    function evidence(p: Observation, role: string, subject: string | null, value: unknown = fields(raw(p), entityFields[role] ?? []), rawId: unknown = record(raw(p)).id) {
      return observe(p.snapshot_id, p.source_path, role, subject, value, rawId);
    }

    const eventIds = new Map<string, string>();
    const schoolIds = new Map<string, { sourceId: string; id: string }>();
    const entryIds = new Map<string, string>();
    const studentIds = new Map<string, string>();
    const judgeIds = new Map<string, string>();
    const personIds = new Map<string, string>();
    const key = (...parts: string[]) => JSON.stringify(parts);

    for (const item of batch.tournament?.observations ?? []) {
      const sourceId = item.provenance.source_id;
      const tournament = await identify(schema.tournaments, { sourceId });
      await evidence(item.provenance, 'tournament', tournament);
      const publication = record(raw(item.provenance)).public;
      await observe(item.provenance.snapshot_id, '', 'tournament-publication', tournament, publication, null);
    }
    if (batch.invitation) {
      const p = batch.invitation.provenance;
      await evidence(p, 'invitation', await identify(schema.tournaments, { sourceId: p.source_id }));
    }
    for (const item of batch.events) {
      const p = item.provenance;
      const input = inputs.get(p.snapshot_id)!;
      const tournament = input.snapshot.scope.tournament;
      const event = await identify(schema.events, { tournament, sourceId: p.source_id });
      eventIds.set(item.id, p.source_id);
      await evidence(p, 'event', event);
      const categoryPointer = p.source_path.split('/events/')[0];
      const categoryRow = record(at(input.root, categoryPointer));
      const categoryId = sourceId(categoryRow.id);
      if (categoryId) {
        const category = await identify(schema.categories, { tournament, sourceId: categoryId });
        await observe(p.snapshot_id, categoryPointer, 'category', category, fields(categoryRow, entityFields.category), categoryRow.id);
        await evidence(p, 'event-category', event, { category });
        for (const judge of collection(categoryRow.judges, categoryPointer + '/judges')) {
          const judgeId = sourceId(judge.row.id);
          if (!judgeId) continue;
          const id = await identify(schema.judges, { tournament, sourceId: judgeId });
          await observe(p.snapshot_id, judge.pointer, 'category-judge', category, { judge: id, raw: fields(judge.raw, entityFields.judge) }, judge.row.id);
        }
      }
      const resultPointer = p.source_path + '/result_sets';
      const resultSets = record(raw(p)).result_sets;
      await observe(p.snapshot_id, resultPointer, 'result-sets', event, resultSets, null);
      for (const set of collection(resultSets, resultPointer)) {
        await observe(p.snapshot_id, set.pointer, 'result-set', event, set.raw, set.row.id);
        await observe(p.snapshot_id, set.pointer + '/published', 'result-set-publication', event, set.row.published, null);
        for (const standing of collection(set.row.results, set.pointer + '/results')) {
          await observe(p.snapshot_id, standing.pointer, 'standing', event, standing.raw, standing.row.id);
          for (const value of collection(standing.row.values, standing.pointer + '/values')) {
            await observe(p.snapshot_id, value.pointer, 'standing-value', event, value.raw, value.row.id);
          }
        }
      }
    }
    for (const item of batch.schools) {
      const p = item.provenance;
      const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
      const id = await identify(schema.schools, { tournament, sourceId: p.source_id });
      schoolIds.set(item.id, { sourceId: p.source_id, id });
      await evidence(p, 'school', id);
      const chapterValue = record(raw(p)).chapter;
      const chapterId = sourceId(chapterValue);
      if (chapterId) {
        const chapter = await identify(schema.chapters, { sourceId: chapterId });
        await evidence(p, 'school-chapter', id, { chapter }, chapterValue);
      }
    }
    for (const item of batch.students) {
      const p = item.provenance;
      const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
      const school = schoolIds.get(item.schoolId)!;
      const id = await identify(schema.students, { tournament, school: school.sourceId, sourceId: p.source_id });
      studentIds.set(key(item.schoolId, item.id), id);
      await evidence(p, 'student', id);
    }
    for (const item of batch.entries) {
      const p = item.provenance;
      const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
      const event = eventIds.get(item.eventId)!;
      const id = await identify(schema.entries, { tournament, event, sourceId: p.source_id });
      entryIds.set(key(item.eventId, item.id), id);
      await evidence(p, 'entry', id);
      const school = item.schoolId && schoolIds.get(item.schoolId);
      await evidence(p, 'entry-school', id, { school: school ? school.id : null });
      await observe(p.snapshot_id, p.source_path + '/students', 'entry-roster', id, record(raw(p)).students, null);
      for (const member of item.roster ?? []) {
        const student = item.schoolId && member.studentId ? studentIds.get(key(item.schoolId, member.studentId)) : null;
        await evidence(member.provenance, 'roster-member', id, { student, raw: raw(member.provenance) }, raw(member.provenance));
      }
    }
    for (const item of batch.timeslots) {
      const p = item.provenance;
      const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
      await evidence(p, 'timeslot', await identify(schema.timeslots, { tournament, sourceId: p.source_id }));
    }
    const roundPaths = new Map(batch.rounds.map(item => [key(item.provenance.snapshot_id, item.provenance.source_path), item]));
    for (const item of batch.rounds) {
      const p = item.provenance;
      const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
      const event = eventIds.get(item.eventId)!;
      const round = await identify(schema.rounds, { tournament, event, sourceId: p.source_id });
      await evidence(p, 'round', round);
      await observe(p.snapshot_id, p.source_path + '/published', 'round-publication', round, record(raw(p)).published, null);
    }
    // Explicit judge and person IDs come from their independently validated adapter references.
    for (const item of batch.tournamentJudges) {
      for (const p of item.provenance) {
        const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
        const row = record(raw(p));
        const value = row.judge ?? row.id;
        const id = await identify(schema.judges, { tournament, sourceId: sourceId(value)! });
        judgeIds.set(item.id, id);
        await evidence(p, 'judge', id, fields(row, entityFields.judge), value);
      }
    }
    for (const item of batch.persons) {
      for (const p of item.provenance) {
        const value = record(raw(p)).judge_person;
        const id = await identify(schema.persons, { sourceId: sourceId(value)! });
        personIds.set(item.id, id);
        await evidence(p, 'person', id, { person: value }, value);
      }
    }
    for (const judge of batch.tournamentJudges) {
      for (const link of judge.personObservations) {
        for (const p of link.provenance) {
          await observe(p.snapshot_id, p.source_path, 'judge-person', judgeIds.get(judge.id)!,
            { person: personIds.get(link.personId) }, record(raw(p)).judge_person, 'observed',
            judge.personId === null ? 'conflicting' : 'verified');
        }
      }
    }
    for (const item of batch.debates) {
      const p = item.provenance;
      const tournament = inputs.get(p.snapshot_id)!.snapshot.scope.tournament;
      const round = roundPaths.get(key(p.snapshot_id, p.source_path.split('/sections/')[0]))!;
      const event = eventIds.get(round.eventId)!;
      const id = await identify(schema.panels, { tournament, event, round: round.provenance.source_id, sourceId: p.source_id });
      await evidence(p, 'panel', id);
      await observe(p.snapshot_id, p.source_path, 'panel-outcome', id, { winner: null }, null, 'observed', 'unresolved');
      for (const ballot of item.ballots) {
        const bp = ballot.provenance;
        const row = record(raw(bp));
        const entry = entryIds.get(key(round.eventId, ballot.entryId));
        const judge = ballot.judgeId ? judgeIds.get(ballot.judgeId) : null;
        await evidence(bp, 'ballot', id, { row: fields(row, ['id', 'entry', 'panel', 'judge', 'judge_person', 'side', 'score', 'bye', 'submitted', 'confirmed']), entry, judge });
        await evidence(bp, 'panel-entry', id, { entry }, row.entry);
        if (judge) {
          await tx.insert(schema.panelJudges).values({ panel: id, judge }).onConflictDoNothing();
          await evidence(bp, 'panel-judge', id, { judge }, row.judge);
        }
        await observe(bp.snapshot_id, bp.source_path + '/scores', 'ballot-scores', id, row.scores, null);
        for (const score of collection(row.scores, bp.source_path + '/scores')) {
          await observe(bp.snapshot_id, score.pointer, 'ballot-score', id, score.raw, score.row.id);
        }
      }
    }
  });
}
