# Existing weekly refresh — read-only contract mirror

**This file is a summary for cross-workspace engineering communication, not the live automation prompt.** For current rules, read the actual Google Drive `05_STATE/REFRESH_PROTOCOL.md` and current automation configuration. Any divergence must be resolved before implementation.

## Schedule and authorized scope
- Weekly, Monday at 8 a.m., `America/New_York`; currently enabled in ChatGPT.
- Authorized source root: `/3 - Southern Nazarene Debate/Current - SNU/2026-27 Arms Sales` (Dropbox).
- Authorized output: [AI Workspace / SNU_AI_CONTEXT](https://drive.google.com/drive/folders/1iZnsREA_YWM5rM7RMBxqUZu9-ZohboDV) (Google Drive).
- Budget: up to 50 eligible original DOCX parses per scheduled run, changed current sources first, then backlog in provenance order: shared current, team current, inbox, historical, external DebateOS.
- No automatic modification of original Dropbox debate evidence.

## Existing Drive record families
- `00_CORE` — operating and strategic guidance
- `01_TOPIC` — topic/team context
- `02_ARGUMENT_REGISTRY` — names, aliases and argument relationships
- `03_INDEX` — Dropbox manifest, source-text index, split card index and analytic index
- `04_SCHEMA` — record schemas, parser rules, validation checklist
- `05_STATE` — corpus snapshot, ingestion status, pending coach review, run state, protocol and changelog
- `06_HISTORY` — change events and historical entries

## Invariants that new implementations must preserve
1. Canonical source wording comes from current original DOCX; no fabricated evidence.
2. Keep source type, provenance, revision/fingerprint and verification label together.
3. Connector-extracted text is not automatically original-DOCX verified.
4. Candidate cards and analytics are unreviewed until independently accepted.
5. Never auto-adopt material changes to plan texts, CPs, kritik alternatives, argument theses or canonical statuses.
6. Stage, validate, check concurrent writes, preserve Drive file IDs and publish only complete verified updates; update final RUN_STATE last.
7. Distinguish successful scan, structural parsing, semantic classification, coach review and publication, including separate backlog/exception counts.
8. Source activity reporting is limited to observable, attributable source changes; ingestion or parser work is not student activity.
9. Preserve recovery and audit history; missing or zero-byte files are not silently deleted.
10. An unchanged Dropbox inventory does not imply complete extraction or full semantic understanding.

## Recent health checkpoint
The November 23 scheduled run was reported as failed during original DOCX retrieval, with transport resets and cancellations. Inventory comparison completed, but no staged replacement was published. The prior verified context remained intact. Do not alter this automation in response to this document without a separately approved change plan.

## Engineer's acceptance checklist for future code
- Pinned fixture tests for new/modified/moved/missing/unchanged file cases
- Identity matching independent of path and safe hash/revision semantics
- Zero-byte/unsupported/transport failure handling
- Reproducible extraction classification with coverage and verification labels
- Deterministic, idempotent staging and output schema checks
- Conflict detection and non-destructive failure/recovery
- No private source content in public tests, logs or code
- Dry-run parity against the last verified snapshot and two successive successful weekly runs before scheduling cutover

**No production acceptance tests were run by creating these documents.**
