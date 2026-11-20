# DebateOS initial roadmap

## Phase 0 — Control plane and operating discipline

Goal: make human/AI collaboration reliable before scaling implementation.

- Establish GitHub repository instructions, roadmap, and work-order convention.
- Keep GitHub and Dropbox responsibilities distinct.
- Prove the manual loop: leadership decision → approved work order → Work/Codex execution → review.
- Do not build the automated dispatcher yet.

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

Only after the manual work-order loop is stable:

- introduce a shared queue
- add event-driven dispatch
- route research to Work and implementation to Codex
- add status/result handoffs
- add QA/review triggers

The automation should encode a proven workflow rather than inventing one.

## Accepted implementation stack

The initial stack is now approved in `docs/architecture/ADR-001-initial-stack.md`: TypeScript + Next.js + PostgreSQL, with Python reserved for specialized later workloads.

Task 002 is unblocked for Codex implementation of the public-only Tabroom adapter. Task 003 continues independently as Work research into supported authenticated Tabroom access.
