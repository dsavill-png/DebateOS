import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const connectionString = process.env.WAREHOUSE_TEST_URL;

test('public judge mart preserves grains and lineage and excludes internal and protected evidence', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  try {
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
      await client.query(readFileSync(new URL('../fixtures/warehouse/public-judge-analytics.sql', import.meta.url), 'utf8'));
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  } finally {
    await pool.end();
  }
});
