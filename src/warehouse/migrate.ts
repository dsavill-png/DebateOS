import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const connectionString = process.env.WAREHOUSE_DATABASE_URL;
if (!connectionString) throw new Error('WAREHOUSE_DATABASE_URL is required');

const pool = new pg.Pool({ connectionString, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
} finally {
  await pool.end();
}
