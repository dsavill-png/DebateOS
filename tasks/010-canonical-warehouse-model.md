# 010 · Design the canonical warehouse model

**Status** Completed  
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis approved the backend design on 2026-11-23. Jared is a downstream UI contract consultee.

## Objective

Define the logical grain, keys, relationships, provenance and authorization boundaries for the first normalized DebateOS warehouse. Use the [public Tabroom inventory](../docs/research/tabroom-public-data-inventory.md), [authenticated-access addendum](../docs/research/tabroom-authenticated-access.md), and [ADR-001](../docs/architecture/ADR-001-initial-stack.md) as inputs.

## Required scope

| Area | Design requirements |
| --- | --- |
| Tournament and competition | Define tournament, event/division, round, tournament timeslot and panel/section grain, keys and cardinality. Keep timeslots independent and require explicit source evidence for a round-to-timeslot link. |
| Schools and participation | Distinguish tournament school from chapter and entry from any durable team identity. Define evidence and scope for student references, roster membership, and any debater identity crosswalk. Resolve a public roster reference only against a unique match in the verified containing school. |
| Season and event scope | Define reusable season scopes with immutable manifest revisions, dates, format, division, circuit and evidence-backed event membership. Pin revisions for judge eligibility and season analytics. |
| Judges and assignments | Distinguish tournament judge from person. Define panel judge assignment grain, deduplication and supporting observations. Require explicit source evidence for judge-to-person links and preserve conflicts. |
| Ballots and standings | Define ballot observation, score observation, result set and standings observation grain. Preserve raw score arrays and standing values when semantics are uncertain. Keep event placement distinct from panel outcomes and require an explicit crosswalk between result-set identifiers from different sources. |
| Publication and lineage | Model publication state and immutable provenance snapshots. Each observation must trace to source method, source ID when supplied, JSON pointer, UTC capture timestamp, snapshot ID and digest, parser version, authorization class (public or authenticated), and uncertainty state. Define replay, conflicting observations and the distinction between missing, empty, unpublished, forbidden and invalid responses. |
| Authorization-aware observations | Use common canonical keys and observation structures for public and authenticated evidence. Define authorization for coach and account-linked resources, scope-aware crosswalks, and access controls for capture, storage and serving. Use the observed authenticated round-to-timeslot and event-to-result-set links as examples. Keep protected evidence out of public outputs and keep backend ingestion gated on TASK-003 confirmation. |

Reserve verified debate decisions and winners until side, decision, vote aggregation, bye and forfeit semantics are established. Harvard panel 9200905 remains unresolved.

## College judge paradigm corpus

Define auditable event and season coverage, supported structured discovery, production search versus global enumeration evidence, explicit judge-person resolution, versioning, restricted serving and a method for measuring reach. Where retention permits, preserve sanitized source-faithful content and normalized text with hashes, transformation versions, capture provenance and immutable revisions within the authorization partition. Label derived tendencies separately and enforce serving entitlements. Bulk collection requires a separate approved work order.

## Deliverable and acceptance

Produce an ADR-style logical model and a staged implementation plan for Dennis's backend review. Include an entity and relationship catalog with grain, keys, cardinality, optionality, source mappings and evidence requirements. Walk through Harvard examples covering roster resolution, judge-to-person linkage, an explicit authenticated timeslot link, and an unresolved outcome. Document open identity, publication and authorization decisions and record the review outcome before marking the design approved.

PostgreSQL tables, migrations, and ingestion changes require a separate approved implementation work order. Leadership approval of a separate implementation work order is required before schema work starts.

## Approved design

Dennis completed substantive backend review on November 23, 2026 and approved [ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md). The decision covers evidence-first, judge-centric analysis, conservative identity resolution, exact source provenance, one authorization-aware warehouse, immutable paradigm revisions and a separate judging-history observation stream. It retains approved season manifests and paradigm corpus design and preserves deferred semantics. Consult Jared on downstream UI-facing contracts. [TASK-011](011-college-judge-paradigm-corpus.md) remains Draft and unexecuted.
