# TASK-003 · Tabroom authenticated API discovery addendum

November 23, 2026. This addendum supplements the [original authentication memo](https://www.dropbox.com/home/DebateOS/Research?preview=TASK-003-7039686188-tabroom-authentication.md).

The official Tabroom website showed an existing signed-in account. The live [IndexCards OpenAPI](https://api.tabroom.com/v1) returned 200 and matched the pinned v1.2.0 digest. Its protected API uses cookie authentication. Website sign-in establishes a website session. The documented interfaces and available API client provided no supported way to use that session outside the browser without transferring session material. Authenticated GETs attempted in this pass: zero. No protected payloads, credentials or private ballot/RFD/comment text were collected.

| Planned GET operation under /v1 | Evidence and classification | Scope and join to validate |
| --- | --- | --- |
| /rest/tourns/{tournId}/rounds | Anonymous 401 in TASK-009. Protected-unavailable in public mode. Authenticated shape and role uncertain. | Tournament → event → round → panel; verify published scope. |
| /rest/tourns/{tournId}/schedule | Anonymous 401 in TASK-009. Protected-unavailable in public mode. Authenticated shape and role uncertain. | Tournament → timeslot; require an explicit round link. |
| /rest/tourns/{tournId}/results | Anonymous 401 in TASK-009. Protected-unavailable in public mode. Authenticated shape and role uncertain. | Tournament and event → result set. Verify published state and ID. |
| /rest/tourns/{tournId}/results/{resultSetId} | Protected by specification. No authenticated list response supplied a verified detail ID. | Join detail using the ID returned by the list within the same tournament. |
| /rest/paradigms; /rest/paradigms/{personId}; /rest/paradigms/{personId}/record | Anonymous 401 in TASK-009. Protected-unavailable in public mode. Authenticated shape and role uncertain. | Use person ID; keep tournament judge ID distinct. |
| /user/tourns/{tournId}/ballots/current | Protected by specification. Coach and assignment entitlements uncertain. | Validate account/tournament scope, panel, entry, judge and ballot IDs; omit all text. |
| /pages/invite/{tournId}/{eventAbbr}/{roundName}/results | Anonymous 401 in TASK-009. Protected-unavailable in public mode. Authenticated shape and role uncertain. | Event abbreviation and round name are route parameters, separate from canonical IDs. |
| /user/tourns/{tournId}/summary; /user/chapters/byTourn/{tournId}/mySchools; /user/judges/history/{tournId} | Protected by specification. Team-scoped, person-scoped and administrator access remain unverified. | Validate tournament, chapter vs. tournament school, and judge vs. person IDs. |

Public structured coverage is documented in the [public data inventory](tabroom-public-data-inventory.md). Authenticated coach access and tournament-admin or role-dependent access have no verified API examples yet. Tabroom's [FAQ](https://docs.tabroom.com/overview/faq) documents account-linked and school result views on the website. REST authorization is a separate question. Even a successful response from one coach account would not establish entitlement for other coaches or generic users. Semantics remain uncertain for outcome promotion, result-set crosswalks and ballot workflow flags.

Next verification requires a Tabroom-supported authenticated API client or an approved in-session GET method whose only output is status, field shapes and allowlisted join identifiers. Keep authorized metadata and permission scope separate from public ingestion.

**Partially verified; additional credential/session test required**
