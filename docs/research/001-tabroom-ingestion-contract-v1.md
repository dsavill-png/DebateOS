# Tabroom ingestion contract

**DebateOS Task 001 · Final v1 contract**

**Approved v1 decision.** DebateOS Tabroom v1 is public-only. Use anonymous REST where available and the classic structured JSON export for bulk tournament data. Report protected REST resources as unavailable. HTML scraping is out of scope. Authenticated access is a separate future capability. The Harvard matchup and judge assignment are verified from public data. The ballot winner remains unresolved.

## Adapter contract

The caller supplies a typed tournament ID and optionally an event or round ID as an import scope. TabroomAdapter resolves supported REST GET operations from the live OpenAPI document, fetches the approved tournament JSON export, validates that payloads cover the requested scope, and returns a normalized batch, raw snapshot references, and per-resource diagnostics. The caller receives normalized records and coverage statuses without needing URLs, transport-specific field names, or authentication details. Research and derived interpretations stay separate from imported source facts.

| Data | Preferred source and reconciliation |
| --- | --- |
| Tournament identity and descriptive metadata | REST tournament resource. Bulk may supply fields where the schema and matching tournament ID establish equivalence. |
| Event, round and timeslot metadata | Use explicit relationships and published fields from bulk. The REST rounds and schedule resources are unavailable anonymously in the Harvard check. Track those REST coverage gaps independently. |
| Invitation | REST invite. Optional metadata for this import. |
| Schools, entries, judge assignments, pairings | Bulk snapshot. Join by typed IDs within tournament and round scope. Use published REST observations to corroborate when they expose equivalent IDs. |
| Results and ballot observations | The Harvard REST results route is unavailable anonymously. Preserve public bulk ballot observations independently. An event standing is not a debate decision. Promote an outcome only after its semantics and exact matchup join are verified. |
| Paradigm and other protected data | Outside the public importer. Record unavailable when access is denied. |

The live [IndexCards API specification](https://api.tabroom.com/v1) reported version 1.2.0 and base path /v1. For Harvard tournament 40923, anonymous GET to /rest/tourns/{tournId} and /rest/tourns/{tournId}/invite returned JSON. GET to the same tournament path with /rounds, /results or /schedule returned 401. The specification lists cookieAuth on those three operations. This supersedes the earlier anonymous-access observation for Harvard. Bind these exact operations and preserve the spec version or digest. The [Harvard bulk export](https://www.tabroom.com/api/download_data.mhtml?tourn_id=40923) returned public JSON. Validate its media and shape even on a successful HTTP response.

## Normalized entities and joins

Treat source IDs as opaque strings and namespace them by provider and entity type. Preserve original IDs and source scope. Never join by display name or entry code. Keep optional facts nullable and report their coverage separately.

| Entity | Identity and minimum relationships |
| --- | --- |
| Tournament | Tournament ID. Name and dates when available. |
| Event | Event ID and tournament reference. Name or division label when present. |
| Round | Round ID and event reference. Label, schedule and publication state when evidenced. |
| School | Tournament school ID and tournament reference. External chapter identity is a separate optional reference. |
| Entry | Entry ID and event reference. Preserve code/name, school link and roster references only when supplied. |
| Debate | Panel/section ID scoped to round, with two distinct matchup entries for the Harvard fixture. Keep source flight and room if present. Never merge panels solely because entrants match. |
| Debate entry | Debate and entry reference. Preserve source side separately and normalize only with a verified mapping. |
| Tournament judge and person | Read the judge ID in its tournament context and keep person ID in a separate namespace. Link only on an explicit association. |
| Judge assignment | Debate and tournament judge references, deduplicated across repeated ballot rows. Retain source references. |
| Ballot observation | Source ballot ID, debate, entry and optional tournament judge reference. Preserve source side, scores or flags when provided, without treating an entry-scoped ballot row as a verified judge decision. |
| Published outcome | Optional debate-level winning entry and decision provenance only when supported by a validated mapping. Unknown and conflicting outcomes remain unresolved. |

The [legacy exporter source](https://github.com/speechanddebate/tabroom/blob/master/web/api/download_data.mhtml) shows rounds with sections and sections containing entry-scoped ballot rows. It also gates public round, score and feedback data on publication settings. Use those relationships as parser guidance and validate against the deployed JSON fixture. Missing public data can reflect visibility or publication and must never be interpreted as a loss, zero score, or absent assignment.

## Provenance and raw snapshots

Before normalization, retain immutable response bytes for authorized JSON captures, including responses that fail schema validation, under controlled access. Record snapshot ID, sanitized request path and query, fetch timestamp in UTC, status, media type, content digest, import scope, export visibility where known, and parser/spec version. Record only allowlisted response headers. On each imported observation capture `source`, `source_method` (REST or bulk), `source_id`, `source_path` (JSON pointer or equivalent), `fetched_at`, and `snapshot_id`. Multi-source fields retain supporting references and conflicts. Never retain credentials, cookies or authorization headers with snapshots. Use a controlled fixture store for raw data and omit private fields from reports and shared examples.

## Failure and fallback

- Retry transient connection failures, 429 and 5xx responses with a bounded backoff and honor Retry-After. Emit a diagnostic when exhausted.
- Treat 401/403 as access restrictions. Do not retry with guessed credentials or use a different interface to obtain restricted fields.
- Report 404 against the documented route and requested resource. Never probe guessed paths.
- Detect HTML/login redirects, malformed JSON, explicit JSON errors, wrong tournament, and incompatible schema. Keep valid independent resources and withhold invalid joins. Never scrape HTML.
- Fall back from REST to validated bulk for explicitly equivalent public fields when REST is unavailable or incomplete. Mark the source and whether the snapshot is stale. If bulk fails, return partial REST coverage. Keep the last verified values distinct from incomplete refresh data. On material disagreement, retain both observations and flag the conflict instead of silently replacing values.
- Replaying the same fixture must produce stable identities and relationships. Commit normalized records with their provenance together. An optional resource failure must not erase verified data or create placeholder identities from names.

## Harvard 2026 R1 acceptance fixture

Use approved public payloads for tournament `40923` and round `1587204`. Capture REST responses and the bulk snapshot once, pin their digests, and test replay offline. Match the unordered set of entry IDs `7401836` (Kansas SS) and `7465627` (Texas BS) to exactly one panel in that round, then retain the source panel ID. Assert the event link, both entry links, and the assignment of tournament judge `2912715` (Dennis Savill). Assert event `389106` (Open) and panel `9200905`. The pinned bulk response produced exactly one matching panel. Both entry-scoped ballot rows identify judge `2912715` in judge and explicitly link person `366665` through judge_person. Preserve both as separate typed IDs.

Assert provenance for both REST and bulk observations, stable reimport, and no fabricated side, score, winner or judge decision. Check a missing/withheld ballot, contradictory observations, invalid JSON, 401/403 without credential fallback, and a transient failure followed by eligible bulk fallback. A clean public import may retain an unresolved outcome. Multiple matching panels or missing required matchup IDs fail the matchup assertion and require inspection of the pinned payloads.

## First implementation and open decisions

**First implementation** binds and pins the documented public routes, captures authorized JSON, builds the normalized graph above, and proves the Harvard identity and assignment fixture. Include diagnostic handling and deterministic replay. The implementation language, framework, database and hosting are outside this contract.

**Later** verify the supported authentication flow for the paradigm route (the work order records an anonymous 401), permitted scopes and retention before wiring protected access. Verify the side and score tags that encode policy decisions, multi-judge aggregation, publication semantics, and bye/forfeit treatment before asserting any outcome. Defer incremental refresh orchestration, protected ballots and feedback, cross-source identity enrichment, and strategic analysis.

## Evidence and verification status

The live OpenAPI document, public tournament metadata, invite and bulk responses were downloaded and hashed. The Harvard identity and assignment assertions passed on the saved responses. No authenticated request was performed. The fixture has no asserted ballot winner.

