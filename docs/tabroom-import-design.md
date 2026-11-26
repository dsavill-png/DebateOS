# DebateOS Tabroom collection design

## Credential isolation

Run an approved provider service identity in a separate cloud account or equivalent security boundary. The collector workload role alone reads the vault secret. Separate deployment from development IAM, require approval for release and role changes, restrict egress to the approved API, and keep short-lived sessions in memory. Redact responses, credentials and session identifiers from operational logs. Security operators own rotation and revocation. Codex development and CI use fixtures and have no access to collector roles, secrets or protected storage.

## Incremental collection

Pin the verified TASK-011 cohort and join its explicit provider Person links to canonical Person IDs. Queue history and paradigm independently per Person. Advance durable page cursors in the same transaction as idempotent writes. Key revisions by source identity and observation, retain provenance, and leave ambiguous keys unresolved. Use a provider-supported change cursor or conditional request when verified. Otherwise use a scheduled rescan and suppress unchanged content. Resume with a durable lease, honor Retry-After, enforce a shared rate limit and a request budget, and pause on authorization failures. Record completed, remaining, retried and failed work by stream without logging payloads. Keep protected records behind grant-aware policy and validated field mappings.

The accompanying fixture runner accepts a JSON object with kind `synthetic-judge-snapshot`, a stable `snapshotId`, and `pages`. Each page has an ISO `observedAt` and `records` with `personId`, `stream` (history or paradigm), `sourceId` and string `content`. Run it using Node with the fixture path and a checkpoint path. It processes committed pages once per snapshot and records changed content across successive snapshots. Use a single runner per checkpoint. The fixture pace is local and there is no external transport.

Before reusing a checkpoint after a crash, verify that its writer has exited and no replacement is running, then remove the adjacent `.lock` file. The next writer discards any uncommitted `.pending` page and resumes at the last committed cursor. Use a local filesystem and a single canonical checkpoint name. Files are synced before replacement. POSIX also syncs the containing directory. Windows directory-entry durability after power loss is unverified. The cloud implementation requires transactional PostgreSQL checkpoints and a worker lease.

## Planning estimate

The pinned 2025–26 college policy cohort contains **401 distinct linked people**. At one response per Person per stream, budget **802 requests** for the baseline and **802 per full refresh**, or **3,208 per four weekly refreshes**. Pagination, retries, session renewal and changed-record discovery can add requests. At one request per second, the baseline takes at least 13 minutes 22 seconds before extra requests. This pace is for modeling only.

Illustrative AWS US East serverless scenario with one secret, at most 4,010 requests in the baseline month, one 512 MiB-second of Lambda per request, 10,000 or fewer secret reads, and 1 GB or less of standard object storage comes to about **$0.51 before logs, checkpoint storage, network and existing PostgreSQL costs**, using published rates before free tiers. Even modest fixed networking or database minimums could dominate. Confirm region, worker runtime, storage volume, retention and network design before approving spend.

Rates: [Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/), [Lambda](https://aws.amazon.com/lambda/pricing/), [AWS storage example](https://docs.aws.amazon.com/solutions/latest/automated-security-response-on-aws/cost.html).

## Release gates

Complete TASK-003 and obtain Tabroom approval for unattended use, credential renewal, endpoint and record scope, rate and request caps, and storage and retention terms. Release bounded TASK-014 validation and verify pagination, identity joins and field mappings before enabling bulk collection. Obtain separate approval for credential provisioning, bulk collection, protected persistence and spending. Before deployment, approve workload isolation, audit and revocation, storage access and retention, monitoring, and a stop mechanism.

## Deployment and pilot

1. Run the repository's Node test suite in CI. The synthetic five-judge rehearsal checkpoints staged revisions, quarantine pointers, and cursor together. The runner has no provider transport.
2. After deployment approval, use an isolated, manually invoked worker and a deployed workload identity scoped to one secret. Separate deployment permissions, audit vault access, use an approved egress boundary, and test rotation, revocation and the kill switch. Keep live transport and scheduling disabled until authorized.
3. Reproduce the pinned cohort from the verified capture archive. Build a worklist from explicit provider-to-canonical Person links. Require 401 unique canonical IDs and one unambiguous provider ID per person. Record the manifest and worklist digests. Yield two independent streams per person and leave unresolved and roster-only links outside the run.
4. Select five authorized judges across activity levels and divisions. Cap the initial history and paradigm pass at ten requests plus an agreed pagination allowance. Compare identity, level, dates and time zones, sides, ballot and panel results, and paradigm lineage. Pause on scope drift, ambiguous identity, or unknown mapping. Require clean resume and repeat-run reconciliation and separate full-load approval.
5. In production, commit pages and cursors together in PostgreSQL under a lease, retaining immutable evidence under approved retention. Separate quarantine from promotion and record reconciled counts by stream. Promote only fields with an approved versioned mapping and policy evidence. Keep serving disabled through full-load reconciliation.

## Operating budget worksheet

For the five-judge pilot, first inventory approved worker capacity, outbound access, a secret store and PostgreSQL. Prefer an isolated workload role, an explicitly scoped database role and protected storage on that existing stack, with manual invocation and serving disabled. If only PostgreSQL is missing, price a temporary private single-AZ instance on the existing approved network, including storage and backups through teardown.

Before authentication setup, the owner must obtain Tabroom's written authorization for a permanent service identity, approved endpoints and renewal, rate and scope limits, and collection and retention terms. The owner must name the security operator for secret provisioning, rotation and revocation, and approve infrastructure, access, storage, retention and any spend. After credential-free verification and archive replay, approve the specific five judges, ten initial requests and any pagination allowance. Require repeat-run reconciliation before approving any broader run.

Request the authorized TASK-011 capture manifest and archive from its custodian for offline replay. Verify the published pin and reconstruct explicit links before comparing the 401-person count and recording the worklist digest. Where accessible and authorized, independently reconcile paradigm text against Tabroom's event-level bulk paradigm PDF and round counts against seasonal totals or the associated judge record. Record capture dates, academic year, judge identity and category. Filter to comparable scope and record missing or incomparable evidence explicitly.

Use 4,010 baseline-month requests and 3,208 subsequent monthly requests, before pagination, retries and auth renewals. Price the selected US East deployment before free tiers.

| Cost center | Sizing basis |
| --- | --- |
| Worker and schedule | 512 MiB-second per execution, plus retries and auth |
| Vault and encryption | One secret, up to 10,000 reads, plus KMS key and operations if applicable |
| Captures, quarantine and backups | GB-months retained, reads, writes, and restores |
| PostgreSQL and checkpoints | Compute, storage, transaction I/O, backup and PITR at expected volume |
| Networking | Approved egress, public IPv4 or NAT, and outbound bytes |
| Monitoring | Log ingestion and retention, metrics, alarms, and audit events |
| Operations | Rotation, incident response, reconciliation and recovery tests |

The $0.51 example is a partial estimate. Complete the budget with the selected warehouse, egress topology, retention, and pilot-measured bytes and runtime before spend approval. Set budget alerts and independent request caps. See [AWS Pricing Calculator](https://calculator.aws/).

### Single-AZ planning scenario

Use a 730-hour month, one private PostgreSQL instance, a private Lambda worker with one NAT gateway and public IPv4 address, one secret and customer-managed key, 5 GB of object storage, and 1 GB each of NAT traffic and log ingestion. These rounded allowances are for comparing deployment options and require an AWS Calculator quote before approval.

| Monthly AWS cost | Baseline | Steady state |
| --- | ---: | ---: |
| Worker and schedule, including retry and session allowance | $0.10 | $0.10 |
| Secret and key, including reads and usage | $1.50 | $1.50 |
| Capture, quarantine and restore allowance | $0.25 | $0.25 |
| PostgreSQL, 20 GB storage and backup allowance | $15.00 | $15.00 |
| NAT, public IPv4 and network transfer | $37.00 | $37.00 |
| Logs, monitoring, audit and alerts | $2.00 | $2.00 |
| AWS subtotal | $55.85 | $55.85 |
| 25% usage/design contingency | $13.96 | $13.96 |
| AWS planning total, before tax | $69.81 | $69.81 |

The fixed warehouse and network costs dominate in this scenario. Track operator time separately at an initial allowance of two hours per month multiplied by the team's loaded hourly rate. Reprice if the approved deployment needs multi-AZ failover, additional private endpoints, more retention, or different egress controls. An existing approved warehouse and egress path could reduce incremental cost. Price protection and retention settings after the bounded pilot and before deploying a schedule.

Rate references: [RDS](https://aws.amazon.com/rds/postgresql/pricing/), [VPC](https://aws.amazon.com/vpc/pricing/), [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [S3](https://aws.amazon.com/s3/pricing/), [KMS](https://aws.amazon.com/kms/pricing/).
