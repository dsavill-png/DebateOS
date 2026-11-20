# 004 · Establish the Codex dispatch path

**Status** Approved  
**Worker** Work  
**Review** Chat with Dennis and Jared  
**Priority** High

## Objective

Determine and document the strongest supported way for Chat to dispatch approved DebateOS coding work to Codex without requiring Dennis or Jared to manually copy/paste instructions between systems.

## Context

The Work dispatcher is now operating through GitHub PR #1 using event-driven comments such as `WORK TASK-003`. DebateOS needs the equivalent command path for Codex so leadership can approve work once and Chat can issue the engineering command.

Task 002 is the first approved Codex implementation task and should be the pilot target once this dispatch path is verified.

## Questions to resolve

1. What supported OpenAI/Codex mechanism can start a Codex coding task non-interactively from a trusted GitHub event, CI workflow, API/CLI invocation, or another supported automation surface?
2. Can Codex be launched with:
   - repository `dsavill-png/DebateOS`,
   - trusted default branch `main`,
   - a specific approved task file under `tasks/`,
   - repository `AGENTS.md` instructions,
   - and permission to create a branch/commit/PR?
3. What authentication/credential material would the dispatcher need, where should it be stored, and what permissions should it have?
4. What is the safest event pattern for a permanent command bus, for example an exact `CODEX TASK-###` comment on PR #1?
5. How should deduplication, retries, failure reporting, and completion handoff work?
6. Can the result be returned to PR #1 and/or a pull request without manual relay?
7. What limitations or product-plan restrictions prevent a fully automatic launch today?

## Guardrails

- Prefer supported OpenAI/Codex and GitHub mechanisms over custom scraping or browser automation.
- Do not expose or commit secrets.
- Do not create production credentials or external paid resources without explicit approval.
- Do not execute Task 002 during this research task.
- Do not change the accepted TypeScript + Next.js + PostgreSQL stack.
- Do not weaken the existing Work dispatcher security rules.
- Distinguish clearly between what is documented, what is experimentally verified, and what remains hypothetical.

## Deliverable

Save a concise implementation plan in `/DebateOS/Architecture` or `/DebateOS/Research` and link it from this work order.

End with one of these conclusions:

- **Native Codex dispatch verified**
- **Supported Codex dispatch requires one-time setup**
- **Automatic Codex dispatch not currently supported; manual launch remains necessary**

If one-time setup is required, list the exact user/admin action once, after which Chat should be able to dispatch future Codex tasks without human note-passing.

## Completion handoff

Report:

- STATUS
- WHAT I DID
- WHAT CHANGED
- TEST RESULTS
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP

## Research memo

[Codex dispatch implementation plan](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-004-7039823123-codex-dispatch.md) · source comment `7039823123`
