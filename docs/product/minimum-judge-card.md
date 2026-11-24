# Minimum judge-card UI contract

The static prototype at `/judge-proof` uses the checked-in TASK-019 [profiles](../coverage/college-policy-2025-26-r1-judge-profiles.json) and [field coverage matrix](../coverage/public-judge-profile-field-coverage.json). The profiles are derived from pinned public evidence.

| Level | Display | TASK-019 field |
| --- | --- | --- |
| 1 | Judge name and secondary Tabroom person ID | `identity.displayName.label`, `identity.personId` |
| 1 | Observed panels judged and observed tournaments | `atAGlance.panelAssignmentCount`, `atAGlance.tournamentCount` |
| 1 | Observed date span and divisions judged | `atAGlance.firstAssignmentDate`, `atAGlance.mostRecentAssignmentDate`, `atAGlance.divisions` |
| 1 | Observed SNU panels and, when present, rounds | `atAGlance.snuExposure.panelCount`, `atAGlance.snuExposure.roundCount` |
| 1 | Public-record coverage label and included-division roster warning when present | `coverage.caveat`, `coverage.assignedJudgeIdsAbsentFromSeasonRosters`, `identity.displayName.status` |
| 2 | Up to three recent panels in artifact order | `recentPanels[].tournamentName`, `eventName`, `division`, `assignmentDate`, `schools`, `roundId`, `panelId` |
| 2 | Missing assignment dates and unresolved panel schools | `atAGlance.assignmentsWithoutDate`, `recentPanels[].schoolCoverageUnresolved` |
| 3 | Identity status, public exports, roster evidence and explicit ballot-to-person join | `identity.displayName.status`, `identity.displayName.evidence[]` |
| 3 | Recent assignment references and coverage caveats | `recentPanels[].evidence`, `coverage.caveat`, `coverage.events[].assignmentCoverageUnknown`, `coverage.assignedJudgeIdsAbsentFromSeasonRosters`, `coverage.panelsWithUnresolvedSchoolCoverage` |
| 3 | Evidence cutoff | `evidenceCutoff` in the field coverage matrix |

Use the artifact’s unresolved label if identity verification is unavailable. Keep a roster warning alongside verified identity when both are present. Treat tournament-scoped judge IDs as evidence context and Tabroom person IDs as identity context. Qualify counts as observed public records. “0 observed SNU panels” describes the included records. Activity outside those records remains unknown. Highlight explicit SNU exposure factually.

Show an absent assignment date as “Unknown.” Use known assignment dates for the observed span and retain the missing-date count in recent activity. Mark partial or ambiguous school joins as unresolved. Keep round/panel IDs secondary and source URLs, snapshots and row pointers in the evidence disclosure.

Keep Level 1 visible. Open Recent activity once to reach Level 2. Open Evidence and data quality within it to reach Level 3. Both use native keyboard-operable disclosures, collapsed by default.

Excluded fields include judge paradigms, Aff/Neg tendencies, votes, panel results, win rates, implied affiliation or employer, ideological inferences, strategic recommendations, rankings or scores, SNU suitability judgments, and unresolved debater history.
