import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

function connection(variable, database) {
  const value = process.env[variable];
  assert(value, 'Set ' + variable + ' through the runner secret store');
  const url = new URL(value);
  assert(['postgres:', 'postgresql:'].includes(url.protocol), 'Expected PostgreSQL URL');
  assert.equal(url.pathname, '/' + database, 'Unexpected synthetic database name');
  assert(url.hostname && !url.hostname.includes('-pooler'), 'Use direct endpoints');
  return url;
}

async function withDatabase(url, action) {
  const client = new pg.Client({ connectionString: url.href, enableChannelBinding: true });
  await client.connect();
  try {
    return await action(client);
  } finally {
    await client.end();
  }
}

function runTool(binary, args, url) {
  const options = {
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: url.searchParams.get('sslmode') || 'prefer',
  };
  for (const [parameter, variable] of [
    ['channel_binding', 'PGCHANNELBINDING'],
    ['sslrootcert', 'PGSSLROOTCERT'],
  ]) {
    if (url.searchParams.has(parameter)) options[variable] = url.searchParams.get(parameter);
  }
  if (options.PGSSLMODE === 'verify-full' && !options.PGSSLROOTCERT) options.PGSSLROOTCERT = 'system';
  // Avoid passing credentials as arguments or printing child diagnostics.
  execFileSync(binary, args, { env: { ...process.env, ...options }, stdio: 'ignore' });
}

const fixture = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
];

async function markers(client) {
  const { rows } = await client.query(
    "SELECT id, person_source_id FROM public.persons WHERE provider = 'synthetic-dev' ORDER BY id",
  );
  return rows;
}

async function main() {
  const source = connection('WAREHOUSE_DATABASE_URL', 'debateos_dev');
  const restore = connection('WAREHOUSE_RESTORE_DATABASE_URL', 'debateos_restore');
  assert.notEqual(source.hostname, restore.hostname, 'Use a separate restore branch');
  const reader = connection('WAREHOUSE_DEV_READER_URL', 'debateos_dev');
  const writer = connection('WAREHOUSE_DEV_WRITER_URL', 'debateos_dev');
  assert.equal(reader.username, 'debateos_dev_reader');
  assert.equal(writer.username, 'debateos_dev_writer');
  for (const role of [reader, writer]) {
    assert.equal(role.hostname, source.hostname, 'Role must point at the source branch');
    assert.equal(role.port, source.port, 'Role must use the source endpoint port');
  }

  await withDatabase(restore, async client => {
    const { rows: [check] } = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
      ) OR EXISTS (
        SELECT FROM pg_namespace WHERE nspname = 'drizzle'
      ) AS occupied
    `);
    assert(!check.occupied, 'Use a fresh restore database for each run');
  });

  const expected = fixture.map((id, index) => ({ id, person_source_id: 'fictional-judge-' + (index + 1) }));
  const migrationHistory = async client => (await client.query(
    'SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id',
  )).rows;
  const sourceHistory = await withDatabase(source, async client => {
    await client.query(`
      INSERT INTO public.persons (id, provider, person_source_id)
      SELECT id, 'synthetic-dev', 'fictional-judge-' || position
      FROM unnest($1::uuid[]) WITH ORDINALITY AS seed(id, position)
      ON CONFLICT (provider, person_source_id) DO NOTHING
    `, [fixture]);
    assert.deepEqual(await markers(client), expected);
    return migrationHistory(client);
  });
  assert(sourceHistory.length > 0, 'Expected migrated source database');

  await withDatabase(reader, async client => {
    assert.deepEqual(await markers(client), expected);
    await assert.rejects(client.query("DELETE FROM public.persons WHERE false"), { code: '42501' });
  });
  await withDatabase(writer, async client => {
    await client.query('BEGIN');
    try {
      assert.equal((await client.query(
        "UPDATE public.persons SET person_source_id = 'temporary' WHERE id = $1", [fixture[0]],
      )).rowCount, 1);
      await assert.rejects(client.query('CREATE TABLE public.disallowed (id integer)'), { code: '42501' });
    } finally {
      await client.query('ROLLBACK');
    }
  });

  const directory = mkdtempSync(join(tmpdir(), 'debateos-dev-'));
  try {
    const archive = join(directory, 'warehouse.dump');
    runTool('pg_dump', ['--format=custom', '--no-password', '--file', archive], source);
    runTool('pg_restore', ['--exit-on-error', '--single-transaction', '--no-owner',
      '--no-privileges', '--no-password', '--dbname', 'debateos_restore', archive], restore);
    await withDatabase(restore, async client => {
      assert.deepEqual(await markers(client), expected);
      assert.deepEqual(await migrationHistory(client), sourceHistory);
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  console.log('Synthetic seed, restricted roles, and PostgreSQL dump/restore verified.');
}

try {
  await main();
} catch (error) {
  // Connection failures can contain endpoint details; keep diagnostics bounded.
  console.error('Warehouse verification failed:', error.code ?? error.name);
  process.exitCode = 1;
}
