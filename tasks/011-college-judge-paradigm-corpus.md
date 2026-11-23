# 011 · Validate coverage and pilot the college judge paradigm corpus

**Status** Phase A Completed · Phase B Draft / Gated  
**Owner** Dennis Commander  
**Review** Dennis leads Phase A backend review. Consult Jared on UI-facing contracts.  
**Dependencies** [TASK-010](010-canonical-warehouse-model.md) design review and [TASK-003](003-tabroom-authentication.md) vendor confirmation for protected work

## Objective

Measure coverage for a leadership-approved season and collegiate event manifest. Validate a small, authorized person-keyed paradigm acquisition and servicing workflow before proposing broader implementation.

## Approved Phase A · Public coverage

Dennis approved Phase A on November 23, 2026. Scope is the closed 2025–26 collegiate policy season, all verified divisions, using anonymous structured Tabroom data. Keep roster and panel-assignment denominators separate. Resolve only explicit judge-to-person links. Report missing, conflicting and unavailable coverage against a pinned manifest. Dennis approved the archive and roster-gap follow-up and merge. [PR #10](https://github.com/dsavill-png/DebateOS/pull/10) merged at [`47c4c89ee03933299010be35f1c575509b4cde9e`](https://github.com/dsavill-png/DebateOS/commit/47c4c89ee03933299010be35f1c575509b4cde9e). See the [public coverage handoff](../docs/handoffs/2026-11-23-college-policy-public-coverage.md) for coverage, verification and replay.

## Phase A and gated Phase B scope

1. Propose one closed college policy season, using the ADR-002 season manifest. Record exact dates, formats, circuits, divisions, membership decisions and evidence, coverage gaps and treatment of roster-only candidates. Pin the approved manifest revision in coverage reports.
2. Measure public coverage from approved structured exports. Report rostered and assigned judge IDs and person linkage coverage, including missing mappings and conflicts. Preserve separate denominators and distinguish unknown coverage from zero participation.
3. After Tabroom authorization, perform bounded authenticated production pagination checks and a capped person-keyed pilot. Confirm allowable roles, unattended credentials and session renewal, aggregate and per-route request limits, retry policy, retention, audience and derived use before enabling any protected processing. Require explicit limits and stop on access denial, unexpected identity or response shape, or rate limiting under the approved pilot policy.
4. Demonstrate immutable revisions, capture lineage and both retained representations using permitted data or synthetic replay. Verify hashes and transformation versions for each representation and enforce the authorization partition for text, indexing and derived output. Report coverage and cost, including distinct eligible people, available and unavailable paradigms, requests, freshness and change history. Demonstrate entitlement-aware dossier output and a separately labeled derived feature using permitted inputs or synthetic examples.

## Acceptance and release

Phase B stays Draft / Gated pending TASK-003, Tabroom authorization and separate leadership approval of the scope, sample cap, schedule and serving rules. Deliver a manifest, counts and denominators, a production behavior record, versioning replay, and a written go/no-go recommendation for broader acquisition. Keep protected bodies out of GitHub. No scraping, broad harvest, deployment or public republication in this draft scope. Any implementation that requires schema changes needs an approved work order.
