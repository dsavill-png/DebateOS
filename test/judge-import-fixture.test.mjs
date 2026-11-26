import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { importFixture, planCohortImport } from '../scripts/judge-import-fixture.mjs';

test('five synthetic judges resume with deduplicated revisions and quarantined rows', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/judge-import-pilot.json', import.meta.url), 'utf8'));
  const directory = await mkdtemp(join(tmpdir(), 'judge-import-'));
  const checkpoint = join(directory, 'checkpoint.json');
  try {
    const first = await importFixture(fixture, checkpoint, { intervalMs: 0, pageBudget: 1 });
    assert.equal(first.completedPages, 1);
    assert.equal(Object.keys(first.records).length, 10);
    const result = await importFixture(fixture, checkpoint, { intervalMs: 0 });
    assert.equal(result.completedPages, 2);
    assert.deepEqual(result.quality, { accepted: 11, unchanged: 1, quarantined: 2 });
    assert.deepEqual(result.quarantine.map(row => row.reason), ['conflicting-observation', 'invalid-record']);
    assert.equal(result.records[JSON.stringify(['fixture-2', 'paradigm', 'record-1'])].length, 2);
    assert.deepEqual(await importFixture(fixture, checkpoint, { intervalMs: 0 }), result);
    await assert.rejects(importFixture({ ...fixture, pages: [] }, checkpoint), /Snapshot changed/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('pinned worklist plans 802 streams or ten for the pilot and rejects ambiguous links', () => {
  const pin = {
    scopeId: 'tabroom-college-policy-2025-26',
    revision: 1,
    sha256: '5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac',
  };
  const links = Array.from({ length: 401 }, (_, index) => ({
    personId: `fixture-${index}`, providerId: String(index + 1),
  }));
  const full = planCohortImport(pin, links);
  assert.equal(full.worklist.length, 802);
  assert.equal(planCohortImport(pin, [...links].reverse()).sha256, full.sha256);
  assert.equal(planCohortImport(pin, links, links.slice(0, 5).map(row => row.personId)).worklist.length, 10);
  assert.throws(() => planCohortImport(pin, [...links.slice(1), links[1]]), /ambiguous/);
  assert.throws(() => planCohortImport(pin, links, ['fixture-0']), /five distinct/);
});
