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
