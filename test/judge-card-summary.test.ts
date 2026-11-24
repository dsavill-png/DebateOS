import assert from 'node:assert/strict';
import test from 'node:test';
import profiles from '../docs/coverage/college-policy-2025-26-r1-judge-profiles.json' with { type: 'json' };
import { assignmentDateLabel, judgeCardSummary } from '../src/app/judge-proof/judge-card-summary.ts';

const [michael, latoya, arya] = profiles;

test('judge card labels explicit and zero SNU observations within the public sample', () => {
  const observed = judgeCardSummary(michael);
  assert.equal(observed.snuPanels, '2 observed SNU panels');
  assert.equal(observed.snuRounds, 'in 2 rounds');
  assert.equal(observed.dateSpan, '2025-11-01 to 2026-01-03');

  const zero = judgeCardSummary(latoya);
  assert.equal(zero.snuPanels, '0 observed SNU panels');
  assert.equal(zero.snuRounds, null);
});

test('judge card preserves unknown dates in the summary and recent activity', () => {
  assert.equal(judgeCardSummary(arya).dateSpan, 'Unknown');
  assert.equal(assignmentDateLabel(arya.recentPanels[0].assignmentDate), 'Unknown');
});

test('an included-division roster gap can coexist with verified identity', () => {
  assert.equal(judgeCardSummary(latoya).hasRosterGap, true);
  assert.equal(latoya.identity.displayName.status, 'verified');
});
