# Dispatcher result handoff · November 23, 2026

The Codex route on trusted `main` receives new comments on PR #1, validates the exact command and authorized sender, checks the work order's release, executes Codex, opens draft PRs for eligible patches, and records the outcome in a GitHub Actions bot comment. Work's Event Orchestrator is a separate consumer. The prior incident showed a result posted while the command-event automation was still active, with no observed follow-up run. The point of failure inside event delivery remains unconfirmed. OpenAI Support case 20524159 was referred for specialist review. No resolution was found in the case email, and the current desktop Scheduled view did not expose the DebateOS event task.

The proposed report job writes the existing result line, a fixed review disposition mentioning Dennis's existing GitHub account, and a source-ID marker in one PR comment. The marker and existing per-comment serialization suppress duplicate posts. This avoids a second event dependency for recording the review action and adds no GitHub token permissions. GitHub notification settings govern delivery to Dennis, who can coordinate review with Jared.

If no report is visible, inspect the linked Actions run from the source command before deciding how to recover. Existing run-attempt gates intentionally prevent a replay from re-executing or re-publishing a task. A missing report after cancellation or a GitHub write failure still needs manual reconciliation. An already posted report is durable even when a separate Work event is missed.

See [TASK-008](../../tasks/008-dispatcher-reliability.md) for production smoke and autonomous acceptance criteria.
