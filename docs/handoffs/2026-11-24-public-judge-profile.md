# TASK-019 handoff for Jared

The three coach profiles show observed panels, divisions, date spans, SNU exposure and recent panel schools. The read model uses the Tabroom provider/person key and TASK-013 v2's distinct panel count. It retains the full assignment and roster evidence for drilldown. [Coach proof](../coverage/college-policy-2025-26-r1-judge-profiles.md) · [Profile JSON](../coverage/college-policy-2025-26-r1-judge-profiles.json) · [Field coverage](../coverage/public-judge-profile-field-coverage.md)

All three names are unresolved in this run. The checked-in samples carry explicit person links and omit raw roster names. For `175248` and `775310`, verify a named category roster row and an explicit `judge_person` ballot using the same tournament judge ID in the same pinned capture. For `19665`, the season samples establish the ballot-person link for `37578/2648063` and contain no matching observed roster row. A bounded public structured observation with an explicit identity link would be needed to close that gap. The anonymous bulk host failed DNS resolution and the pinned capture archive was unavailable in this workspace.

With the verified [Phase A archive](2026-11-23-college-policy-public-coverage.md) extracted locally, run the following to inspect the three name joins. The replay checks available bulk body hashes against the pinned manifest before accepting names. Review the resulting source URLs, snapshot IDs, JSON pointers and verification states.

```sh
node src/warehouse/run-judge-profiles.ts CAPTURES_DIRECTORY
```

The two profile tests passed, including a synthetic pinned name and rejection of mismatched IDs or capture bytes. The full suite recorded 16 passes, two module-load failures for missing Drizzle, and one skipped archive replay. TypeScript and the production build could not run because dependencies could not be installed. Review the proof with Dennis after the name replay and dependency-backed verification.
