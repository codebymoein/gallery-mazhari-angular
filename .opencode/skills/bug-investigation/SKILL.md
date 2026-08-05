---
name: bug-investigation
description: Find and fix root causes, not symptoms. Capture expected vs actual behavior, reproduce, form and validate hypotheses, propose the smallest safe fix, then verify and protect against regression.
---

# bug-investigation

Investigate and fix the root cause of a bug.

## When to use
- A bug, unexpected behavior, or failing test is reported.
- Regression suspected after a change.

## When NOT to use
- Feature implementation (use `feature-planning` / `senior-engineering`).
- Requirements are unclear rather than buggy.

## Inputs
- Bug report / failing behavior, exact error text if available.
- Reproduction steps if known.

## Workflow
1. Capture expected behavior.
2. Capture actual behavior and the exact error.
3. Identify reproduction steps.
4. Inspect relevant logs, tests, code, and recent changes.
5. Form ranked hypotheses.
6. Validate hypotheses with evidence (logs, tests, code paths).
7. Identify the root cause.
8. Propose the smallest safe fix.
9. Implement only when authorized and in scope.
10. Add regression protection (a test that reproduces the bug).
11. Verify the reproduction no longer fails.
12. Check adjacent behavior for side effects.

## Safety constraints
- Do not change behavior outside the bug scope.
- Do not introduce hidden fallbacks or silence errors.
- Do not modify payments/authorization/schema casually (see AGENTS.md Risk Controls).
- Never claim a test passed unless actually run.

## Expected output
- Reproduction.
- Evidence.
- Root cause.
- Affected scope.
- The fix.
- Verification results.
- Regression risk.

## Completion criteria
- Root cause identified and fixed (or authorized plan provided).
- Regression test added/updated when appropriate.
- Verification run and reported truthfully.
