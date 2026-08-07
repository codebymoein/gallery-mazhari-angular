# Required GitHub Repository Settings

These settings are required to make RM-01 governance enforceable. Repository files cannot substitute for GitHub server-side enforcement.

## Main branch protection / ruleset
Target: `main`

Required configuration:
- Require a pull request before merging.
- Require at least **1 independent approving review**.
- Dismiss stale approvals when new commits are pushed.
- Require review from Code Owners for matching sensitive paths.
- Require conversation resolution before merge.
- Block force pushes.
- Block branch deletion.
- Do not allow direct pushes/bypass for routine development, including administrators where the repository plan/account supports that control.
- Required status checks are intentionally deferred to RM-02; do not invent placeholder checks in RM-01.

## Reviewer model
`@codebymoein` is the current default CODEOWNER. Independent approval requires a second authorized human reviewer/collaborator for PRs authored by `@codebymoein`. Do not invent an account or use an AI-agent self-review as independent approval.

Before enabling a protection rule that requires approval, ensure at least one real second human reviewer can approve or the repository can deadlock its own merges.

## Branch lifecycle
Merged work branches are deleted by `.github/workflows/cleanup-merged-branches.yml` for same-repository PRs. The workflow excludes `main` and `rm-baseline-2026-08-07`.

If the repository setting **Automatically delete head branches** is later enabled, it may replace the cleanup workflow after a reviewed governance change; do not run two competing cleanup mechanisms without reviewing behavior.

## Current tooling limitation
The connected GitHub automation used for RM-01 exposes repository/file/branch/PR operations but does not expose branch-protection or repository-ruleset mutation. Therefore server-side protection must be applied through GitHub Settings/API by an authorized human or another approved tool. RM-01 MUST NOT be marked complete until the effective `main` protection is verified from GitHub.
