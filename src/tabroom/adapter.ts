import { createHash } from 'node:crypto';
import { normalize } from './normalize.ts';

export type Scope = { tournament: string; event?: string; round?: string };
export type Resource = 'tournament' | 'invite' | 'bulk' | 'rounds' | 'results' | 'schedule';

export const spec = {
  version: '1.2.0',
  sha256: 'e01682f296589c599f6390127ef06a6c9fb10f8c6ab3019a700727322bd7e375',
};

export interface Snapshot {
  id: string;
  path: string;
  fetched_at: string;
  status: number;
  media_type: string;
  sha256: string;
  scope: Scope;
  spec: typeof spec;
  parser_version: number;
  visibility: 'anonymous public';
}

export type Observation = {
  source: 'tabroom';
  source_method: 'REST' | 'bulk';
  source_id: string;
  source_path: string;
  fetched_at: string;
  snapshot_id: string;
};

export interface TabroomAdapter {
  import(scope: Scope): Promise<ImportBatch>;
}

type Diagnostic = {
  resource: Resource;
  state: 'available' | 'unavailable' | 'failed' | 'conflict';
  reason?: string;
  status?: number;
};

type ImportBatch = ReturnType<typeof normalize> & {
  snapshots: Snapshot[];
  diagnostics: Diagnostic[];
};

export const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export type Json = Record<string, unknown>;

export function object(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid object');
  return value as Json;
}

export type Capture = { data: Json; snapshot: Snapshot };
type Reply = {
  status: number;
  mediaType: string;
  bytes: Uint8Array;
  fetchedAt: string;
  retryAfter?: string;
};

type Options = {
  // Store bytes under controlled access before parsing, including invalid JSON.
  retain: (metadata: Snapshot, bytes: Uint8Array) => Promise<void>;
  read?: (url: string) => Promise<Reply>;
  wait?: (ms: number) => Promise<void>;
};

async function readPublic(url: string): Promise<Reply> {
  const response = await fetch(url, {
    credentials: 'omit',
    redirect: 'manual',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  const mediaType = response.headers.get('content-type') ?? '';
  return {
    status: response.status,
    mediaType,
    bytes: response.ok && isJson(mediaType)
      ? new Uint8Array(await response.arrayBuffer())
      : new Uint8Array(),
    fetchedAt: new Date().toISOString(),
    retryAfter: response.headers.get('retry-after') ?? undefined,
  };
}

function isJson(mediaType: string) {
  return /^application\/(?:json|[\w.+-]+\+json)\s*(?:;|$)/i.test(mediaType);
}

export function publicTabroom({ retain, read = readPublic, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }: Options): TabroomAdapter {
  return {
    async import(scope) {
      const id = encodeURIComponent(scope.tournament);
      if (!/^\d+$/.test(id)) throw Error('Invalid tournament ID');
      const base = 'https://api.tabroom.com/v1/rest/tourns/' + id;
      const urls = {
        tournament: base,
        invite: base + '/invite',
        bulk: 'https://www.tabroom.com/api/download_data.mhtml?tourn_id=' + id,
      };
      const diagnostics: Diagnostic[] = ['rounds', 'results', 'schedule'].map(resource => ({
        resource: resource as Resource, state: 'unavailable', reason: 'Protected REST operation',
      }));
      const snapshots: Snapshot[] = [];

      async function capture(resource: keyof typeof urls): Promise<Capture | undefined> {
        const url = urls[resource];
        let reply: Reply | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            reply = await read(url);
          } catch {
            reply = undefined;
          }
          if (reply && reply.status !== 429 && (reply.status < 500 || reply.status >= 600)) break;
          if (attempt === 2) break;
          const hint = reply?.retryAfter;
          const delay = hint && /^\d+$/.test(hint) ? Number(hint) * 1000 : Date.parse(hint ?? '') - Date.now();
          // If the server asks for a longer wait, end this import attempt.
          if (delay > 30_000) break;
          await wait(Math.max(250 * 2 ** attempt, Number.isFinite(delay) ? delay : 0));
        }

        const status = reply?.status;
        if (!reply || status === undefined || status < 200 || status >= 300 || !isJson(reply.mediaType)) {
          diagnostics.push({
            resource, status,
            state: status === 401 || status === 403 ? 'unavailable' : 'failed',
            reason: !reply ? 'Connection failed' : reply.status >= 200 && reply.status < 300 ? 'Unexpected media type' : 'HTTP response',
          });
          return;
        }

        const sha = sha256(reply.bytes);
        const identity = JSON.stringify([url, scope.tournament, scope.event, scope.round, reply.fetchedAt, sha]);
        const snapshot: Snapshot = {
          id: sha256(Buffer.from(identity)),
          path: url, fetched_at: reply.fetchedAt, status, media_type: reply.mediaType,
          sha256: sha, scope: { ...scope }, spec, parser_version: 1, visibility: 'anonymous public',
        };
        await retain(snapshot, reply.bytes);
        snapshots.push(snapshot);
        try {
          const data = object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(reply.bytes)));
          if (String(data.id) !== scope.tournament || data.error || data.errors || data.success === false ||
              (resource === 'bulk' && (!Array.isArray(data.categories) || !Array.isArray(data.schools)))) {
            throw Error('Incompatible payload');
          }
          diagnostics.push({ resource, state: 'available', status });
          return { data, snapshot };
        } catch {
          diagnostics.push({ resource, state: 'failed', status, reason: 'Invalid JSON, schema or tournament scope' });
        }
      }

      const tournament = await capture('tournament');
      const invite = await capture('invite');
      const bulk = await capture('bulk');
      const batch = normalize(scope, tournament, invite, bulk);
      return { ...batch, snapshots, diagnostics: [...diagnostics, ...batch.issues] };
    },
  };
}
