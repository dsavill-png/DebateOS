import { readFileSync } from 'node:fs';
import { publicTabroom, sha256 } from '../src/tabroom/adapter.ts';
import { replayPublicTabroom } from '../src/warehouse/replay.ts';
import * as schema from '../src/warehouse/schema.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eq } from 'drizzle-orm';
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
          const event = data.categories[0].events[0];
          data.schools[0].students = [{ id: 123 }];
          data.schools[1].students = [{ id: 123 }, { id: 456 }];
          data.schools[0].entries[0].students = [123, 456];
          data.schools[1].entries[0].students = [];
          data.timeslots = [{ id: 42, name: 'A standalone slot' }];
          event.rounds[0].sections[0].ballots[0].scores = [{ id: 17, tag: 'speaker', value: 28.5 }];
          event.rounds[0].sections[0].ballots[1].scores = [];
          event.result_sets = [{ published: 'true', results: [{ place: 1, values: [{ result_key: 7, value: '28.5' }] }] }];
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
    const variant = await adapter.import(scope);
    await replayPublicTabroom(db, variant, retained);
    const snapshot = variant.snapshots.find(row => row.path.includes('download_data'))!.id;
    const rows = await db.select().from(schema.publicEvidence).where(eq(schema.publicEvidence.snapshot, snapshot));
    const roster = rows.filter(row => row.role === 'roster-member').sort((a, b) => a.pointer.localeCompare(b.pointer));
    assert.equal(typeof (roster[0].value as { student: unknown }).student, 'string');
    assert.deepEqual(roster[1].value, { student: null, raw: 456 });
    assert.equal(rows.filter(row => row.role === 'timeslot' && row.sourceId === 42).length, 1);
    assert.equal(rows.filter(row => row.role === 'ballot-scores' && row.state === 'empty').length, 1);
    assert.deepEqual(rows.find(row => row.role === 'ballot-score')?.value, { id: 17, tag: 'speaker', value: 28.5 });
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

