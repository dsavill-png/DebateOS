# TASK-003 · Tabroom authenticated API discovery

November 23, 2026. Follow-up to the [original authentication memo](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-003-7039686188-tabroom-authentication.md).

## Authentication evidence

The live [IndexCards OpenAPI v1.2.0](https://api.tabroom.com/v1) declares cookie session authentication for protected operations and documents a first-party `POST /v1/auth/login` that creates a session. It lists no bearer, OAuth or service-account scheme. The previous pass recorded a match to the pinned digest. This pass inspected the live specification without recomputing that digest. [Tabroom Help](https://www.tabroom.com/index/help.mhtml) describes developer API access as still evolving. A production API contract for unattended third-party backend use remains unconfirmed.

The Work browser showed an existing first-party website sign-in. Ordinary top-level HTTPS GET navigation to the API from that browser returned the documented JSON shapes on routes that had returned anonymous 401 in TASK-009. This verified browser session reuse without reading or transferring credential material. Dennis did not need to sign in again. No login POST was made. Login-cookie issuance on the API endpoint, its compatibility with MFA and its suitability for backend use were not tested.

## Authenticated GET observations

All 14 distinct operations below returned parseable `application/json` with success shapes consistent with the spec's HTTP 200 responses. The browser exposed the media type and rendered body but did not expose the HTTP status line, so 200 is inferred for these observations. Earlier anonymous statuses are recorded in the [public inventory](tabroom-public-data-inventory.md). No protected response bodies or free-text values were exported or retained as research artifacts. All paths are relative to `/v1`.

| GET route | Tested scope and response shape | Authorization and warehouse finding |
| --- | --- | --- |
| `/rest/tourns/{tournId}/rounds` | Harvard 40923. Array of 31 published rounds with round ID, event ID, nested Event and publication/feedback indicators. | Authenticated on the tested account. Generic access uncertain. Provides publication indicators, with round identity also present in the public export. |
| `/rest/tourns/{tournId}/schedule` | Harvard. Array of 33 rounds with nested Event and Timeslot. Open event 389106, round 1587204 explicitly links to timeslot 466139. | Authenticated on the tested account. Generic access uncertain. Adds a verified round-to-timeslot crosswalk for this source. |
| `/rest/tourns/{tournId}/results` | Harvard. Object keyed by event ID, with nested ResultSets. Event 389104 includes result set 471479. | Published-result scope per spec. Generic access uncertain. Adds a navigable event-to-result-set index. |
| `/rest/tourns/{tournId}/results/{resultSetId}` | Harvard, list-returned ID 471479. One result set in an array, 15 rows with Entry, School, round, rank and values. | Published-result scope per spec. Generic access uncertain. Structured standings and display metadata supplement the public observations. |
| `/rest/paradigms` | Search 366665, limit 1. Empty array. | Authenticated search returned a valid collection. Numeric search and nonempty search coverage remain unverified. |
| `/rest/paradigms/{personId}` | Person 366665, already linked in the public inventory to Harvard judge 2912715. Object with ID, paradigm field, review date and certifications. | Cross-person access observed from the tested account. Role requirements uncertain. Adds review and certification metadata. |
| `/rest/paradigms/{personId}/record` | Same person. 324 records with tournament ID, event/round labels and vote fields. | Cross-person access observed. Potential judging history source. Labels alone do not establish entry or panel joins. |
| `/pages/invite/{tournId}/{eventAbbr}/{roundName}/results` | Harvard Open round 1 resolves to event 389106 and round 1587204. Panel 9200905 is present and keyed judges include 2912715. Entry map keys on that panel were 1 and 2. | Generic access uncertain. Adds round-level result structure. Entry map keys are not verified entry IDs. Winner remains unresolved. |
| `/user/tourns` | Signed-in account. Array of 166 tournament records, including Harvard. | Account-scoped per spec. Useful for choosing in-scope tournaments. |
| `/user/tourns/{tournId}` | Harvard. `me` and `mine` objects with ID arrays. Two entries under `mine` and one judge under `me`. | Account/affiliation data. The distinct branches are candidate join scopes. |
| `/user/tourns/{tournId}/summary` | Harvard. Object with ID, roles and livedocs. Reported roles were judge and coach. | Account-scoped. Shows both roles and does not isolate a coach-only entitlement. |
| `/user/chapters/byTourn/{tournId}/mySchools` | Harvard. One school with distinct school ID and chapter fields, entries, events, judges and four student rows. | Consistent with team-coach access on the tested account. Exact entitlement boundary remains uncertain. Adds team-scoped joins. |
| `/user/judges/history/{tournId}` | Harvard. Tourn and one Judge with Category, School, two Results and empty Panels. | Consistent with linked judge access. This does not demonstrate access to other judges' account-specific histories. |
| `/user/tourns/{tournId}/ballots/current` | Harvard. Empty array. | Confirms successful access to the collection at this scope. Nonempty ballot shape and coach, judge-assignment and admin boundaries remain unverified. The live spec advertised this as its only GET with a ballot-named path. |

No admin-only access was verified. The account's combined coach and judge roles prevent attributing access to either role alone. School, chapter, entry, student, person, tournament judge, round, panel and result-set identifiers remain distinct.

## Backend recommendation

Ask Tabroom to confirm an approved production integration, including delegated or service credentials, permitted scopes, expiration and renewal. Until then, keep authenticated backend ingestion disabled. If approved, put authentication behind an injected session provider that owns an in-memory HTTP client and exposes allowlisted read operations plus typed expiry and authorization errors. Keep secrets out of process arguments, logs, persisted configuration, fixtures and application records. Require user reauthorization or vendor-supported renewal on expiry. For the next verification pass, use a coach-only comparison or known unrelated tournament, plus a legitimately assigned current ballot, and capture only status, schema metadata and allowlisted join identifiers. This discovery did not implement schema or adapter changes.

**Partially verified; additional credential/session test required**

## TASK-023 · Verified API login contract

Verified November 25, 2026 against the live [IndexCards OpenAPI v1.2.0](https://api.tabroom.com/v1). The server base is `/v1` and the operation is `POST /auth/login` (`authLogin`), making the request path `POST /v1/auth/login`. The operation declares no pre-existing authentication requirement.

| Contract item | Documented behavior |
| --- | --- |
| Request | Required `application/json` object (`LoginRequest`) with two required fields: `username` (string) and `password` (string). Neither field declares a format or length constraint. |
| Success | HTTP `200`, `application/json` (`LoginResponse`). The body requires an object named `Person` with required `id` (integer) and `email` (string). Both objects disallow additional properties. |
| Errors | HTTP `401 Unauthorized` and `500 Internal Server Error`, both using `application/problem+json` (`ProblemSchema`). |
| Session | Login creates a session. Cookie-authenticated requests send the session token in the `TabroomToken` cookie. `GET /v1/user/session` uses that scheme. `POST /v1/auth/logout` invalidates the current session and documents `204 No Content` on success. |
| Cookie issuance and expiry | The login response declares no `Set-Cookie` header or cookie attributes. The session-list schema includes UTC creation and last-access timestamps. The login and session schemas specify no lifetime, idle timeout, or renewal behavior. |

This resolves TASK-023’s login-schema verification blocker. Runtime cookie issuance and expiry remain unverified. This check used only the public OpenAPI document and made no login request.
