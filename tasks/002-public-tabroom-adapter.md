# 002 · Implement the public Tabroom adapter

**Status** Draft — blocked on leadership stack decision  
**Worker** Codex  
**Review** Chat with Dennis and Jared  
**Priority** High

## Objective

Implement the first DebateOS Tabroom adapter in **public-only mode** using the approved Task 001 ingestion contract.

## Approved architecture

- Use anonymous Tabroom REST only where currently public.
- Use the structured `download_data.mhtml` JSON endpoint for the approved bulk tournament data.
- Represent protected REST resources as unavailable in public mode.
- Do **not** use HTML/web scraping.
- Do not infer winners or protected fields that have not been verified.
- Preserve raw-source provenance and keep tournament judge IDs distinct from person IDs.

## Blocker

The initial DebateOS implementation stack has not yet been approved by leadership. Do not begin implementation until this task is updated to name the approved language/runtime/framework and is explicitly marked Approved.

## Acceptance target after unblock

The first implementation should be able to replay the Harvard fixture from Task 001 and verify the known matchup, panel, entry IDs, and judge/person mapping while leaving the winner unresolved.

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
