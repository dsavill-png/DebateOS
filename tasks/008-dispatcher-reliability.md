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
- After leadership review and merge, run reserved `CODEX TASK-998` and `CODEX TASK-999` from the already authorized account. Verify one bot report each, a draft PR for 999 only, the intended review disposition, and receipt in Dennis's GitHub inbox. Replay one run and confirm no second report or draft.
- For autonomous acceptance, show that a result arriving during another orchestrator run is still picked up and that duplicate deliveries lead to one review or escalation. A GitHub mention provides a human handoff with delivery subject to GitHub notification settings. It does not establish an automatic Work wake or acknowledgement.

Phase 1 remains open pending production verification and a proven Commander consumer. Hold new Tabroom work.
