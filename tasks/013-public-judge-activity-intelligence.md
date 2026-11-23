# 013 · Public Judge Activity Intelligence Prototype

**Status** Approved / In Progress  
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis approved execution in Explore DebateOS APIs. Jared reviews the UI-facing contract. Leadership approves any merge separately.  
**Dependencies** [TASK-011 Phase A](011-college-judge-paradigm-corpus.md), [TASK-012](012-public-canonical-physical-schema.md), and [ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md)

## Scope

Derive a versioned public-evidence activity report for the 401 explicitly linked Tabroom people in the pinned 2025–26 college policy cohort. Include evidenced assignments, tournaments, divisions, dates, roster context, coverage and school exposure. Use the existing public replay and leave the canonical schema intact. Protected paradigms, authenticated ingestion, scraping, inferred results and sides, and subjective experience labels are outside scope.

## Acceptance

Verify scoped identity and assignment deduplication, roster-only and unlinked exclusions, assigned IDs absent from observed rosters, evidence-backed school exposure, caveat propagation, and byte-for-byte replay of the pinned archive. Publish the TypeScript/JSON contract, representative samples and [Jared handoff](../docs/handoffs/2026-11-23-public-judge-activity.md) in a draft PR.
