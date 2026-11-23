import { readFileSync } from 'node:fs';
import { publicTabroom, sha256 } from '../src/tabroom/adapter.ts';
import { replayPublicTabroom } from '../src/warehouse/replay.ts';
import * as schema from '../src/warehouse/schema.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { entries, events, panels, rounds, schools, students, tournaments } from '../src/warehouse/schema.ts';

const connectionString = process.env.WAREHOUSE_TEST_URL;

test('scoped identities stay distinct and full-key replay is idempotent', { skip: !connectionString }, async () => {
  const pool = new pg.Pool({ connectionString });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: 'drizzle' });
    const base = { provider: 'collision-test', tournament: '1', sourceId: '123' };
    const roundRows = [{ ...base, event: 'A' }, { ...base, event: 'B' }];
    const studentRows = [{ ...base, school: 'A' }, { ...base, school: 'B' }];
    const panelRows = [{ ...base, event: 'A', round: '123' }, { ...base, event: 'A', round: '456' }];
    const entryRows = [{ ...base, event: 'A' }, { ...base, event: 'B' }];
    await db.transaction(async tx => {
      await tx.insert(tournaments).values({ provider: base.provider, sourceId: base.tournament });
      for (const sourceId of ['A', 'B']) {
        await tx.insert(events).values({ provider: base.provider, tournament: base.tournament, sourceId });
        await tx.insert(schools).values({ provider: base.provider, tournament: base.tournament, sourceId });
      }
      await tx.insert(rounds).values({ ...base, event: 'A', sourceId: '456' });
      const firstRounds = await tx.insert(rounds).values(roundRows).returning();
      const firstStudents = await tx.insert(students).values(studentRows).returning();
      const firstPanels = await tx.insert(panels).values(panelRows).returning();
      const firstEntries = await tx.insert(entries).values(entryRows).returning();
      for (const records of [firstRounds, firstStudents, firstPanels, firstEntries]) {
        assert.equal(records.length, 2);
        assert.notEqual(records[0].id, records[1].id);
      }
      assert.deepEqual(await tx.insert(rounds).values(roundRows).onConflictDoNothing().returning(), []);
      assert.deepEqual(await tx.insert(students).values(studentRows).onConflictDoNothing().returning(), []);
      assert.deepEqual(await tx.insert(panels).values(panelRows).onConflictDoNothing().returning(), []);
      assert.deepEqual(await tx.insert(entries).values(entryRows).onConflictDoNothing().returning(), []);
      await tx.delete(panels).where(eq(panels.provider, base.provider));
      await tx.delete(rounds).where(eq(rounds.provider, base.provider));
      await tx.delete(students).where(eq(students.provider, base.provider));
      await tx.delete(entries).where(eq(entries.provider, base.provider));
      await tx.delete(events).where(eq(events.provider, base.provider));
      await tx.delete(schools).where(eq(schools.provider, base.provider));
      await tx.delete(tournaments).where(eq(tournaments.provider, base.provider));
    });
  } finally {
    await pool.end();
  }
});

test('Harvard capture replay preserves lineage, evidence and assignment grain', { skip: !connectionString }, async () => {
  const pool = new pg.Pool({ connectionString });
  try {
    const db = drizzle(pool);
    const dir = new URL('../fixtures/tabroom/harvard-40923/', import.meta.url);
    const manifest = JSON.parse(readFileSync(new URL('provenance.json', dir), 'utf8'));
    const captures = Object.values(manifest.captures) as {
      url: string; file: string; source_sha256: string; fixture_sha256: string;
      fetched_at: string; media_type: string; status: number;
    }[];
    const retained = new Map<string, { bytes: Uint8Array; originalDigest?: string }>();
    let synthetic = false;
    const adapter = publicTabroom({
      async read(url) {
        const capture = captures.find(row => row.url === url)!;
        const bytes = readFileSync(new URL(capture.file, dir));
        assert.equal(sha256(bytes), capture.fixture_sha256);
        if (synthetic && capture.file === 'bulk.json') {
          const data = JSON.parse(bytes.toString('utf8'));
          data.schools[0].test_contact = 'excluded';
          const event = data.categories[0].events[0];
          data.schools[0].students = [{ id: 123 }, { id: 789 }, { id: 789 }];
          data.schools[1].students = [{ id: 123 }, { id: 456 }];
          data.schools[0].entries[0].students = [123, 456, 789];
          data.schools[1].entries[0].students = [];
          data.timeslots = [{ id: 42, name: 'A standalone slot' }];
          event.rounds[0].sections[0].ballots[0].scores = [
            { id: 17, tag: 'speaker', value: 28.5, private_feedback: 'private-test-marker' },
            { id: { contact: 'private-test-marker' }, tag: 'private-test-marker', value: 'private-test-marker' },
          ];
          event.rounds[0].sections[0].ballots[1].scores = [];
          const entry = data.schools[0].entries[0].id;
          const school = data.schools[0].id;
          const round = event.rounds[0].id;
          data.categories[0].events.push({ id: 7777, rounds: [{ id: round }, { id: 9999 }] });
          data.schools[1].entries.push({ id: entry, event: 7777 }, { id: 9999, event: 7777 });
          event.result_sets = [{ published: 'false', label: 'private-test-marker', results: [
            { entry, school, student: 123, round, place: 1, comments: 'private-test-marker',
              values: [{ result_key: 7, value: '28.5', unknown: 'private-test-marker' }] },
            { tournament: 9999, entry, school, student: 123, round },
            { event: 9999, entry, school, student: 123, round },
            { entry, school: data.schools[1].id, student: 123 },
            { school, student: 789 },
            { student: 123 },
            { entry: 9999, round: 9999 },
          ] }];
          return { bytes: Buffer.from(JSON.stringify(data)), status: capture.status,
            fetchedAt: '2026-11-20T15:00:00Z', mediaType: capture.media_type };
        }
        return { bytes, status: capture.status, fetchedAt: capture.fetched_at, mediaType: capture.media_type };
      },
      async retain(snapshot, bytes) {
        retained.set(snapshot.id, { bytes, originalDigest: synthetic && snapshot.path.includes('download_data') ? undefined : captures.find(row => row.url === snapshot.path)!.source_sha256 });
      },
    });

    const scope = { tournament: '40923', event: '389106', round: '1587204' };
    const data = await adapter.import(scope);
    await replayPublicTabroom(db, data, retained);
    const original = eq(schema.publicEvidence.snapshot, data.snapshots.find(row => row.path.includes('download_data'))!.id);
    const first = await db.select().from(schema.publicEvidence).where(original).orderBy(schema.publicEvidence.id);
    await Promise.all([replayPublicTabroom(db, data, retained), replayPublicTabroom(db, data, retained)]);
    assert.deepEqual(await db.select().from(schema.publicEvidence).where(original).orderBy(schema.publicEvidence.id), first);
    const [panel] = await db.select().from(panels).where(eq(panels.sourceId, '9200905'));
    assert.equal(panel.round, '1587204');
    assert.equal(first.filter(row => row.role === 'panel-judge').length, 2);
    assert.equal((await db.select().from(schema.panelJudges).where(eq(schema.panelJudges.panel, panel.id))).length, 1);
    assert.deepEqual(first.find(row => row.role === 'panel-outcome')?.value, { winner: null });
    assert.equal(first.find(row => row.role === 'panel-outcome')?.verification, 'unresolved');
    assert.equal(first.filter(row => row.role === 'judge-person' && row.verification === 'verified').length, 2);
    assert.equal((await db.select().from(schema.persons))[0].sourceId, '366665');
    assert.equal(first.filter(row => row.role === 'ballot-scores' && row.state === 'omitted').length, 2);
    for (const { id, digest, metadata } of await db.select().from(schema.captures)) {
      if (!retained.has(id)) continue;
      assert.equal(digest, sha256(retained.get(id)!.bytes));
      assert.equal((metadata as { originalDigest: string }).originalDigest, retained.get(id)!.originalDigest);
    }
    synthetic = true;
    const variant = await adapter.import({ tournament: scope.tournament });
    await replayPublicTabroom(db, variant, retained);
    const snapshot = variant.snapshots.find(row => row.path.includes('download_data'))!.id;
    const rows = await db.select().from(schema.publicEvidence).where(eq(schema.publicEvidence.snapshot, snapshot));
    assert.ok(rows.filter(row => row.role === 'school').every(row => !Object.hasOwn(row.value as object, 'test_contact')));
    const roster = rows.filter(row => row.role === 'roster-member').sort((a, b) => a.pointer.localeCompare(b.pointer));
    assert.equal(typeof (roster[0].value as { student: unknown }).student, 'string');
    assert.deepEqual(roster[1].value, { student: null, raw: 456 });
    assert.deepEqual(roster[2].value, { student: null, raw: 789 });
    assert.equal(rows.filter(row => row.role === 'timeslot' && row.sourceId === 42).length, 1);
    assert.equal(rows.filter(row => row.role === 'ballot-scores' && row.state === 'empty').length, 1);
    const scores = rows.filter(row => row.role === 'ballot-score').sort((a, b) => a.pointer.localeCompare(b.pointer));
    assert.deepEqual(scores.map(row => row.value), [{ id: 17, tag: 'speaker', value: 28.5 }, {}]);
    assert.ok(scores.every(row => row.sourceId === null));
    assert.ok(!JSON.stringify(rows).includes('private-test-marker'));
    const internal = await db.select().from(schema.evidence).where(eq(schema.evidence.snapshot, snapshot));
    assert.ok(JSON.stringify(internal).includes('private-test-marker'));
    assert.equal(rows.find(row => row.role === 'result-set-publication')?.state, 'unpublished');
    const typed = await db.select({ pointer: schema.evidence.pointer, entry: schema.evidenceRelationships.entry,
      student: schema.evidenceRelationships.student, round: schema.evidenceRelationships.round,
      parent: schema.evidenceRelationships.parentEvidence,
    }).from(schema.evidenceRelationships).innerJoin(schema.evidence,
      eq(schema.evidence.id, schema.evidenceRelationships.evidence))
      .where(sql`${schema.evidence.snapshot} = ${snapshot} and ${schema.evidence.role} = 'standing'`)
      .orderBy(schema.evidence.pointer);
    assert.equal(typed.length, 7);
    assert.ok((await db.select().from(schema.operationOutcomes).where(eq(schema.operationOutcomes.snapshot, snapshot)))
      .some(row => row.operation === 'bulk.result-set-publication' && row.outcome === 'unpublished'));
    assert.ok(typed[0].entry && typed[0].student && typed[0].round);
    assert.equal(new Set(typed.map(row => row.parent)).size, 1);
    for (const row of typed.slice(1)) {
      assert.deepEqual([row.entry, row.student, row.round], [null, null, null]);
    }
    assert.deepEqual(rows.find(row => row.role === 'standing-value')?.value, { result_key: 7, value: '28.5' });
  } finally {
    await pool.end();
  }
});

test('public evidence requires eligible capture and row authorization', { skip: !connectionString }, async () => {
  const pool = new pg.Pool({ connectionString });
  const rollback = new Error('rollback synthetic policy rows');
  try {
    const db = drizzle(pool);
    await assert.rejects(db.transaction(async tx => {
      for (const authorization of ['public', 'protected']) {
        await tx.insert(schema.captures).values({
          id: 'policy-' + authorization, provider: 'synthetic', method: 'REST', route: '/synthetic',
          scope: {}, fetchedAt: '2026-01-01T00:00:00Z', status: 200, mediaType: 'application/json',
          digest: 'synthetic', metadata: {}, authorization, purpose: 'test', audience: 'public', retention: 'test',
        });
        for (const access of ['public', 'protected']) {
          await tx.insert(schema.evidence).values({
            snapshot: 'policy-' + authorization, parser: 1, pointer: '/' + access, role: 'policy',
            verification: 'observed', state: 'observed', authorization: access, purpose: 'test',
            audience: 'public', retention: 'test',
          });
        }
      }
      const eligible = await tx.select().from(schema.publicEvidence).where(eq(schema.publicEvidence.role, 'policy'));
      assert.deepEqual(eligible.map(row => [row.snapshot, row.pointer]), [['policy-public', '/public']]);
      throw rollback;
    }), error => error === rollback);
  } finally {
    await pool.end();
  }
});


test('operation outcomes preserve failures, explicit empty and earlier successes', { skip: !connectionString }, async () => {
  const pool = new pg.Pool({ connectionString });
  try {
    const db = drizzle(pool);
    const scope = { tournament: '424242' };
    const retained = new Map<string, { bytes: Uint8Array }>();
    const expected = ['empty', 'unauthorized', 'forbidden', 'ambiguous-not-found',
      'rate-limited', 'transient-failure', 'invalid', 'observed'];
    const statuses = [200, 401, 403, 404, 429, 503, 200, 200];
    for (const [index, status] of statuses.entries()) {
      const adapter = publicTabroom({
        async read(url) {
          const bulk = url.includes('download_data');
          return {
            status: bulk ? status : 200,
            mediaType: 'application/json', fetchedAt: `2026-11-23T12:00:0${index}Z`,
            bytes: Buffer.from(bulk && index === 6 ? '{"id":42}' : JSON.stringify({
              id: scope.tournament, categories: [], schools: [],
              ...(index === 7 && { timeslots: [{ id: 1234 }] }),
            })),
          };
        },
        async retain(snapshot, bytes) { retained.set(snapshot.id, { bytes }); },
        wait: async () => {},
      });
      const batch = await adapter.import(scope);
      await replayPublicTabroom(db, batch, retained);
      await replayPublicTabroom(db, batch, retained);
    }
    const outcomes = await db.select().from(schema.operationOutcomes)
      .where(sql`${schema.operationOutcomes.scope}->>'tournament' = ${scope.tournament}`);
    const bulk = outcomes.filter(row => row.operation === 'bulk').sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
    assert.deepEqual(bulk.map(row => row.outcome), expected);
    assert.deepEqual(bulk.map(row => row.status), statuses);
    assert.ok(bulk.every(row => row.route?.includes('download_data') && row.mediaType === 'application/json'));
    assert.ok(bulk[0].snapshot && bulk[6].snapshot && bulk[7].snapshot);
    assert.ok(bulk.slice(1, 6).every(row => row.snapshot === null));
    assert.ok(outcomes.some(row => row.operation === 'results' && row.outcome === 'not-requested'));
  } finally {
    await pool.end();
  }
});
