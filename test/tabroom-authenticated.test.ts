import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { openTabroomSession } from '../src/tabroom/authenticated-session.ts';
import { publicTabroom } from '../src/tabroom/adapter.ts';
import { validateGoldRecord } from '../src/tabroom/gold-record.ts';

const credentials = { username: 'synthetic-user', password: 'synthetic-password' };
const secrets = { async getCredentials() { return credentials; } };
const cookie = 'TabroomToken=synthetic-session';
const login = () => Response.json({ id: 42 }, { headers: { 'set-cookie': cookie + '; Secure; HttpOnly' } });
const base = 'https://api.tabroom.com/v1';

test('uses first-party cookie login and reads only the signed-in person record', async () => {
  const calls: string[] = [];
  const session = await openTabroomSession(secrets, {
    async fetch(url, request) {
      calls.push(String(url));
      assert.equal(request?.redirect, 'error');
      assert.equal(request?.credentials, 'omit');
      const headers = new Headers(request?.headers);
      if (request?.method === 'POST') {
        assert.deepEqual(JSON.parse(String(request.body)), credentials);
        assert.equal(headers.get('cookie'), null);
        return login();
      }
      assert.equal(request?.method, 'GET');
      assert.equal(headers.get('cookie'), cookie);
      assert.equal(headers.get('authorization'), null);
      return Response.json([]);
    },
  });
  assert.equal(session.personId, 42);
  assert.deepEqual(await session.readOwnJudgeRecord(), []);
  session.close();
  await assert.rejects(session.readOwnJudgeRecord(), { code: 'closed' });
  assert.deepEqual(calls, [base + '/auth/login', base + '/rest/paradigms/42/record']);
});

test('distinguishes rejected credentials, malformed login, and session expiry', async () => {
  for (const [reply, code] of [
    [new Response(credentials.password, { status: 401 }), 'unauthorized'],
    [Response.json({ id: 42, token: cookie }), 'invalid-response'],
    [Response.json({ id: 'unknown' }, { headers: { 'set-cookie': cookie } }), 'invalid-response'],
    [new Response('{', { headers: { 'set-cookie': cookie, 'content-type': 'application/json' } }), 'invalid-response'],
  ] as const) {
    await assert.rejects(openTabroomSession(secrets, { fetch: async () => reply }), { code });
  }

  let calls = 0;
  const session = await openTabroomSession(secrets, {
    fetch: async () => ++calls === 1 ? login() : new Response(cookie, { status: 401 }),
  });
  await assert.rejects(session.readOwnJudgeRecord(), { code: 'expired' });
  await assert.rejects(session.readOwnJudgeRecord(), { code: 'expired' });
  assert.equal(calls, 2);
});

test('caps retries and strips underlying errors from diagnostics', async () => {
  const sensitive = new Error(credentials.password + cookie);
  await assert.rejects(openTabroomSession({
    async getCredentials() { throw sensitive; },
  }), { message: 'Tabroom session: credentials' });

  let calls = 0;
  const session = await openTabroomSession(secrets, {
    timeoutMs: 10,
    async fetch(_url, request) {
      if (++calls === 1) return login();
      await setTimeout(500, undefined, { signal: request?.signal ?? undefined });
      throw sensitive;
    },
  });
  await assert.rejects(session.readOwnJudgeRecord(), { message: 'Tabroom session: transport' });
  assert.equal(calls, 3);
  session.close();

  let loginAttempts = 0;
  await assert.rejects(openTabroomSession(secrets, {
    async fetch() { loginAttempts++; throw sensitive; },
  }), { message: 'Tabroom session: transport' });
  assert.equal(loginAttempts, 1);
});

test('classifies a split panel using distinct fields and emits only statuses', async () => {
  const record = { panelId: 11, vote: 'Aff', result: 'Neg', event: ' Policy ', round: 3, teams: {} };
  const sample = {
    personId: 42,
    rows: [{
      match: [{ path: ['panelId'], value: 11 }],
      fields: {
        individualVote: { path: ['vote'], expected: 'Aff' },
        panelResult: { path: ['result'], expected: 'Neg' },
        event: { path: ['event'], expected: 'Policy', transform: 'trim' },
        round: { path: ['round'], expected: 2 },
        aff: { path: ['teams'], expected: 'Team A' },
      },
    }],
  };
  const matrix = await validateGoldRecord(sample, secrets, {
    fetch: async (_url, request) => request?.method === 'POST' ? login() : Response.json([record]),
  });
  assert.deepEqual(matrix, [{ row: 1, fields: {
    tournament: 'unavailable', level: 'unavailable', date: 'unavailable',
    event: 'explainable transform', round: 'mismatch', aff: 'ambiguous', neg: 'unavailable',
    individualVote: 'exact', panelResult: 'exact',
  } }]);
});

test('rejects a different account before reading its record', async () => {
  let calls = 0;
  await assert.rejects(validateGoldRecord({
    personId: 41,
    rows: [{ match: [{ path: ['panelId'], value: 11 }], fields: {} }],
  }, secrets, {
    async fetch() { calls++; return login(); },
  }), { message: 'Gold sample person differs from login' });
  assert.equal(calls, 1);
});

test('public imports omit credentials while an authenticated session is open', async t => {
  const session = await openTabroomSession(secrets, { fetch: async () => login() });
  try {
    const read = t.mock.method(globalThis, 'fetch', async (_url: RequestInfo | URL, _init?: RequestInit) =>
      new Response(null, { status: 401 }));
    await publicTabroom({ retain: async () => assert.fail('Unexpected public snapshot') })
      .import({ tournament: '42' });
    assert.equal(read.mock.calls.length, 3);
    for (const { arguments: [, request] } of read.mock.calls) {
      assert.equal(request?.credentials, 'omit');
      assert.deepEqual(request?.headers, { accept: 'application/json' });
    }
  } finally {
    session.close();
  }
});
