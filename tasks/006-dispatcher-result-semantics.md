# 006 · Clarify Codex dispatcher result semantics

**Status** Approved  
**Worker** Chat  
**Review** Dennis and Jared  
**Priority** High

## Objective

Make the Codex dispatcher report the task outcome rather than leaking the publish-job result into the human-facing status.

## Approved behavior

- **success**: Codex reports Completed, produces an allowed patch, and draft-PR publishing succeeds.
- **partial**: Codex reports Partial, produces an allowed patch, and draft-PR publishing succeeds.
- **blocked**: Codex explicitly reports Blocked and produces no patch. This is a controlled outcome, not a packaging failure, and no draft PR is created.
- **failure**: Codex/workflow produces an unexpected or inconsistent outcome, such as no explicit task status, no patch for Completed/Partial, a patch with Blocked, or a publishing failure.
- **skipped**: reserved for genuine no-op cases such as rejected commands or replay/deduplication. Rejected/no-op commands do not need a status comment.

## Scope

1. Capture the Codex final response to a file in the production route.
2. Parse the required AGENTS.md completion status: Completed, Partial, or Blocked.
3. Allow explicit Blocked + zero diff to complete the route cleanly without artifact upload or PR publishing.
4. Publish patches only for Completed/Partial outcomes.
5. Report the task status and pipeline outcome separately enough that a publishing result cannot masquerade as the Codex task result.
6. Preserve all existing trust gates, exact-command validation, sender/repository/PR restrictions, deduplication, protected-path checks, secret isolation, and no-auto-merge behavior.
7. Do not broaden GitHub permissions.

## Acceptance criteria

- The prior TASK-002 missing-source-material case would report **blocked**, not **skipped** or a packaging error.
- A Completed/Partial result with changes still publishes a draft PR.
- A Blocked result with zero changes does not enter the publish job.
- Unexpected status/diff combinations report failure.
- Replay and invalid commands remain no-ops.
