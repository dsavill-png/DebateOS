# TASK-022 · Public judge analytics mart

Completed. The manifest writer sets the public audience after checking the supplied manifest pin, anonymous authorization, source bytes and digest, and event pointer. It checks stored capture and observation eligibility before linking new membership evidence.

Migration 0003 repairs the historical 2025–26 revision 1. Its allowlist comes from the checked-in manifest. It checks the revision pin, capture identity, digest, route, request scope and policy, and the exact membership and evidence links before updating audience metadata. If a capture change would expose unrelated evidence, the migration rejects the repair. A fresh warehouse has no historical revision to repair.

PostgreSQL 18.7 single-user checks applied the migrations on an empty database and replayed the repair with a synthetic historical database populated from the pinned manifest metadata. The repaired revision had 160 eligible classifications. An unrelated internal observation stayed ineligible, and separate checks rejected a digest mismatch and a capture change that would expose unrelated evidence. The original source archive was unavailable.

Initial Codex-local dependency-backed verification was incomplete because the sandbox could not resolve the package registry or bind its disposable PostgreSQL socket. Leadership therefore required the repository's GitHub-hosted verification harness before merge.

Leadership review tightened the partial repair before merge: new-write capture conflict checks now require the exact season-membership purpose, and the historical repair requires the evidence observation's event type to match the pinned classification as well as its name and IDs. A regression case corrupts the observed event type and requires the migration to fail closed.

## Public mart implementation

Migration `0004_public_judge_analytics` adds build-scoped Person × panel assignments and panel × entry facts, with evidence junctions for assignments, entries and names. Assignment lineage retains each eligible ballot pointer and scoped judge ID. School and chapter links require a same-event entry and a same-capture school chain. Two explicitly evidenced SNU entries contribute one observed SNU debate. A zero SNU count applies to observed eligible panels in the build. Missing dates, entry/school gaps, and events with observed panels lacking public judge-assignment evidence remain visible.

The PostgreSQL function `build_public_judge_analytics` requires a scope, approved revision, manifest digest and UTC evidence cutoff. It reduces the eligible observations in a consistent snapshot. Build identity covers these pins, the mapping and policy versions, and the contributing evidence IDs and capture digests. Rebuilding with the same inputs keeps the same build ID and metrics. A later cutoff can select newly eligible contextual or school observations while earlier builds and evidence remain available. Contradictory public Person assertions leave the scoped judge unresolved. Refresh metadata carries the producing build's cutoff and first successful promotion timestamp. A rerun with identical inputs keeps both values. Freshness is relative to the explicitly selected inputs and their cutoff.

The function promotes the build and refreshes `judge_summary_public_cache` in one transaction. Query `judge_summary_public` and `judge_snu_detail_public` for serving. Both check current public evidence eligibility and suppress the affected build if an input loses its eligible policy. The materialized cache and derived tables are internal. Summary indexes cover scope plus Person and Person alone. Fact keys support Person-to-panel and panel-to-entry lookups, the SNU index covers matching panels, and the junctions have evidence lookup indexes. Use `(build_id, person_id, panel_id)` for assignment lineage and `(build_id, panel_id, entry_id)` for entry lineage.

The implementation pins one season revision per serving scope. Warehouse replay now retains separate round-date and name observations from public captures. Replay of the original bytes can add these observations to an existing capture. Aff/Neg, vote, result, affiliation and paradigm fields are absent from the mart contract.

### Build and refresh

Run the migration and replay from a local copy of the approved archive. The optional replay flag verifies the source captures using the existing season coverage validation and feeds the same public canonical replay used by the warehouse tests.

```sh
npm run db:migrate
node src/warehouse/run-season-coverage.ts docs/coverage/college-policy-2025-26-r1.json \
  CAPTURES_DIRECTORY 5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac --replay
node src/warehouse/run-judge-analytics.ts tabroom-college-policy-2025-26 1 \
  5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac 2026-11-23T18:06:06.000Z
```

Use a local `WAREHOUSE_DATABASE_URL`. Run the build after an eligible ingestion batch completes. For a full reconstruction, migrate a fresh warehouse, restore or replay the verified canonical inputs, and invoke the same build command. Build IDs reproduce when the retained warehouse evidence identities are preserved. Replaying into a fresh warehouse generates new canonical UUIDs while the provider-keyed facts and metrics reproduce. If the build transaction fails, its previous active build and cache stay in place subject to the read-time eligibility check. An operator can retry a transient failure with the same pins.

### Verification

- PostgreSQL 18.7 single-user mode passed the fresh SQL migration and the upgrade from migrations 0000–0003. The established TASK-017 relationship fixture passed and its public Person role observations remained accessible after upgrade.
- The mart SQL fixture passed on both paths. It covers ballot and alias lineage, two flighted panels in one round, cross-tournament counts, two SNU entries counting once, zero observed SNU debates, missing dates and schools, internal membership, protected assignments and corrections, deterministic rerun and rebuild, failed promotion, and read-time revocation.
- GitHub-hosted verification run 45643854289 passed at immutable head `f76917e830b70db5c128128fed965e7fff49bdbb`: locked dependencies, full Node test suite, TypeScript, Next.js production build, fresh migration, base-to-head upgrade preserving an existing Person, and PostgreSQL dump/restore all succeeded.
- PR #26 merged to `main` as `6e743b843f3bc9d2657976a17bbe397912a7ae2a`.
- The original pinned archive was not mounted in the hosted runner, so no new end-to-end archive replay was performed during closeout. The archive bytes/digests were previously verified in TASK-011/TASK-019; TASK-022 remains pinned to the manifest and stored digest/lineage checks.

