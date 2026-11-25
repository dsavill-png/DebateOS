# 025 · Private evidence search launch

**Status** Implemented for owner-private validation

**Owner** Jared Commander

**Worker** Codex

**Authorization** Jared requested launch after the TASK-024 relevance benchmark.

## Deliverable

Add the DebateOS Evidence Search route with card, argument and document modes, claim clarification and source-linked previews. Run on the approved pilot snapshot under owner-only sign-in. Keep the source export in private runtime object storage and application code on GitHub. Preserve the existing weekly refresh and PostgreSQL warehouse boundaries.

## Validation

- Use rules that suggest a claim only when relevant source text supports it. Preserve exact evidence bytes in previews and label automated classifications separately from coach-reviewed ones.
- Verify the flagship query, the Japan and Taiwan paraphrases, source preview provenance and the anonymous and cross-origin denial paths.
- Use the same seed benchmark for iteration and a separate, coach-labeled holdout before student rollout. Seed results do not establish performance on unseen queries.
- Student audiences and additional Dropbox scopes require an explicit permission mapping and validation against signed-in representative accounts. This release authorizes the owner only.

This work order builds on TASK-024 and is reviewable as a stacked change.
