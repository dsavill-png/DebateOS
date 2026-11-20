# 002 · Implement the public Tabroom adapter

**Status** Approved  
**Worker** Codex  
**Review** Chat with Dennis and Jared  
**Priority** High

## Objective

Implement the first DebateOS Tabroom adapter in **public-only mode** using the approved Task 001 ingestion contract.

## Approved implementation stack

- TypeScript is the primary implementation language.
- Next.js is the approved web/application/API framework.
- PostgreSQL is the approved durable application database.
- Python is reserved for later specialized data/AI workloads when explicitly justified.
- See `docs/architecture/ADR-001-initial-stack.md`.

Do not choose a different primary framework, language, or database without an explicit architecture decision.

## Approved Tabroom architecture

- Use anonymous Tabroom REST only where currently public.
- Use the structured `download_data.mhtml` JSON endpoint for the approved bulk tournament data.
- Represent protected REST resources as unavailable in public mode.
- Do **not** use HTML/web scraping.
- Do not infer winners or protected fields that have not been verified.
- Preserve raw-source provenance and keep tournament judge IDs distinct from person IDs.

## Scope

1. Establish the minimum TypeScript/Next.js project structure needed for this adapter if the repository does not already contain one.
2. Define a `TabroomAdapter` boundary so application code is not coupled to a specific Tabroom transport.
3. Implement the public-mode transport behavior approved in Task 001.
4. Normalize the Harvard fixture fields needed for the first acceptance test.
5. Represent unavailable/protected REST coverage explicitly rather than throwing away that state.
6. Preserve raw source/provenance metadata required by Task 001.
7. Add automated tests for the Harvard fixture and adapter behavior.
8. Do not implement authenticated Tabroom access in this task. Task 003 is investigating that separately.

## Acceptance criteria

The implementation must be able to replay the approved Harvard fixture and verify:

- tournament `40923`
- round `1587204`
- Kansas SS entry `7401836`
- Texas BS entry `7465627`
- panel `9200905`
- tournament judge `2912715`
- person `366665`
- the judge/person relationship

The winner must remain unresolved unless a separately verified source is added by an approved change.

Tests must demonstrate that protected REST resources are represented as unavailable in public mode and that the adapter does not fall back to HTML scraping.

## Constraints

- No HTML/web scraping.
- No invented Tabroom routes.
- No authentication assumptions.
- No secrets in code, fixtures, logs, commits, or Dropbox.
- Do not introduce a second primary application framework or database.
- If implementing the task requires an architecture choice not covered by ADR-001, stop and report the decision rather than improvising.

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
