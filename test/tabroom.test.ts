import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { publicTabroom, sha256, spec } from '../src/tabroom/adapter.ts';

const directory = new URL('../fixtures/tabroom/harvard-40923/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('provenance.json', directory), 'utf8'));
const scope = {
  tournament: manifest.scope.tournament_id,
  event: manifest.scope.event_id,
  round: manifest.scope.round_id,
};
const captures = new Map<string, {
  bytes: Buffer; fetchedAt: string; mediaType: string; status: number;
}>();
for (const capture of Object.values(manifest.captures) as {
  url: string; file: string; fixture_sha256: string; fetched_at: string; media_type: string; status: number;
}[]) {
  const bytes = readFileSync(new URL(capture.file, directory));
  assert.equal(sha256(bytes), capture.fixture_sha256);
  captures.set(capture.url, {
    bytes, fetchedAt: capture.fetched_at, mediaType: capture.media_type, status: capture.status,
  });
}
const { tournament, invite, bulk } = manifest.captures;
type Reply = NonNullable<ReturnType<typeof captures.get>> & { retryAfter?: string };

function replay(replace: (url: string, reply: Reply, count: number) => Reply = (_, reply) => reply) {
  const requests: string[] = [];
  const delays: number[] = [];
  const retained = new Map<string, Uint8Array>();
  const adapter = publicTabroom({
    read: async url => {
      requests.push(url);
      const reply = captures.get(url);
      assert.ok(reply, url);
      return replace(url, reply, requests.filter(request => request === url).length);
    },
    wait: async ms => { delays.push(ms); },
    retain: async (snapshot, bytes) => { retained.set(snapshot.id, bytes); },
  });
  return { run: () => adapter.import(scope), requests, delays, retained };
}

test('pinned Harvard replay preserves IDs, joins, source pointers and uncertainty', async () => {
  assert.equal(spec.version, manifest.openapi.version);
  assert.equal(spec.sha256, manifest.openapi.source_sha256);
  const fixture = replay();
  const result = await fixture.run();
  assert.deepEqual(result, await fixture.run());
  assert.deepEqual(fixture.requests, [
    tournament.url, invite.url, bulk.url, tournament.url, invite.url, bulk.url,
  ]);
  const prefix = 'tabroom:tournament:40923';
  assert.equal(result.tournament?.id, prefix);
  assert.deepEqual(result.tournament?.observations.map(value => value.provenance.source_method), ['REST', 'bulk']);
  assert.equal(result.events[0].id, prefix + ':event:389106');
  assert.equal(result.rounds[0].eventId, result.events[0].id);
  assert.equal(result.rounds[0].id, prefix + ':round:1587204');
  const expected = [prefix + ':entry:7401836', prefix + ':entry:7465627'];
  const matching = result.debates.filter(debate => debate.roundId === result.rounds[0].id &&
    [...debate.entryIds].sort().join(',') === expected.join(','));
  assert.equal(matching.length, 1);
  const [panel] = matching;
  assert.equal(panel.provenance.source_id, '9200905');
  assert.deepEqual(result.entries.map(entry => [entry.id, entry.code, entry.eventId]), [
    [expected[0], 'Kansas SS', result.events[0].id],
    [expected[1], 'Texas BS', result.events[0].id],
  ]);
  assert.equal(panel.winningEntryId, null);
  assert.equal(panel.outcome, 'unresolved');
  assert.equal(panel.assignments.length, 1);
  assert.equal(panel.assignments[0].provenance.length, 2);
  const [judge] = result.tournamentJudges;
  assert.equal(panel.assignments[0].judgeId, judge.id);
  assert.equal(judge.id, prefix + ':judge:2912715');
  assert.equal(judge.personId, 'tabroom:person:366665');
  assert.equal(judge.personId, result.persons[0].id);
  for (const ballot of panel.ballots) {
    const bytes = fixture.retained.get(ballot.provenance.snapshot_id);
    assert.ok(bytes);
    const raw = ballot.provenance.source_path.slice(1).split('/').reduce(
      (value, segment) => value[segment], JSON.parse(Buffer.from(bytes).toString()),
    );
    assert.equal(raw.id, ballot.provenance.source_id);
    assert.equal(ballot.sourceScore, null);
    assert.equal(ballot.sourceSide, null);
  }
  assert.deepEqual(result.diagnostics.filter(item => item.state === 'unavailable').map(item => item.resource),
    ['rounds', 'results', 'schedule']);
});

test('401, 403 and an HTML redirect produce partial coverage without fallback requests', async () => {
  const fixture = replay((url, reply) => ({
    ...reply, status: url === tournament.url ? 401 : url === invite.url ? 403 : 302,
    mediaType: 'text/html',
  }));
  const result = await fixture.run();
  assert.deepEqual(fixture.requests, [tournament.url, invite.url, bulk.url]);
  assert.deepEqual(result.diagnostics.slice(3).map(item => [item.status, item.state]), [
    [401, 'unavailable'], [403, 'unavailable'], [302, 'failed'],
  ]);
  assert.equal(result.tournament, null);
  assert.equal(fixture.retained.size, 0);
});

test('invalid JSON is retained and valid independent REST coverage survives', async () => {
  const fixture = replay((url, reply) => url === bulk.url ? { ...reply, bytes: Buffer.from('{') } : reply);
  const result = await fixture.run();
  assert.ok(result.tournament);
  assert.equal(result.debates.length, 0);
  assert.ok(result.diagnostics.some(item => item.resource === 'bulk' && item.state === 'failed'));
  assert.equal(fixture.retained.size, 3);
});

test('transient REST failure retries with Retry-After and validated bulk supplies tournament data', async () => {
  const fixture = replay((url, reply, count) => {
    if (url !== tournament.url) return reply;
    if (count === 1) throw Error('Connection reset');
    return { ...reply, status: 503, retryAfter: '1' };
  });
  const result = await fixture.run();
  assert.deepEqual(fixture.delays, [250, 1000]);
  assert.equal(fixture.requests.filter(url => url === tournament.url).length, 3);
  assert.deepEqual(result.tournament?.observations.map(value => value.provenance.source_method), ['bulk']);
  assert.equal(result.debates.length, 1);
});

for (const scenario of ['withheld', 'contradictory']) {
  test(scenario + ' ballot observations preserve uncertainty', async () => {
    const fixture = replay((url, reply) => {
      if (url !== bulk.url) return reply;
      const data = JSON.parse(reply.bytes.toString());
      const section = data.categories[0].events[0].rounds[0].sections[0];
      if (scenario === 'withheld') delete section.ballots;
      else section.ballots[1].judge_person = 123;
      return { ...reply, bytes: Buffer.from(JSON.stringify(data)) };
    });
    const result = await fixture.run();
    assert.equal(result.debates[0].winningEntryId, null);
    assert.equal(result.tournamentJudges[0].personId, null);
    if (scenario === 'withheld') {
      assert.equal(result.debates[0].matchup, 'unresolved');
      assert.equal(result.debates[0].assignments.length, 0);
    } else {
      assert.equal(result.tournamentJudges[0].personObservations.length, 2);
      assert.ok(result.diagnostics.some(item => item.state === 'conflict'));
    }
  });
}

test('real transport uses only pinned anonymous GET URLs and rejects HTML', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response('<html>Sign in</html>', {
      status: 200, headers: { 'content-type': 'text/html' },
    }),
  );
  const adapter = publicTabroom({
    retain: async () => assert.fail('HTML must not be retained as a JSON snapshot'),
  });
  const result = await adapter.import(scope);
  assert.deepEqual(fetch.mock.calls.map(call => call.arguments[0]), [
    tournament.url, invite.url, bulk.url,
  ]);
  for (const { arguments: [, init] } of fetch.mock.calls) {
    assert.equal(init?.method, 'GET');
    assert.equal(init?.credentials, 'omit');
    assert.equal(init?.redirect, 'manual');
    assert.deepEqual(init?.headers, { accept: 'application/json' });
  }
  assert.deepEqual(
    result.diagnostics.filter(item => item.state === 'unavailable').map(item => item.resource),
    manifest.protected_rest.map(({ url }: { url: string }) => url.split('/').at(-1)),
  );
  assert.deepEqual(result.diagnostics.slice(3).map(item => item.reason),
    Array(3).fill('Unexpected media type'));
  assert.equal(result.tournament, null);
  assert.deepEqual(result.snapshots, []);
});

test('public bulk roster, timeslots and score observations retain their source semantics', async () => {
  const fixture = replay((url, reply) => {
    if (url !== bulk.url) return reply;
    const data = JSON.parse(reply.bytes.toString());
    data.schools[0].students = [{ id: '123', chapter: 456 }];
    data.schools[0].entries[0].students = ['123', '999'];
    data.timeslots = [{ id: '42', name: 'Round 1', start: '2026-02-14 08:00:00', end: '2026-02-14 10:00:00' }];
    data.categories[0].events[0].rounds[0].sections[0].ballots[0].scores = [{ id: 17, tag: 'example', value: 1 }];
    return { ...reply, bytes: Buffer.from(JSON.stringify(data)) };
  });
  const result = await fixture.run();
  const [student] = result.students;
  assert.equal(student.chapterId, '456');
  assert.equal(student.schoolId, result.entries[0].schoolId);
  assert.equal(student.provenance.source_path, '/schools/0/students/0');
  assert.deepEqual(result.entries[0].roster?.map(item => [item.sourceStudentId, item.studentId]), [
    ['123', student.id], ['999', null],
  ]);
  assert.equal(result.entries[0].roster?.[1].provenance.source_path, '/schools/0/entries/0/students/1');
  assert.equal(result.timeslots[0].provenance.source_id, '42');
  assert.equal(result.timeslots[0].provenance.source_path, '/timeslots/0');
  assert.equal(result.debates[0].ballots[0].sourceScore, null);
  assert.deepEqual(result.debates[0].ballots[0].sourceScores, [{ id: 17, tag: 'example', value: 1 }]);
  assert.equal(result.debates[0].outcome, 'unresolved');
});
