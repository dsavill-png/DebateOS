# 020 · Minimum judge-card UI contract and static coach prototype

**Status** Approved  
**Owner** Dennis Commander  
**Worker** Codex  
**Dispatch** Released  
**Review** Dennis and Jared  
**Priority** High

## Objective

Turn the completed TASK-019 judge-profile proof into the first coach-facing DebateOS interface contract.

Build a small **static judge-card prototype**, not a dashboard, using the three verified TASK-019 public profiles. The purpose is to let Dennis and Jared answer one product question:

> When a pairing arrives, what should a coach understand about the judge in the first few seconds, and what should require drill-down?

This task is intentionally narrow. It validates information hierarchy and interaction before we build broader product navigation or live database wiring.

## Product principles

Apply the established DebateOS UX rule:

1. **Bottom line first.**
2. **Minimum clicks for common coaching decisions.**
3. **Progressive disclosure for evidence and caveats.**
4. **Observed facts must not look like complete-history claims.**
5. **No AI branding or autonomous strategic recommendation layer.**
6. **Evidence/provenance remains accessible without crowding the first view.**

The first screen should feel like an executive briefing, not a raw database report.

## Source contract

Use the checked-in, verified TASK-019 artifacts only:

- `docs/coverage/college-policy-2025-26-r1-judge-profiles.json`
- `docs/coverage/public-judge-profile-field-coverage.json`
- TASK-019 handoff and evidence rules

Do not fetch Tabroom at runtime.

Do not use authenticated/private data.

Do not invent missing fields.

The sample people are:

- Michael Scott — Tabroom person `175248`
- LaToya Green — Tabroom person `19665`
- Arya Persaud — Tabroom person `775310`

## Required judge-card hierarchy

### Level 1 · Immediate coach view

A coach should be able to scan this without opening anything.

Show:

- verified judge name;
- compact identity context such as Tabroom person ID;
- **observed panels judged** using `panelAssignmentCount`;
- tournament count;
- observed date span;
- divisions judged;
- SNU exposure, with especially clear treatment when explicit SNU panels exist;
- one short coverage indicator that makes clear these are observed public records, not a complete career history.

Do **not** lead with IDs, hashes, source paths, or technical provenance.

### Level 2 · Recent activity

One interaction or progressive disclosure may reveal:

- up to three recent observed panels;
- tournament;
- event/division;
- assignment date or Unknown;
- schools observed on the panel;
- round/panel identifiers in secondary text;
- unresolved school/date coverage indicators.

### Level 3 · Evidence / data quality

A further disclosure should expose:

- identity verification status;
- public evidence references;
- roster/person join evidence;
- relevant coverage caveats;
- evidence cutoff;
- the distinction between "0 observed" and "none exists."

This layer can be technical. It should not dominate normal coaching use.

## Required visual states

The prototype must visibly distinguish:

1. **SNU exposure present**
   - Michael Scott has 2 observed SNU panels in 2 rounds.
   - This should be noticeable at first glance without turning into a subjective recommendation.

2. **Roster/coverage gap**
   - LaToya Green has an included-division roster gap while still having a verified public identity.
   - Do not imply the identity is uncertain.

3. **Missing assignment date**
   - Arya Persaud has an observed panel with no usable assignment date.
   - Show Unknown rather than fabricating a date.

4. **Zero SNU exposure**
   - Label as "0 observed SNU panels" or equivalent.
   - Never say "has never judged SNU."

## Field restrictions

Do not display or infer:

- judge paradigm;
- Aff/Neg voting tendency;
- vote record;
- panel result;
- win rate;
- inferred employer/current school;
- inferred ideological orientation;
- strategic recommendation;
- judge ranking or score;
- "good/bad for SNU";
- debater history not yet resolved into the profile contract.

A disabled or "not yet verified" teaser is not needed. Keep unavailable fields out of the normal card.

## Implementation

Build a lightweight Next.js prototype using the existing scaffold.

Preferred structure:

- a reusable typed `JudgeCard` component;
- a dedicated prototype route such as `/judge-proof`;
- three sample cards driven from the checked-in JSON rather than duplicated hard-coded facts;
- minimal local CSS with responsive behavior;
- semantic HTML and keyboard-accessible disclosure controls;
- no UI framework dependency unless clearly justified;
- no production API/database wiring.

The existing home page may link to the prototype, but do not turn the home page into a dashboard.

## UI contract document

Add a short product contract under `docs/product/` defining:

- Level 1 / Level 2 / Level 3 fields;
- wording rules;
- caveat rules;
- interaction rules;
- fields explicitly excluded;
- which TASK-019 fields map to each display element.

This contract is the artifact Jared and Dennis can approve before later live implementation.

## Tests / verification

At minimum:

- TypeScript passes;
- Next.js production build passes;
- existing test suite remains green;
- add focused tests for any nontrivial view-model formatting logic;
- verify "0 observed SNU panels" wording does not become a lifetime claim;
- verify Unknown date handling;
- verify verified identity and coverage-gap state can coexist.

Do not introduce snapshot-heavy UI tests or a browser-testing framework solely for this prototype.

## Acceptance criteria

- A coach can identify the judge and the key observed-history facts in a few seconds.
- Michael Scott's SNU exposure is prominent but factual.
- LaToya Green remains a verified identity despite the roster coverage warning.
- Arya Persaud visibly preserves the unknown-date state.
- Evidence and technical provenance are available through progressive disclosure.
- The interface never turns missing observations into negative claims.
- The prototype uses the TASK-019 JSON as its source.
- No authenticated/private source is used.
- No dashboard, search, auth, deployment, Neon, or live DB work.
- Full tests, TypeScript, and production build pass.

## Deliverables

- reusable judge-card component;
- static prototype route with all three profiles;
- minimal styles;
- UI contract under `docs/product/`;
- concise handoff for Dennis/Jared under `docs/handoffs/`;
- PROJECT_STATE refresh.

## Completion handoff

Report:

- STATUS
- WHAT I BUILT
- INFORMATION HIERARCHY
- THREE SAMPLE STATES
- TEST RESULTS
- PRODUCT QUESTIONS FOR DENNIS/JARED
- FILES / COMMITS
- RECOMMENDED NEXT STEP

Do not proceed from prototype to dashboard or live database wiring without a separate approved task.
