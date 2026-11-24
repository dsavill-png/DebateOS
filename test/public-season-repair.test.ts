import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import type { RetainedManifest } from '../src/warehouse/persist-season-manifest.ts';
import { manifestDigest } from '../src/warehouse/season-coverage.ts';

const connectionString = process.env.WAREHOUSE_TEST_URL;
const manifest: RetainedManifest = JSON.parse(readFileSync(
  new URL('../docs/coverage/college-policy-2025-26-r1.json', import.meta.url), 'utf8'));
const repair = readFileSync(new URL('../drizzle/0003_public_season_membership.sql', import.meta.url), 'utf8');

test('the season repair promotes only approved historical classification lineage', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  try {
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { scopeId, revision, tournaments, discovery } = manifest;
      await client.query('INSERT INTO season_scopes (id) VALUES ($1)', [scopeId]);
      const { rows: [version] } = await client.query(
        "INSERT INTO season_revisions (scope_id, version, definition, approved_by, reason) VALUES ($1, $2, $3, $4, 'fixture') RETURNING id",
        [scopeId, revision, { pin: manifestDigest(manifest) }, manifest.approval]);
      const captures = [
        ...discovery.map(source => ({ source, scope: { season: scopeId }, method: 'REST' })),
        ...tournaments.flatMap(tournament => [
          { source: tournament.invite, scope: { tournament: tournament.id }, method: 'REST' },
          { source: tournament.bulk ?? tournament.bulkAttempt, scope: { tournament: tournament.id }, method: 'bulk' },
        ]),
      ];
      for (const { source, scope, method } of captures) {
        if (!source) continue;
        await client.query(
          `INSERT INTO warehouse_captures (id, provider, source_method, route, request_scope, fetched_at,
             status, media_type, response_digest, metadata, authorization_class, purpose, audience, retention_policy)
           VALUES ($1, 'tabroom', $2, $3, $4, $5, $6, $7, $8, '{}', 'public', 'season membership evidence',
             'internal', 'public-evidence')`,
          [source.id, method, source.url, scope, source.fetchedAt, source.status, source.mediaType, source.sha256]);
      }
      let expected = 0;
      for (const tournament of tournaments) {
        await client.query("INSERT INTO tournaments (provider, tournament_source_id) VALUES ('tabroom', $1) ON CONFLICT DO NOTHING", [tournament.id]);
        for (const event of tournament.events) {
          await client.query(
            "INSERT INTO events (provider, tournament_source_id, event_source_id) VALUES ('tabroom', $1, $2) ON CONFLICT DO NOTHING",
            [tournament.id, event.id]);
          await client.query(
            `WITH target AS (
               SELECT id FROM events WHERE provider = 'tabroom' AND tournament_source_id = $1 AND event_source_id = $2
             ), membership AS (
               INSERT INTO season_memberships (revision_id, event_id, decision, rationale, classification)
               SELECT $3, id, $4, $5, $6 FROM target RETURNING id
             ), observation AS (
               INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role,
                 subject_id, raw_source_id, observed_value, verification, observation_state,
                 authorization_class, purpose, audience, retention_policy)
               SELECT $7, 1, $8, 'season-event-classification', id, $9, $10, 'observed', 'observed',
                 'public', 'season membership evidence', 'internal', 'public-evidence' FROM target RETURNING id
             )
             INSERT INTO season_membership_evidence SELECT membership.id, observation.id FROM membership, observation`,
            [tournament.id, event.id, version.id, event.decision, event.rationale,
              { division: event.division, sourceType: event.type, circuit: 'NDT-CEDA' },
              event.evidence.source, event.evidence.pointer, JSON.stringify(event.id), { name: event.division, type: event.type }]);
          expected++;
        }
      }
      const capture = discovery[0];
      const { rows: [unrelated] } = await client.query(
        `INSERT INTO warehouse_evidence (snapshot_id, parser_version, source_pointer, output_role, verification,
           observation_state, authorization_class, purpose, audience, retention_policy)
         VALUES ($1, 1, '', 'unrelated', 'observed', 'observed', 'public', 'fixture', 'internal', 'public-evidence')
         RETURNING id`, [capture.id]);
      await client.query('SAVEPOINT corrupt_digest');
      await client.query("UPDATE warehouse_captures SET response_digest = 'wrong' WHERE id = $1", [capture.id]);
      await assert.rejects(client.query(repair), /Pinned season capture missing or ineligible/);
      await client.query('ROLLBACK TO SAVEPOINT corrupt_digest');
      await client.query('SAVEPOINT corrupt_type');
      await client.query(
        "UPDATE warehouse_evidence SET observed_value = jsonb_set(observed_value, '{type}', '"wrong"') WHERE output_role = 'season-event-classification' AND id = (SELECT evidence_id FROM season_membership_evidence LIMIT 1)");
      await assert.rejects(client.query(repair), /Pinned season membership lineage mismatch/);
      await client.query('ROLLBACK TO SAVEPOINT corrupt_type');
      await client.query('SAVEPOINT would_expose_unrelated');
      await client.query("UPDATE warehouse_evidence SET audience = 'public' WHERE id = $1", [unrelated.id]);
      await assert.rejects(client.query(repair), /would expose existing public-labelled evidence/);
      await client.query('ROLLBACK TO SAVEPOINT would_expose_unrelated');

      await client.query(repair);
      await client.query(repair);
      const eligible = await client.query(
        `SELECT p.id FROM warehouse_public_evidence p JOIN season_membership_evidence l ON l.evidence_id = p.id
         JOIN season_memberships m ON m.id = l.membership_id WHERE m.revision_id = $1`, [version.id]);
      assert.equal(eligible.rowCount, expected);
      assert.equal((await client.query('SELECT id FROM warehouse_public_evidence WHERE id = $1', [unrelated.id])).rowCount, 0);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  } finally {
    await pool.end();
  }
});
