# TASK-019 handoff for Jared

The three coach profiles show observed panels, divisions, date spans, SNU exposure and recent panel schools. The read model uses the Tabroom provider/person key and TASK-013 v2's distinct panel count. It retains the full assignment and roster evidence for drilldown. [Coach proof](../coverage/college-policy-2025-26-r1-judge-profiles.md) · [Profile JSON](../coverage/college-policy-2025-26-r1-judge-profiles.json) · [Field coverage](../coverage/public-judge-profile-field-coverage.md)

Dennis's pinned public capture archive was reopened from Dropbox and its relevant bulk files matched the manifest SHA-256 values exactly. All three sample names are now verified from structured public Tabroom evidence: `175248` is **Michael Scott**, `19665` is **LaToya Green**, and `775310` is **Arya Persaud**. Each identity requires the same tournament-scoped judge ID to appear in a named public roster row and in same-capture ballots whose `judge_person` explicitly equals the profile Person ID. For `19665`, the named judge row is in another category of the same tournament bulk capture; TASK-013's included-division season-roster gap therefore remains a valid coverage caveat rather than an identity conflict.

The profile generator continues to require the verified [Phase A archive](2026-11-23-college-policy-public-coverage.md) to reproduce the name joins. It checks each bulk body hash against the pinned manifest before accepting names. Review the resulting source URLs, snapshot IDs, roster pointers, ballot pointers and verification states.

```sh
node src/warehouse/run-judge-profiles.ts CAPTURES_DIRECTORY
```

The original Codex sandbox passed the focused profile tests but could not complete dependency-backed verification. GitHub-hosted verification exposed a TypeScript nullability bug in the recent-panel type; leadership review corrected it. Final immutable head `94a94b87c57e51c4d3888fd382dbed4df407dd01` then passed the full Node test suite, TypeScript check, Next.js production build, fresh migration, base-to-head upgrade, and PostgreSQL dump/restore in Actions run `45436087781`. PR #17 merged at `4b2e3d72da0b6a7350f6ccba80a781855506edff`.
