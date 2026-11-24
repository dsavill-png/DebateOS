# TASK-020 judge-card prototype for Dennis and Jared

Open `/judge-proof` in the existing Next.js app. The collapsed cards show identity and observed activity. Recent activity reveals up to three panels. Its nested evidence disclosure contains the public identity join, assignment references, and coverage caveats. [UI contract](../product/minimum-judge-card.md)

- Michael Scott shows 2 observed SNU panels in 2 rounds.
- LaToya Green shows a verified identity alongside the included-division roster gap.
- Arya Persaud shows Unknown in the observed date span and on the panel itself.

For review, can a coach pick out the observed judging history and SNU exposure at a glance? Does the roster warning read as a coverage gap while preserving confidence in the identity? Is the nested evidence disclosure easy to find when a coach needs to verify a claim?

The focused formatting tests passed. The full Node run reported 19 passes, 2 skips, and 2 test-file load failures for missing Drizzle. TypeScript and the Next.js build could not run because the locked dependencies were unavailable locally and npm registry DNS resolution failed. Complete those checks in a dependency-enabled checkout before accepting the prototype.
