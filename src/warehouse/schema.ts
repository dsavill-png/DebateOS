import { sql, type SQLWrapper } from 'drizzle-orm';
import { check, date, foreignKey, integer, jsonb, pgTable, pgView, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

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

const relationshipEvidence = () => uuid('evidence_id').notNull().references(() => evidence.id);
const relationshipVerification = () =>
  text('verification').$type<'unverified' | 'verified' | 'conflicting' | 'rejected'>().notNull();
const verificationCheck = (name: string, verification: ReturnType<typeof sql>) =>
  check(name, sql`${verification} in ('unverified', 'verified', 'conflicting', 'rejected')`);

const temporalFields = () => ({
  temporalPrecision: text('temporal_precision')
    .$type<'exact-interval' | 'start-only' | 'end-only' | 'event-only' | 'unknown'>().notNull(),
  effectiveStart: date('effective_start'),
  effectiveEnd: date('effective_end'),
  observedOn: date('observed_on'),
});

type TemporalColumns = {
  [K in keyof ReturnType<typeof temporalFields>]: SQLWrapper;
};

const temporalCheck = (name: string, t: TemporalColumns) => check(name, sql`
  case ${t.temporalPrecision}
    when 'exact-interval' then ${t.effectiveStart} is not null and ${t.effectiveEnd} is not null
      and ${t.effectiveStart} <= ${t.effectiveEnd}
    when 'start-only' then ${t.effectiveStart} is not null and ${t.effectiveEnd} is null
    when 'end-only' then ${t.effectiveStart} is null and ${t.effectiveEnd} is not null
    when 'event-only' then ${t.effectiveStart} is null and ${t.effectiveEnd} is null and ${t.observedOn} is not null
    when 'unknown' then ${t.effectiveStart} is null and ${t.effectiveEnd} is null and ${t.observedOn} is null
    else false
  end`);

export const personRoleObservations = pgTable('person_role_observations', {
  evidence: relationshipEvidence().primaryKey(),
  person: uuid('person_id').notNull().references(() => persons.id),
  role: text('role').notNull(),
  verification: relationshipVerification(),
  ...temporalFields(),
}, t => [
  check('person_role_allowed', sql`${t.role} in ('debater', 'judge', 'coach')`),
  verificationCheck('person_role_verification', sql`${t.verification}`),
  temporalCheck('person_role_dates', t),
]);

export const personInstitutionAffiliations = pgTable('person_institution_affiliations', {
  evidence: relationshipEvidence().primaryKey(),
  person: uuid('person_id').notNull().references(() => persons.id),
  chapter: uuid('chapter_id').notNull().references(() => chapters.id),
  role: text('role'),
  verification: relationshipVerification(),
  ...temporalFields(),
}, t => [
  check('person_affiliation_role_allowed', sql`${t.role} in ('debater', 'judge', 'coach')`),
  verificationCheck('person_affiliation_verification', sql`${t.verification}`),
  temporalCheck('person_affiliation_dates', t),
]);

export const studentPersonEvidence = pgTable('student_person_evidence', {
  evidence: relationshipEvidence().primaryKey(),
  student: uuid('student_id').notNull().references(() => students.id),
  person: uuid('person_id').references(() => persons.id),
  basis: text('basis').$type<'explicit-source' | 'validated-crosswalk'>(),
  verification: relationshipVerification(),
}, t => [
  unique('student_person_evidence_candidate_key').on(t.evidence, t.student, t.person),
  verificationCheck('student_person_verification', sql`${t.verification}`),
  check('student_person_explicit_basis', sql`
    (${t.person} is null and ${t.basis} is null and ${t.verification} = 'unverified')
    or (${t.person} is not null and ${t.basis} is not null
      and ${t.basis} in ('explicit-source', 'validated-crosswalk'))`),
]);

export const entryPersonMemberships = pgTable('entry_person_memberships', {
  evidence: relationshipEvidence(),
  entry: uuid('entry_id').notNull().references(() => entries.id),
  person: uuid('person_id').notNull().references(() => persons.id),
  student: uuid('student_id').references(() => students.id),
  identityEvidence: uuid('identity_evidence_id'),
  verification: relationshipVerification(),
}, t => [
  primaryKey({ name: 'entry_person_memberships_pk', columns: [t.evidence, t.entry, t.person] }),
  verificationCheck('entry_person_verification', sql`${t.verification}`),
  foreignKey({
    name: 'entry_person_identity_candidate_fk',
    columns: [t.identityEvidence, t.student, t.person],
    foreignColumns: [studentPersonEvidence.evidence, studentPersonEvidence.student, studentPersonEvidence.person],
  }),
  check('entry_person_student_lineage', sql`(${t.student} is null) = (${t.identityEvidence} is null)`),
]);

export const publicPersonRoleObservations = pgView('public_person_role_observations', personRoleObservationsColumns()).existing();

function personRoleObservationsColumns() {
  return {
    evidence: uuid('evidence_id').notNull(),
    person: uuid('person_id').notNull(),
    role: text('role').notNull(),
    verification: relationshipVerification(),
    ...temporalFields(),
  };
}

export const publicPersonInstitutionAffiliations = pgView('public_person_institution_affiliations', {
  ...personRoleObservationsColumns(),
  chapter: uuid('chapter_id').notNull(),
  role: text('role'),
}).existing();

export const publicEntryPersonMemberships = pgView('public_entry_person_memberships', {
  evidence: uuid('evidence_id').notNull(),
  entry: uuid('entry_id').notNull(),
  person: uuid('person_id').notNull(),
  student: uuid('student_id'),
  identityEvidence: uuid('identity_evidence_id'),
  verification: relationshipVerification(),
}).existing();

export const publicStudentPersonAssertions = pgView('public_student_person_assertions', {
  evidence: uuid('evidence_id').notNull(),
  student: uuid('student_id').notNull(),
  person: uuid('person_id'),
  basis: text('basis').$type<'explicit-source' | 'validated-crosswalk'>(),
  verification: relationshipVerification(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true, mode: 'string' }).notNull(),
}).existing();
