# 009 · Verify public Tabroom data for warehouse planning

**Status** Partial    
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis and Jared

Dennis approved resuming public Tabroom product work on November 23, 2026. TASK-008 remains Partial and the GitHub handoff stays in service.

Recheck the live specification and documented anonymous JSON interfaces against TASK-001 and TASK-002. Record resource and field coverage, source keys and joins, provenance, and unresolved semantics in an executive-first public data inventory. Extend the public adapter only for verified data needed by the inventory and test any extension against pinned replay fixtures, including the Harvard judge/person link and unresolved winner. Publish implementation changes as a draft PR for leadership review.

Public REST and the approved structured bulk export are in scope. Authentication, HTML scraping, unsupported routes, winner inference, dispatcher changes and warehouse implementation are outside scope. Refresh shared project state at close.

## Phase 2 delivery

The [public data inventory](../docs/research/tabroom-public-data-inventory.md) is complete for the verified Harvard sample. Live OpenAPI v1.2.0 matched the TASK-001 pin. The three existing importer endpoints and the event-field and discovery routes were checked anonymously. Refer to the matrix for access and publication limits.

[Draft PR #7](https://github.com/dsavill-png/DebateOS/pull/7) contains the adapter extension and is pending leadership review. Node 24 offline replay passed 8/8 tests, including judge 2912715 → person 366665 and unresolved winner.
