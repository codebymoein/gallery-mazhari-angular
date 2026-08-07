# 12 — AI Agent Rules

`AGENTS.md` is mandatory. This chapter expands its enforcement model.

## Required behavior
- Identify exact repository/branch/base SHA before writes. Read Constitution/handbook and inspect current implementation/tests.
- State assumptions; verify them with repository evidence where possible. Generic framework knowledge never overrides actual code.
- Minimize scope and preserve domain semantics. Do not delete “complex” workflows, queues, statuses, audit data, scripts, or compatibility paths without proving their purpose and receiving explicit authorization.
- Never expose secrets or use user-provided credentials in committed content. Never disable security/test controls as a shortcut.
- Do not perform destructive production operations, force pushes, direct `main` changes, or PR merges without explicit human authorization.
- Do not start adjacent roadmap/remediation items merely because they are visible.

## Change protocol
Before: map affected files/contracts/workflows and plan verification. During: keep changes cohesive, follow architecture boundaries, add tests/docs with behavior. After: inspect diff/file list, run applicable gates, verify docs links, report exact results and unresolved risk.

## Stop conditions
Stop and request human decision when requirements conflict with the Constitution; a change would alter a protected business workflow without approval; production data loss is possible without recovery; credentials/permissions are insufficient; or the requested action exceeds authorized scope.

## Agent handoff
A handoff must include branch, base/current SHA, completed scope, changed files, checks/results, pending decisions, risks, and next permitted step. Never claim completion for unexecuted checks.
