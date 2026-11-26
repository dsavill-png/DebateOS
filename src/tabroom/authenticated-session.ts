const baseUrl = 'https://api.tabroom.com/v1';

export interface SecretProvider {
  getCredentials(): Promise<{ username: string; password: string }>;
}

type Failure = 'credentials' | 'unauthorized' | 'expired' | 'forbidden'
  | 'invalid-response' | 'transport' | 'http' | 'closed' | 'read-used';

export class TabroomSessionError extends Error {
  readonly code: Failure;

  constructor(code: Failure) {
    super(`Tabroom session: ${code}`);
    this.code = code;
  }
}

type Options = {
  fetch: typeof fetch;
  timeoutMs?: number;
};

export async function openTabroomSession(secrets: SecretProvider, options: Options) {
  const send = options?.fetch;
  if (typeof send !== 'function' || send === globalThis.fetch) {
    throw new TabroomSessionError('transport');
  }
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 15_000) {
    throw new TabroomSessionError('transport');
  }

  async function request(path: string, init: RequestInit) {
    try {
      return await send(baseUrl + path, {
        ...init, credentials: 'omit', redirect: 'error', cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new TabroomSessionError('transport');
    }
  }

  async function json(response: Response): Promise<unknown> {
    try {
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
        throw new TabroomSessionError('invalid-response');
      }
      return await response.json();
    } catch {
      throw new TabroomSessionError('invalid-response');
    }
  }

  async function login() {
    let body: string;
    try {
      const { username, password } = await secrets.getCredentials();
      if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw new TabroomSessionError('credentials');
      }
      body = JSON.stringify({ username, password });
    } catch {
      throw new TabroomSessionError('credentials');
    }
    const response = await request('/auth/login', {
      method: 'POST', body, headers: { accept: 'application/json', 'content-type': 'application/json' },
    });
    if (response.status !== 200) {
      await response.body?.cancel().catch(() => {});
      if (response.status === 401) throw new TabroomSessionError('unauthorized');
      if (response.status === 403) throw new TabroomSessionError('forbidden');
      throw new TabroomSessionError('http');
    }
    const cookies = response.headers.getSetCookie()
      .filter(value => value.startsWith('TabroomToken='));
    const token = cookies[0]?.split(';', 1)[0];
    if (cookies.length !== 1 || !token || !/^TabroomToken=[!#$%&'*+\-.0-9A-Z^_`a-z|~:/=]+$/.test(token)) {
      await response.body?.cancel().catch(() => {});
      throw new TabroomSessionError('invalid-response');
    }
    const payload = await json(response);
    const person = payload && typeof payload === 'object' && 'Person' in payload
      ? payload.Person : undefined;
    const id = person && typeof person === 'object' && 'id' in person ? person.id : undefined;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
      throw new TabroomSessionError('invalid-response');
    }

    return { id, cookie: token };
  }

  let { id, cookie }: { id: number; cookie?: string } = await login();
  let expired = false;
  let readAttempted = false;
  return {
    personId: id,
    close() { cookie = undefined; },
    async readOwnJudgeRecord(): Promise<readonly unknown[]> {
      if (!cookie) throw new TabroomSessionError(expired ? 'expired' : 'closed');
      if (readAttempted) throw new TabroomSessionError('read-used');
      readAttempted = true;
      const reply = await request(`/rest/paradigms/${id}/record`, {
        method: 'GET', headers: { accept: 'application/json', cookie },
      });
      if (reply.status === 401) {
        expired = true;
        cookie = undefined;
      }
      if (reply.status !== 200) {
        await reply.body?.cancel().catch(() => {});
        if (reply.status === 401) throw new TabroomSessionError('expired');
        if (reply.status === 403) throw new TabroomSessionError('forbidden');
        throw new TabroomSessionError('http');
      }
      const rows = await json(reply);
      if (!Array.isArray(rows)) throw new TabroomSessionError('invalid-response');
      return rows;
    },
  };
}
