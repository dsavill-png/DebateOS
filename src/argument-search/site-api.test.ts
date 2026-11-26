import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { handleSearchApi, type SearchEnvironment } from './site-api.ts';

const origin = 'https://search.example.test';
const data = JSON.stringify({ schema: 1, checkedOn: '2026-11-25', corpus: { documents: [
  { id: 'd', title: 'Synthetic.docx', folderPath: 'Fixtures', revision: 'r2', coverage: 'unparsed' },
], cards: [], arguments: [] } });
const auth = { 'oai-authenticated-user-id': 'account', 'oai-authenticated-user-email': 'owner@example.test' };

function environment() {
  const objects = new Map<string, ArrayBuffer>();
  const env: SearchEnvironment = {
    DEBATEOS_OWNER_EMAIL: 'owner@example.test',
    DEBATEOS_IMPORT_TOKEN: 'synthetic-import-token',
    DEBATEOS_SNAPSHOT_SHA256: createHash('sha256').update(data).digest('hex'),
    EVIDENCE_SNAPSHOTS: {
      async get(key) {
        const bytes = objects.get(key);
        return bytes ? { json: async () => JSON.parse(new TextDecoder().decode(bytes)) } : null;
      },
      async put(key, value) { objects.set(key, value); },
    },
  };
  return { env, objects };
}

function upload(body: string, authorization = 'Bearer synthetic-import-token') {
  return new Request(`${origin}/api/internal/evidence-snapshot`, { method: 'PUT', body, headers: {
    Authorization: authorization, 'Content-Length': String(Buffer.byteLength(body)),
  } });
}

function search(headers: Record<string, string> = auth) {
  return new Request(`${origin}/api/arguments/search`, {
    method: 'POST', headers, body: JSON.stringify({ intent: 'document', query: 'Synthetic.docx' }),
  });
}

test('only a pinned import with service credentials can seed the snapshot', async () => {
  const { env, objects } = environment();
  assert.equal((await handleSearchApi(upload(data, 'invalid'), env)).status, 404);
  assert.equal((await handleSearchApi(upload(data + ' '), env)).status, 422);
  assert.equal(objects.size, 0);
  assert.equal((await handleSearchApi(upload(data), env)).status, 200);
  assert.equal(objects.size, 1);
});

test('private search refuses anonymous, other accounts and cross-origin requests', async () => {
  const { env } = environment();
  assert.equal((await handleSearchApi(search(), env)).status, 503);
  await handleSearchApi(upload(data), env);
  assert.equal((await handleSearchApi(search({}), env)).status, 401);
  assert.equal((await handleSearchApi(search({ ...auth, 'oai-authenticated-user-email': 'other@example.test' }), env)).status, 403);
  assert.equal((await handleSearchApi(search({ ...auth, Origin: 'https://other.example.test' }), env)).status, 403);
  const result = await handleSearchApi(search({ ...auth, Origin: origin }), env);
  assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
  assert.equal((await result.json()).results[0].source.title, 'Synthetic.docx');
});
