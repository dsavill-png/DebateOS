import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveJudgeProfile } from './judge-profile.ts';
import type { JudgeActivityReport } from './judge-activity.ts';
import type { RetainedManifest } from './persist-season-manifest.ts';

const directory = new URL('../../docs/coverage/', import.meta.url);
const prefix = 'college-policy-2025-26-r1';
const manifest: RetainedManifest = JSON.parse(readFileSync(new URL(prefix + '.json', directory), 'utf8'));
const report: Pick<JudgeActivityReport, 'manifest' | 'evidenceCutoff' | 'derivationVersion' | 'people'> =
  JSON.parse(readFileSync(new URL(prefix + '-judge-activity-samples.json', directory), 'utf8'));
const coverage: Pick<JudgeActivityReport['coverage'], 'pin' | 'events'> =
  JSON.parse(readFileSync(new URL(prefix + '-summary.json', directory), 'utf8'));
if (coverage.pin.sha256 !== report.manifest.sha256) throw new Error('Coverage manifest pin mismatch');

const [capturesDirectory] = process.argv.slice(2);
const profiles = ['175248', '19665', '775310'].map(personId => {
  const activity = report.people.find(row => row.personId === personId);
  if (!activity) throw new Error('Missing sample person ' + personId);
  return deriveJudgeProfile(report, activity, manifest, coverage.events, tournamentId => {
    if (!capturesDirectory) return undefined;
    const path = join(capturesDirectory, tournamentId + '-bulk.json');
    return existsSync(path) ? readFileSync(path) : undefined;
  });
});
process.stdout.write(JSON.stringify(profiles, null, 2) + '\n');
