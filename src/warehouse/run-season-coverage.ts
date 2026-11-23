import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spec, type Snapshot } from '../tabroom/adapter.ts';
import { measureCoverage } from './season-coverage.ts';
import { persistSeasonManifest, type RetainedManifest } from './persist-season-manifest.ts';

const [manifestPath, capturesDirectory, expectedDigest] = process.argv.slice(2);
if (!manifestPath || !capturesDirectory || !/^[0-9a-f]{64}$/.test(expectedDigest ?? '')) {
  throw new Error('Usage: node src/warehouse/run-season-coverage.ts MANIFEST CAPTURES_DIRECTORY MANIFEST_SHA256');
}
const manifest: RetainedManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const captures = new Map<string, { bytes: Uint8Array; snapshot: Snapshot }>();
for (const { id, bulk } of manifest.tournaments) {
  if (!bulk) continue;
  if (!/^\d+$/.test(id)) throw new Error('Invalid tournament ID');
  const bytes = readFileSync(join(capturesDirectory, id + '-bulk.json'));
  captures.set(bulk.id, {
    bytes,
    snapshot: {
      id: bulk.id, path: bulk.url, fetched_at: bulk.fetchedAt, status: bulk.status,
      media_type: bulk.mediaType, sha256: bulk.sha256, scope: { tournament: id }, spec,
      parser_version: 1, visibility: bulk.authorization,
    },
  });
}
const report = measureCoverage(manifest, {
  scopeId: manifest.scopeId, revision: manifest.revision, sha256: expectedDigest,
}, captures);
const connectionString = process.env.WAREHOUSE_DATABASE_URL;
if (connectionString) {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString });
  try {
    await persistSeasonManifest(drizzle(pool), manifest, expectedDigest, (source, filename) =>
      captures.get(source.id)?.bytes ?? readFileSync(join(capturesDirectory, filename)));
  } finally {
    await pool.end();
  }
}
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
