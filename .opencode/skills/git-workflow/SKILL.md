---
name: git-workflow
description: Protect repository history and user work. Inspect status, preserve unrelated changes, review diffs, and only commit/push with explicit user approval. Never rewrite or destructively alter history without approval.
---

# git-workflow

Inspect and safely perform Git operations.

## When to use
- Before/after any change to understand state.
- When committing, pushing, or reviewing history.
- When asked to create a branch or PR.

## When NOT to use
- When the user has asked you not to touch Git.

## Workflow
1. Run `git status`.
2. Identify the current branch.
3. Identify staged, unstaged, and untracked files.
4. Preserve unrelated changes (do not stage them unless requested).
5. Review the diff before and after work.
6. Suggest a conventional commit message.
7. Commit only with explicit user approval.
8. Push only with explicit user approval.

## Forbidden without explicit approval
- `git reset --hard`
- `git clean`
- Force push
- Deleting branches
- Rebasing shared branches
- Rewriting history
- Discarding user changes
- Committing secrets

## Safety constraints
- Never commit secrets; verify staged files against `.gitignore` before committing.
- Do not push to shared/default branches without approval.

## Expected output
- Branch.
- Repository status.
- Files affected.
- Diff summary.
- Suggested commit message.
- Warnings.
- Next Git action.

## Completion criteria
- State inspected and reported.
- Any commit/push performed only with explicit user approval.
- No destructive operations without approval.
