import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256, spec, type Snapshot } from '../tabroom/adapter.ts';
import { deriveJudgeActivity } from './judge-activity.ts';
import { manifestDigest } from './season-coverage.ts';
import type { ManifestSource, RetainedManifest } from './persist-season-manifest.ts';

const [manifestPath, capturesDirectory, expectedDigest] = process.argv.slice(2);
if (!manifestPath || !capturesDirectory || !/^[0-9a-f]{64}$/.test(expectedDigest ?? '')) {
  throw new Error('Usage: node src/warehouse/run-judge-activity.ts MANIFEST CAPTURES_DIRECTORY MANIFEST_SHA256');
}
const manifest: RetainedManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifestDigest(manifest) !== expectedDigest) throw new Error('Manifest pin mismatch');
const captures = new Map<string, { bytes: Uint8Array; snapshot: Snapshot }>();

function read(source: ManifestSource, filename: string) {
  const bytes = readFileSync(join(capturesDirectory, filename));
  if (source.authorization !== 'anonymous public' || sha256(bytes) !== source.sha256) {
    throw new Error('Ineligible or mismatched public capture: ' + filename);
  }
  return bytes;
}

for (const [index, source] of manifest.discovery.entries()) {
  read(source, index ? 'discovery-end.json' : 'discovery.json');
}
for (const { id, invite, bulk } of manifest.tournaments) {
  if (!/^\d+$/.test(id)) throw new Error('Invalid tournament ID');
  read(invite, id + '-invite.json');
  if (!bulk) continue;
  captures.set(bulk.id, {
    bytes: read(bulk, id + '-bulk.json'),
    snapshot: {
      id: bulk.id, path: bulk.url, fetched_at: bulk.fetchedAt, status: bulk.status,
      media_type: bulk.mediaType, sha256: bulk.sha256, scope: { tournament: id }, spec,
      parser_version: 1, visibility: bulk.authorization,
    },
  });
}
const report = deriveJudgeActivity(manifest, {
  scopeId: manifest.scopeId, revision: manifest.revision, sha256: expectedDigest,
}, captures);
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
