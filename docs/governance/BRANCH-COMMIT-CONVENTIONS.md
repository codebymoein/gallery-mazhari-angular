# Branch and Commit Conventions

## Branches
All development branches MUST start from the current approved `main` SHA and MUST be single-purpose.

Preferred prefixes:
- `chore/rm-XX-short-scope` — remediation/governance work
- `fix/short-scope` — focused defect fix
- `feat/short-scope` — approved feature work
- `security/short-scope` — focused security remediation
- `docs/short-scope` — documentation-only work

Forbidden patterns:
- direct development on `main`;
- reusing a diverged/stale branch as a new remediation base;
- mixing unrelated RM programs/findings in one branch;
- force-moving shared branches without explicit coordination.

## Commits
Commits SHOULD use concise Conventional-Commit-style subjects when practical, for example:

`chore(rm-01): add repository governance templates`

`fix(auth): reject disabled-user sessions`

Rules:
- one intelligible purpose per commit;
- no generated/refactor/dependency churn mixed with unrelated behavior;
- no secrets, production data or runtime artifacts;
- no `--no-verify`/history rewriting as a shortcut;
- commit messages must not claim tests/fixes that were not actually verified.

## Pull Requests
Every PR MUST use the repository PR contract and include exact base SHA, scope/non-scope, changed areas, workflow/data/security impact, actual verification results, known risks and rollback/recovery.

Sensitive paths identified by `.github/CODEOWNERS` require human owner review. AI agents may prepare/request review but may not count their own approval as independent approval.

## Branch lifecycle
After a PR is merged, its work branch should be deleted unless it is an explicitly documented stable marker/release branch. `main`, release refs and the RM-00 baseline marker are never cleanup targets.
