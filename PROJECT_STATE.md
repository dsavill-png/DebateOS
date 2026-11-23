# DebateOS project state

## Executive Snapshot

As of 2026-11-23. Shared state for Dennis Commander and Jared Commander, maintained on trusted `main`.

- Dennis approved resuming public Tabroom Phase 2 on November 23. TASK-008 remains Partial and does not gate product work. Continue using the human-safe GitHub handoff.
- TASK-012 is complete on `main`. The first public-evidence PostgreSQL warehouse implements the [TASK-010 design](docs/architecture/ADR-002-canonical-warehouse-model.md) and preserves capture lineage and row-level eligibility.
- TASK-002 cleared leadership merge and is complete on `main`. TASK-006 is complete and verified.
- The Codex dispatcher is operational. The remaining event-orchestrator wakeup gap is separate from the Codex pipeline.

## Completed Since Last Update

- [TASK-013](tasks/013-public-judge-activity-intelligence.md) is Completed on `main`. [PR #11](https://github.com/dsavill-png/DebateOS/pull/11) merged at [`db362ded6cd309714003127f6f1b59668b00e012`](https://github.com/dsavill-png/DebateOS/commit/db362ded6cd309714003127f6f1b59668b00e012). The pinned v2 replay produced 401 summaries, 8,868 scoped judge-ID observations and 8,868 distinct person-panel assignments. The [Jared handoff](docs/handoffs/2026-11-23-public-judge-activity.md) records the contract, coverage limits and verification.

- [TASK-011 Phase A](tasks/011-college-judge-paradigm-corpus.md) is Completed on `main`. [PR #10](https://github.com/dsavill-png/DebateOS/pull/10) merged at [`47c4c89ee03933299010be35f1c575509b4cde9e`](https://github.com/dsavill-png/DebateOS/commit/47c4c89ee03933299010be35f1c575509b4cde9e). Across the included 2025–26 college policy divisions, 1,949 of 1,950 observed assigned judge IDs link explicitly to 401 distinct people. Four assigned IDs were absent from the observed category rosters. The [handoff](docs/handoffs/2026-11-23-college-policy-public-coverage.md) records the Dropbox archive, digests, replay and coverage limits.

- [TASK-012](tasks/012-public-canonical-physical-schema.md) completed after Dennis approved the verified head. [PR #9](https://github.com/dsavill-png/DebateOS/pull/9) merged at [`c318236bf6e6af07a92b213876d66140aae455f7`](https://github.com/dsavill-png/DebateOS/commit/c318236bf6e6af07a92b213876d66140aae455f7). The [implementation handoff](docs/handoffs/2026-11-23-public-warehouse.md) records 12 passing tests on fresh, restored, and upgraded PostgreSQL 17.9 databases, plus passing TypeScript and production builds.

- [TASK-010](tasks/010-canonical-warehouse-model.md) completed substantive backend review and received Dennis's approval on November 23. [PR #8](https://github.com/dsavill-png/DebateOS/pull/8) merged at [`457594e`](https://github.com/dsavill-png/DebateOS/commit/457594ead6768903099e0746ff1ac0f731d61c1f). Consult Jared on downstream UI-facing contracts.

- [TASK-009](tasks/009-tabroom-public-data-inventory.md) merged via [PR #7](https://github.com/dsavill-png/DebateOS/pull/7) at [`b6cf6ff`](https://github.com/dsavill-png/DebateOS/commit/b6cf6ff271b373f58c613053869e2b32c8d1c579). Verified head `026a7655a6f4eef91fd921588c1992b02e75626a`. Node 24.22.3 passed all 8 tests. The locked Next.js 16.4.6 production build passed TypeScript checking and generated all 3 static pages. The public request set, fixture lineage, roster and ID boundaries, standalone timeslots and raw scores were verified. Harvard judge `2912715` links to person `366665`. Panel `9200905` remains unresolved.

- [TASK-002](tasks/002-public-tabroom-adapter.md) shipped the public-only Tabroom adapter and Next.js scaffold through [PR #3](https://github.com/dsavill-png/DebateOS/pull/3).
- [TASK-006](tasks/006-dispatcher-result-semantics.md) separated task status from publishing status. Completed and blocked smoke probes passed. A blocked run with zero changes produces no draft PR.
- [TASK-007](tasks/007-shared-project-state.md) established the shared state and session protocol.

## Current Work

- [TASK-014](tasks/014-authenticated-judge-record-api-validation.md) is Draft / Gated. After TASK-003 clears, compare a bounded sample from Dennis's Tabroom judge record with supported API responses and propose the verified warehouse contract.

- TASK-011 Phase B stays Draft / Gated on TASK-003, Tabroom authorization, and separate pilot approval.

- [TASK-008](tasks/008-dispatcher-reliability.md) remains Partial. The human-safe GitHub handoff passed the production probes on [merge `562c1d8`](https://github.com/dsavill-png/DebateOS/commit/562c1d844bf80a6859a2aaeff28173014c16ddae). TASK-998 [source](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103563936), [result](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103584571), and [run](https://github.com/dsavill-png/DebateOS/actions/runs/45191160409) show blocked with no draft. TASK-999 [source](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103564339), [result](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103600699), and [run](https://github.com/dsavill-png/DebateOS/actions/runs/45191163133) show completed with [one test draft](https://github.com/dsavill-png/DebateOS/pull/6), now closed without merging. Each replay produced zero additional reports or drafts. Dennis's GitHub inbox showed the TASK-998 mention. Separate TASK-999 receipt awaits confirmation.

- [TASK-003](tasks/003-tabroom-authentication.md) remains Partial. The [November 23 discovery](docs/research/tabroom-authenticated-access.md) verified in-browser cookie-session reuse across 14 protected API operations. Harvard returned a round-to-timeslot join, result-set detail and account-linked coach/judge data. The current-ballot collection was empty.

## Decisions Made

- GitHub is canonical for code, tasks, decisions, and project state. Dropbox is the durable research and artifact library.
- Both commanders use this file for session startup and shutdown. The [repository instructions](AGENTS.md#task-execution-protocol) define the process.

## Architecture / Guardrails

- [ADR-002](docs/architecture/ADR-002-canonical-warehouse-model.md) establishes one canonical evidence warehouse with observation-level authorization and a public-evidence first rollout.

- The [approved stack](docs/architecture/ADR-001-initial-stack.md) is TypeScript, Next.js, and PostgreSQL. The v1 Tabroom adapter stays public-only.
- Codex dispatch remains approval-gated and publishes draft PRs for review. Leadership controls merges. See [PLANS.md](PLANS.md#phase-6--automation-and-dispatcher).

## Known Blockers / Risks

- TASK-003 needs Tabroom confirmation of supported unattended third-party backend credentials, session lifetime and renewal, scopes and authorization boundaries, and rate limits. Dennis reports that the current login uses username/password only, without MFA. This is operational context supplied by Dennis. Coach-only, generic and tournament-admin entitlements and nonempty current-ballot access remain unverified.
- The DebateOS Event Orchestrator (`Automation_996ef13630648191a4e3b8c843b62979`) was paused when checked on November 23. Its configured trigger is creation of a top-level comment on PR #1. The latest recorded run, `7b14f5fe-11dc-832e-bb38-5881f3f3d02b`, handled only the command fast path. On November 20 (Central Standard Time), [command 7042624192](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7042624192) was posted at 08:53:37, [Actions run 44757840497](https://github.com/dsavill-png/DebateOS/actions/runs/44757840497) started at 08:53:40, and [result 7042640941](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7042640941) was posted at 08:54:22 during the orchestrator's 08:54:17–08:54:29 run. No later run or corresponding `ORCH PROCESSED` marker was observed. The cause and duplicate-delivery behavior remain unverified. No new probe was posted against the paused automation. OpenAI Support case 20524159 has no confirmed fix.

## Next Approved Actions

- Coordinate a smoke-only test window with Support (case 20524159) to run the existing automation with a controlled overlap and redeliver the original result event. Verify one review or escalation against the original result ID and linked Actions run ID. Ask Support whether the native trigger can retain pending result events and retry them after the active run releases. The repository's report marker already suppresses duplicate GitHub reports and provides a human handoff. If native delivery cannot be made reliable, consider a bounded read-only reconciliation of unhandled PR #1 results for review or escalation under the existing trust gates.

- Use the shared startup and shutdown protocol in [AGENTS.md](AGENTS.md#task-execution-protocol).
- For TASK-003, Dennis reviews the [vendor confirmation draft](docs/research/tabroom-vendor-confirmation.md) for Tabroom Support. Outreach requires his separate approval. Record the vendor's answer and approved validation scope before considering release of TASK-014. Role-isolated and nonempty ballot verification remain follow-up work.
## Next Product Recommendation

Obtain Tabroom confirmation for supported backend use under TASK-003, then release the bounded TASK-014 judge-record validation within the approved scope. Persistent protected ingestion requires separate Dennis approval.

Review the TASK-013 v2 contract and samples with Jared before wiring the public judge activity card. Use `panelAssignmentCount` for observed experience.

## Recent Detailed Handoffs

- [TASK-003 Tabroom vendor confirmation plan and draft](docs/research/tabroom-vendor-confirmation.md).

- [TASK-013 public judge activity](docs/handoffs/2026-11-23-public-judge-activity.md).

- [TASK-011 public coverage](docs/handoffs/2026-11-23-college-policy-public-coverage.md).

- [TASK-012 public warehouse implementation](docs/handoffs/2026-11-23-public-warehouse.md).

- [TASK-010 warehouse design handoff](docs/handoffs/2026-11-23-warehouse-design.md).

- [TASK-003 authenticated API discovery addendum](docs/research/tabroom-authenticated-access.md).

- [TASK-009 live verification and warehouse assessment](docs/research/tabroom-public-data-inventory.md).

- [Dispatcher result handoff](docs/handoffs/2026-11-23-dispatcher-result-handoff.md).

- [TASK-003 authenticated-access research memo](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-003-7039686188-tabroom-authentication.md), linked from its work order.
