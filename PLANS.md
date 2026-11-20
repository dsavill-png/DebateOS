# DebateOS initial roadmap

## Phase 0 — Control plane and operating discipline

Goal: make human/AI collaboration reliable before scaling implementation.

- Establish GitHub repository instructions, roadmap, and work-order convention.
- Keep GitHub and Dropbox responsibilities distinct.
- Prove the manual loop: leadership decision → approved work order → Work/Codex execution → review.
- The Work dispatcher loop has now been proven sufficiently to authorize the limited Codex dispatcher bootstrap in Task 005.
- Task 005 is complete. The Codex dispatcher is verified for production routing and draft PR publishing under the bounded bootstrap authorization.

## Phase 1 — Consolidate the knowledge model

Treat the existing SNU/Jared knowledge layer as DebateOS Knowledge Layer v0, not as the final persistence architecture.

Review its concepts as KEEP / MODIFY / REJECT / ADD, including:

- document/card/analytic/argument records
- verification and source hierarchy
- provenance and revision tracking
- argument ontology
- refresh/change protocol

Add tournament-side entities that the knowledge layer does not yet model well, including people, schools, teams, entries, tournaments, events, rounds, debates, judges, ballots, disclosures, speeches, argument usage, decisions, and post-round reports.

## Phase 2 — Tabroom ingestion contract

Goal: freeze a supported, testable Tabroom adapter contract before broad implementation.

Known direction:

- v4 REST is preferred for typed/queryable resources.
- classic download_data.mhtml is useful as a rich bulk tournament snapshot and fallback.
- classic HTML is fallback/identity corroboration, not the primary ingestion path.
- application code should depend on a TabroomAdapter, not on a specific transport.
- raw tournament responses should be retainable as forensic snapshots.
- protected endpoints and authentication mechanisms must be verified rather than assumed.

## Phase 3 — OpenCaselist ingestion

Use the OpenCaselist API for schools, teams, rounds, cites, recent changes, downloads/files, and incremental synchronization.

Avoid manual wiki scraping unless an approved fallback or diagnostic requires it.

## Phase 4 — Canonical normalized schema

Freeze the first application schema that joins:

- tournament/round/debate/judge/result data
- OpenCaselist disclosure and speech-document data
- SNU evidence and analytics
- post-round reports and strategic learning

Preserve source provenance and verification state throughout.

## Phase 5 — Actionable dossier MVP

Given an opponent team and judge, surface an executive-level strategic dossier:

- judge preferences and decision history
- opponent tendencies and disclosed arguments
- likely affirmative/negative positions
- relevant SNU prep and evidence
- prior post-round learning
- targeted prep suggestions

The bottom line should appear first, with deeper evidence available through progressive disclosure.

## Phase 6 — Automation and dispatcher

The automation layer should encode proven workflows rather than inventing them.

Current authorization:

- Work dispatch through GitHub PR #1 is operational.
- The reserved read-only Codex smoke test passed. TASK-999 verified production command routing, draft PR publishing, and reporting to PR #1. Evidence: [source comment 7041685281](https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-7041685281), [Actions run 44751105302](https://github.com/dsavill-png/DebateOS/actions/runs/44751105302), and [draft PR #2](https://github.com/dsavill-png/DebateOS/pull/2).
- On November 20, 2026, Dennis explicitly approved releasing TASK-002 for Codex dispatch. The release authorizes implementation of the public-only Tabroom adapter and publication of a draft PR for review.
- Task 006 is complete. The Codex dispatcher now reports Codex task status separately from publishing status; explicit Blocked + zero-diff outcomes report cleanly without draft-PR publication. Completed and blocked smoke probes passed on November 20, 2026.
- Broader queueing, QA chains, retries, and unattended orchestration remain future work after the command path is proven.

## Accepted implementation stack

The initial stack is now approved in `docs/architecture/ADR-001-initial-stack.md`: TypeScript + Next.js + PostgreSQL, with Python reserved for specialized later workloads.

Task 002 is complete. The first public-only Tabroom adapter and Next.js scaffold are now on `main` through [PR #3](https://github.com/dsavill-png/DebateOS/pull/3).

Task 003 continues independently as Work research into supported authenticated Tabroom access.
