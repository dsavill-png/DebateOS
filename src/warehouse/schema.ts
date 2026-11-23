import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, jsonb, pgTable, pgView, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

const pk = () => uuid('id').defaultRandom().primaryKey();
const policy = () => ({
  authorization: text('authorization_class').notNull(),
  purpose: text('purpose').notNull(),
  grant: text('grant_scope'),
  audience: text('audience').notNull(),
  retention: text('retention_policy').notNull(),
});

export const tournaments = pgTable('tournaments', {
  id: pk(),
  provider: text('provider').notNull(),
  sourceId: text('tournament_source_id').notNull(),
}, t => [unique('tournaments_identity_key').on(t.provider, t.sourceId)]);

export const categories = pgTable('categories', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  sourceId: text('category_source_id').notNull(),
}, t => [unique('categories_identity_key').on(t.provider, t.tournament, t.sourceId), foreignKey({ columns: [t.provider, t.tournament], foreignColumns: [tournaments.provider, tournaments.sourceId] })]);

export const events = pgTable('events', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  sourceId: text('event_source_id').notNull(),
}, t => [unique('events_identity_key').on(t.provider, t.tournament, t.sourceId), foreignKey({ columns: [t.provider, t.tournament], foreignColumns: [tournaments.provider, tournaments.sourceId] })]);

export const schools = pgTable('schools', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  sourceId: text('school_source_id').notNull(),
}, t => [unique('schools_identity_key').on(t.provider, t.tournament, t.sourceId), foreignKey({ columns: [t.provider, t.tournament], foreignColumns: [tournaments.provider, tournaments.sourceId] })]);

export const chapters = pgTable('chapters', {
  id: pk(),
  provider: text('provider').notNull(),
  sourceId: text('chapter_source_id').notNull(),
}, t => [unique('chapters_identity_key').on(t.provider, t.sourceId)]);

export const entries = pgTable('entries', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  event: text('event_source_id').notNull(),
  sourceId: text('entry_source_id').notNull(),
}, t => [unique('entries_identity_key').on(t.provider, t.tournament, t.event, t.sourceId), foreignKey({ columns: [t.provider, t.tournament, t.event], foreignColumns: [events.provider, events.tournament, events.sourceId] })]);

export const students = pgTable('students', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  school: text('school_source_id').notNull(),
  sourceId: text('student_source_id').notNull(),
}, t => [unique('students_identity_key').on(t.provider, t.tournament, t.school, t.sourceId), foreignKey({ columns: [t.provider, t.tournament, t.school], foreignColumns: [schools.provider, schools.tournament, schools.sourceId] })]);

export const timeslots = pgTable('timeslots', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  sourceId: text('timeslot_source_id').notNull(),
}, t => [unique('timeslots_identity_key').on(t.provider, t.tournament, t.sourceId), foreignKey({ columns: [t.provider, t.tournament], foreignColumns: [tournaments.provider, tournaments.sourceId] })]);

export const rounds = pgTable('rounds', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  event: text('event_source_id').notNull(),
  sourceId: text('round_source_id').notNull(),
}, t => [unique('rounds_identity_key').on(t.provider, t.tournament, t.event, t.sourceId), foreignKey({ columns: [t.provider, t.tournament, t.event], foreignColumns: [events.provider, events.tournament, events.sourceId] })]);

export const panels = pgTable('panels', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  event: text('event_source_id').notNull(),
  round: text('round_source_id').notNull(),
  sourceId: text('panel_source_id').notNull(),
}, t => [unique('panels_identity_key').on(t.provider, t.tournament, t.event, t.round, t.sourceId), foreignKey({ columns: [t.provider, t.tournament, t.event, t.round], foreignColumns: [rounds.provider, rounds.tournament, rounds.event, rounds.sourceId] })]);

export const judges = pgTable('judges', {
  id: pk(),
  provider: text('provider').notNull(),
  tournament: text('tournament_source_id').notNull(),
  sourceId: text('judge_source_id').notNull(),
}, t => [unique('judges_identity_key').on(t.provider, t.tournament, t.sourceId), foreignKey({ columns: [t.provider, t.tournament], foreignColumns: [tournaments.provider, tournaments.sourceId] })]);

export const persons = pgTable('persons', {
  id: pk(),
  provider: text('provider').notNull(),
  sourceId: text('person_source_id').notNull(),
}, t => [unique('persons_identity_key').on(t.provider, t.sourceId)]);

export const captures = pgTable('warehouse_captures', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  method: text('source_method').notNull(),
  route: text('route').notNull(),
  scope: jsonb('request_scope').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true, mode: 'string' }).notNull(),
  status: integer('status').notNull(),
  mediaType: text('media_type').notNull(),
  digest: text('response_digest').notNull(),
  metadata: jsonb('metadata').notNull(),
  ...policy(),
});

export const evidence = pgTable('warehouse_evidence', {
  id: pk(),
  snapshot: text('snapshot_id').notNull().references(() => captures.id),
  parser: integer('parser_version').notNull(),
  pointer: text('source_pointer').notNull(),
  role: text('output_role').notNull(),
  subject: uuid('subject_id'),
  sourceId: jsonb('raw_source_id'),
  value: jsonb('observed_value'),
  verification: text('verification').notNull(),
  state: text('observation_state').notNull(),
  ...policy(),
}, t => [unique('captures_identity_key').on(t.snapshot, t.parser, t.pointer, t.role)]);

export const operationOutcomes = pgTable('warehouse_operation_outcomes', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  operation: text('operation').notNull(),
  route: text('route'),
  scope: jsonb('request_scope').notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true, mode: 'string' }).notNull(),
  status: integer('status'),
  mediaType: text('media_type'),
  snapshot: text('snapshot_id').references(() => captures.id),
  outcome: text('outcome').notNull(),
}, t => [check('warehouse_operation_outcome_allowed', sql`${t.outcome} in
  ('observed', 'empty', 'not-requested', 'unpublished', 'unauthorized', 'forbidden',
   'ambiguous-not-found', 'invalid', 'rate-limited', 'transient-failure')`)]);

export const evidenceRelationships = pgTable('warehouse_evidence_relationships', {
  evidence: uuid('evidence_id').primaryKey().references(() => evidence.id),
  parentEvidence: uuid('parent_evidence_id').references(() => evidence.id),
  category: uuid('category_id').references(() => categories.id),
  event: uuid('event_id').references(() => events.id),
  school: uuid('school_id').references(() => schools.id),
  chapter: uuid('chapter_id').references(() => chapters.id),
  entry: uuid('entry_id').references(() => entries.id),
  student: uuid('student_id').references(() => students.id),
  round: uuid('round_id').references(() => rounds.id),
  panel: uuid('panel_id').references(() => panels.id),
  judge: uuid('judge_id').references(() => judges.id),
  person: uuid('person_id').references(() => persons.id),
});

// Reconstruct public score and standing rows from named, typed scalars. Raw arrays,
// result keys and arbitrary text stay internal. SQL also protects preexisting rows.
const numericFields = (keys: string[]) => sql`jsonb_strip_nulls(jsonb_build_object(${sql.join(keys.map(key => {
  const field = sql`${evidence.value}->${sql.raw("'" + key + "'")}`;
  return sql`${sql.raw("'" + key + "'")} , case when jsonb_typeof(${field}) in ('number', 'string')
    and (${evidence.value}->>${sql.raw("'" + key + "'")}) ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$' then ${field} end`;
}), sql`, `)}))`;

export const publicEvidence = pgView('warehouse_public_evidence').as(q => q.select({
  id: evidence.id, snapshot: evidence.snapshot, parser: evidence.parser, pointer: evidence.pointer,
  role: evidence.role, subject: evidence.subject, sourceId: sql`case when ${evidence.role} in ('ballot-score', 'standing', 'standing-value', 'result-set') then null else ${evidence.sourceId} end`.as('raw_source_id'),
  value: sql`case ${evidence.role}
    when 'ballot-score' then ${numericFields(['id', 'value'])} || case when ${evidence.value}->>'tag' = 'speaker' then '{"tag":"speaker"}'::jsonb else '{}'::jsonb end
    when 'standing' then ${numericFields(['place', 'rank', 'percentile'])}
    when 'standing-value' then ${numericFields(['result_key', 'value'])}
    when 'result-sets' then null
    when 'result-set' then null
    when 'result-set-publication' then case when ${evidence.value} in ('true', 'false', '"true"', '"false"') then ${evidence.value} end
    when 'ballot-scores' then null
    when 'ballot' then case when (${evidence.value}#>>'{row,score}') ~ '^-?[0-9]{1,20}([.][0-9]{1,10})?$'
      and jsonb_typeof(${evidence.value}#>'{row,score}') in ('number', 'string')
      then ${evidence.value} else ${evidence.value} #- '{row,score}' end
    else ${evidence.value} end`.as('observed_value'),
  verification: evidence.verification, state: evidence.state,
}).from(evidence).innerJoin(captures, sql`${evidence.snapshot} = ${captures.id}`)
  .where(sql`${evidence.authorization} = 'public' and ${evidence.audience} = 'public'
    and ${evidence.grant} is null and ${captures.authorization} = 'public'
    and ${captures.audience} = 'public' and ${captures.grant} is null`));

export const panelJudges = pgTable('panel_judges', {
  id: pk(),
  panel: uuid('panel_id').notNull().references(() => panels.id),
  judge: uuid('judge_id').notNull().references(() => judges.id),
}, t => [unique('panelJudges_identity_key').on(t.panel, t.judge)]);

export const seasonScopes = pgTable('season_scopes', {
  id: text('id').primaryKey(),
});

export const seasonRevisions = pgTable('season_revisions', {
  id: pk(),
  scope: text('scope_id').notNull().references(() => seasonScopes.id),
  version: integer('version').notNull(),
  predecessor: integer('predecessor_version'),
  definition: jsonb('definition').notNull(),
  approvedBy: text('approved_by').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [
  unique().on(t.scope, t.version),
  foreignKey({ columns: [t.scope, t.predecessor], foreignColumns: [t.scope, t.version] }),
]);

export const seasonMemberships = pgTable('season_memberships', {
  id: pk(),
  revision: uuid('revision_id').notNull().references(() => seasonRevisions.id),
  event: uuid('event_id').notNull().references(() => events.id),
  decision: text('decision', { enum: ['included', 'excluded', 'unresolved'] }).notNull(),
  rationale: text('rationale').notNull(),
  classification: jsonb('classification').notNull(),
}, t => [unique('seasonScopes_identity_key').on(t.revision, t.event)]);

export const seasonMembershipEvidence = pgTable('season_membership_evidence', {
  membership: uuid('membership_id').notNull().references(() => seasonMemberships.id),
  evidence: uuid('evidence_id').notNull().references(() => evidence.id),
}, t => [unique('seasonMembershipEvidence_identity_key').on(t.membership, t.evidence)]);
