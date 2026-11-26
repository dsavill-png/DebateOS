import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const cohortPin = Object.freeze({
  scopeId: 'tabroom-college-policy-2025-26',
  revision: 1,
  sha256: '5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac',
});

// Use explicit, canonical links from the separately verified archive replay.
export function planCohortImport(pin, links, pilotPersonIds) {
  if (!pin || Object.entries(cohortPin).some(([key, value]) => pin[key] !== value)) {
    throw new Error('Unexpected cohort pin');
  }
  if (!Array.isArray(links) || links.length !== 401) throw new Error('Expected 401 cohort links');
  const byPerson = new Map();
  const providers = new Set();
  for (const { personId, providerId } of links) {
    if (typeof personId !== 'string' || !personId || personId.trim() !== personId ||
        typeof providerId !== 'string' || !/^[1-9][0-9]*$/.test(providerId) ||
        byPerson.has(personId) || providers.has(providerId)) {
      throw new Error('Invalid or ambiguous cohort link');
    }
    byPerson.set(personId, providerId);
    providers.add(providerId);
  }
  const allPeople = [...byPerson.keys()].sort();
  if (pilotPersonIds !== undefined &&
      (!Array.isArray(pilotPersonIds) || pilotPersonIds.length !== 5 ||
      new Set(pilotPersonIds).size !== 5 || pilotPersonIds.some(id => !byPerson.has(id)))) {
    throw new Error('Expected five distinct pilot people from the cohort');
  }
  const worklist = (pilotPersonIds === undefined ? allPeople : [...pilotPersonIds].sort())
    .flatMap(personId => ['history', 'paradigm'].map(stream => ({
      personId, providerId: byPerson.get(personId), stream,
    })));
  return { pin: cohortPin, worklist, sha256: digest(worklist) };
}

// One runner owns a checkpoint file. Each rename commits records and position together.
export async function importFixture(fixture, checkpoint, {
  intervalMs = 1000, pageBudget = Infinity, onProgress = () => {},
} = {}) {
  if (fixture.kind !== 'synthetic-judge-snapshot' || !fixture.snapshotId ||
      !Number.isFinite(intervalMs) || intervalMs < 0 || !(pageBudget >= 0) ||
      (pageBudget !== Infinity && !Number.isSafeInteger(pageBudget))) {
    throw new Error('Invalid fixture or import limits');
  }
  const fingerprint = digest(fixture);
  let state = { version: 1, snapshots: {}, records: {}, lastObserved: {} };
  try {
    state = JSON.parse(await readFile(checkpoint, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (state.version !== 1) throw new Error('Unsupported checkpoint version');
  state.quarantine ??= [];
  state.quality ??= { accepted: 0, unchanged: 0, quarantined: 0 };
  const key = JSON.stringify(fixture.snapshotId);
  const position = state.snapshots[key] ?? { fingerprint, nextPage: 0 };
  if (position.fingerprint !== fingerprint) throw new Error('Snapshot changed after import started');
  const pages = fixture.pages;
  if (!Array.isArray(pages) || !Number.isSafeInteger(position.nextPage) ||
      position.nextPage < 0 || position.nextPage > pages.length) throw new Error('Invalid page position');
  state.snapshots[key] = position;
  let processed = 0;
  while (position.nextPage < pages.length && processed < pageBudget) {
    await delay(intervalMs);
    const page = pages[position.nextPage];
    const observedAt = new Date(page.observedAt).toISOString();
    if (!Array.isArray(page.records)) throw new Error('Invalid fixture page');
    for (const [index, record] of page.records.entries()) {
      const quarantine = reason => {
        state.quarantine.push({ snapshotId: fixture.snapshotId, page: position.nextPage, index, reason });
        state.quality.quarantined += 1;
      };
      if (!record || typeof record.personId !== 'string' || !record.personId.trim() ||
          typeof record.sourceId !== 'string' || !record.sourceId.trim() ||
          !['history', 'paradigm'].includes(record.stream) ||
          typeof record.content !== 'string' || !record.content.trim()) {
        quarantine('invalid-record');
        continue;
      }
      const content = record.content.replace(/\r\n/g, '\n').trim();
      const recordKey = JSON.stringify([record.personId.trim(), record.stream, record.sourceId.trim()]);
      const revisions = state.records[recordKey] ??= [];
      const contentHash = digest(content);
      const previous = revisions.at(-1);
      const lastObserved = state.lastObserved[recordKey];
      if (lastObserved && observedAt < lastObserved) {
        quarantine('out-of-order');
        continue;
      }
      if (lastObserved === observedAt && previous?.contentHash !== contentHash) {
        quarantine('conflicting-observation');
        continue;
      }
      if (previous?.contentHash !== contentHash) {
        revisions.push({ contentHash, content, observedAt, snapshotId: fixture.snapshotId });
        state.quality.accepted += 1;
      } else {
        state.quality.unchanged += 1;
      }
      state.lastObserved[recordKey] = observedAt;
    }
    position.nextPage += 1;
    processed += 1;
    await writeFile(checkpoint + '.pending', JSON.stringify(state), 'utf8');
    await rename(checkpoint + '.pending', checkpoint);
    onProgress({ completedPages: position.nextPage, totalPages: pages.length });
  }
  return { completedPages: position.nextPage, totalPages: pages.length, records: state.records, quality: state.quality, quarantine: state.quarantine };
}

const args = globalThis.process?.argv;
if (args?.[1] && import.meta.url === pathToFileURL(args[1]).href) {
  const [, , path, checkpoint] = args;
  if (!path || !checkpoint) throw new Error('Usage: node judge-import-fixture.mjs FIXTURE CHECKPOINT');
  const fixture = JSON.parse(await readFile(path, 'utf8'));
  const result = await importFixture(fixture, checkpoint, {
    onProgress: progress => console.log(JSON.stringify(progress)),
  });
  console.log(JSON.stringify({
    completedPages: result.completedPages, totalPages: result.totalPages,
    distinctRecords: Object.keys(result.records).length,
    quality: result.quality,
  }));
}
