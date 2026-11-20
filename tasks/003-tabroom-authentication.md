# 003 · Verify Tabroom authenticated access

**Status** Approved  
**Worker** Work  
**Review** Chat with Dennis and Jared  
**Priority** High

## Objective

Determine the supported authentication mechanism and practical authenticated coverage for the Tabroom REST routes that returned 401 during Task 001, without blocking the public-only v1 adapter.

## Scope

1. Use the live Tabroom OpenAPI specification and first-party behavior as the primary evidence.
2. Determine what authentication scheme the protected REST routes actually expect.
3. Verify whether rounds, results, schedule, paradigms, or other relevant protected resources become available with legitimate authenticated access.
4. Distinguish clearly among:
   - documented authentication,
   - experimentally verified authentication,
   - hypotheses not yet verified.
5. Identify the safest way DebateOS should supply credentials or session material in development and production without storing secrets in GitHub or Dropbox.
6. Record any access limitations, authorization boundaries, or terms-relevant constraints that affect the design.

## Constraints

- Do not scrape HTML as a substitute for authenticated API access.
- Do not invent credentials or authentication headers.
- Do not expose or persist secret values in GitHub, Dropbox, logs, or the final memo.
- Do not change the public-only v1 decision from Task 001.
- If legitimate authentication cannot be completed with available access, report the exact blocker and what evidence would be needed next.
- Keep tournament judge IDs and person IDs distinct.

## Deliverable

Save a concise authenticated-access research memo in `/DebateOS/Research` and link it from this task.

The memo must end with one of:

- **Verified supported auth path**
- **Partially verified; additional credential/session test required**
- **Blocked; supported auth mechanism remains unresolved**

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
