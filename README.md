# DebateOS

DebateOS is a debate intelligence and workflow platform for college policy debate.

Its core design principle is **arguments, not files**: evidence, analytics, opponent intelligence, judge information, round history, and post-round learning should be organized around the strategic questions debaters and coaches actually need to answer.

## Operating model

- **Chat / leadership**: product decisions, architecture, coordination, and review.
- **Work**: research, investigation, synthesis, and operational tasks.
- **Codex**: software implementation, tests, refactors, and repository changes.
- **GitHub**: source code, engineering history, standing engineering instructions, and approved work orders.
- **Dropbox**: durable research, architecture, handoffs, product thinking, and data references.

## UX principle

Surface the bottom line first, minimize clicks for common tasks, and use progressive disclosure for deeper detail.

## Current status

The repository is being bootstrapped. Read `AGENTS.md` before doing engineering work and `PLANS.md` for the current roadmap. Approved work orders live under `tasks/`.

## Run and verify

Use Node.js 24 or newer. Run `npm ci`, `npm test`, and `npm run build`.
For local development use `npm run dev`.

The public Tabroom adapter uses the two GET operations recorded in the
[Task 001 contract](docs/research/001-tabroom-ingestion-contract-v1.md).
The [Harvard provenance manifest](fixtures/tabroom/harvard-40923/provenance.json)
pins the OpenAPI version and source digest and records the exact public URLs
and protected responses. Each offline replay checks that the adapter uses
those URLs and carries the pinned version and digest. A transport test also
checks the HTTP method, anonymous request settings, and rejection of HTML.
This verifies the approved pinned contract without live spec discovery.
A change to the approved operations requires updated contract and fixture evidence.
