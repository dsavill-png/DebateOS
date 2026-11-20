# DebateOS repository instructions

Read PLANS.md and the assigned work order before beginning.

## Working model

- Dennis: product owner, debate-domain lead, and data/BI/programming perspective.
- Jared: debate-domain collaborator and AI ecosystem/business application perspective.
- Olivia: backend/data collaborator and validation support.
- Chat: leadership, technical architecture, coordination, work-order drafting, integration, and review.
- Work: research, investigation, synthesis, and operational tasks.
- Codex: implementation, testing, refactoring, and repository changes.

These roles describe how work is organized. Do not infer authority beyond an approved work order.

## Source-of-truth boundaries

- GitHub is authoritative for source code, engineering history, repository instructions, and approved engineering work.
- Dropbox is the durable home for architecture, research, product notes, data references, and handoffs.
- Canonical debate evidence must remain distinct from derived AI knowledge.
- Generated summaries, indexes, embeddings, classifications, and model interpretations are derived data and must be labeled as such.

## Non-negotiable engineering rules

1. No silent architecture substitution. If an approved approach fails, conflicts with the repository, or depends on an unavailable capability, stop and report the conflict. Do not quietly replace an API with scraping, replace a data source, or choose a new framework.
2. Do not re-research settled decisions without a reason. Read repository instructions, plans, tasks, and linked handoffs first.
3. Preserve provenance. Normalized or derived records must remain traceable to their original sources.
4. Do not invent source facts. Missing, ambiguous, or protected data stays missing or unresolved until verified.
5. Keep identifiers semantically distinct. A Tabroom tournament judge ID and a person ID, for example, are not interchangeable.
6. Protect credentials. Never commit usernames, passwords, API keys, cookies, tokens, or secret values. Use environment variables or an approved secret manager.
7. Prefer supported APIs and documented interfaces. Use scraping only when explicitly approved as a fallback or diagnostic.
8. Canonical evidence is read-only unless an approved task explicitly says otherwise.
9. Tests are part of implementation. New behavior should include appropriate automated tests or a written reason why a test is not yet possible.
10. Record uncertainty. Parser confidence, verification state, stale/current state, and unresolved mappings should be represented rather than hidden.

## Data architecture principles

DebateOS should normalize external data behind adapters so application code does not need to know whether a record came from REST, bulk download, file import, or another approved source.

For imported records, prefer provenance fields such as:

- source
- source_method
- source_id
- source_path
- fetched_at
- snapshot_id

The canonical debate/round model should eventually bridge tournament data, disclosure data, SNU evidence/analytics, and post-round reports.

## Product/UX rules

- Put executive-level, task-focused information first.
- Minimize clicks for frequent actions.
- Use progressive disclosure for detail.
- Optimize for the decision the debater or coach is trying to make, not for exposing raw database structure.

## Task execution protocol

Before beginning an approved task:

1. Read this AGENTS.md.
2. Read PLANS.md.
3. Read the specific task under tasks/ or the linked GitHub issue.
4. Inspect relevant existing code/docs before changing anything.

When finishing, report:

- STATUS: Completed / Partial / Blocked
- WHAT I DID
- WHAT CHANGED
- TEST RESULTS
- NEW INFORMATION
- ARCHITECTURE CONFLICTS
- FILES / COMMITS
- RECOMMENDED NEXT STEP

If a task is blocked by a decision that belongs to Dennis/Jared/Chat, stop and surface the decision instead of improvising.

## Approved initial stack

The accepted initial application stack is recorded in `docs/architecture/ADR-001-initial-stack.md`:

- TypeScript as the primary application language.
- Next.js for the web/application/API layer.
- PostgreSQL for durable application data.
- Python only for later specialized data/AI workloads when explicitly justified.

Do not silently replace these with another primary framework, language, or database.
