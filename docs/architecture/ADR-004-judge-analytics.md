# ADR-004 · Judge analytics dimensions, facts, and serving

Status: Accepted. Dennis approved the architecture on 2026-11-24 under [TASK-021](../../tasks/021-judge-analytics-dimensional-model.md).

## Evidence and dimensions

Build on [ADR-002](ADR-002-canonical-warehouse-model.md) and [ADR-003](ADR-003-person-role-affiliation-history.md). Immutable captures and evidence retain source IDs, paths, observation time, parser state and authorization. Every promoted value, including contextual labels and enrichment, needs field-level evidence references and the mapping version that verified it. A canonical key establishes identity. Eligibility of a label or relationship is evaluated separately.

| Dimension | Canonical key and scope |
| --- | --- |
| Person | `persons.id`, backed by provider and person source ID. Role-neutral. Verified name requires eligible identity and name evidence. |
| Tournament | `tournaments.id`, provider and tournament source ID. |
| Event/division | `events.id`, scoped to tournament. Category references `categories.id` when evidenced. |
| Round | `rounds.id`, scoped to event. Labels and competition dates are observations. |
| Panel | `panels.id`, scoped to round. Two panels in one round are two assignments for a judge on both. |
| Entry/team observation | `entries.id`, scoped to event. Durable membership uses ADR-003 with explicit evidence. |
| School/chapter/institution | `schools.id` for a tournament school observation, `chapters.id` for provider-wide chapter identity. Use the ADR-003 affiliation target with explicit crosswalk evidence. |
| Tournament judge | `judges.id`, scoped to tournament. `panel_judges` provides scoped assignment keys. Require explicit Person links. |
| Date/season | Use evidenced round date under a pinned source date/time-zone rule. Count stable approved season scope IDs using one pinned membership revision per scope. Missing or conflicting membership stays unresolved. A separate calendar table is unnecessary for these measures. |

## Atomic relations and review schema

The following relational sketch specifies logical keys for the eligible facts at a given cutoff and audience. Physical implementation is deferred to review. IDs below refer to canonical UUIDs unless specified. All promoted fact rows have one or more required evidence links. Optional attributes are nullable and carry their own evidence links when populated.

| Relation | Key and typed payload |
| --- | --- |
| `judge_assignment` | PK `(person_id, panel_id)`. Required explicit assignment and Person identity evidence. A child `judge_assignment_source` has PK `(person_id, panel_id, judge_id, evidence_id)`, FK to assignment and judge. Require the judge and panel to belong to the same tournament. Repeated ballots and multiple explicitly linked judge IDs contribute evidence to one assignment. Conflicting or missing Person mappings remain evidence and coverage gaps. |
| `panel_entry` | PK `(panel_id, entry_id)`. Both keys must belong to the same event. Optional verified school and SNU identity classification. School/entry observations can be usable before side mapping. |
| `panel_sides` | PK `(panel_id)`. Nullable `aff_entry_id, neg_entry_id` reference panel entries, distinct when both present. Require explicit verified side mappings and a verified two-sided contest before deriving opponent identity or SNU vote direction. |
| `individual_judge_decision` | PK and FK `(person_id, panel_id)` to assignment. `vote_side` enum `aff, neg`, required on promotion, with scoped judge and source ballot evidence through the assignment source. At most one verified effective vote per assignment. Agreement across multiple observations corroborates one vote. Conflicting votes remain unresolved pending adjudication. Revisit the grain before promotion if validation finds multiple legitimate votes by one Person on one panel. |
| `panel_result` | PK `(panel_id)`. Independently verified `winner_side` (nullable `aff, neg`) and optional nonnegative Aff/Neg tally integers. Evidence must establish the result or split explicitly. Neither an individual ballot nor the majority of partially observed ballots establishes a result. |
| `paradigm_revision` | PK `revision_id`, unique `(person_id, evidence_id)` for one revision observation per Person and source evidence record. Immutable `text`, nullable `source_review_date date`, required `observed_at timestamptz`, evidence, policy and verification. Repeat captures may preserve identical text with different observation times. |
| Historical affiliation | Reuse `person_institution_affiliations` at its evidence-keyed grain, with Person, role, institution and temporal precision. See selection below. |

Use typed lineage junctions with a foreign key to each fact version and `warehouse_evidence.id`, a field or evidence role, and a composite uniqueness constraint over those columns. Every candidate has verification state (verified, unverified, conflicting, rejected) and a reason where unresolved. The primary keys above constrain the effective facts visible in one build. Retain candidate and prior versions with observation/verification timestamps and explicit supersession links so that an earlier cut can be replayed. A correction takes effect at its recorded verification time. An unresolved conflict in eligible inputs suppresses the affected effective value. Apply visibility before resolving candidates, so restricted corrections and conflicts cannot change public results.

### As-of selection

- **Affiliation.** Select a verified judge-role affiliation with evidence explicitly scoped to the tournament context, or a verified closed effective interval covering the evidenced competition date under ADR-003. A dated event-only observation needs an explicit tournament match. Open-ended or unknown periods require independent event-specific corroboration. For competing eligible institutions return unresolved context with evidence for the conflict. For an optional summary reference use the most recent dated assignment context with a resolved affiliation, showing its date and tournament.
- **Paradigm.** Select among verified eligible revisions observed by the evidence cutoff. Order by observation time descending, then by immutable evidence identity for byte-identical observations tied in time. Conflicting content at the latest observation time requires resolution. Report source review date separately as provider metadata. A later capture cannot appear in an earlier build even if its source review date predates the build.
- **Display name.** Use eligible verified Person name observations as of the cutoff, preferring the latest effective verified observation. Tied conflicting names remain unresolved. For TASK-019 the proof is a named scoped roster judge linked by explicit same-capture ballot Person evidence.

## Metric definitions

Within a build, let A be the eligible verified assignments for one Person, V the subset with a verified individual vote mapped to Aff or Neg, S the subset of A with at least one explicitly evidenced SNU panel entry, and D the subset of S with a verified individual vote and an unambiguous single SNU side. S uses the TASK-013 eligible same-event panel-entry-school chain. Two SNU entries count once toward exposure but yield no for/against classification. Absence of an SNU match is an observation limit, especially when entry or school links are missing.

| Output | Formula |
| --- | --- |
| Observed debates judged / assignment count | `count(A)`, TASK-013 `panelAssignmentCount`. The authoritative experience grain is Person × panel. Two flighted debates in the same named round count as two debates judged. Ballot rows can repeat for one judge/panel and judge IDs can alias one Person. A distinct round-ID count answers a different question. |
| Observed tournament count | Distinct tournament keys across A. |
| Aff and Neg counts | Count V separately for each verified vote side. |
| Known-vote denominator | `count(V) = aff_count + neg_count`. |
| Aff and Neg percentages | `100 * side_count / count(V)` in numeric arithmetic, each null when the denominator is zero. |
| SNU observed rounds | `count(S)` at the same assignment grain. Zero means zero observed in eligible data. |
| Votes for/against SNU | Count D where vote side equals/opposes SNU side, respectively. Panel result has no role in either count. |
| SNU known-decision denominator | `count(D) = for_count + against_count`. |
| SNU for/against percentages | `100 * direction_count / count(D)`, each null when the denominator is zero. |
| First and latest observed judging date | Minimum and maximum verified competition date across A, null when none are usable. |
| Observed season count | Count distinct approved season scope IDs with eligible included membership for events in A under the pinned revisions. |
| Coverage | `count(A) - count(V)` unresolved individual votes and `count(S) - count(D)` unresolved SNU decisions. Also count assignments missing verified dates, season membership, or complete entry/school observation, once per gap type per assignment. Report observed events with incomplete/unknown assignment coverage separately. Unresolved Person observations belong to scope diagnostics until linked to a Person. |

Counts over verified decisions can be zero while their coverage is unresolved. Calculate percentages from counts at the serving grain and round only for presentation. Judging history uses date span and season count.

## SNU detail

Proposed `judge_snu_detail` query keyed by `(person_id, panel_id)` within the same partition and build. Drive from A with an existence test for SNU entry evidence. Join only one effective row per key and aggregate evidence links independently to preserve grain.

Return Person key and eligible display name, tournament, competition date, event/division, round and panel keys and eligible labels, verified Aff and Neg entries, all explicitly observed SNU entry keys, SNU side, opposing entry when a unique SNU side and the opposing entry are verified, individual vote side, and nullable for/against flag. Include panel winner and split separately, tournament-time affiliation reference, evidence grouped by field, policy reference, and verification/gap flags. Unresolved attributes are null. Observed panel schools can be included as a separate evidence-backed list.

## Serving and authorization

Use a PostgreSQL public materialized view `judge_summary_public` over public-only eligible fact projections. Its grain is one Person per pinned coverage scope and build, with a unique index on `(scope_id, person_id)` for the active build and person lookup. Include the metrics and coverage above, eligible display name, optional affiliation and paradigm references, and build ID. Store full paradigm text in the revision relation. Index assignment projections by Person and panel, decisions by assignment key, panel entries by panel, and paradigm revisions by Person and observation time.

Pin scope membership revisions, evidence and verification cutoffs, mapping and policy versions, and source coverage in a build manifest. Fix these inputs in a consistent snapshot, apply eligibility and supersession, then reduce each fact to its key before grouping. Publish summary, detail query inputs and manifest on the same successful build boundary. Rebuilds from identical pins produce identical analytical values and references. Refresh after a verified ingestion batch, correction, membership change or policy change. A full rebuild regenerates effective projections from eligible versioned facts and refreshes the view. Retain the prior eligible build on transient failure and report its cutoff, last successful refresh and stale state. Remove access immediately when policy or retention invalidates it. Report freshness against the latest eligible input generation, separately from source coverage.

Public input requires the existing `warehouse_public_evidence` eligibility rules, across every required evidence link including capture and row policy, with no restricted grant. Exclude restricted values, counts, presence indicators and restricted-driven changes in freshness from the public build. Derived policy is the intersection of permitted audiences, purposes and grants of contributing inputs, with the strictest retention restriction. Suppress output if the intersection cannot be served. Join optional enrichment only after eligibility filtering and keep public lineage free of ineligible evidence IDs.

Future protected analytics should evaluate eligibility against the caller's grants before computing facts and aggregates. PostgreSQL materialized views store precomputed rows and refresh without per-reader recomputation, so filtering a mixed aggregate at read time cannot remove restricted contributions. Begin with grant-aware on-demand queries after explicit authorization. Any later protected materialization requires a separate, access-controlled partition per identical entitlement profile, request-time entitlement checks, and invalidation on grant or retention changes. Keep base tables and refresh privileges internal.

See the [field readiness matrix and verified example](judge-analytics-readiness.md).
