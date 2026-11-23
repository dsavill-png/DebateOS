# TASK-011 Phase A public judge coverage

Dennis approved the public coverage measurement on November 23, 2026. Phase A is Approved / In Progress pending leadership review. Jared is a consultee on UI-facing contracts. Phase B requires TASK-003, Tabroom authorization, and separate pilot approval.

## Season and discovery

Revision 1 of `tabroom-college-policy-2025-26` uses tournament start in the UTC interval from 2025-07-01 inclusive to 2026-07-01 exclusive. A tournament starting inside that interval keeps all of its divisions even if it ends after the cutoff. A tournament starting before the lower cutoff stays outside. July-to-June is a proposed academic-year convention that reserves room for early or late competitions. A narrower September-to-April window is also plausible given the usual schedule and the 2026 national championships. Both windows contain every discovered tournament start, from September 12 to April 2. The October 2026 Harvard fixture belongs to the following season. [UNLV's competition calendar explanation](https://www.unlv.edu/debate/faq/travel) and [the 2026 National Debate Tournament report](https://www.americanforensicsassoc.org/wp-content/uploads/2026/11/2026-NDT-Alumni-news-compressed.pdf) support the competitive-season timing.

Anonymous structured Tabroom discovery used circuit 43 (NDT-CEDA), the documented date filters, a limit of 100, and offsets 0 and 41. The second page was empty. The 41 unique tournaments each had a structured invitation and bulk fetch attempt. The manifest classifies the union of invitation and export event IDs. It uses explicit format labels where available and circuit membership plus the structured competition divisions for college policy tournaments. Mixed-format Big Tent membership requires the explicit NDT/CEDA division label. CARD, NPDA, high-school tracks, observer and scout divisions are excluded. Five divisions with ambiguous or conflicting metadata remain unresolved. Events outside the circuit listing, unavailable or unlisted events, and off-platform tournaments are discovery gaps. No independent approved structured schedule was available for reconciliation. [Pinned event manifest](../coverage/college-policy-2025-26-r1.json)

## Observed coverage

| Measure | Count |
| --- | ---: |
| Discovered tournaments / tournaments with included events | 41 / 40 |
| Included / excluded / unresolved events | 87 / 68 / 5 |
| Included events present in a usable bulk export | 87 / 87 |
| Included events with at least one verified assignment | 69 / 87 |
| Included events with no panels or at least one panel without verified assignments | 81 / 87 |
| Category-rostered tournament judge IDs | 2,261 |
| Panel-assigned tournament judge IDs | 1,950 |
| Assigned judge IDs with one explicit person link | 1,949 / 1,950 |
| Distinct linked people | 401 |
| Unlinked / conflicting assigned judge IDs | 1 / 0 |
| Rostered judge IDs with no observed in-scope assignment | 315 |
| Assigned judge IDs absent from the observed category rosters | 4 |
| People reached from multiple scoped judge IDs / multiple events | 302 / 335 |

The one unlinked assigned judge is tournament `36669`, judge `2587546`. Judge IDs deduplicate across panels and divisions within a tournament. Explicit person IDs deduplicate across tournaments. A person link corroborated by another included division can resolve the same scoped judge. Category rosters can be shared with other divisions, including in mixed-format tournaments. The roster-only count measures absence of an observed qualifying assignment and can include judges whose assignments were withheld. The assigned-but-not-rostered count is computed directly from the assigned IDs absent from the observed roster set. The aggregate compares the union of included divisions, while each event compares its own category roster. Event counts are not additive because a judge may be rostered in another included division or assigned in several divisions. The difference describes the observed snapshots and can occur with legitimate Tabroom assignments. Panels without verified assignments can include byes or incomplete publication. Export availability measures event presence. The linkage rate measures only observed assignments. [Per-event coverage and counts](../coverage/college-policy-2025-26-r1-summary.json)

The observed links are suitable for choosing a small stratified sample when the protected pilot is separately authorized. Before treating the list as representative of the circuit, reconcile the five unresolved divisions, the 18 divisions without observed assignments, and possible tournaments missing from circuit discovery.

## Replay and persistence

Use the manifest digest `5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac`. The digest is computed from the parsed manifest serialized with `JSON.stringify`. Download the controlled Dropbox archive at `/DebateOS/Data References/task-011-college-policy-2025-26-r1-public-captures.zip` (file ID `id:MrZVwAkRCAEAAAAAAAFT_w`). Verify the ZIP SHA-256 `61fe140e5726269c4d87f2688cd7529f7a44429f0a9a8800826f169ef3a11fd4` and extract into `CAPTURES_DIRECTORY`. All 84 captured bodies match their per-capture hashes in the pinned manifest. The archive retains the original response headers present in the capture directory.

```sh
node src/warehouse/run-season-coverage.ts docs/coverage/college-policy-2025-26-r1.json CAPTURES_DIRECTORY 5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac
```

The replay verifies the manifest and required export digests and writes a detailed derived report. Use `WAREHOUSE_DATABASE_URL` with a migrated warehouse to persist the scope, immutable revision, classification decisions, evidence pointers, and capture outcomes using TASK-012's existing tables. The source bytes stay in the capture set. Two replays into a disposable PostgreSQL warehouse yielded the same report, one revision, 160 membership rows, and 160 evidence links. No migration or schema change was needed.

The housekeeping verification replayed the extracted archive twice offline and twice against a fresh PostgreSQL 17.9 database. All four reports matched byte for byte. All 14 tests passed with PostgreSQL, along with standalone TypeScript and the Next.js production webpack build.
