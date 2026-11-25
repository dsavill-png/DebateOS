import { runSnapshotSearch, type SearchSnapshot } from './snapshot.ts';

interface SnapshotStorage {
  get(key: string): Promise<{ json(): Promise<unknown> } | null>;
  put(key: string, data: ArrayBuffer): Promise<unknown>;
}

export interface SearchEnvironment {
  EVIDENCE_SNAPSHOTS?: SnapshotStorage;
  DEBATEOS_OWNER_EMAIL?: string;
  DEBATEOS_IMPORT_TOKEN?: string;
  DEBATEOS_SNAPSHOT_SHA256?: string;
}

const noStore = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const maxSnapshotBytes = 4 * 1024 * 1024;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: noStore });
}

async function digest(bytes: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

function readSnapshot(value: unknown): SearchSnapshot | null {
  const snapshot = value as Partial<SearchSnapshot> | null;
  return snapshot?.schema === 1 && typeof snapshot.checkedOn === 'string'
    && Array.isArray(snapshot.corpus?.documents) && Array.isArray(snapshot.corpus?.cards)
    && Array.isArray(snapshot.corpus?.arguments) ? snapshot as SearchSnapshot : null;
}

export async function handleSearchApi(request: Request, env: SearchEnvironment): Promise<Response> {
  const url = new URL(request.url);
  const internal = url.pathname === '/api/internal/evidence-snapshot';
  if (internal) {
    if (!env.DEBATEOS_IMPORT_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.DEBATEOS_IMPORT_TOKEN}`) {
      return json({ error: 'Not found' }, 404);
    }
  } else {
    const identity = request.headers.get('oai-authenticated-user-id');
    const email = request.headers.get('oai-authenticated-user-email')?.toLowerCase();
    if (!identity || !email) return json({ error: 'Sign-in required' }, 401);
    if (!env.DEBATEOS_OWNER_EMAIL || email !== env.DEBATEOS_OWNER_EMAIL.toLowerCase()) {
      return json({ error: 'Access denied' }, 403);
    }
    if (request.method !== 'POST') return json({ error: 'Unsupported method' }, 405);
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ error: 'Access denied' }, 403);
  }

  const hash = env.DEBATEOS_SNAPSHOT_SHA256;
  const storage = env.EVIDENCE_SNAPSHOTS;
  if (!hash || !/^[a-f0-9]{64}$/.test(hash) || !storage) return json({ error: 'Index unavailable' }, 503);
  const key = `search-snapshot/${hash}.json`;
  if (internal && request.method === 'PUT') {
    const declaredSize = Number(request.headers.get('Content-Length'));
    if (declaredSize <= 0 || declaredSize > maxSnapshotBytes) return json({ error: 'Invalid snapshot size' }, 413);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength !== declaredSize || await digest(bytes) !== hash) return json({ error: 'Snapshot digest mismatch' }, 422);
    try {
      if (!readSnapshot(JSON.parse(new TextDecoder().decode(bytes)))) return json({ error: 'Invalid snapshot shape' }, 422);
    } catch {
      return json({ error: 'Invalid snapshot JSON' }, 422);
    }
    await storage.put(key, bytes);
    return json({ ready: true });
  }
  if (internal && request.method !== 'GET') return json({ error: 'Unsupported method' }, 405);

  const source = await storage.get(key);
  if (!source) return json({ error: 'Index unavailable' }, 503);
  const snapshot = readSnapshot(await source.json());
  if (!snapshot) return json({ error: 'Index unavailable' }, 503);
  if (internal) {
    const sample = runSnapshotSearch(snapshot, { query: 'No US-China War', intent: 'card', limit: 1 });
    return json({ ready: true, documents: snapshot.corpus.documents.length, cards: snapshot.corpus.cards.length,
      firstKind: sample?.results[0]?.kind, firstMatch: sample?.results[0]?.match });
  }
  if (Number(request.headers.get('Content-Length')) > 2_048) return json({ error: 'Query too large' }, 413);
  try {
    const body = await request.text();
    if (body.length > 2_048) return json({ error: 'Query too large' }, 413);
    const response = runSnapshotSearch(snapshot, JSON.parse(body));
    return response ? json(response) : json({ error: 'Invalid search' }, 400);
  } catch {
    return json({ error: 'Invalid search' }, 400);
  }
}
