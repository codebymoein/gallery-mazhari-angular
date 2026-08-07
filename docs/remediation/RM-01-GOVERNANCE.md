# RM-01 — Repository Governance and Multi-Agent Operating System

Status: **IN PROGRESS — repository controls implemented; GitHub protection enforcement pending**  
Wave: **0**  
Priority: **P0**  
Repository: `codebymoein/gallery-mazhari-angular`  
Base SHA: `cdb9abf387d42219181c9fe928a75911f014be6e`  
Working branch: `chore/rm-01-repository-governance`

## Roadmap coverage
- Ledger coverage: **45 findings**
- Severity summary: Critical 3, High 20, Medium 22
- Finding IDs: `P10-F01`–`P10-F45`

The repository currently does not contain the per-finding P10 inventory text, so this program does not invent individual finding descriptions or claim per-finding closure without source evidence. RM-01 is implemented against the authoritative Master Remediation Roadmap deliverables and exit criteria plus current repository evidence.

## Objective
Make multi-agent work safe, reviewable, attributable and reversible before broader remediation begins.

## Deliverables
- [ ] Protected `main` — **server-side setting pending; current main observed `protected:false`**
- [x] `.github/CODEOWNERS`
- [x] Pull Request template with base SHA/scope/tests/data/security/rollback contract
- [x] Remediation and bug issue templates
- [x] Agent Task Manifest
- [x] Branch/commit conventions
- [x] `AGENTS.md` connected to Project Memory and task manifest
- [x] `docs/PROJECT_MEMORY.md`
- [x] Automatic merged-branch cleanup workflow
- [x] Sensitive-path ownership map through CODEOWNERS
- [x] Required GitHub settings documented

## Exit criteria status
1. **Direct push to main is blocked:** NOT YET VERIFIED / NOT ENFORCED. GitHub reports `main` as unprotected and the current connector cannot mutate branch protection/rulesets.
2. **Independent approval is required:** NOT YET ENFORCED. Requires branch protection/ruleset and at least one real second human reviewer for owner-authored PRs.
3. **Merged branches are deleted:** IMPLEMENTED for same-repository merged PRs through `cleanup-merged-branches.yml`, excluding `main` and RM-00 baseline marker.
4. **Every PR has scope, tests, data impact, rollback and base SHA:** TEMPLATE IMPLEMENTED. Server-side enforcement of template completeness is not claimed.
5. **Sensitive paths require designated review:** CODEOWNERS IMPLEMENTED; mandatory CODEOWNER review awaits branch protection/ruleset enforcement.

## Explicit non-scope
RM-01 does not create CI/CD quality gates, PostgreSQL integration jobs, security scanners, coverage thresholds or required status checks; those belong to RM-02. It does not remediate application/business/auth/database/import/media/SEO/UI findings.

## Verification
Repository-level verification for this branch consists of final diff/file-list inspection and validation of YAML/Markdown structure where possible. No application runtime behavior is changed. GitHub-side protection must be verified after settings are applied.

## Required human/server-side completion
Before RM-01 can be marked COMPLETE:
- apply the `main` protection/ruleset defined in `docs/governance/GITHUB-SETTINGS.md`;
- ensure at least one genuine independent human reviewer is available before requiring approval, to avoid merge deadlock;
- verify GitHub reports `main` protected and that a direct push is rejected;
- verify CODEOWNER review is required for a test PR touching a sensitive path.

No AI self-review or documentation-only statement may be used as evidence that these GitHub controls are enforced.
