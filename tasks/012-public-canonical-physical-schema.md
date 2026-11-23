# 012 · Implement the canonical physical schema — Phase 1 public evidence

**Status** Blocked  
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis approved execution and the refinements below on 2026-11-23. Consult Jared on downstream UI-facing contracts.  
**Dependencies** [TASK-010](010-canonical-warehouse-model.md), [ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md), and the [TASK-009 public adapter contract](009-tabroom-public-data-inventory.md).

## Objective

Implement the first PostgreSQL/ORM slice of the approved canonical evidence warehouse using public Tabroom fixtures and existing structured adapter outputs. Use a single set of typed, scoped identities and canonical observation structures. Public evidence is the first implementation slice of the one canonical warehouse.

## Approved refinements

- Use Drizzle ORM because DebateOS is PostgreSQL-first, has extensive relationships and provenance, and needs SQL-transparent analytical queries. Surface any concrete tooling conflict for review.
- Reproduce migrations from an empty disposable PostgreSQL database and test recovery. For production, prefer forward migrations, backup and restore, and controlled remediation. Document which changes are reversible.

## Blocking identity decision

The [adapter normalizer](../src/tabroom/normalize.ts) emits round IDs scoped to the tournament and builds panel IDs from those round IDs. It also emits tournament-scoped student IDs. [ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md) requires event-scoped round IDs, round-scoped panel IDs and school-scoped student references. Equal source IDs in different valid parent scopes can therefore yield equal adapter IDs. The normalizer retains event and school context on parent rows and source pointers on panels, so the evidence can still distinguish these cases.

Recommend keeping existing adapter identifiers stable and adding explicit scoped identity components for persistence. Verify repeated source IDs across events and schools in a synthetic replay before wiring foreign keys. Dennis should confirm the adapter contract choice, with Jared consulted if it affects downstream UI contracts. Schema and validation work are pending this decision.

## Approved scope

- Define PostgreSQL tables, ORM mappings, constraints and migrations for tournament, category/event, school/chapter, entry/student roster, round/timeslot, panel, judge/person and assignments, ballot/score and result set/standing observations, publication and capture lineage. Include versioned season scopes and evidence-linked event membership.
- Encode scoped uniqueness, evidence-backed optional relationships and crosswalks, unresolved references, conflict retention, and immutable snapshot and parser replay semantics. Preserve raw score and standing values and distinguish missing, empty, unpublished, forbidden and invalid states.
- Carry observation-level authorization class, purpose, grant scope, audience and retention metadata in the shared model. Public projections require public-eligible lineage throughout. Use synthetic policy cases to test protected input exclusion.
- Keep live ingestion changes, production authenticated processing, paradigm harvesting, and derived judge tendencies out of the implementation scope. TASK-003 gates production authentication. [TASK-011](011-college-judge-paradigm-corpus.md) is a separately reviewed Draft. Defer durable identity crosswalks and winner inference until verified.

## Acceptance and release

Prove migration and rollback in a disposable PostgreSQL database and replay the pinned Harvard fixtures. Verify same-school roster resolution and rejection of ambiguous or cross-school matches, explicit judge/person links, deduplicated panel assignments, independently scoped timeslots, unresolved panel 9200905, raw scores and standings, missing versus empty observations, replay idempotency and protected-evidence exclusion. Validate TypeScript and the existing test suite. Record limitations and fixture lineage in the implementation PR. The implementation PR remains subject to separate Dennis merge approval.
