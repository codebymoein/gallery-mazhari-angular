---
name: senior-engineering
description: Implement or refactor production-ready code safely. Make the smallest coherent change, reuse existing abstractions, avoid new dependencies, and verify with focused checks. Always follow the repository startup protocol first.
---

# senior-engineering

Safely implement or refactor production-ready code.

## When to use
- Implementing code.
- Refactoring existing code.
- Fixing a bug with an authorized plan.
- Updating business logic (with care — see AGENTS.md risk areas).

## When NOT to use
- Onboarding (use `project-onboarding`).
- Ambiguous requirements (use `grill-me`).
- Pure planning (use `feature-planning`).

## Inputs
- The task and plan.
- Related repository code.
- Repository instructions and memory (read first).

## Workflow
1. Read instructions and memory (`AGENTS.md`, `docs/PROJECT_MEMORY.md`).
2. Inspect related files and existing patterns.
3. Confirm the implementation plan.
4. Make the smallest coherent change.
5. Reuse existing abstractions.
6. Avoid unnecessary dependencies.
7. Add or update tests when appropriate.
8. Run focused lint, type-check, tests, or build relevant to the change.
9. Review the git diff for unintended changes.
10. Report exact results.
11. Update project memory if the work is substantial.

## Rules
- No speculative rewrites.
- No broad cleanup unrelated to the task.
- No hidden fallback behavior.
- No silent error swallowing.
- No duplicated logic.
- No fake test results (never claim an untuned/unrun test passed).
- No destructive Git operations.
- Never introduce secrets.

## Safety constraints
- Do not install packages or update dependencies without explicit approval.
- Never delete/rename files without approval.
- Never modify environment secrets.
- Respect repository conventions (path aliases, style, injection pattern per file).

## Expected output
- Changed files and reasons.
- Verification run and real results.
- Remaining risks.
- Recommended next step.

## Completion criteria
- Requested behavior implemented; unrelated behavior preserved.
- Focused checks run and reported truthfully.
- Diff reviewed; no secrets; definition of done satisfied.
