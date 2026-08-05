---
name: code-review
description: Review proposed or completed changes by inspecting the actual diff. Report findings before compliments, prioritize bugs and regressions, and distinguish blocking issues from suggestions. Do not modify files.
---

# code-review

Review changes (proposed or committed).

## When to use
- A change is proposed or made and needs review.
- Before commit/push or as part of a PR review.

## When NOT to use
- Implementing changes (that is `senior-engineering`).
- Auditing security/performance deeply (use those skills, though they may inform review).

## Inputs
- The diff (working tree, a commit, or a range).

## Review priorities
1. Correctness
2. Regressions
3. Security
4. Data integrity
5. Authorization
6. Error handling
7. Performance
8. Maintainability
9. Test coverage
10. Style

## Rules
- Inspect the actual diff (`git diff`, `git diff HEAD~n`, staged changes).
- Report findings before compliments.
- Avoid vague comments; include file and line references when possible.
- Do not report purely stylistic preferences as critical.
- Distinguish blocking issues from suggestions.
- If no issue is found, state residual risks and unverified areas.
- Read-only: do not modify files.

## Expected output
- Blocking findings.
- High-priority findings.
- Normal findings.
- Suggestions.
- Test gaps.
- Final recommendation (approve / changes needed / needs more testing).

## Completion criteria
- Actual diff inspected.
- Findings prioritized and referenced.
- Recommendation given.
