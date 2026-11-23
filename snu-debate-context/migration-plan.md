# Safe integration plan: zero-cutover first

## Phase 1 — documentation and inventory (this PR)
- Establish a stable read-only landing area in the public DebateOS repository for cross-workspace coordination.
- Identify existing published schemas and the live source/output locations without transferring raw data.
- Capture the weekly refresh invariants and last known failure boundary.
- Leave the ChatGPT schedule, Dropbox evidence and Drive data entirely untouched.
- Obtain Dennis/Jared review before merge. No external services or execution permissions are introduced.

**Completion is documentation only.** It does not mean a working parser has been migrated.

## Phase 2 — code discovery and implementation proposal (not authorized by this PR)
Inventory all execution surfaces:
- ChatGPT automation prompt and effective connector actions
- Drive-held instructions and schemas
- Any existing scripts, if actually verified, in accessible authorized storage
- Retry, pagination, original-DOCX parsing, staging, write and report behaviors

Classify each operation as **existing executable code**, **agent-driven instruction**, **human review**, or **unverified**. Draft a bounded work order and owner. Decide whether non-sensitive code can live in the public repo or requires a private repository.

## Phase 3 — isolated implementation and tests (separate approval)
- Build reusable parser and manifest logic with synthetic/anonymized fixtures.
- Use a separately authorized read-only source credential where available.
- Never publish to current Google Drive production state in tests.
- Measure comparison with current snapshot: IDs, change classifications, candidate counts, exceptions, review queue and provenance.
- Require security review for student/private data and connection handling.

## Phase 4 — shadow mode (separate approval)
Run an isolated dry-run on a bounded subset, then full approved scope. Compare at least two successful weekly cycles with existing behavior. Log missed sources, hashes, cost, performance, connector errors and result mismatches. Continue the existing scheduled automation as sole publisher.

## Phase 5 — explicit cutover decision (not automatic)
Only after acceptance and human signoff:
- choose scheduler, runtime and authentication approach;
- define single writer, locking/conflict check, backout and recovery;
- designate authority for Drive IDs or new storage; 
- preserve last good snapshot and test restoration;
- switch production one time within a monitored window.

If any condition fails, keep the existing ChatGPT automation. A GitHub commit, merge or PR must never independently change the live refresh schedule.

## Open questions for both agents
1. Is any refresh parsing logic stored as executable code today, or are operations entirely implemented through ChatGPT tool orchestration?
2. Which current Drive state files are accessible to Dennis's agent independently? Verify, do not presume connector permissions.
3. What sanitized unit-test fixtures are possible without leaking competitive prep or student activity?
4. Can retrieval transport resets be mitigated safely without changing source precedence or state-publishing guarantees?
5. Does future integration need private repository permissions or a controlled service endpoint?
6. How would SNU Knowledge Layer v0 map to ADR-002's canonical warehouse without merging unlike access scopes?

## Proposed owner and review
**Owner:** Jared Commander, documentation / product integration proposal.
**Review:** Dennis Commander for backend architecture and repository conventions. Further coding would need its own approved task and tests.

This file records a proposal; it does not supersede `PLANS.md`, `PROJECT_STATE.md`, `AGENTS.md`, or Drive's active protocol.
