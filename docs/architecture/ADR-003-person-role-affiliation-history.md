# ADR-003 · Durable person, role, affiliation, and participation history

**Status:** Proposed  
**Date:** 2026-11-24  
**Work order:** [TASK-016](../../tasks/016-person-role-affiliation-model.md)  
**Supersedes:** Nothing. This refines the identity portions of [ADR-002](ADR-002-canonical-warehouse-model.md).

## Context

DebateOS needs to reason about humans across many years of debate activity. The same human may first appear as a debater, later judge, coach, or occupy several roles at once. A debater may transfer institutions and may compete with different partners over time.

The current canonical model already treats `Person` as distinct from tournament-scoped `Judge`, and it deliberately treats tournament-scoped student references and entry membership separately from durable debater identity. The physical schema therefore avoids some incorrect identity shortcuts, but it does not yet define the complete durable-person model needed for longitudinal analytics.

The core modeling rule is:

> **The person is durable. Roles, affiliations, entries, partnerships, and assignments are historical relationships.**

## Decision

### 1. Person is role-neutral

`Person` represents a durable human identity within an identity provider or a verified cross-provider resolution. It does not own a single role, school, team, or partner.

Logical key for a provider person:

- `provider + person_source_id`

DebateOS may later support cross-provider identity resolution, but only through explicit evidence and a separately reviewed resolution policy.

A role transition never creates a new person.

### 2. Provider identity and observed references remain separate

Provider records that describe a human in a specific context are not automatically the durable Person.

Examples include:

- tournament judge record;
- tournament student/debater reference;
- coach/account-scoped record;
- other provider-specific participant records.

Each contextual record retains its own source key and grain. A relationship to Person requires explicit or otherwise validated identity evidence.

### 3. Person-role observation

Introduce a logical **Person Role Observation**.

**Grain:** one evidence-backed assertion that a Person acted in a role within a defined context and, where known, time range.

Candidate fields:

- person
- role type
- source/context type and source key
- observed_at or observed interval
- optional effective_start
- optional effective_end
- temporal precision
- verification state
- evidence references

Roles are not mutually exclusive. A Person may be both a debater and a judge during overlapping periods.

An observed tournament participation may establish that a role existed at that event. It does not by itself establish an uninterrupted multi-year role.

### 4. Person-institution affiliation observation

Introduce a logical **Person Institution Affiliation Observation**.

**Grain:** one evidence-backed assertion connecting a Person to a durable institution/chapter, optionally with a role and effective interval.

Candidate fields:

- person
- institution/chapter
- optional role type
- source/context
- observed_at
- optional effective_start
- optional effective_end
- temporal precision
- verification state
- evidence references

A Person may have many affiliation observations across time and may have overlapping affiliations.

A tournament-scoped school record remains distinct from a durable chapter/institution. A tournament school may support an affiliation only when the school-to-chapter/institution relationship and the person participation are both explicitly evidenced.

Do not place `school_id` or `institution_id` on Person as a timeless current truth.

### 5. Student/debater reference to Person evidence

Preserve the current tournament-scoped student reference.

Introduce a logical **Student-Person Identity Evidence** relationship analogous to Judge-Person Evidence.

**Grain:** one evidence assertion connecting one tournament-scoped student/debater reference to one candidate Person.

Rules:

- require explicit source identity or a separately validated crosswalk;
- names, entry codes, school similarity, or numeric coincidence are insufficient alone;
- preserve unresolved and conflicting candidates;
- a student reference may resolve to zero or one Person in an as-of view;
- one Person may resolve from many student references across tournaments and institutions.

This is the bridge that permits a former debater and later judge to be recognized as the same human while preserving source-specific records.

### 6. Entry membership is the fact of who debated together

Introduce or formalize **Entry Person Membership** as the durable-person projection of an evidenced entry roster.

**Grain:** one Person participating in one tournament Event Entry.

The underlying evidence may originate from a student reference roster membership and then resolve through Student-Person Identity Evidence.

Cardinality:

- one Entry has one or more Persons as supported by source evidence;
- one Person may belong to many Entries over time;
- multiple Persons may appear together in many Entries;
- the same Person may appear with different partners in different Entries.

The Entry remains tournament/event scoped. It is the preferred competition-level fact for who debated together.

### 7. Partnership/team is not a person attribute

A debate partnership is never stored as a permanent `team_id` on Person.

If DebateOS later needs a durable **Partnership Episode** or **Team Composition Episode**, it is a separate derived or evidence-backed entity whose membership comes from entry/person memberships.

Possible grain:

- membership set of durable persons
- season or effective interval
- institution when supported
- source/evidence policy

It may span multiple entries, but only when the evidence warrants that grouping.

Entry codes, display names, initials, or repeated pairings may help discovery but do not by themselves establish a durable team identity.

### 8. Judge history remains unchanged in principle

The existing chain remains valid:

`Person <- Judge-Person Evidence -> Tournament Judge -> Panel Judge Assignment -> Panel`

A Person can simultaneously have:

- historical Entry Person Memberships as a debater;
- current or historical Person Institution Affiliations;
- current or historical Person Role Observations;
- tournament Judge records and panel assignments.

No duplicate Person is required when the role changes.

### 9. Transfers and affiliation changes

School transfer is represented by separate affiliation and competition observations.

Example:

- Person P has Entry membership at tournament T1 through School/Chapter A.
- Later Person P has Entry membership at tournament T2 through School/Chapter B.
- Both resolve to the same durable Person P when identity evidence supports it.

This does not mutate an old affiliation into a new one and does not create Person P2.

The system may derive an affiliation interval only when a reviewed rule supports it. Otherwise, retain point-in-time observations.

### 10. Temporal semantics

Use evidence-first temporal precision.

Supported states should include:

- exact effective interval known;
- start known/end unknown;
- end known/start unknown;
- event/date observation only;
- inferred interval with explicit derivation version;
- unknown.

Do not fabricate January 1/December 31 boundaries merely to make ranges non-null.

Absence of later evidence is not proof an affiliation or role ended.

As-of views may resolve observations under a reviewed policy while retaining the underlying evidence and conflicts.

## Relationship summary

| Relationship | Cardinality | Meaning |
| --- | --- | --- |
| Person -> Person Role Observation | 1:M | A human may hold many roles over time and simultaneously |
| Person -> Person Institution Affiliation | 1:M | A human may be affiliated with many institutions over time |
| Tournament Judge -> Person | M:0..1 per as-of resolution | Existing explicit judge-person identity resolution |
| Tournament Student Reference -> Person | M:0..1 per as-of resolution | Future explicit debater-person identity resolution |
| Entry -> Person membership | M:N over history | Who competed together in a specific tournament/event entry |
| Person -> Entry | 1:M | A debater may compete in many entries and with different partners |
| Chapter/Institution -> Person affiliation | 1:M | Institution history, not a permanent Person attribute |
| Partnership Episode -> Person | M:N if later introduced | Optional historical/derived grouping, not identity |

## Required behavior examples

### Debater -> transfer -> judge

One Person:
- debater role observation at Institution A;
- entry memberships for Institution A;
- later affiliation and entry memberships at Institution B;
- later tournament judge records linked to the same Person.

### Partner changes

One Person may appear:
- with Person B in Entry E1;
- with Person C in Entry E2;
- again with Person B in Entry E3.

No Person or permanent team record is rewritten.

### Simultaneous roles

A graduate student could have a debater role in one event context and a judge role in another overlapping time period. Both observations coexist.

### Unresolved student identity

A tournament student reference may remain unlinked to a durable Person. DebateOS must preserve the roster membership without guessing a cross-tournament identity.

## Physical implementation recommendation

This ADR does **not** authorize schema changes.

A follow-on physical-schema work order should evaluate tables or equivalent typed structures for:

1. `person_role_observations`
2. `person_institution_affiliations`
3. `student_person_evidence`
4. `entry_person_memberships`
5. supporting evidence/link tables and temporal precision fields

The implementation must preserve the existing `students`, `judges`, `persons`, `entries`, `schools`, `chapters`, and evidence/provenance structures unless an approved migration explicitly changes them.

Public evidence should be implemented first. Protected identity facts inherit their source access restrictions.

## Consequences

### Benefits

- A former debater and later judge can be analyzed as one human.
- Transfers do not fragment identity.
- Partner changes are natural rather than exceptional.
- Coach/judge/debater career histories become possible.
- Longitudinal matchup and institutional analysis becomes feasible.
- The model avoids slowly corrupting Person with mutable "current" attributes.

### Costs

- More relationship tables and evidence resolution are required.
- Some people will remain unresolved across tournaments until stronger identity evidence exists.
- "Current school," "current role," and "current team" become derived views rather than simple columns.
- Temporal inference must be explicitly versioned and explained.

These costs are intentional. DebateOS favors traceable historical truth over convenient but unstable identity shortcuts.
