# TASK-010 · Warehouse design handoff

November 23, 2026. The [proposed ADR](../architecture/ADR-002-canonical-warehouse-model.md) is ready for Dennis and Jared to review. It uses the TASK-009 public adapter contract and TASK-003 authenticated evidence. The design leaves panel winner semantics unresolved and defers PostgreSQL changes to a separate work order.

A fresh production spec check and three anonymous one-row probes established documented search pagination and an authenticated access boundary. Authenticated global listing remains unverified. A one-event Harvard public export count provides a coverage example. The [corpus section](../architecture/ADR-002-canonical-warehouse-model.md#college-judge-paradigm-corpus) records methods, provenance and remaining tests. No paradigm content was fetched in TASK-010.

[TASK-011](../../tasks/011-college-judge-paradigm-corpus.md) proposes structured season coverage and a separately authorized pilot. Dennis and Jared should resolve the ADR's implementation sequence and review decisions before releasing schema work. Protected processing remains gated on TASK-003 and Tabroom guidance.
