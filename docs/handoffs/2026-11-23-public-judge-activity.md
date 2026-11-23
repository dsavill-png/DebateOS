# TASK-013 public judge activity handoff

The offline report contains 401 derived activity records from pinned revision 1 of the 2025–26 college policy manifest. It uses the Phase A public normalizer and the same export eligibility, identity and coverage rules. The canonical warehouse schema is unchanged.

## Replay

Download and verify the archive using the [Phase A handoff](2026-11-23-college-policy-public-coverage.md). Keep the capture files in the controlled location. Replay verifies the pinned manifest, discovery pages, invitations and bulk bodies, then writes a JSON report to standard output.

```sh
node src/warehouse/run-judge-activity.ts docs/coverage/college-policy-2025-26-r1.json CAPTURES_DIRECTORY 5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac
```

Set `JUDGE_ACTIVITY_CAPTURES_DIRECTORY` to the extracted archive and run `npm test` to replay twice, compare output digests, reconcile the published coverage counts and verify the checked-in [sample records](../coverage/college-policy-2025-26-r1-judge-activity-samples.json).

## Contract for Jared

`JudgeActivityReport` and `JudgeActivity` are exported from [judge-activity.ts](../../src/warehouse/judge-activity.ts).

| Object | Fields |
| --- | --- |
| Report | `derivationVersion`, `parserVersion`, `manifest{scopeId,revision,sha256}`, `evidenceCutoff`, `coverage{pin,aggregate,events}`, `people` |
| Person | `provider`, `personId`, `judgeLinks`, `tournamentIds`, `tournamentCount`, `eventDivisionCount`, `assignmentCount`, `firstAssignmentDate`, `mostRecentAssignmentDate`, `assignmentsWithoutDate`, `divisionDistribution`, `repeatedAcrossTournaments`, `repeatedAcrossEvents`, `rosterStatus`, `schoolExposure`, `eventHistory` |
| Judge link | `tournamentId`, `judgeId`, `personEvidence`, `seasonRosterEvidence` |
| Division distribution row | `division`, `eventCount`, `assignmentCount` |
| Roster status | `assignedJudgeIdsObservedOnSeasonRosters`, `assignedJudgeIdsAbsentFromSeasonRosters` |
| Event history row | `tournamentId`, `tournamentName`, `tournamentStart`, `eventId`, `eventName`, `division`, `membershipEvidence{source,pointer}`, `eventEvidence`, `assignments` |
| Assignment | `roundId`, `panelId`, `judgeId`, `roundStartRaw`, `assignmentDate`, `rosterEvidence`, `roundEvidence`, `panelEvidence`, `assignmentEvidence`, `schoolObservations`, `unresolvedEntryEvidence`, `panelEntryCoverage` |
| School exposure | `schoolCount`, `schools`, `panelsWithUnresolvedSchoolCoverage`, `explicitSnu{panelCount,roundCount}` |
| School aggregate row | `schoolKey`, `names`, `panelCount`, `roundCount`, `explicitSnu` |
| School observation | `schoolKey`, `tournamentSchoolId`, `chapterId`, `name`, `explicitSnu`, `schoolEvidence`, `entryEvidence`, `panelEntryEvidence` |
| Evidence reference | `snapshotId`, `pointer` |

Use `provider` and `personId` as the activity card key. Show counts as **observed in the pinned season**. A tournament/event pair is one event division. Distribution rows group the pinned division labels, and history preserves the bulk event name. An assignment is a scoped tournament judge on a panel. Two entry-scoped ballots can support one assignment. Two verified judge IDs for one person on the same panel remain two assignment observations. School panels and rounds deduplicate at the person level.

Show the first and most recent evidenced round dates as the observed span. Dates are taken from the calendar portion of public round `start_time`; missing or invalid values remain null. Tournament start is available separately for context. The evidence cutoff is the latest observation time in the manifest, distinct from competition dates.

Join `coverage.events` to the card by tournament and event IDs and retain the season-level coverage alongside it. The Phase A discovery, withheld-publication and roster caveats apply throughout. A championship or division appearing in history establishes observed assignment only. Public roster status compares observed roster paths at both event and season scope. The complete Phase A coverage report retains the unlinked and conflicting IDs and the roster-only counts. Four assigned IDs were absent from the observed season rosters, including three linked IDs and the unlinked ID.

Use **schools observed on panels** for exposure. Each observation traces a panel-entry ballot through a unique same-event entry to a unique verified containing school. Chapter IDs reconcile school observations across tournaments when explicit. Otherwise the key stays tournament-scoped, so one institution can contribute multiple unresolved cross-tournament keys. Panel and round counts are distinct at their fully scoped grains. Exact explicit Southern Nazarene University school names support SNU counts. Abbreviations, name similarity, team codes, and missing joins provide no SNU evidence. Zero means no observed evidence in the available panels. Partial panel entry coverage and unresolved school links stay visible. The report carries no team or debater identity, side or result.

Evidence pointers address the original public JSON bytes. Resolve the snapshot through the manifest's capture IDs, routes and hashes. Event decisions point to their membership evidence, and tournament labels and start context come from the pinned manifest. Keep full evidence references available for drill-down. The samples are an excerpt of the envelope with coverage omitted.

## Observed results

- 401 of 401 linked people yielded activity summaries with 8,868 scoped panel assignments. No linked person was excluded. One unlinked assigned ID and 315 roster-only scoped IDs remained outside person activity. There were zero conflicting assigned IDs.
- 87 included event divisions were present in the exports. 81 had incomplete or unknown assignment coverage, including 18 with zero observed assignments. 68 event divisions were excluded and 5 remained unresolved.
- 197 assignments lacked a usable round date. One person had no observed assignment date. All 401 people had at least one observed school. 99 had explicitly evidenced SNU exposure. Four people had at least one panel with unresolved school coverage.
- Person `175248` had 4 assignments across 2 tournaments and 3 divisions, 6 observed school keys and 2 SNU panels in 2 rounds. Person `19665` had 3 assignments and no observed season roster membership for the assigned judge ID. Person `775310` had one assignment with two observed school keys and a missing round date.

## Verification

Node 24.11.1 passed 14 tests, including the pinned two-run replay and sample comparison. Four existing PostgreSQL tests were skipped because a disposable database was not configured. Standalone TypeScript and the Next.js 16.4.6 production webpack build passed.
