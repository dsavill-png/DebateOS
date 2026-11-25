# 022 · Public judge analytics fact mart and materialized summary

**Status** Completed  
**Owner** Dennis Commander  
**Worker** Codex  
**Dispatch** Completed  
**Review** Verified and merged through PR #26 on 2026-11-25. Jared owns downstream presentation.  
**Priority** High

## Objective

Physically implement the **public-ready portion** of accepted [ADR-004](../docs/architecture/ADR-004-judge-analytics.md).

This is the first real judge-analytics mart. Build the atomic public facts and a reproducible PostgreSQL materialized-view serving layer using only already-verified public evidence.

The architecture must preserve the rule:

> Evidence is provenance. Atomic facts are authoritative analytical truth. Rollups are disposable and reproducible.

Dennis explicitly approved **Person × panel** as the authoritative "debates judged" grain. If one person judges two flighted debates in the same named round, that is **two debates judged**.

## Scope

Implement public-safe physical structures sufficient to answer, for an eligible Person:

- observed debates judged;
- observed tournament count;
- observed first/latest judging dates;
- observed distinct season count where the pinned scope supports it;
- observed SNU debates judged;
- public coverage gaps;
- row-level SNU debate details that are already verified publicly.

Do **not** populate or infer:

- Aff/Neg entry side;
- individual judge vote;
- Aff/Neg percentages;
- SNU for/against counts or percentages;
- panel winner/result;
- paradigm text/revisions;
- judge affiliation.

Those remain gated until their source semantics and authorization are separately verified.

## Blocker resolution authorization · 2026-11-24

The first TASK-022 dispatch stopped correctly because `persist-season-manifest.ts` writes the pinned season-membership captures and `season-event-classification` evidence with `audience: internal`, while ADR-004 requires every input that determines a public-mart row to be eligible through `warehouse_public_evidence`.

Dennis/Chat authorizes the following **narrow correction** so TASK-022 can proceed:

- **Do not weaken or bypass ADR-004 or `warehouse_public_evidence`.**
- Treat the already approved season-membership lineage as public-eligible only when its source is explicitly `authorization: 'anonymous public'`, its bytes match the pinned SHA-256 digest, the manifest pin matches, the event pointer/classification verification succeeds, the stored authorization class is `public`, and `grant_scope` is null.
- Update the manifest writer so newly persisted qualifying season-membership captures and `season-event-classification` evidence use `audience: public`.
- Add the smallest deterministic migration/repair needed for **already persisted qualifying rows** from the approved pinned season revision. The repair must be bounded to the season-membership policy/evidence path and approved capture IDs; it must not broadly relabel arbitrary internal evidence.
- Preserve immutable source identity, digests, pointers, evidence lineage, revision identity, and retention semantics. Do not fabricate replacement evidence merely to obtain a public label.
- Unrelated internal evidence, protected/authenticated evidence, account-scoped evidence, restricted grants, raw protected values, and any evidence that fails the public-eligibility checks must remain excluded.
- Add a regression test proving an internal/protected row cannot influence scope membership, fact presence, counts, coverage, freshness, or the public materialized view.
- After this correction, continue the original TASK-022 implementation and full verification. If the bounded correction cannot be implemented without destructive evidence rewriting or weakening the public/protected boundary, stop and report Blocked again.

This authorization changes the **policy metadata for verified anonymous-public season-membership evidence**, not the analytical scope, metric definitions, or protected-data policy.

## Existing-row repair clarification · 2026-11-24

The second TASK-022 dispatch confirmed that the original TASK-011 capture archive is not mounted in the GitHub Actions workspace. That does **not** require exposing Dropbox or weakening the public-evidence rule.

For **new writes**, continue to require the original source bytes and verify each source SHA-256 before persistence exactly as `persistSeasonManifest` does today.

For the **already persisted approved 2025–26 season-membership rows only**, a migration/repair may rely on the existing stored capture identity and digest because those rows were created by the ingestion path that verified the original bytes before insert, and the pinned archive was independently replayed and verified during TASK-011/TASK-019.

The repair is authorized only when all of the following are true:

- the scope is exactly `tabroom-college-policy-2025-26`, revision 1;
- the capture ID appears in `docs/coverage/college-policy-2025-26-r1.json`;
- the stored capture digest exactly equals that manifest entry's SHA-256;
- the manifest source authorization is exactly `anonymous public`;
- stored `authorization_class = 'public'`;
- stored `grant_scope IS NULL`;
- the retained purpose is `season membership evidence`;
- retention remains `public-evidence`;
- event-classification evidence is role `season-event-classification` and is linked through `season_membership_evidence` to the approved revision;
- no unrelated evidence row is updated merely because it shares a capture.

The migration must fail closed if any expected capture, digest, scope, revision, policy field, or membership/evidence relationship does not match. It may update only the qualifying capture/evidence `audience` metadata needed to satisfy `warehouse_public_evidence`.

The Dropbox archive remains the durable original-byte source and does not need to be copied into the public GitHub repository for this existing-row repair.

## Required source reading

Read and preserve:

- `AGENTS.md`
- `PLANS.md`
- `PROJECT_STATE.md`
- `docs/architecture/ADR-002-canonical-warehouse-model.md`
- `docs/architecture/ADR-003-person-role-affiliation-history.md`
- `docs/architecture/ADR-004-judge-analytics.md`
- `docs/architecture/judge-analytics-readiness.md`
- `src/warehouse/schema.ts`
- TASK-013 public judge activity implementation/tests
- TASK-017 durable Person relationship schema/tests
- TASK-019 verified judge profiles

No architecture substitution.

## Physical fact model

Implement the public-ready form of the following logical structures, choosing names consistent with repository conventions.

### 1. Judge assignment fact

Grain:

> one verified durable Person × one panel

Requirements:

- canonical Person FK;
- canonical panel FK;
- effective tournament-scoped judge lineage retained separately;
- one assignment row regardless of duplicate ballot observations;
- multiple scoped judge IDs explicitly linked to the same Person on one panel must still yield one assignment;
- evidence lineage required;
- verification state required;
- authorization/public eligibility inherited from contributing evidence;
- assignment must not bridge panel/judge/person evidence across incompatible tournament scopes.

The fact should support:
- competition date when verified;
- tournament/event/round/panel relationships via canonical FKs;
- public SNU exposure derived only from explicit panel-entry-school evidence;
- coverage flags needed by the serving layer.

### 2. Assignment-source lineage

Retain all public evidence supporting the effective Person × panel assignment, including:
- tournament-scoped judge identity;
- person-link evidence;
- panel-assignment evidence.

Do not collapse multiple supporting ballot rows into lost provenance.

### 3. Panel-entry analytical relation

Implement the public-safe panel-entry relation required by ADR-004.

Grain:

> one panel × one entry

Requirements:

- same-event validation;
- verified school/chapter relationship where available;
- explicit SNU classification when the evidenced school is Southern Nazarene University;
- evidence lineage;
- unresolved/partial school coverage remains visible.

Do not add Aff/Neg side columns as verified values in this task.

## Build / promotion strategy

Do not hand-maintain fact rows.

Implement a deterministic build/promotion path from eligible public canonical evidence into the fact layer.

Requirements:

- idempotent rerun;
- evidence cutoff / build manifest or equivalent pinned build identity;
- same inputs produce same effective fact keys and analytical metrics;
- corrections/supersession can be represented without destructive loss of prior evidence;
- public facts must depend only on public-eligible evidence;
- protected evidence must not affect public fact presence, coverage, freshness, or aggregates.

If the repository's current schema requires candidate/effective views rather than directly persisted effective facts, use the smallest approach consistent with ADR-004 and document it.

## Public judge summary materialized view

Create a PostgreSQL materialized view or equivalent accepted by ADR-004, preferably named consistently with `judge_summary_public`.

Serving grain:

> one eligible Person per pinned public analytics build/scope

At minimum expose:

- Person key;
- verified display name reference/value if already supported by eligible public evidence without duplicating unique source truth;
- observed debate-assignment count;
- distinct observed tournament count;
- first observed judging date;
- most recent observed judging date;
- distinct observed season count where supported;
- observed SNU debate count;
- assignments missing usable date;
- assignments with incomplete/unknown panel-entry or school coverage;
- observed events with incomplete/unknown assignment coverage if the source contract supports it;
- evidence/build cutoff or build ID;
- refresh/freshness metadata needed to identify the producing build.

Decision-related fields may be represented only as clearly named **coverage placeholders** if useful, for example:
- verified individual decision count = 0 in a public-only build;
- unresolved decision coverage count = assignment count;
- percentage = NULL.

Do not expose a zero in a way that means "judge has never voted Aff/Neg." Any such zero must mean "zero verified eligible decision facts in this build."

### Indexing

Add indexes needed for:
- Person lookup in the summary;
- Person → assignment drilldown;
- Person → SNU detail;
- panel → entries;
- evidence lineage lookup.

A unique index required for concurrent materialized-view refresh may be added if the chosen refresh strategy uses it.

## Materialized-view refresh contract

Implement and test/document:

- deterministic initial build;
- refresh after a verified ingestion/build batch;
- full rebuild from scratch;
- identical results for identical pinned inputs;
- safe behavior on refresh failure;
- stale/fresh metadata or build reference;
- correction behavior;
- no protected-input leakage.

Do not introduce an external scheduler. A callable build/refresh command is enough.

## Public SNU detail view/query

Implement a row-level public-safe view/query keyed by Person × panel for observed SNU debates.

Return fields already verified publicly:

- Person ID/key;
- verified display name if eligible;
- tournament ID/name when evidenced;
- competition date when available;
- event/division;
- round ID/label where available;
- panel ID;
- observed panel entries / schools;
- explicit SNU entry or school observation;
- tournament-scoped judge IDs in lineage where useful;
- verification/coverage flags;
- evidence references or a stable path to lineage;
- build/cutoff metadata.

The following must remain null/absent/unresolved:
- Aff entry;
- Neg entry;
- SNU side;
- opponent as side-specific concept;
- individual judge vote;
- vote for/against SNU;
- panel result;
- affiliation;
- paradigm.

## Verification cases

Automated tests must include at least:

1. Duplicate ballot observations for one judge/panel → one Person × panel assignment.
2. Two scoped judge IDs explicitly linked to the same Person on one panel → one assignment with both in lineage.
3. Same Person on two panels in one named round/flight context → **two debates judged**.
4. Same Person on panels in two tournaments → assignment count 2, tournament count 2.
5. Explicit SNU panel entry → increments SNU debate count once.
6. Two SNU entries on one panel → SNU exposure count still increments once.
7. No SNU evidence → zero **observed** SNU debates, never a lifetime negative claim.
8. Missing round date → assignment retained and missing-date coverage increments.
9. Partial/unresolved school join → assignment retained and coverage gap visible.
10. Restricted-only assignment/correction/evidence → no change to public fact/rollup/detail.
11. Rerun identical build → idempotent facts and identical summary metrics.
12. Materialized-view refresh/rebuild produces the same outputs for the same pinned build.
13. Existing TASK-013/TASK-017 metrics and identity behavior remain intact.
14. Fresh migration, upgrade migration, dump/restore, full Node tests, TypeScript, and production build pass.

## Migration / upgrade

This is a physical schema task.

Require:

- a new Drizzle migration;
- fresh database migration test;
- upgrade from current `main`;
- preservation of existing Person and relationship data;
- dump/restore verification;
- no destructive rewrite of canonical evidence.

## Deliverables

- schema and migration;
- fact-building/promotion code;
- materialized summary view and refresh/build path;
- public SNU detail view/query;
- indexes;
- fixtures/tests;
- concise architecture implementation note if the physical design needs clarification;
- handoff under `docs/handoffs/`;
- `PROJECT_STATE.md` refresh.

## Non-goals

- no protected/authenticated ingestion;
- no TASK-014 execution;
- no Aff/Neg or vote inference;
- no panel-result inference;
- no paradigm persistence;
- no affiliation inference;
- no UI redesign;
- no new dashboard;
- no vendor outreach;
- no HTML scraping;
- no deployment/Neon;
- no AI strategy layer.

## Acceptance criteria

- Public atomic assignment facts exist at Person × panel grain.
- Two flighted panels in one named round count as two debates judged.
- Duplicate ballot rows and scoped judge aliases do not double count.
- Public panel-entry/SNU facts are evidence-backed.
- Public summary materialized view is reproducible from facts.
- Public SNU detail is row-level and evidence-backed.
- Missing/unresolved data remains visible as coverage, not fabricated certainty.
- Rollup rebuild is deterministic/idempotent.
- Protected inputs cannot influence public metrics or freshness.
- Full verification passes.

## Completion handoff

Report:

- STATUS
- PHYSICAL FACT TABLES
- BUILD/PROMOTION PATH
- MATERIALIZED VIEW
- SNU DETAIL
- INDEXES
- TEST RESULTS
- MIGRATION RESULTS
- PUBLIC/PROTECTED BOUNDARY
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP


## Completion record · 2026-11-25

TASK-022 passed leadership review and the GitHub-hosted verification harness at head `f76917e830b70db5c128128fed965e7fff49bdbb`. The harness passed the full Node test suite, TypeScript check, Next.js production build, fresh migration, upgrade preserving existing Person data, and PostgreSQL dump/restore. PR #26 merged to `main` as `6e743b843f3bc9d2657976a17bbe397912a7ae2a`.

The original pinned archive was not mounted in the hosted runner, so no new archive replay was performed in this closeout. That is not a merge blocker for TASK-022: the approved source bytes and digests were previously verified in TASK-011/TASK-019, while the TASK-022 repair and mart remain pinned to the checked-in manifest, stored capture identity/digest, and public-evidence eligibility rules. Protected vote/side/result/paradigm/affiliation fields remain gated.
