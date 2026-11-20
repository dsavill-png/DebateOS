# 001 · Freeze the Tabroom ingestion contract

**Status** Completed  
**Worker** Work  
**Review** Chat with Dennis and Jared  
**Priority** High

## Objective

Turn the Tabroom research already completed for DebateOS into a concise, implementation-ready ingestion contract without repeating settled research.

## Existing facts to treat as inputs

The project has already verified:

- GET https://api.tabroom.com/v1 returns the live OpenAPI document.
- For Harvard tournament tourn_id 40923, prior research reported anonymous REST coverage. The final v1 check verified anonymous tournament and invite access, and rounds, results, and schedule returned 401. See the completed design note below.
- Guessed routes that returned 404 must not be treated as supported; exact paths should come from the OpenAPI specification.
- download_data.mhtml?tourn_id=40923 returns a rich bulk tournament snapshot and is useful alongside REST.
- The Harvard 2026 R1 Kansas SS vs Texas BS example is the canonical test case currently used by the project.
- Known identifiers:
  - tournament: 40923
  - round: 1587204
  - Kansas SS entry: 7401836
  - Texas BS entry: 7465627
  - Dennis Savill tournament judge ID: 2912715
  - Dennis Savill person ID: 366665
- The paradigm route for person 366665 exists but anonymous access returns 401; the supported authentication mechanism remains unresolved.
- DebateOS should hide transport details behind a TabroomAdapter.
- Raw responses should be retainable with provenance.

Do not spend time rediscovering these facts unless a contradiction appears.

## Deliverable

Prepare an implementation-ready design note in Dropbox Research and link it from this work order. Define:

1. Responsibilities of TabroomAdapter.
2. Which data should come from v4 REST versus bulk download_data.
3. Required normalized entities and identifiers for the first end-to-end import.
4. Required provenance fields and raw-snapshot handling.
5. Error/fallback behavior.
6. The Harvard Kansas SS vs Texas BS acceptance fixture.
7. Explicit unresolved questions, especially authentication and any still-unverified ballot/outcome mapping.
8. A proposed boundary between first implementation and later enhancements.

## Constraints

- Do not choose a programming language, web framework, database, or cloud provider unless approved elsewhere.
- Do not invent API paths.
- Do not assume Bearer token, cookie, or another authentication mechanism without verification.
- Do not substitute HTML scraping for the approved API/bulk approach.
- Keep tournament judge IDs and person IDs distinct.
- If existing research is insufficient for one required contract detail, mark it unresolved rather than silently filling the gap.

## Acceptance criteria

The result should be specific enough that a subsequent Codex task can implement the first adapter/importer without re-litigating the data-source architecture.

## Completion handoff

Report:

- STATUS
- WHAT I DID
- WHAT CHANGED
- TEST RESULTS, if applicable
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP

## Delivered design note

[Final Tabroom v1 ingestion contract in Dropbox](https://www.dropbox.com/home/DebateOS/Research?preview=001-tabroom-ingestion-contract-v1.md)

Dropbox path: `/DebateOS/Research/001-tabroom-ingestion-contract-v1.md`.

**Approved decision.** Tabroom v1 is public-only. Use anonymous REST where available and `download_data.mhtml` for structured bulk tournament data. Represent protected REST resources as unavailable. Do not scrape HTML. Authenticated access is a separate future capability.

**Verification.** Live OpenAPI route bindings checked. The saved Harvard bulk response verified the unique panel `9200905`, both entry IDs, and tournament judge `2912715` linked to person `366665`. The ballot winner remains unresolved. Adapter implementation is a follow-on task.
