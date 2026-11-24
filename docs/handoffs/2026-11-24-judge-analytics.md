# TASK-021 · Judge analytics handoff for Dennis

The proposed dimensional model is ready for architecture review. It reuses warehouse identities and makes Person × panel the assignment key. Individual decisions share that key and panel results use the panel key alone. Paradigm observations are immutable revisions. Tournament-time affiliation reuses TASK-017's evidenced relationships. [ADR and schema sketch](../architecture/ADR-004-judge-analytics.md)

The public materialized view uses eligible facts only. Its summary and Person × panel SNU detail share scope and cutoff. Known individual and SNU decisions use separate denominators. Public coverage can show where verified decisions are absent. Protected inputs require grant-aware filtering before aggregation. [Field readiness and sample](../architecture/judge-analytics-readiness.md)

Review the fact keys, season and affiliation rules, and build publication contract before approving physical schema work. TASK-014 or an approved successor must verify Person and panel joins, date and side semantics, individual vote versus overall result and split, and paradigm revision semantics. The checked-in public sample shows assignment history and SNU exposure with unresolved votes, sides, result, affiliation and paradigm.


## Approval

Dennis approved the model on 2026-11-24 and confirmed Person × panel as the primary "debates judged" measure, including counting two flighted debates in one named round as two judged debates. Final PR #21 head `1feb7788206341da0c1ff5aa76bc6f46fa0d0e8e` passed the full GitHub-hosted verification harness and merged at `6147ac6c6cea28c69eeefa9d0f552abef100b813`.
