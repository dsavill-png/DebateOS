import pg from 'pg';

const [scope, revision, pin, cutoff] = process.argv.slice(2);
const connectionString = process.env.WAREHOUSE_DATABASE_URL;
if (!connectionString || !scope || !/^[1-9]\d*$/.test(revision ?? '') ||
    !/^[a-f0-9]{64}$/.test(pin ?? '') || !cutoff ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(cutoff)) {
  throw new Error('Set WAREHOUSE_DATABASE_URL and pass SCOPE REVISION MANIFEST_SHA256 UTC_CUTOFF');
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  const { rows } = await client.query<{ build_id: string }>(
    'SELECT build_public_judge_analytics($1, $2, $3, $4) AS build_id',
    [scope, revision, pin, cutoff],
  );
  await client.query('COMMIT');
  console.log(rows[0].build_id);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
