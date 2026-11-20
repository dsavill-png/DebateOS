# 005 · Bootstrap Codex dispatcher

**Status** Completed (production dispatcher verified)  
**Worker** Work  
**Review** Chat with Dennis and Jared  
**Priority** High

## Objective

Perform the one-time repository setup required to let Chat dispatch approved DebateOS coding tasks to Codex through the trusted GitHub command bus, without requiring Dennis or Jared to manually relay instructions.

## Context

Task 004 concluded: **Supported Codex dispatch requires one-time setup.**

The recommended pattern is:

1. A trusted top-level comment on permanent PR #1 matches an exact command such as `CODEX TASK-###`.
2. A default-branch GitHub Actions workflow validates the command and source.
3. The workflow launches the official supported Codex action using an authorized secret.
4. Codex reads `AGENTS.md`, `PLANS.md`, and the approved task on `main`.
5. Codex works on a branch and produces a draft pull request or other reviewable result.
6. Completion/failure is reported back through GitHub so Chat can review it.

Task 002 is the first approved production coding task, and remains on hold pending a separate explicit leadership decision to release it.

## Scope

1. Re-read Task 004 and its linked research memo.
2. Create the minimum trusted default-branch GitHub Actions workflow needed for Codex dispatch, following the supported mechanism identified in Task 004.
3. Use a strict exact command format: `CODEX TASK-[0-9]{3}`.
4. Restrict accepted commands to:
   - repository `dsavill-png/DebateOS`,
   - PR #1,
   - top-level conversation comment creation,
   - sender `dsavill-png`,
   - an unedited exact command body,
   - an approved, unblocked Codex task on trusted `main`.
5. Deduplicate by source comment ID.
6. Ensure Codex receives:
   - the trusted repository,
   - trusted default branch `main`,
   - `AGENTS.md`,
   - `PLANS.md`,
   - the specific approved task file.
7. Configure the workflow to create a reviewable branch and draft PR, or the closest supported review surface documented in Task 004.
8. Add a reserved smoke-test task/command that cannot modify production application code.
9. Document the exact one-time secret or authorization step that a repository admin/user must complete if Work cannot set it automatically.
10. Verify all repository changes that can be verified without the missing secret.

## Guardrails

- Do not run Task 002.
- Do not create, expose, or commit secrets.
- Do not weaken the existing Work dispatcher or its validation rules.
- Do not accept commands from arbitrary users, branches, issues, or PRs.
- Do not read executable instructions from the dispatcher PR head branch.
- Do not allow a command to select an arbitrary file path.
- Do not silently substitute a different automation platform if the supported Codex/GitHub route from Task 004 cannot be implemented.
- If GitHub Actions or the official Codex action requires a user/admin secret that is not available, stop at the precise one-time setup step and report it.

## Deliverable

Create the repository workflow/configuration and a concise setup note in `/DebateOS/Architecture` or `/DebateOS/Research`.

The handoff must state one of:

- **Codex dispatcher verified for production routing and draft PR publishing**
- **Partial; production verification pending**
- **Codex dispatcher ready for smoke test**
- **Codex dispatcher installed; one-time user secret/authorization required**
- **Blocked; supported dispatcher could not be installed**

If user action is required, specify exactly one clear action path and what Chat can do immediately afterward.

## Completion handoff

Report:

- STATUS
- WHAT I DID
- WHAT CHANGED
- TEST RESULTS
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- REQUIRED ONE-TIME USER ACTION, if any
- RECOMMENDED NEXT STEP

## Prerequisite update

**2026-11-20:** Dennis confirmed that the repository Actions secret `OPENAI_API_KEY` is now set for `dsavill-png/DebateOS`. Treat the secret value as unavailable and do not attempt to reveal or log it. Resume the approved setup, install the dispatcher workflow, and start with the reserved harmless smoke test. The continuation below authorizes the next stage.

## Post-smoke continuation (2026-11-20)

The reserved `CODEX TASK-000` read-only smoke test [passed](https://github.com/dsavill-png/DebateOS/actions/runs/44744769927). Work received the [7:30:31 AM CST command](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7040788200) and completed a confirmation-only run. It confirmed the smoke result in ChatGPT and posted no new status to PR #1. That run did not satisfy Task 005. The task remains Partial.

A fresh exact `WORK TASK-005` comment on PR #1 authorizes the implementation and verification batch. Read the current work order from `main`, continue past smoke confirmation, and post a new Task 005 result on PR #1 linked to the fresh source comment.

1. Install production routing for exact `CODEX TASK-###` commands on `main`, retaining the source, approval, and deduplication checks in Scope and preserving the read-only smoke route. Resolve only approved Codex work orders from trusted `main`.
2. Publish results from dedicated task branches as draft PRs against `main`. Keep publishing credentials out of the Codex execution step. Report success or failure and link any draft PR from the command bus.
3. Verify the default-branch workflow with a harmless reserved production-path test that creates a reviewable test-only change. Record the source comment, Actions run, and draft PR, and verify that rejected commands and replayed comment IDs cannot invoke Codex or publish. Keep the status Partial or Blocked if verification is incomplete and name the precise blocker.
4. Enforce the TASK-002 hold in the dispatcher before invoking Codex. Do not post `CODEX TASK-002` or release it as a result of the test or completion report. Release requires verified production routing and publishing plus a separate explicit leadership decision.

## Production verification (2026-11-20)

The reserved TASK-999 test verified production command routing, Codex execution, branch publishing, draft PR creation, and success reporting to PR #1. Evidence: [source comment 7041685281](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7041685281), [Actions run 44751105302](https://github.com/dsavill-png/DebateOS/actions/runs/44751105302), and [draft PR #2](https://github.com/dsavill-png/DebateOS/pull/2). The draft contained only `codex-dispatch-verification.txt`. The dispatcher [reported success on PR #1](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7041708370). An [earlier replay check](https://github.com/dsavill-png/DebateOS/actions/runs/44750067848/attempts/2) skipped Codex, publishing, and reporting.

TASK-002 remains on dispatch hold pending a separate explicit leadership decision to release it.
