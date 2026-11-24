# 017 · Implement durable person relationship schema

**Status** Completed  
**Owner** Dennis Commander  
**Worker** Codex  
**Dispatch** Released  
**Review** Chat with Dennis. Consult Jared on downstream profile/UI implications.  
**Priority** High

## Objective

Implement the first physical PostgreSQL/Drizzle structures required by [ADR-003](../docs/architecture/ADR-003-person-role-affiliation-history.md) so DebateOS can represent one durable human across changing debate roles, institutions, tournament entries, partners, and later judging activity without duplicating people or overwriting history.

This task implements schema and tests only. It does not authorize broad data backfill, authenticated Tabroom ingestion, or public identity guessing.

## Required physical structures

Implement typed PostgreSQL/Drizzle tables, constraints, migrations, and evidence links for the following logical relationships.

### 1. Person role observations

Represent evidence that a durable Person acted in a role within a context/time.

Required capabilities:
- many role observations per Person;
- overlapping roles allowed;
- role values at minimum: debater, judge, coach, with extensibility for future reviewed roles;
- exact or partial temporal information without invented dates;
- source/context reference;
- verification state and evidence lineage;
- as-of/history-safe semantics.

Do not add a single mutable role column to `persons`.

### 2. Person institution affiliations

Represent evidence-backed Person affiliation to a durable chapter/institution over time.

Required capabilities:
- many affiliations per Person;
- transfers and overlapping affiliations;
- optional role context;
- exact/partial/open temporal information;
- explicit distinction between durable chapter/institution and tournament-scoped school;
- evidence lineage and verification state.

Do not add a permanent school/chapter column to `persons`.

### 3. Student-person identity evidence

Add a relationship analogous to the existing judge-person evidence concept.

Required capabilities:
- one tournament-scoped student reference may have zero or one resolved Person in an as-of view;
- one Person may be supported by many student references across tournaments/schools;
- preserve unresolved/conflicting evidence;
- require explicit source evidence;
- names, initials, entry codes, or numeric coincidence cannot establish identity by themselves.

Do not remove or collapse the existing `students` table.

### 4. Entry-person memberships

Represent the durable-person projection of an evidenced entry roster.

Required capabilities:
- many Persons per Entry;
- one Person across many Entries;
- same two Persons may appear together repeatedly;
- same Person may compete with different partners across entries;
- membership must trace back to evidence and, where applicable, the student-person identity link that supports it.

Do not create a permanent team or partner foreign key on `persons`.

### 5. Temporal precision

Implement a reusable, explicit representation for temporal precision sufficient to distinguish at least:
- exact interval;
- start known/end unknown;
- end known/start unknown;
- event/date observation only;
- unknown;
- derived/inferred interval, if supported.

Do not fabricate placeholder start/end dates.

### 6. Evidence and access control

All new relationships must integrate with existing warehouse provenance and authorization principles.

- public-derived records must be reconstructable from public-eligible evidence;
- protected evidence must never leak into public views;
- derived records inherit the most restrictive applicable authorization;
- keep source evidence IDs and verification states;
- no secret/session/contact data.

## Existing schema compatibility

Preserve and integrate with:

- `persons`
- `judges`
- `students`
- `entries`
- `schools`
- `chapters`
- `evidence`
- `evidenceRelationships`
- `panelJudges`
- existing migrations and public evidence view

Existing judge-person behavior and TASK-013 public judge activity must continue to pass unchanged.

## Required tests

Add automated tests covering at minimum:

1. **Debater -> transfer -> judge**
   - one Person;
   - debater role at Institution A;
   - later debater role/affiliation at Institution B;
   - later Judge relationship to same Person;
   - no duplicate Person.

2. **Partner changes**
   - Person A + Person B in Entry 1;
   - Person A + Person C in Entry 2;
   - Person A + Person B again in Entry 3;
   - no permanent team mutation.

3. **Simultaneous roles**
   - one Person with overlapping debater and judge observations.

4. **Unknown/partial dates**
   - relationships remain valid without invented boundary dates.

5. **Unresolved student identity**
   - student reference survives with no Person match.

6. **Conflicting student-person candidates**
   - conflict is represented rather than silently resolved.

7. **Transfer semantics**
   - multiple institution affiliations attach to same Person.

8. **Authorization**
   - public output cannot be derived from protected-only relationship evidence.

9. **Replay/idempotency**
   - repeated approved fixture replay does not duplicate relationship rows.

10. Existing warehouse, TASK-013, TypeScript, and Next.js production-build tests remain green.

Use synthetic or sanitized fixtures only. Do not add private student details or protected Tabroom data.

## Migration requirements

- Add a new numbered Drizzle/PostgreSQL migration.
- Existing databases must upgrade cleanly.
- Fresh database creation must succeed.
- Backup/restore behavior must remain valid.
- Do not drop existing tables or reinterpret existing natural keys without a separate architecture decision.

## Deliverables

- Drizzle schema changes;
- SQL migration;
- tests and synthetic fixtures;
- concise implementation handoff under `docs/handoffs/`;
- update `PROJECT_STATE.md` against latest trusted `main`.

## Non-goals

- No production data backfill.
- No durable team/partnership entity yet.
- No school-transfer inference from names.
- No cross-provider person merge.
- No authenticated Tabroom collection.
- No browser-session bridge.
- No UI/dashboard work.
- No Neon deployment.
- No changes to PR #12 / SNU Context Refresh.
- No Tabroom/NSDA outreach.

## Completion handoff

Report:

- STATUS
- WHAT I DID
- WHAT CHANGED
- TEST RESULTS
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP

If an existing schema constraint makes ADR-003 impossible without a breaking change not authorized here, stop and report the conflict instead of improvising.


## Completion decision

Dennis approved the verified implementation on 2026-11-24. PR #14 merged at `a706e779101a3b5ae3eee73d4d505558bff62d27`.

GitHub-hosted verification against immutable PR head `47d51f09dbc624b0e9da5381741421f17d9df5f2` passed the full Node test suite, TypeScript check, Next.js production build, fresh migration, base-to-head upgrade preserving a preexisting Person, and PostgreSQL dump/restore. The workflow's final reporting step failed with HTTP 403 after the substantive verification had already passed; TASK-018 tracks that reporting-permission fix.
