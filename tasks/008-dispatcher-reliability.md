# 008 · Close the dispatcher result handoff

**Status** Partial  
**Owner** Dennis Commander  
**Worker** Codex  
**Review** Dennis and Jared  
**Priority** High

## Objective

Keep the approved command-to-worker route and the TASK-006 outcomes. Hand each accepted Codex result to Commander review even when a result comment arrives during an active Work Event Orchestrator run.

## Scope

- Use the existing report job to post the TASK-006 result and the review or escalation disposition together on PR #1. Mention the existing authorized dispatch account (`dsavill-png`) for human triage.
- Key the report by source comment ID. An existing report from the Actions bot suppresses a duplicate under the existing per-comment workflow concurrency. Retain the Actions run and draft PR links.
- Keep the trusted-main checkout, repository, sender, exact-command and release gates, protected paths, draft-only publishing, existing token permissions, and replay guards. No new credentials, poller, automatic merge, or follow-up dispatch.
- Keep Work's existing event automation in place. Its wake and consumption behavior is a separate verification item.

## Verification and release

- Local mocked PowerShell smoke passed completed, partial, blocked, inconsistent blocked, publish failure, and missing status cases. Replay suppressed a second result in all six cases. An unrelated account's marker did not suppress a result, and a failed lookup prevented a write.
- Historical production evidence confirms the dispatcher posted a [completed result](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7042612693) and a [blocked zero-diff result](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7042640941).
- [PR #5](https://github.com/dsavill-png/DebateOS/pull/5) merged to trusted `main` at [`562c1d844bf80a6859a2aaeff28173014c16ddae`](https://github.com/dsavill-png/DebateOS/commit/562c1d844bf80a6859a2aaeff28173014c16ddae). Verified the reporting workflow and `tests/dispatcher-result.Tests.ps1` on `main`.
- TASK-998 ran from [source comment 7103563936](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103563936) in [Actions run 45191160409](https://github.com/dsavill-png/DebateOS/actions/runs/45191160409). [Result 7103584571](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103584571) reported blocked, asked `@dsavill-png` to review the blocker, and had no draft PR.
- TASK-999 ran from [source comment 7103564339](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103564339) in [Actions run 45191163133](https://github.com/dsavill-png/DebateOS/actions/runs/45191163133). [Result 7103600699](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7103600699) reported success/completed and asked `@dsavill-png` to review [draft PR #6](https://github.com/dsavill-png/DebateOS/pull/6). The draft contained only the test marker file and was closed without merging after verification, following the precedent of PRs #2 and #4.
- Each source ID had exactly one Actions bot result with its unique source-ID marker. Both reruns reached attempt 2 and skipped worker execution, publishing, and reporting. The result counts and draft counts stayed at one result per probe, zero drafts for TASK-998, and one draft for TASK-999.
- Dennis's GitHub inbox showed a mention on PR #1 linked to the TASK-998 result. Separate receipt for TASK-999 and whether Dennis personally saw either result await Dennis's confirmation.
- Automatic Commander receipt remains open. In a controlled test, post a result while another Work Event Orchestrator run is active and verify the Commander picks it up and records exactly one review or escalation across duplicate deliveries.

Phase 1 remains Partial. The human-safe GitHub handoff passed the production probes and replays. Dennis authorized Tabroom Phase 2 independently on November 23, 2026. Continue using the human-safe GitHub handoff while the Commander test remains pending.
