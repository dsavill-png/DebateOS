# DebateOS project state

## Executive Snapshot

As of 2026-11-23. Shared state for Dennis Commander and Jared Commander, maintained on trusted `main`.

- Dennis approved resuming public Tabroom Phase 2 on November 23. TASK-008 remains Partial and does not gate product work. Continue using the human-safe GitHub handoff.
- TASK-002 cleared leadership merge and is complete on `main`. TASK-006 is complete and verified.
- The Codex dispatcher is operational. The remaining event-orchestrator wakeup gap is separate from the Codex pipeline.

## Completed Since Last Update

- [TASK-002](tasks/002-public-tabroom-adapter.md) shipped the public-only Tabroom adapter and Next.js scaffold through [PR #3](https://github.com/dsavill-png/DebateOS/pull/3).
- [TASK-006](tasks/006-dispatcher-result-semantics.md) separated task status from publishing status. Completed and blocked smoke probes passed. A blocked run with zero changes produces no draft PR.
- [TASK-007](tasks/007-shared-project-state.md) established the shared state and session protocol.

## Current Work

- [TASK-009](tasks/009-tabroom-public-data-inventory.md) is Partial pending leadership review of [draft PR #7](https://github.com/dsavill-png/DebateOS/pull/7). The [public data inventory](docs/research/tabroom-public-data-inventory.md) is on `main`. The live spec matched the v1.2.0 pin. Offline replay passed 8/8 tests, including the Harvard judge/person link and unresolved winner.

- [TASK-008](tasks/008-dispatcher-reliability.md) remains Partial. The human-safe GitHub handoff passed the production probes on [merge `562c1d8`](https://github.com/dsavill-png/DebateOS/commit/562c1d844bf80a6859a2aaeff28173014c16ddae). TASK-998 [source](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103563936), [result](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103584571), and [run](https://github.com/dsavill-png/DebateOS/actions/runs/45191160409) show blocked with no draft. TASK-999 [source](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103564339), [result](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103600699), and [run](https://github.com/dsavill-png/DebateOS/actions/runs/45191163133) show completed with [one test draft](https://github.com/dsavill-png/DebateOS/pull/6), now closed without merging. Each replay produced zero additional reports or drafts. Dennis's GitHub inbox showed the TASK-998 mention. Separate TASK-999 receipt awaits confirmation.

- [TASK-003](tasks/003-tabroom-authentication.md) remains approved Work research. The [latest reported outcome](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7039755463) was Partial. Authenticated route coverage awaits an authorized Tabroom session.

## Decisions Made

- GitHub is canonical for code, tasks, decisions, and project state. Dropbox is the durable research and artifact library.
- Both commanders use this file for session startup and shutdown. The [repository instructions](AGENTS.md#task-execution-protocol) define the process.

## Architecture / Guardrails

- The [approved stack](docs/architecture/ADR-001-initial-stack.md) is TypeScript, Next.js, and PostgreSQL. The v1 Tabroom adapter stays public-only.
- Codex dispatch remains approval-gated and publishes draft PRs for review. Leadership controls merges. See [PLANS.md](PLANS.md#phase-6--automation-and-dispatcher).

## Known Blockers / Risks

- TASK-003 needs an authorized Tabroom session to verify protected routes and role-specific access.
- The DebateOS Event Orchestrator (`Automation_996ef13630648191a4e3b8c843b62979`) was paused when checked on November 23. Its configured trigger is creation of a top-level comment on PR #1. The latest recorded run, `7b14f5fe-11dc-832e-bb38-5881f3f3d02b`, handled only the command fast path. On November 20 (Central Standard Time), [command 7042624192](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7042624192) was posted at 08:53:37, [Actions run 44757840497](https://github.com/dsavill-png/DebateOS/actions/runs/44757840497) started at 08:53:40, and [result 7042640941](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7042640941) was posted at 08:54:22 during the orchestrator's 08:54:17–08:54:29 run. No later run or corresponding `ORCH PROCESSED` marker was observed. The cause and duplicate-delivery behavior remain unverified. No new probe was posted against the paused automation. OpenAI Support case 20524159 has no confirmed fix.

## Next Approved Actions

- Coordinate a smoke-only test window with Support (case 20524159) to run the existing automation with a controlled overlap and redeliver the original result event. Verify one review or escalation against the original result ID and linked Actions run ID. Ask Support whether the native trigger can retain pending result events and retry them after the active run releases. The repository's report marker already suppresses duplicate GitHub reports and provides a human handoff. If native delivery cannot be made reliable, consider a bounded read-only reconciliation of unhandled PR #1 results for review or escalation under the existing trust gates.

- Use the shared startup and shutdown protocol in [AGENTS.md](AGENTS.md#task-execution-protocol).
- For the already-approved TASK-003 research, verify authenticated access when an authorized session is available.
- Review TASK-009 draft PR #7 and use the inventory to decide the initial warehouse entities, relationship grain and provenance requirements. Schema implementation requires a separate work order.

## Recent Detailed Handoffs

- [TASK-009 live verification and warehouse assessment](docs/research/tabroom-public-data-inventory.md).

- [Dispatcher result handoff](docs/handoffs/2026-11-23-dispatcher-result-handoff.md).

- [TASK-003 authenticated-access research memo](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-003-7039686188-tabroom-authentication.md), linked from its work order.
