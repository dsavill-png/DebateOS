# Judge analytics source readiness

“Today” means the verified public contract can populate the field when eligible observations exist. It does not imply full coverage or an implemented mart. See the [TASK-019 field audit](../coverage/public-judge-profile-field-coverage.md) and [TASK-014 validation gate](../../tasks/014-authenticated-judge-record-api-validation.md).

| Field or metric | Warehouse target | Known source and access | Verification / populate today | Dependency |
| --- | --- | --- | --- | --- |
| Person and display name | `persons` and eligible name evidence | Public explicit ballot Person link and named bulk roster | Verified in pinned examples. Yes where linked. | Same-capture scoped roster and ballot agreement for name. |
| Scoped judge ID | `judges`, `panel_judges`, assignment source | Public bulk ballots and category rosters | Verified where explicit. Yes, including ballot-only scoped IDs. | Keep unresolved Person links in scope diagnostics. |
| Tournament, division, round, panel, labels | Canonical tournament, event, round, panel keys and evidence | Public bulk and pinned membership | Verified in scope. Yes where evidenced. | Validate scoped joins. TASK-014 must crosswalk protected record labels/IDs including level. |
| Date, first date, latest date | Verified round date and summary | Public bulk round start time | Yes for usable dates. | Verify protected record display-date and time-zone convention separately. |
| Season count | `season_memberships` and summary | Approved revision and public membership evidence | Yes within pinned coverage. | Resolve missing membership with an approved revision. |
| Assignment and tournament counts | Assignment and summary | Public TASK-013 v2 assignment chain | Yes. Observed counts. | Verify explicit Person mappings and record coverage. |
| Panel entries, observed schools, SNU entry and assignment count | Panel entry and SNU detail/summary | Public bulk ballot entry, same-event entry and school | Yes for explicit links. Side-independent. | Missing school links remain coverage gaps. |
| Aff entry, Neg entry, SNU side and opponent entry | Panel sides and detail | Public raw side values, protected judge record comparison | Mapping unverified. No. | Verify both side-to-entry joins and identify the unique SNU side from evidenced entries. |
| Individual vote, Aff/Neg counts, known denominator and percentages | Individual decision and summary | Protected record or ballot and verified side mapping | No verified decisions today. Verified counts/denominator zero within the public build, percentages null. | Verify exact Person/panel/scoped judge and individual vote mapping. |
| For/against flag, counts, denominator and percentages | SNU detail and summary | Derived from verified vote and SNU side | Flag and percentages null today. Verified counts and denominator zero. | Verify both mappings independently. |
| Overall result and split | Panel result | Public raw bulk results and protected result structures | Semantics unresolved. No. | Verify overall result and split against the record independently of individual ballots. |
| Tournament-time and latest affiliation reference | `person_institution_affiliations` | No verified sample affiliation. Schools on panels are public. | Unresolved. No. | Obtain eligible event-specific or valid-interval judge affiliation evidence. |
| Paradigm revision text, review/observation date and latest reference | Paradigm revision | Protected person paradigm REST observation | Candidate source only. No public revision. | Verify text, review date, observation semantics and authorization separately. |
| Freshness, cutoff, coverage, lineage, verification and policy | Build manifest, evidence and eligible projections | Public manifest, capture metadata, row policies and scope diagnostics | Available as inputs for build metadata and gap counts. | Pin exact inputs and protect derived metadata with the same eligibility rules. |

## Validation needed before promotion

TASK-014 or an equivalent separately approved validation must reconcile tournament, level, date and time zone, event, round and panel IDs or verified crosswalks against the bounded reference. Confirm how multiple panels in one round, duplicate ballot observations and multiple scoped IDs for one Person affect uniqueness. Verify both entries and their sides, the individual vote tied to the correct Person, and the panel winner and split independently. Include a split where the judge's vote differs from the result when available. Verify paradigm text and review date separately from capture time. Record mappings and unresolved fields, with authorization covering this use before any promotion.

## Verified public example

Michael Scott (`tabroom:175248`) has 4 observed assignments across 2 tournaments in the pinned 2025–26 coverage, one observed season. Dates span 2025-11-01 through 2026-01-03. Two assignments have explicit SNU exposure. Two observed divisions have incomplete or unknown assignment coverage. The evidence cutoff is `2026-11-23T18:06:06.000Z`.

Aff, Neg and SNU for/against verified counts and both known-decision denominators are zero. All four percentages are null. Four assignments lack verified individual votes and both SNU assignments lack verified SNU vote direction. Name is verified. Affiliation and paradigm references are unresolved.

Both detail rows are from the 3rd Annual Sunflower Swing Part 1 hosted by KU on 2026-01-03.

| Division | Round | Panel | Observed panel schools |
| --- | --- | --- | --- |
| JV | `1434283` | `8614591` | Southern Nazarene University, University of Houston |
| Open | `1434290` | `8613913` | University of Wyoming, Southern Nazarene University |

Aff and Neg entry references, SNU side, opponent entry, individual vote, for/against flag, overall result and affiliation are unresolved on both rows. The observed school names are independent of side verification. Both rows use public evidence. Follow the round/panel, scoped judge and school references in the [profile evidence](../coverage/college-policy-2025-26-r1-judge-profiles.json) to the [pinned manifest](../coverage/college-policy-2025-26-r1.json).

## Implementation review cases

| Case | Expected outcome |
| --- | --- |
| Repeat a ballot and add a second scoped judge ID explicitly linked to the same Person on the panel. | One assignment with both scoped IDs in lineage. |
| Assign that Person to another panel in the same round. | Two assignments. |
| Add a verified Aff individual vote on a Neg-winning panel with verified SNU on Aff. | One Aff vote and one vote for SNU. Panel result remains Neg. |
| Remove verified side mapping on an observed SNU panel. | Keep the SNU assignment. Exclude it from the SNU denominator and record the gap. |
| Add only restricted evidence or a restricted correction, then rebuild public. | Public metrics, coverage, lineage and freshness stay unchanged. |
| Rebuild from identical pins, then rebuild at a cutoff that includes an eligible correction. | Identical analytical results for identical pins. Corrected output at the later cutoff with the original still reproducible subject to policy and retention. |
