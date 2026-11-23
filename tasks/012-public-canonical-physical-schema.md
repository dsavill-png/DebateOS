# 012 · Implement the public canonical physical schema

**Status** Draft  
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Leadership approval required before execution. Consult Jared on downstream UI-facing contracts.  
**Dependencies** [TASK-010](010-canonical-warehouse-model.md), [ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md), and the [TASK-009 public adapter contract](009-tabroom-public-data-inventory.md).

## Objective

Implement the first PostgreSQL/ORM slice of the approved canonical evidence warehouse using public Tabroom fixtures and existing structured adapter outputs. Use a single set of typed, scoped identities and canonical observation structures. Review the ORM choice, migration and rollback plan, and exact release scope before implementation.

## Proposed scope

- Define PostgreSQL tables, ORM mappings, constraints and migrations for tournament, category/event, school/chapter, entry/student roster, round/timeslot, panel, judge/person and assignments, ballot/score and result set/standing observations, publication and capture lineage. Include versioned season scopes and evidence-linked event membership.
- Encode scoped uniqueness, evidence-backed optional relationships and crosswalks, unresolved references, conflict retention, and immutable snapshot and parser replay semantics. Preserve raw score and standing values and distinguish missing, empty, unpublished, forbidden and invalid states.
- Carry observation-level authorization class, purpose, grant scope, audience and retention metadata in the shared model. Public projections require public-eligible lineage throughout. Use synthetic policy cases to test protected input exclusion.
- Keep live ingestion changes, production authenticated processing, paradigm harvesting, and derived judge tendencies out of the implementation scope. TASK-003 gates production authentication. [TASK-011](011-college-judge-paradigm-corpus.md) is a separately reviewed Draft. Defer durable identity crosswalks and winner inference until verified.

## Acceptance and release

Prove migration and rollback in a disposable PostgreSQL database and replay the pinned Harvard fixtures. Verify same-school roster resolution and rejection of ambiguous or cross-school matches, explicit judge/person links, deduplicated panel assignments, independently scoped timeslots, unresolved panel 9200905, raw scores and standings, missing versus empty observations, replay idempotency and protected-evidence exclusion. Validate TypeScript and the existing test suite. Record limitations and fixture lineage in the implementation PR. Leadership must approve this work order before schema changes begin.
