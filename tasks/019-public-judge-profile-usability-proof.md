# 019 · Public judge profile usability proof

**Status** Completed  
**Owner** Dennis Commander  
**Worker** Codex  
**Dispatch** Released  
**Review** Dennis and Jared  
**Priority** High

## Objective

Turn the verified TASK-013 public judge-activity contract into a coach-usable proof answering Jared's question: **"Who is this judge?"**

Produce three evidence-backed public judge profiles plus a field-coverage matrix before building any dashboard.

Use the durable Person model from ADR-003 / TASK-017. This task is public-data only.

## Required sample profiles

Start with the three checked-in TASK-013 sample people:

1. Tabroom person `175248` — known public activity includes SNU exposure.
2. Tabroom person `19665` — useful roster-gap case.
3. Tabroom person `775310` — useful missing-date/coverage case.

If one sample cannot support a meaningful profile, keep it as a documented negative example and select a replacement only from the same pinned public season with explicit evidence.

## Name / identity resolution

The central product question is human-readable identity.

For each profile:

- attempt to resolve a display name only from explicit **public structured Tabroom evidence** already permitted by the project;
- approved sources are the pinned public captures and bounded anonymous structured Tabroom endpoints already within the public adapter contract;
- no authenticated endpoints;
- no HTML scraping;
- no search-engine/name guessing;
- no name matching by school, initials, entry codes, or contextual similarity;
- preserve source path, capture/snapshot identity or request evidence, and verification state.

A name is **verified** only when the structured public source explicitly connects the name to the same judge/person identity chain.

If the permitted public data does not establish a name, show **Name unresolved from public evidence** and document the exact missing join. Never guess.

Any new live public fetch used for the proof must be narrowly bounded to these profiles, retain source provenance, and avoid introducing an unpinned hidden dependency into tests. Prefer the existing pinned capture archive whenever available.

## Profile contract

Each profile should present an executive-level coach view:

### At a glance
- verified display name, or explicit unresolved label;
- Tabroom person ID;
- observed panels judged using `panelAssignmentCount`;
- tournament count;
- divisions judged;
- observed first / most recent assignment dates;
- explicit SNU exposure panel and round counts;
- coverage warning when appropriate.

### Recent verified activity
For a small recent set:
- tournament;
- event/division;
- assignment date if known;
- round/panel IDs;
- schools observed on the panel;
- unresolved panel/school coverage where present.

### Evidence drilldown
Expose evidence references sufficient to trace each displayed fact to public source observations.

### Do not show yet
- paradigm text;
- vote history;
- Aff/Neg tendency;
- win rate;
- strategic prediction;
- "good/bad for SNU";
- subjective experience rankings;
- inferred current school/employer.

## Field-coverage matrix

Produce a machine-readable and Markdown matrix with at least:

- field;
- coach relevance;
- source;
- public / protected / unavailable;
- join key;
- verification status;
- freshness / last observed basis where applicable;
- UI allowed now?;
- caveat / missing dependency.

Include at minimum:

- display name;
- Tabroom person ID;
- institution/affiliation;
- observed panels judged;
- tournament count;
- division history;
- observed date span;
- SNU exposure;
- recent panel schools;
- paradigm;
- individual vote;
- panel result;
- Aff/Neg side;
- vote tendency;
- team/debater history.

## Implementation

Create a small typed profile derivation layer over the existing TASK-013 contract rather than a dashboard.

Suggested outputs:

- TypeScript profile contract / derivation;
- checked-in representative profile JSON for the three samples;
- Markdown coach-facing proof;
- field-coverage matrix;
- tests for display-name provenance, unresolved-name behavior, SNU exposure, missing dates, roster gaps, and evidence preservation.

Do not mutate the canonical warehouse solely for presentation fields unless explicit existing public identity evidence requires a narrowly justified relationship. Prefer a derived read model.

## Acceptance criteria

- Three public profiles are produced.
- Person `175248` remains the SNU-exposure example.
- Every displayed identity claim has explicit public provenance.
- No guessed name or affiliation appears.
- If names are resolvable, at least one profile demonstrates a verified human-readable name.
- If no permitted structured public source resolves names, the task may finish **Partial** with the profile/read-model implementation complete and the exact name-resolution gap documented.
- `panelAssignmentCount` remains the observed-experience measure.
- Coverage caveats distinguish "not observed" from "does not exist."
- Existing TASK-013 metrics remain unchanged.
- Full tests, TypeScript, and production build pass.
- No authenticated/private Tabroom access.
- No HTML scraping.
- No dashboard or visual ranking UI.
- No Neon deployment.

## Deliverables

- implementation and tests;
- three representative profile artifacts;
- field-coverage matrix;
- concise Jared handoff under `docs/handoffs/`;
- PROJECT_STATE refresh.

## Completion handoff

Report:

- STATUS
- WHAT I DID
- NAME RESOLUTION RESULT
- THREE PROFILE SUMMARY
- FIELD COVERAGE RESULT
- TEST RESULTS
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP

If public structured evidence cannot support the identity/name claim, surface that as the product gap instead of changing sources or weakening the evidence rule.


## Completion

Dennis approved the public judge-profile usability proof on 2026-11-24.

PR #17 merged at `4b2e3d72da0b6a7350f6ccba80a781855506edff`.

Leadership review reopened the pinned Phase A public capture archive from Dropbox. The relevant bulk files matched the manifest SHA-256 values exactly and supplied explicit named tournament-judge rows plus same-capture ballot `judge_person` links for all three samples:

- Tabroom person `175248` — Michael Scott;
- Tabroom person `19665` — LaToya Green;
- Tabroom person `775310` — Arya Persaud.

The final immutable PR head `94a94b87c57e51c4d3888fd382dbed4df407dd01` passed the GitHub-hosted verification harness: full Node tests, TypeScript, Next.js production build, fresh migration, upgrade, and PostgreSQL dump/restore.

No authenticated/private Tabroom data, HTML scraping, inferred affiliation, or dashboard work was introduced.
