import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalize } from '../tabroom/normalize.ts';
import { spec, type Snapshot } from '../tabroom/adapter.ts';
import { measureCoverage } from './season-coverage.ts';
import { persistSeasonManifest, type RetainedManifest } from './persist-season-manifest.ts';

const [manifestPath, capturesDirectory, expectedDigest, replayFlag] = process.argv.slice(2);
if (!manifestPath || !capturesDirectory || !/^[0-9a-f]{64}$/.test(expectedDigest ?? '') ||
    (replayFlag !== undefined && replayFlag !== '--replay')) {
  throw new Error('Usage: node src/warehouse/run-season-coverage.ts MANIFEST CAPTURES_DIRECTORY MANIFEST_SHA256 [--replay]');
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
const replayBatches = new Map<string, Parameters<typeof import('./replay.ts').replayPublicTabroom>[1]>();
const report = measureCoverage(manifest, {
  scopeId: manifest.scopeId, revision: manifest.revision, sha256: expectedDigest,
}, captures, replayFlag ? ({ bulk }) => {
  const snapshotId = bulk.snapshot.id;
  // Keep one full bulk replay per verified capture, including roster names from all categories.
  if (!replayBatches.has(snapshotId)) {
    replayBatches.set(snapshotId, { ...normalize(bulk.snapshot.scope, undefined, undefined, bulk), snapshots: [bulk.snapshot], diagnostics: [] });
  }
} : undefined);
const connectionString = process.env.WAREHOUSE_DATABASE_URL;
if (replayFlag && !connectionString) throw new Error('WAREHOUSE_DATABASE_URL is required for --replay');
if (connectionString) {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString });
  try {
    const db = drizzle(pool);
    await persistSeasonManifest(db, manifest, expectedDigest, (source, filename) =>
      captures.get(source.id)?.bytes ?? readFileSync(join(capturesDirectory, filename)));
    if (replayFlag) {
      const { replayPublicTabroom } = await import('./replay.ts');
      for (const batch of replayBatches.values()) await replayPublicTabroom(db, batch, captures);
    }
  } finally {
    await pool.end();
  }
}
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
