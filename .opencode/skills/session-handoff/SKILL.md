---
name: session-handoff
description: Make the project resumable by another agent with minimal context loss. Summarize the task, completed work, files changed, commands run, unresolved items, and the exact next step. Update docs/PROJECT_MEMORY.md. Never include secrets.
---

# session-handoff

Produce a durable handoff and update project memory.

## When to use
- Ending or transferring a session.
- After substantial work before stopping.
- When starting a follow-up session (read memory; write only at the end).

## When NOT to use
- Mid-task without a clear stopping point.
- Onboarding (that is `project-onboarding`).

## Inputs
- The task and all work performed this session.

## Workflow
1. Inspect git status and diff.
2. Summarize the task.
3. Record completed work.
4. Record files changed.
5. Record commands and tests that were actually run (with real results).
6. Record failures and unresolved issues.
7. Record decisions and assumptions.
8. Record the exact next recommended step.
9. Update `docs/PROJECT_MEMORY.md` (Last Updated, Last Session Handoff, Pending Tasks, Known Issues).
10. Never include secrets or large chat transcripts.

## Safety constraints
- Read-only otherwise; edit only the memory file (and nothing in application source).
- Preserve useful history; do not delete useful past entries.
- Mark stale information as stale rather than silently removing.

## Expected output
- Concise session summary.
- Completed work.
- Current state.
- Verification (exact commands/result).
- Unresolved items.
- Next action.
- Updated `docs/PROJECT_MEMORY.md`.

## Completion criteria
- A new agent can resume with minimal context loss.
- Memory file updated and accurate; no secrets included.
