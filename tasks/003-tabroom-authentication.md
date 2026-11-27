# 003 · Verify Tabroom authenticated access

**Status** Partial  
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

## Research memo

[Tabroom authenticated REST access](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-003-7039686188-tabroom-authentication.md) · source comment `7039686188`

[November 23 API discovery addendum](../docs/research/tabroom-authenticated-access.md) records 14 successful in-browser API reads, including Harvard tournament and coach/judge-affiliated data. TASK-003 remains Partial. Before enabling unattended third-party backend ingestion, obtain Tabroom confirmation of supported unattended third-party backend credential use, session lifetime and renewal behavior, scopes and authorization boundaries, and rate limits. Role-isolated access and nonempty current-ballot coverage remain unverified. The separately scoped supervised TASK-014 validation uses ordinary owner-authenticated access, with its release and constraints recorded privately.

Dennis reports that current Tabroom login uses username/password only, without MFA. This is user-reported operational context. MFA is outside the current test plan.
