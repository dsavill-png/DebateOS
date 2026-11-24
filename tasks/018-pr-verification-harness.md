# 018 · Add owner-gated PR verification harness

**Status** Completed  
**Owner** Dennis Commander  
**Worker** Chat  
**Review** Dennis / Chat  
**Priority** High

## Objective

Add a small owner-gated GitHub Actions verification harness for Codex draft PRs that could not complete full runtime verification inside the Codex sandbox.

The immediate target is PR #14 / TASK-017. The harness is also intended to be reusable for later same-repository Codex PRs.

## Trigger and trust boundary

- Trigger only from a top-level comment on permanent dispatcher PR #1.
- Accept only an exact command of the form `VERIFY PR-<number>`.
- Accept only comments created by `dsavill-png`.
- Resolve the target PR through the GitHub API.
- Target PR must be open, based on `main`, originate from `dsavill-png/DebateOS`, and be authored by `github-actions[bot]` or `dsavill-png`.
- Target branch must be a Codex task branch (`codex/task-*`) or owner task branch (`task-*`).
- Check out the immutable target head SHA returned by the API, not a user-supplied ref.
- Never expose repository secrets to target code. This verifier needs no project secret.

## Verification

Use a GitHub-hosted Ubuntu runner with:

- Node 24;
- PostgreSQL 17 service container;
- locked dependencies via `npm ci`.

Run against the target PR head:

1. full Node test suite with `WAREHOUSE_TEST_URL`;
2. `npx tsc --noEmit`;
3. `npm run build`;
4. fresh database migration;
5. upgrade test: migrate the target PR's base SHA first, insert a preexisting Person, then migrate the target PR head and verify the Person survives and new relationship tables exist;
6. PostgreSQL dump/restore of the upgraded database and verification that the restored Person and new relationship tables survive.

The harness does not pull external Dropbox archives or protected data. External-archive replay remains a separate verification item when a task specifically requires it.

## Reporting

Always post one result comment back to PR #1 with:

- target PR number and immutable head SHA;
- success or failure;
- Actions run link;
- a stable marker keyed by the source verification comment ID.

Do not modify or merge the target PR.

## Non-goals

- No production deployment.
- No Neon.
- No authenticated Tabroom access.
- No protected data.
- No automatic merge.
- No arbitrary fork PR execution.
- No changes to the Codex dispatcher semantics.

## Acceptance criteria

- Exact owner command gates execution.
- PR metadata trust checks are enforced before checkout.
- PostgreSQL-backed tests run outside the Codex sandbox.
- Node 24, TypeScript, Next.js build, fresh migration, upgrade, and dump/restore are exercised.
- Result is reported to PR #1.
- Workflow introduces no secrets to target code.


## Completion note

The first live verification run for PR #14 proved the execution path: Node 24, PostgreSQL 17, full tests, TypeScript, Next.js build, fresh migration, upgrade, and dump/restore all passed. Only the final comment-reporting step failed with GitHub HTTP 403. The workflow was updated to grant pull-request write permission so results can be posted back to PR #1. No target PR code receives project secrets.
