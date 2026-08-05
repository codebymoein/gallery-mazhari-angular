---
name: project-onboarding
description: Safely orient a new agent or new session to this repository. Read instructions, memory, and repository state without modifying source code. Use at the start of any session or when unfamiliar with the project.
---

# project-onboarding

Safely orient an agent to the repository before any work.

## When to use
- Starting a new session.
- Unfamiliar with the repository.
- Resuming after a gap (memory may be stale).

## When NOT to use
- During focused implementation of a task the agent already understands.
- Trivial, obviously-scoped changes within a familiar file.

## Inputs
- The task or question (optional).
- Repository root (current working directory).

## Workflow
1. Read `AGENTS.md`.
2. Read `docs/PROJECT_MEMORY.md`.
3. Run `git status` and note the current branch.
4. Inspect recent commits: `git log --oneline -15`.
5. Diff any uncommitted files to understand existing work in progress.
6. Read the relevant README and package/config files (`README.md`, `package.json`, `backend/package.json`).
7. Identify the code areas relevant to the task.
8. Summarize current understanding.
9. List unknowns and assumptions (mark as UNKNOWN / TO BE CONFIRMED).
10. Recommend the next action.
11. Do NOT modify source code during onboarding.

## Safety constraints
- Read-only: do not create, edit, or delete any file.
- Do not install packages or run mutations.
- Base every statement on repository evidence; mark guesses as assumptions.

## Expected output
- Project summary (purpose, stack, architecture at a glance).
- Current state (implemented/finishing).
- Current branch and Git status.
- Active workstream.
- Relevant files for the task.
- Risks and assumptions.
- Recommended next step.

## Completion criteria
- Startup protocol satisfied.
- Understanding and unknowns stated.
- Agent ready to plan (not yet to edit).
