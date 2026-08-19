# 12 — AI Agent Rules

`AGENTS.md` is mandatory. This chapter expands its enforcement model.

## Required behavior
- Identify exact repository/branch/base SHA before writes. Read Constitution/handbook and inspect current implementation/tests.
- State assumptions; verify them with repository evidence where possible. Generic framework knowledge never overrides actual code.
- Minimize scope and preserve domain semantics. Do not delete “complex” workflows, queues, statuses, audit data, scripts, or compatibility paths without proving their purpose and receiving explicit authorization.
- Never expose secrets or use user-provided credentials in committed content. Never disable security/test controls as a shortcut.
- Do not perform destructive production operations, force pushes, direct `main` changes, or PR merges without explicit human authorization.
- Do not start adjacent roadmap/remediation items merely because they are visible.
- Select verification by the Tier A/B/C risk model in `10-testing-quality.md`; unrelated full-suite checks are not a default requirement for a focused low-risk edit.

## Change protocol
Before: map affected files/contracts/workflows, classify the verification tier, and plan only the checks applicable to that risk boundary. During: keep changes cohesive, follow architecture boundaries, add tests/docs with behavior. After: inspect diff/file list, run applicable gates, verify docs links, report exact results and unresolved risk.

For isolated frontend presentation work, an agent SHOULD prefer focused frontend evidence over running backend, database, security, release-certification, Lighthouse, sitemap, or full-browser suites that the diff does not touch. For frontend behavior changes, add focused unit/browser coverage. For cross-boundary, security, data, workflow, dependency, deployment, or certification work, escalate to the broad applicable suite. Explicit task/release requirements always override these minimums.

A broader CI matrix may remain enabled as a permanent regression control. Agents MUST NOT weaken CI to match a local tier; the tier controls what must be reproduced for the scoped task, not what repository CI is allowed to protect.

## Stop conditions
Stop and request human decision when requirements conflict with the Constitution; a change would alter a protected business workflow without approval; production data loss is possible without recovery; credentials/permissions are insufficient; or the requested action exceeds authorized scope.

## Agent handoff
A handoff must include branch, base/current SHA, completed scope, changed files, selected verification tier, checks/results, pending decisions, risks, and next permitted step. Never claim completion for unexecuted checks.
