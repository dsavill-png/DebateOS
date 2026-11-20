# DebateOS Dispatcher Bus

This file exists only to support a permanent pull request used as the DebateOS command bus.

## Purpose

Chat issues dispatch commands by adding comments to the permanent dispatcher pull request.

A Work event-triggered task should watch supported pull-request comment activity on this PR and respond only to comments matching the command convention below.

## Command convention

- `WORK TASK-###` — Work reads AGENTS.md, PLANS.md, and the referenced task under tasks/, then executes the approved work order.
- Completion should be posted back to this PR and the task/result should be linked to its durable artifact, usually in Dropbox Research or Handoffs.

## Guardrails

- Ignore comments that do not match the command convention.
- Do not execute tasks marked draft, blocked, or unapproved.
- Do not silently substitute architecture.
- If a task requires an unavailable permission or a leadership decision, report BLOCKED instead of improvising.
- This PR is a control surface and should remain open. Do not merge it.
