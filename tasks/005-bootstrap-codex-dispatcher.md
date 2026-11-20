# 005 · Bootstrap Codex dispatcher

**Status** Approved  
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

Task 002 is the first approved production coding task, but it must **not** run until the dispatcher passes a harmless smoke test.

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

**2026-11-20:** Dennis confirmed that the repository Actions secret `OPENAI_API_KEY` is now set for `dsavill-png/DebateOS`. Treat the secret value as unavailable and do not attempt to reveal or log it. Resume the approved setup, install the dispatcher workflow, and run only the reserved harmless smoke test. Task 002 remains unreleased until the smoke test succeeds.
