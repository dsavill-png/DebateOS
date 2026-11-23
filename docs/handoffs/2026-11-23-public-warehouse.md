# TASK-012 · Public warehouse implementation and verification

The draft implements the Drizzle/PostgreSQL foundation for the single canonical warehouse. Replay accepts the existing adapter batch and retained bytes. It does not fetch data. The Harvard test verifies checked-in fixture SHA-256 digests and records original-response digests separately. Capture and row authorization must both permit public access for a row to appear in the public evidence view. Consumers must apply the same rule to every input to any future joins and projections.

## Schema

All provider identities below use UUID primary keys. The application stores provider IDs in separate source columns. Every scoped tuple is required and unique. The slash-separated components are source IDs in column order after `provider`.

| Table | Source tuple after provider |
| --- | --- |
| tournaments | tournament |
| categories | tournament / category |
| events | tournament / event |
| schools | tournament / school |
| chapters | chapter |
| entries | tournament / event / entry |
| students | tournament / school / student |
| timeslots | tournament / timeslot |
| rounds | tournament / event / round |
| panels | tournament / event / round / panel |
| judges | tournament / judge |
| persons | person |

Parent foreign keys use the full provider scope. Panel judge assignment is unique on panel and judge UUIDs. Capture ID is the capture primary key. Warehouse evidence is unique on snapshot, parser version, pointer and output role and preserves raw source values, differing observations and multiple supporting rows. Season revisions are unique on scope and version. Season membership is unique on revision and event. Supporting evidence is unique on membership and evidence.

Entry roster, school/chapter, category/judge, panel/entry, candidate judge/person, ballot/score, bulk result-set/standing/value, and publication observations use roles in the shared evidence table. Bulk set identity stays tied to the snapshot and pointer. No REST set crosswalk or panel winner is asserted. Evidence relationships stored in JSON still depend on replay validation. The public view is for individual eligible evidence rows and does not resolve facts across multiple evidence inputs.

## Verification

- The pre-foreign-key database probe passed repeated round IDs across events, student IDs across schools, panel IDs across rounds and entry IDs across events. Each pair yielded two distinct UUIDs. Full-key replay inserted zero duplicates. The final migration and test suite confirmed these cases with the parent foreign keys present.
- The pinned Harvard replay preserved 3 captures, tournament 40923, event 389106, round 1587204, panel 9200905, 2 ballot rows, 1 panel judge assignment, and verified judge 2912715/person 366665 evidence. Sequential and concurrent replay preserved the same evidence UUIDs. The panel winner stayed unresolved.
- The synthetic Harvard variant exercised same-school and cross-school roster references, standalone timeslots, missing and empty score arrays, a raw score and a raw standing value. The policy test excluded protected capture lineage and protected rows independently.
- Node 24.22.3, PostgreSQL 17.9, Drizzle ORM 0.45.4, Drizzle Kit 0.31.11, and pg 8.23.1. The original 8 application tests and 3 new PostgreSQL tests passed, as did standalone TypeScript and the Next.js 16.4.6 production build.

## Disposable migration and recovery

Use a fresh PostgreSQL database. Run `npm ci`, set `WAREHOUSE_DATABASE_URL` to the disposable database URL, and run `npm run db:migrate`. Set `WAREHOUSE_TEST_URL` to the same URL and run `npm test`. Without that variable, the PostgreSQL cases are skipped. The suite applies the tracked migration and exercises an already migrated database when repeated.

Backup with `pg_dump --format=custom --file=warehouse.dump SOURCE_URL`. Create a second empty database and run `pg_restore --exit-on-error --dbname=RECOVERY_URL warehouse.dump`. Point `WAREHOUSE_TEST_URL` at the restored database and rerun the tests. The recovery exercise restored the Drizzle migration journal, 4 captures, 84 evidence rows and 1 panel judge assignment before all 11 tests passed again. The initial schema is additive. Replacing an empty database is reversible. After evidence has been written, use a backup restore or a tested forward fix to avoid dropping captured evidence.

## Remaining acceptance work

Verify duplicate/ambiguous roster cases in PostgreSQL, complete typed foreign-key support for JSON evidence relationships and resolve standing references only with verified same-scope evidence. Add a path for source-operation outcomes that the existing public adapter reports only as diagnostics. Review the public evidence field projection before allowing inputs beyond the curated fixtures. Separate Dennis approval is required to merge.
