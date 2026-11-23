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

Entry roster, school/chapter, category/judge, panel/entry, candidate judge/person, ballot/score, bulk result-set/standing/value, and publication observations use roles in the shared evidence table. Bulk set identity stays tied to the snapshot and pointer. No REST set crosswalk or panel winner is asserted. Replay validates relationships and writes typed links alongside their JSON evidence. The public view is for individual eligible evidence rows and does not resolve facts across multiple evidence inputs.

## Verification

- The pre-foreign-key database probe passed repeated round IDs across events, student IDs across schools, panel IDs across rounds and entry IDs across events. Each pair yielded two distinct UUIDs. Full-key replay inserted zero duplicates. The final migration and test suite confirmed these cases with the parent foreign keys present.
- The pinned Harvard replay preserved 3 captures, tournament 40923, event 389106, round 1587204, panel 9200905, 2 ballot rows, 1 panel judge assignment, and verified judge 2912715/person 366665 evidence. Sequential and concurrent replay preserved the same evidence UUIDs. The panel winner stayed unresolved.
- The synthetic Harvard variant exercised same-school, cross-school, and duplicate/ambiguous roster references, standalone timeslots, missing and empty score arrays, a raw score and a raw standing value. The policy test excluded protected capture lineage and protected rows independently.
- Node 24.22.3, PostgreSQL 17.9, Drizzle ORM 0.45.4, Drizzle Kit 0.31.11, and pg 8.23.1. The original 8 application tests and 3 new PostgreSQL tests passed, as did standalone TypeScript and the Next.js 16.4.6 production build.

## Disposable migration and recovery

Use a fresh PostgreSQL database. Run `npm ci`, set `WAREHOUSE_DATABASE_URL` to the disposable database URL, and run `npm run db:migrate`. Set `WAREHOUSE_TEST_URL` to the same URL and run `npm test`. Without that variable, the PostgreSQL cases are skipped. The suite applies the tracked migration and exercises an already migrated database when repeated.

Backup with `pg_dump --format=custom --file=warehouse.dump SOURCE_URL`. Create a second empty database and run `pg_restore --exit-on-error --dbname=RECOVERY_URL warehouse.dump`. Point `WAREHOUSE_TEST_URL` at the restored database and rerun the tests. The recovery exercise restored the Drizzle migration journal, 4 captures, 89 evidence rows and 1 panel judge assignment before all 11 tests passed again. The initial schema is additive. Replacing an empty database is reversible. After evidence has been written, use a backup restore or a tested forward fix to avoid dropping captured evidence.

## Final acceptance

Migration `0001_evidence_acceptance` adds two tables and replaces the public view in place. `warehouse_evidence_relationships.evidence_id` is both the primary key and a foreign key to the supporting observation. Nullable columns are `parent_evidence_id`, `category_id`, `event_id`, `school_id`, `chapter_id`, `entry_id`, `student_id`, `round_id`, `panel_id`, `judge_id`, and `person_id`. Each points to its typed target. Links cover event/category, category/judge, school/chapter, entry/school, entry roster membership, candidate judge/person, panel/entry, panel/judge, ballot/panel with optional entry and judge, score/ballot, result-set/event, standing/result-set with optional entry, student and round, and standing value/standing. Candidate observations can coexist. The public fixture has standalone timeslots and no explicit round-to-timeslot join.

Standing entry and round IDs must identify a unique row in the containing event in the same validated tournament snapshot. A student needs one matching student in a unique explicit school or the unique verified school of a matched entry. An explicit school accompanying an entry must agree with its verified school. Mismatched declared tournament or event blocks all references. The collision fixture uses overlapping entry and round IDs across two events and student IDs across schools. It verifies six unresolved cases and one valid case. Bulk result sets remain keyed by snapshot and pointer.

`warehouse_operation_outcomes` records operation, provider, request scope, route, timestamp, optional HTTP status and media type, and optional snapshot FK. Replay appends deterministic outcomes for observed success, explicit empty bulk, not-requested protected routes, unauthorized, forbidden, ambiguous not-found, invalid, rate-limited and transient failure. An explicit false result-set publication flag records unpublished with its snapshot and source pointer. Failed attempts without a retained response have a null snapshot. Earlier captures and outcomes survive later replay. Existing captures can acquire typed links by replaying their retained inputs.

The public view requires row and capture eligibility. Score rows expose numeric-shaped `id` and `value`, plus the literal `speaker` tag when supplied. A legacy ballot scalar score must also be numeric-shaped. Standing rows expose numeric-shaped `place`, `rank`, and `percentile`. Standing value rows expose numeric-shaped `result_key` and `value`. Result-set publication accepts boolean or exact boolean strings. The public values of raw score collections, result-set collections and result sets are null. Full raw score and standing observations remain internal, and the view suppresses the raw ID for individual score, result-set and standing rows.

Both migrations applied on empty PostgreSQL 17.9. The source and restored databases matched before replay with 2 migration records, 25 captures, 162 evidence rows, 41 typed links, 61 outcomes and 1 panel judge assignment. All 12 tests passed on the fresh database, after backup restore, and after applying the new migration to a restored prior warehouse. Standalone TypeScript and the Next.js 16.4.6 production build passed. Harvard panel 9200905 continues to record an unresolved winner. The adapter still uses the approved anonymous requests and existing adapter IDs. PR #9 is ready for leadership merge review and requires separate Dennis approval to merge.
