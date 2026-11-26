# SNU Debate Context — shared engineering handoff (proposal)

**Status:** Documentation-only proposal; not a deployment, migration or approval to run code.

## Purpose
Make the existing Southern Nazarene University (SNU) debate context-refresh workflow understandable and reviewable by both DebateOS collaborators while preserving its current operation. This is the existing **SNU AI knowledge layer v0** anticipated in [PLANS.md](../PLANS.md#phase-1--consolidate-the-knowledge-model), not a second canonical evidence warehouse.

## Read these first
- [DebateOS AGENTS.md](../AGENTS.md), [PLANS.md](../PLANS.md), [PROJECT_STATE.md](../PROJECT_STATE.md)
- [Architecture and data boundaries](architecture.md)
- [Existing refresh contract](refresh-contract.md)
- [Migration and validation gates](migration-plan.md)

## Existing sources of truth (unchanged)
- **Original evidence:** Existing SNU 2026–27 Arms Sales Dropbox root (access-controlled). Originals and current canonical SNU team files control source wording.
- **Derived knowledge, run state, indices and review queue:** [AI Workspace / SNU_AI_CONTEXT](https://drive.google.com/drive/folders/1iZnsREA_YWM5rM7RMBxqUZu9-ZohboDV) in Google Drive. Its `00_READ_ME_FIRST.md`, `05_STATE`, `04_SCHEMA` and `05_STATE/REFRESH_PROTOCOL.md` control the running refresh.
- **Schedule/executor:** Existing ChatGPT automation **Refresh SNU Debate Context**, Mondays, 8 a.m. America/New_York. It is **not** a GitHub Action and is not changed by these docs.
- **Engineering:** This GitHub repo is the prospective version-control and peer-review home for tested, sanitized future workflow code. **No executable refresh code has been identified as migrated here.**

## Non-goals in this proposal
- Do not copy private evidence, card text, student reports, file manifests, extracted source text, review items, secrets, or raw corpus outputs to this **public** GitHub repository.
- Do not change the scheduled automation, its connected accounts, cadence, task prompt, output folder, budgets, or publishing rules.
- Do not replace Google Drive state, Dropbox originals, approved Tabroom work, or DebateOS's PostgreSQL/Next.js/TypeScript architecture.
- Do not imply agent memories or private chat histories automatically synchronize across workspaces.

## Who can use this
Either agent with repository access can **read** this handoff and propose changes through the repo's existing branch/PR process. Access to private Dropbox, Drive and automation configuration remains separately permissioned; repo access does not grant it.

## Verified checkpoint
The November 23, 2026 scheduled run encountered connector transport failures during original-DOCX backlog retrieval; it published **no replacement context**. Existing Drive state was preserved. The last verified Drive state reports 2,625 active DOCX files, 1,137 structurally parsed originals, 1,466 structural backlog, 18,530 *unreviewed* automated card candidates and 22 explicit extraction exceptions. These figures are time-bounded, not acceptance criteria for all future runs.

## Next safe action
Request review of this documentation-only proposal. Separately inventory the current refresh's executable versus instruction-only steps; no migration of code or scheduling without a tested, authorized work order.
