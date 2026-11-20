# DebateOS project state

## Executive Snapshot

As of 2026-11-20. Shared state for Dennis Commander and Jared Commander, maintained on trusted `main`.

- New feature development is paused. The shared project-state protocol is in effect.
- TASK-002 cleared leadership merge and is complete on `main`. TASK-006 is complete and verified.
- The Codex dispatcher is operational. The remaining event-orchestrator wakeup gap is separate from the Codex pipeline.

## Completed Since Last Update

- [TASK-002](tasks/002-public-tabroom-adapter.md) shipped the public-only Tabroom adapter and Next.js scaffold through [PR #3](https://github.com/dsavill-png/DebateOS/pull/3).
- [TASK-006](tasks/006-dispatcher-result-semantics.md) separated task status from publishing status. Completed and blocked smoke probes passed. A blocked run with zero changes produces no draft PR.
- [TASK-007](tasks/007-shared-project-state.md) established the shared state and session protocol.

## Current Work

- [TASK-003](tasks/003-tabroom-authentication.md) remains approved Work research. The [latest reported outcome](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7039755463) was Partial. Authenticated route coverage awaits an authorized Tabroom session.

## Decisions Made

- GitHub is canonical for code, tasks, decisions, and project state. Dropbox is the durable research and artifact library.
- Both commanders use this file for session startup and shutdown. The [repository instructions](AGENTS.md#task-execution-protocol) define the process.

## Architecture / Guardrails

- The [approved stack](docs/architecture/ADR-001-initial-stack.md) is TypeScript, Next.js, and PostgreSQL. The v1 Tabroom adapter stays public-only.
- Codex dispatch remains approval-gated and publishes draft PRs for review. Leadership controls merges. See [PLANS.md](PLANS.md#phase-6--automation-and-dispatcher).

## Known Blockers / Risks

- TASK-003 needs an authorized Tabroom session to verify protected routes and role-specific access.
- Event-orchestrator wakeup remains an open orchestration gap. [PLANS.md](PLANS.md#phase-6--automation-and-dispatcher) defers unattended orchestration and records the verified Codex command path.

## Next Approved Actions

- Use the shared startup and shutdown protocol in [AGENTS.md](AGENTS.md#task-execution-protocol).
- For the already-approved TASK-003 research, verify authenticated access when an authorized session is available. New product work remains paused.

## Recent Detailed Handoffs

- [TASK-003 authenticated-access research memo](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-003-7039686188-tabroom-authentication.md), linked from its work order.
