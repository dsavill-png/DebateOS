# 011 · Validate coverage and pilot the college judge paradigm corpus

**Status** Draft  
**Owner** Dennis Commander  
**Review** Dennis and Jared  
**Dependencies** [TASK-010](010-canonical-warehouse-model.md) design review and [TASK-003](003-tabroom-authentication.md) vendor confirmation for protected work

## Objective

Measure coverage for a leadership-approved season and collegiate event manifest. Validate a small, authorized person-keyed paradigm acquisition and servicing workflow before proposing broader implementation.

## Proposed scope

1. Propose one closed college policy season, using the ADR-002 season manifest. Record exact dates, formats, circuits, divisions, membership decisions and evidence, coverage gaps and treatment of roster-only candidates. Pin the approved manifest revision in coverage reports.
2. Measure public coverage from approved structured exports. Report rostered and assigned judge IDs and person linkage coverage, including missing mappings and conflicts. Preserve separate denominators and distinguish unknown coverage from zero participation.
3. After Tabroom authorization, perform bounded authenticated production pagination checks and a capped person-keyed pilot. Confirm allowable roles, unattended credentials and session renewal, aggregate and per-route request limits, retry policy, retention, audience and derived use before enabling any protected processing. Require explicit limits and stop on access denial, unexpected identity or response shape, or rate limiting under the approved pilot policy.
4. Demonstrate immutable revisions, capture lineage and both retained representations using permitted data or synthetic replay. Verify hashes and transformation versions for each representation and enforce the authorization partition for text, indexing and derived output. Report coverage and cost, including distinct eligible people, available and unavailable paradigms, requests, freshness and change history. Demonstrate entitlement-aware dossier output and a separately labeled derived feature using permitted inputs or synthetic examples.

## Acceptance and release

Dennis and Jared approve the scope, sample cap, schedule, authorization and serving rules before pilot execution. Deliver a manifest, counts and denominators, a production behavior record, versioning replay, and a written go/no-go recommendation for broader acquisition. Keep protected bodies out of GitHub. No scraping, broad harvest, deployment or public republication in this draft scope. Any implementation that requires schema changes needs an approved work order.
