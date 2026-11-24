# 021 · Judge analytics dimensional model and rollup contract

**Status** Completed  
**Owner** Dennis Commander  
**Worker** Codex  
**Dispatch** Released  
**Review** Chat with Dennis. Jared reviews downstream presentation only.  
**Priority** High

## Why this task exists

Dennis has explicitly shifted the immediate DebateOS priority back to the **data backend**. Jared owns downstream presentation decisions. The static TASK-020 judge-card remains only a usability/debugging aid.

DebateOS now needs a warehouse architecture that follows the classic analytical pattern:

1. evidence / source observations;
2. canonical dimensions and atomic fact tables;
3. derived rollups / materialized views for fast reporting.

The key architectural rule is:

> **Evidence is provenance. Atomic facts are authoritative analytical truth. Rollups are disposable derived serving structures.**

A rollup must always be reproducible from eligible atomic facts. No unique source fact may exist only in a rollup.

## Objective

Design the judge-intelligence dimensional model and metric contract needed to answer these coach/backend questions efficiently and consistently:

1. How many rounds has this judge judged?
2. What percentage of verified individual decisions are Aff vs Neg?
3. How many observed rounds has the judge judged SNU, and in what percentage did the judge vote for SNU vs against SNU?
4. What basic judge context is known: verified name, tournament-time institutional affiliation, and observed judging history / seasons?
5. What paradigm revisions exist, and what is the latest eligible paradigm as of a cutoff?
6. What are the row-level details for every observed SNU round judged by that person?

This task is primarily **architecture + metric definition**. It may add typed contracts or SQL prototypes/tests when useful, but it must not persist protected Tabroom data, broaden authenticated ingestion, or silently treat unresolved vote/side semantics as verified.

## Existing architecture to preserve

Read and honor:

- `AGENTS.md`
- `PLANS.md`
- `PROJECT_STATE.md`
- `docs/architecture/ADR-002-canonical-warehouse-model.md`
- `docs/architecture/ADR-003-person-role-affiliation-history.md`
- `src/warehouse/schema.ts`
- TASK-013 public judge activity
- TASK-014 authenticated judge-record validation
- TASK-017 durable Person relationships
- TASK-019 judge-profile field coverage

Do not replace the canonical evidence warehouse. The dimensional / analytical layer sits **on top of** the existing evidence-first model.

## Required architecture

### Layer A · Evidence / source layer

Preserve the current immutable capture/evidence model and authorization metadata.

Every dimension/fact promoted from source evidence must remain traceable to eligible evidence.

### Layer B · Dimensions

Define the role and grain of the dimensions needed for judge analytics. At minimum address:

- durable Person;
- tournament;
- event/division;
- round;
- panel;
- entry/team observation;
- school/chapter/institution;
- tournament-scoped judge identity;
- date/season if a separate analytical dimension is justified.

Do not duplicate stable canonical entities merely to imitate a star schema. If existing normalized tables already serve as dimensions, document that they are the dimensional keys used by the mart.

A Person must remain role-neutral. Institution and judge role are historical relationships, not permanent Person columns.

### Layer C · Atomic facts

Define exact grain, uniqueness, evidence lineage, verification state, and authorization inheritance for at least:

#### 1. Judge assignment fact

Candidate grain:

> one durable Person × one tournament/event/round/panel judge assignment

This is the authoritative basis for observed judging-count metrics.

It must prevent duplicate counting from:
- multiple ballot rows for the same judge/panel;
- multiple tournament-scoped judge IDs explicitly resolved to the same Person on one panel.

#### 2. Individual judge decision fact

Candidate grain:

> one durable Person × one panel × one verified individual decision

Keep the **individual judge vote** distinct from the **overall panel result**.

The contract must be capable of linking, when verified:
- Aff entry;
- Neg entry;
- judge vote side;
- overall panel result separately;
- SNU entry / side;
- round/panel/date context;
- tournament-scoped judge ID;
- source evidence;
- verification state;
- authorization policy.

Do not promote vote or side fields into verified facts until TASK-014 or equivalent validation establishes the exact source mapping.

#### 3. Panel result fact

Define separately from individual votes. Multi-judge split decisions must be representable without collapsing the individual ballot.

#### 4. Paradigm revision fact/history

One immutable observed revision of a person's paradigm, preserving:
- Person;
- paradigm text;
- source review date when supplied;
- capture/observation time;
- evidence/source;
- authorization;
- verification;
- revision/as-of behavior.

Do not overwrite prior paradigm text.

#### 5. Historical affiliation fact

Reuse / map the TASK-017 person-institution-affiliation model rather than creating a permanent `current_school` attribute. Define how tournament-time judge affiliation is selected as-of the event when evidence exists.

## Metric contract

Define one canonical formula and denominator for every metric.

At minimum:

### Observed rounds judged

Use distinct verified judge assignments at the chosen grain. The existing TASK-013 `panelAssignmentCount` behavior is the starting point.

Document why raw ballot-row count is invalid.

### Aff vote count / Neg vote count

Count only verified **individual judge decisions** whose side mapping is verified.

### Aff vote percentage

`verified Aff individual votes / verified individual votes with known Aff/Neg side`

### Neg vote percentage

`verified Neg individual votes / verified individual votes with known Aff/Neg side`

The percentages must share the same denominator and must not silently include unknown/unresolved votes.

### SNU observed rounds

Count verified judge assignments where at least one panel entry is explicitly evidenced as SNU.

A zero means **zero observed in eligible data**, never "the judge has never judged SNU."

### Votes for SNU

For SNU panels with verified individual vote and verified SNU side:

- judge vote matches SNU side = vote for SNU;
- judge vote opposes SNU side = vote against SNU.

Do not substitute overall panel result for the individual judge vote.

### SNU for percentage

`verified votes for SNU / verified SNU judge decisions with known SNU side and known individual vote`

### SNU against percentage

Same denominator as SNU for percentage.

### Observed judging history

Prefer:
- first observed judging date;
- most recent observed judging date;
- distinct observed seasons.

Do not store or display a mutable "years of experience" value as source truth. If a derived elapsed-year measure is proposed, label it clearly and document why it is safe.

### Tournament-time affiliation

Return only an evidenced/as-of affiliation valid for that context. No permanent school inference from panel participants.

### Current/latest paradigm

Use an as-of policy over immutable eligible paradigm revisions. Preserve the historical versions.

## Rollup / serving layer

Design the first fast judge-serving structure.

Prefer a PostgreSQL materialized view initially unless a physical aggregate table is clearly necessary.

A candidate `judge_summary` serving grain is:

> one durable Person per authorization/audience partition and evidence cutoff / refresh version

At minimum the rollup should be able to expose:

- person key;
- verified display name when eligible;
- observed judge assignment count;
- distinct tournament count;
- Aff vote count;
- Neg vote count;
- known-vote denominator;
- Aff percentage;
- Neg percentage;
- observed SNU assignment count;
- SNU known-decision denominator;
- votes for SNU;
- votes against SNU;
- SNU for percentage;
- SNU against percentage;
- first observed judging date;
- most recent observed judging date;
- distinct observed season count;
- latest eligible affiliation context if appropriate;
- latest eligible paradigm revision reference;
- freshness/evidence cutoff;
- coverage / unresolved counts needed to interpret denominators.

Do not put full paradigm text into a rollup merely for convenience if a key/reference is more appropriate.

### Materialized-view behavior

Specify:

- source facts;
- deterministic refresh;
- idempotent rebuild;
- indexes needed for person lookup;
- refresh timing after ingestion batches;
- stale/fresh metadata;
- what happens when facts are corrected or superseded;
- how the rollup is rebuilt from scratch.

If materialized views are insufficient because of access partitioning or refresh behavior, explain the exact limitation before proposing physical aggregate tables.

## Authorization and leakage rule

This is mandatory.

Protected facts must not leak through aggregates.

A rollup derived from protected votes, paradigms, or affiliations inherits the restrictive authorization/audience/grant rules of its inputs.

The design must explicitly address whether DebateOS needs:
- separate public materialized views;
- protected/grant-scoped marts;
- or another policy-aware serving strategy.

Do not create one global rollup that mixes protected and public inputs and then serves it publicly.

## Required SNU detail contract

Define a row-level query/view for "all observed SNU rounds judged by this Person."

Required columns when verified:

- Person / judge;
- tournament;
- date;
- event/division;
- round;
- panel;
- Aff entry;
- Neg entry;
- SNU side;
- opponent;
- individual judge vote;
- vote for/against SNU derived flag;
- overall panel result separately;
- affiliation at tournament if evidenced;
- evidence/provenance;
- verification / unresolved flags;
- authorization policy.

Unknown fields remain null/unresolved. Do not fabricate labels or winners.

## Source / readiness matrix

Produce a matrix for every required field/metric with:

- canonical warehouse target;
- known source;
- public / protected / unavailable;
- current verification status;
- whether it can be populated today;
- dependency needed to unlock it.

The architecture should clearly distinguish:

### Ready now from public verified data
Examples likely include:
- Person identity;
- observed assignment counts;
- tournament/division/date observations;
- SNU panel exposure;
- recent panel schools.

### Source observed but semantic mapping still gated
Examples likely include:
- individual vote;
- Aff/Neg side;
- panel result;
- judge-record history;
- paradigms.

Use the repository evidence to determine the exact classification rather than assuming.

## Deliverables

1. New ADR under `docs/architecture/` for the dimensional/fact/rollup design.
2. Metric-definition document or ADR section with exact formulas and denominators.
3. Source/readiness matrix.
4. Proposed PostgreSQL table/view/materialized-view DDL or typed schema sketch sufficient for implementation review.
5. Small example using a judge summary plus SNU-detail rows, using only already-verified sample/public fields. Unknown protected metrics must remain unresolved/placeholders rather than invented.
6. Update `PROJECT_STATE.md`.
7. Detailed handoff for Dennis under `docs/handoffs/`.

## Non-goals

- no UI redesign;
- no dashboard;
- no new React work;
- no persistent authenticated/private Tabroom ingestion;
- no vendor outreach;
- no HTML scraping;
- no inference of votes or winners from unverified fields;
- no broad schema migration until the architecture is reviewed;
- no Neon/deployment work;
- no AI strategic recommendation layer.

## Acceptance criteria

- Fact grains are explicit and testable.
- Dimensions reuse canonical identities where appropriate.
- Individual judge vote and overall panel result remain separate.
- Every rollup metric has one documented formula and denominator.
- Unknown/unverified decisions are excluded from percentages and counted as coverage gaps.
- SNU for/against is based on the judge's individual vote, not the panel result.
- Rollups are reproducible from facts and contain no unique source truth.
- Materialized-view refresh and rebuild semantics are specified.
- Authorization inheritance prevents protected aggregate leakage.
- The design can answer Dennis's six judge-backend questions once the gated decision fields are verified.
- The architecture identifies exactly what TASK-014 (or successor validation) must prove before decision metrics can be populated.

## Completion handoff

Report:

- STATUS
- DIMENSION MODEL
- FACT GRAINS
- METRIC DEFINITIONS
- ROLLUP / MATERIALIZED VIEW CONTRACT
- SNU DETAIL CONTRACT
- SOURCE READINESS
- AUTHORIZATION MODEL
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP

If a source semantic is not verified, leave the field unresolved and surface the dependency. Do not weaken the evidence rule to make the metric computable.


## Completion

Dennis approved ADR-004 on 2026-11-24 and explicitly confirmed that two flighted debates in the same named round count as two debates judged because the authoritative assignment grain is Person × panel.

PR #21 passed the owner-gated GitHub verification harness on immutable head `1feb7788206341da0c1ff5aa76bc6f46fa0d0e8e`: full Node tests, TypeScript, Next.js production build, fresh migration, base-to-head upgrade, and PostgreSQL dump/restore.

PR #21 merged at `6147ac6c6cea28c69eeefa9d0f552abef100b813`.

The architecture is accepted. Protected vote, side, result, affiliation, and paradigm promotion remain gated until their source semantics and authorization are separately verified.
