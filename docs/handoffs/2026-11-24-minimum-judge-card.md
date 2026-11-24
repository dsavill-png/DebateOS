# TASK-020 judge-card prototype for Dennis and Jared

Open `/judge-proof` in the existing Next.js app. The collapsed cards show identity and observed activity. Recent activity reveals up to three panels. Its nested evidence disclosure contains the public identity join, assignment references, and coverage caveats. [UI contract](../product/minimum-judge-card.md)

- Michael Scott shows 2 observed SNU panels in 2 rounds.
- LaToya Green shows a verified identity alongside the included-division roster gap.
- Arya Persaud shows Unknown in the observed date span and on the panel itself.

For review, can a coach pick out the observed judging history and SNU exposure at a glance? Does the roster warning read as a coverage gap while preserving confidence in the identity? Is the nested evidence disclosure easy to find when a coach needs to verify a claim?

The original Codex sandbox passed the focused formatting tests but could not complete dependency-backed verification. After the dispatcher patch was recovered, GitHub-hosted verification exposed TypeScript issues in the JSON-facing summary type and CSS-module declarations. Those were corrected during leadership review. Final immutable head `a9637709ac4f25a842762b105444cd19391f81f8` passed the full Node test suite, TypeScript check, Next.js production build, fresh migration, base-to-head upgrade, and PostgreSQL dump/restore in Actions run `45439452465`. PR #19 merged at `f13302dc5ea144118556adbae85753fa16b5de0d`.
