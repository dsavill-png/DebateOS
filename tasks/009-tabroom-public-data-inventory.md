# 009 · Verify public Tabroom data for warehouse planning

**Status** Completed    
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis and Jared

Dennis approved resuming public Tabroom product work on November 23, 2026. TASK-008 remains Partial and the GitHub handoff stays in service.

Recheck the live specification and documented anonymous JSON interfaces against TASK-001 and TASK-002. Record resource and field coverage, source keys and joins, provenance, and unresolved semantics in an executive-first public data inventory. Extend the public adapter only for verified data needed by the inventory and test any extension against pinned replay fixtures, including the Harvard judge/person link and unresolved winner. Publish implementation changes as a draft PR for leadership review.

Public REST and the approved structured bulk export are in scope. Authentication, HTML scraping, unsupported routes, winner inference, dispatcher changes and warehouse implementation are outside scope. Refresh shared project state at close.

## Phase 2 delivery

The [public data inventory](../docs/research/tabroom-public-data-inventory.md) is complete for the verified Harvard sample. Live OpenAPI v1.2.0 matched the TASK-001 pin. The three existing importer endpoints and the event-field and discovery routes were checked anonymously. Refer to the matrix for access and publication limits.

[PR #7](https://github.com/dsavill-png/DebateOS/pull/7) was squash-merged to `main` in [`b6cf6ff271b373f58c613053869e2b32c8d1c579`](https://github.com/dsavill-png/DebateOS/commit/b6cf6ff271b373f58c613053869e2b32c8d1c579) after leadership approval and verification of refreshed head `026a7655a6f4eef91fd921588c1992b02e75626a`. The diff against trusted `main` contained only the adapter, normalizer and replay test.

Node 24.22.3 passed all 8 tests. The locked Next.js 16.4.6 production build passed TypeScript checking and generated all 3 static pages. Replay and code review confirmed the three anonymous JSON GETs, HTML rejection without scraping, snapshot and pointer lineage, distinct student/chapter/judge/person IDs, roster resolution within a unique matching school record, standalone timeslots, and preservation of raw score arrays. Harvard judge `2912715` links to person `366665`. The winner for panel `9200905` remains unresolved.
