# 014 · Authenticated Judge Record API Validation

**Status** Draft / Gated  
**Owner** Dennis Commander  
**Worker** Work, upon release  
**Review** Chat with Dennis. Consult Jared on any UI-facing contract.  
**Dependencies** [TASK-003](003-tabroom-authentication.md) and Tabroom authorization for the proposed access. [ADR-002](../docs/architecture/ADR-002-canonical-warehouse-model.md) governs the warehouse proposal.

## Objective

Verify whether supported Tabroom authenticated APIs can reconstruct the judge history visible in Tabroom, field by field, then propose a warehouse contract based on the verified mappings and limitations. Use Dennis's supplied 15-page Tabroom judge record as the comparison reference after authorization.

## Existing evidence

The [TASK-003 discovery addendum](../docs/research/tabroom-authenticated-access.md) records a person object with paradigm, review date and certifications from `/rest/paradigms/{personId}`. For one tested person, `/rest/paradigms/{personId}/record` returned 324 judging-history records with tournament IDs, event and round labels, and vote fields. Round-level result structures were observed. Team and winner joins remain unverified. These observations establish candidate sources for validation.

## Required field checks

| Field | Evidence to verify |
| --- | --- |
| Tournament | Stable tournament ID and visible tournament name |
| Level | Visible level or category and its source meaning |
| Date | The date shown in the record and the source date and time-zone convention that reproduce it |
| Event | Event or division identity and visible label |
| Round | Visible round label and an explicit round ID or verified crosswalk |
| Aff | Affirmative entry or team identity, display label and explicit side evidence |
| Neg | Negative entry or team identity, display label and explicit side evidence |
| Vote | Individual judge vote tied to the correct person and panel |
| Result | Overall panel decision, including vote split where displayed, supported by an explicit result or verified mapping |
| Paradigm | Statement text and review date, verified separately as a versioned stream |

## Acceptance after release

- Agree on a bounded sample and request cap before accessing protected endpoints. Compare selected visible rows from Dennis's own record field by field. Where available, include a split panel where Dennis's vote differs from the panel decision.
- Require exact or explainable matches for tournament, date, event, round, Aff, Neg, vote and result. Include level and the paradigm text and review date in the validation report. For each field, document its source, join keys, match status, and any transformation. Flag label-only, unavailable, ambiguous and mismatched fields explicitly, and leave unsupported mappings unresolved.
- Review the candidate grain of one judge person per tournament, event, round and panel. Test uniqueness, including multiple panels per round and multiple scoped judge IDs linked to a person, before adopting that grain. Link verified Aff and Neg entries, the individual judge vote, the overall panel result and source provenance. Preserve the individual vote and panel result as distinct facts. Keep tournament-scoped judge IDs distinct from person IDs and require an explicit identity link.
- Propose immutable paradigm revisions separately from judging-history observations. Document provenance and access controls for both streams, including observation time, source and authorized scope, and distinguish the source review date from the observation time.
- Deliver a field matrix and a contract recommendation that identifies supported joins, gaps and unresolved grain questions. Use sanitized evidence in the handoff.

## Authorization and scope limits

TASK-003 remains the gate. Obtain and record Tabroom confirmation of supported backend credentials, session lifetime and renewal, endpoint and role scopes, rate limits, and permitted data handling. Release only the agreed bounded validation after authorization. No broad harvest, HTML scraping, or winner inference from ambiguous structures. No persistent protected ingestion of paradigms or judging records until TASK-003 and vendor approval are in place and Dennis separately approves ingestion. Keep the supplied reference and protected response bodies out of GitHub.

## Credential-free mapper proof

The prototype in [judge-evidence.ts](../src/tabroom/judge-evidence.ts) accepts synthetic response rows and caller-supplied field names and crosswalks. The TASK-003 evidence establishes the response shapes and the TASK-023 proof validates 14 mapped comparisons. Neither source supplies a reusable protected payload fixture. The test field names document the synthetic projection and require validation against an authorized source before live use.

- **Paradigm:** Require the returned Tabroom Person ID to match the expected ID and resolve through an explicit canonical Person link. Key immutable revisions by Person and evidence ID. Keep review date, observation time and evidence separate. Distinct observations of the same text can coexist. As-of selection receives already eligible evidence and uses the observation cutoff. Conflicting latest observations remain unresolved.
- **History:** Resolve the record owner through the same canonical Person crosswalk. Require a row-specific panel link with matching tournament and Person. Group by Person × canonical panel and retain distinct evidence per observation. Keep vote and result independent and surface conflicts per fact. Event and round labels provide context. Entry/side crosswalks and result splits remain outside this prototype pending sufficient evidence.
- **Level:** The [public inventory](../docs/research/tabroom-public-data-inventory.md) records event division, type and category. These are candidates for comparison with the displayed Level after an explicit event join. The evidence does not establish which one reproduces the display. Leave the field null.
- **Date:** Public bulk provides optional round start times and standalone timeslots, while the prior [protected schedule observation](../docs/research/tabroom-authenticated-access.md) demonstrates a specific round-to-timeslot ID link. The small Harvard replay fixture also carries tournament start/end timestamps without a timezone. A competition date requires an explicit round/schedule join and a documented display-timezone rule, tested across tournament days and midnight boundaries. Leave the date null until confirmed.
- **Promotion:** ADR-002 and [ADR-004](../docs/architecture/ADR-004-judge-analytics.md) require per-fact evidence and authorization. The mappers produce candidate observations in memory. Workflow integration, approved access, storage and serving remain gated.

## Credential-free warehouse projection

The [candidate projection](../src/tabroom/judge-warehouse-projection.ts) uses canonical Person, scoped judge and panel IDs. The caller must verify same-tournament assignment and identity links, and supply the field evidence and pinned mapping version. Evidence IDs refer to `warehouse_evidence`, including capture, parser, pointer and policy provenance.

- `judge_assignment` groups by Person and panel. Assignment sources deduplicate on scoped judge and row evidence. Distinct eligible evidence can corroborate one effective individual decision.
- `individual_judge_decision` resolves eligible observations independently for each Person and panel. `panel_result` resolves explicit result observations once per panel, across judges. Incomplete ballot coverage cannot establish the winner. Conflicting recognized values suppress the affected value. An unrecognized observation is retained in its own diagnostic even when another observation supplies a recognized value.
- `paradigm_revision` keeps immutable Person/evidence observations, with separate lineage for text and review date. The source date can be withheld independently of text. Select as of the observation cutoff.
- Apply field evidence eligibility before reconciliation. Public callers must supply IDs eligible through `warehouse_public_evidence` and verified at the pinned cutoff. Any future protected caller needs a grant-aware policy evaluation across every required input. This projection is in-memory. It performs no policy queries, persistence or serving.
- Level, display date/time zone, entry side mappings and explicit result splits still require bounded authorized source validation.
