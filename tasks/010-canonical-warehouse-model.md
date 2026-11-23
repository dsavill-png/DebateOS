# 010 · Design the canonical warehouse model

**Status** Draft  
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis and Jared

## Objective

Define the logical grain, keys, relationships, provenance and authorization boundaries for the first normalized DebateOS warehouse. Use the [public Tabroom inventory](../docs/research/tabroom-public-data-inventory.md), [authenticated-access addendum](../docs/research/tabroom-authenticated-access.md), and [ADR-001](../docs/architecture/ADR-001-initial-stack.md) as inputs.

## Required scope

| Area | Design requirements |
| --- | --- |
| Tournament and competition | Define tournament, event/division, round, tournament timeslot and panel/section grain, keys and cardinality. Keep timeslots independent and require explicit source evidence for a round-to-timeslot link. |
| Schools and participation | Distinguish tournament school from chapter and entry from any durable team identity. Define evidence and scope for student references, roster membership, and any debater identity crosswalk. Resolve a public roster reference only against a unique match in the verified containing school. |
| Judges and assignments | Distinguish tournament judge from person. Define panel judge assignment grain, deduplication and supporting observations. Require explicit source evidence for judge-to-person links and preserve conflicts. |
| Ballots and standings | Define ballot observation, score observation, result set and standings observation grain. Preserve raw score arrays and standing values when semantics are uncertain. Keep event placement distinct from panel outcomes and require an explicit crosswalk between result-set identifiers from different sources. |
| Publication and lineage | Model publication state and immutable provenance snapshots. Each observation must trace to source method, source ID when supplied, JSON pointer, UTC capture timestamp, snapshot ID and digest, parser version, authorization class (public or authenticated), and uncertainty state. Define replay, conflicting observations and the distinction between missing, empty, unpublished, forbidden and invalid responses. |
| Authenticated enrichment | Define separately authorized coach and account-linked resources, scope-aware crosswalks, and access controls for capture, storage and serving. Use the observed authenticated round-to-timeslot and event-to-result-set links as examples. Keep protected evidence out of public outputs and keep backend ingestion gated on TASK-003 confirmation. |

Reserve verified debate decisions and winners until side, decision, vote aggregation, bye and forfeit semantics are established. Harvard panel 9200905 remains unresolved.

## College judge paradigm corpus

Define auditable event and season coverage, supported structured discovery, production search versus global enumeration evidence, explicit judge-person resolution, versioning, restricted serving and a method for measuring reach. Separate raw paradigms from derived tendencies. Bulk collection requires a separate approved work order.

## Deliverable and acceptance

Produce an ADR-style logical model and a staged implementation plan for Dennis and Jared to review. Include an entity and relationship catalog with grain, keys, cardinality, optionality, source mappings and evidence requirements. Walk through Harvard examples covering roster resolution, judge-to-person linkage, an explicit authenticated timeslot link, and an unresolved outcome. Document open identity, publication and authorization decisions and record the review outcome before marking the design approved.

PostgreSQL tables, migrations, and ingestion changes require a separate approved implementation work order. Dennis and Jared review the logical model and implementation plan before schema work is released.

## Design submitted for review

[ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md) records the proposed logical warehouse and staged plan. [TASK-011](011-college-judge-paradigm-corpus.md) is a separate Draft for coverage measurement and an authorized pilot. Review and approval are pending.
