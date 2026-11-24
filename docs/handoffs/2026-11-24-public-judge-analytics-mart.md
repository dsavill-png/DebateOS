# TASK-022 · Season membership repair

Partial. The manifest writer sets the public audience after checking the supplied manifest pin, anonymous authorization, source bytes and digest, and event pointer. It checks stored capture and observation eligibility before linking new membership evidence.

Migration 0003 repairs the historical 2025–26 revision 1. Its allowlist comes from the checked-in manifest. It checks the revision pin, capture identity, digest, route, request scope and policy, and the exact membership and evidence links before updating audience metadata. If a capture change would expose unrelated evidence, the migration rejects the repair. A fresh warehouse has no historical revision to repair.

PostgreSQL 18.7 single-user checks applied the migrations on an empty database and replayed the repair with a synthetic historical database populated from the pinned manifest metadata. The repaired revision had 160 eligible classifications. An unrelated internal observation stayed ineligible, and separate checks rejected a digest mismatch and a capture change that would expose unrelated evidence. The original source archive was unavailable.

Full Node verification stopped at missing Drizzle dependencies. The package registry could not be resolved, and the sandbox denied binding the disposable PostgreSQL server socket. TypeScript, Next.js production build, Drizzle-run migrations, and dump/restore verification remain pending. The atomic facts, build and promotion path, summary, SNU details, and mart-level protected-evidence regression also remain pending.
