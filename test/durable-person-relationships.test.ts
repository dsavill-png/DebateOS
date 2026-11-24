import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const connectionString = process.env.WAREHOUSE_TEST_URL;
const fixture = new URL('../fixtures/warehouse/durable-person-relationships.sql', import.meta.url);

test('durable person relationships preserve history, evidence, and public eligibility', {
  skip: !connectionString,
}, async () => {
  const pool = new pg.Pool({ connectionString });
  try {
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(readFileSync(fixture, 'utf8'));
      assert.equal(result.command, 'DO');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  } finally {
    await pool.end();
  }
});
