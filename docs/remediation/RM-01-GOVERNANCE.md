# RM-01 — Repository Governance and Multi-Agent Operating System

Status: **IN PROGRESS — repository controls implemented; main protection verified; independent review pending**  
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
- [x] Protected `main` — GitHub reports `protected:true` after repository-owner ruleset configuration on 2026-08-07
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
1. **Direct push to main is blocked:** SERVER-SIDE PROTECTION VERIFIED at the branch metadata level (`protected:true`). A destructive direct-push probe is intentionally not performed by the agent.
2. **Independent approval is required:** CONFIGURED BY REPOSITORY OWNER, but PR #13 currently has no submitted human review. This remains the final human evidence gate.
3. **Merged branches are deleted:** IMPLEMENTED for same-repository merged PRs through `cleanup-merged-branches.yml`, excluding `main` and RM-00 baseline marker.
4. **Every PR has scope, tests, data impact, rollback and base SHA:** TEMPLATE IMPLEMENTED. Server-side enforcement of template completeness is not claimed.
5. **Sensitive paths require designated review:** CODEOWNERS IMPLEMENTED and repository-owner ruleset configured to require CODEOWNER review. Because CODEOWNERS is introduced by this PR, end-to-end enforcement becomes observable after this PR lands on `main` and a subsequent sensitive-path PR is opened.

## Protection evidence
After the repository owner created the `main` ruleset, GitHub branch metadata returned:

```text
main.protected = true
```

Required status checks remain intentionally unconfigured in RM-01; CI/status enforcement belongs to RM-02.

## Explicit non-scope
RM-01 does not create CI/CD quality gates, PostgreSQL integration jobs, security scanners, coverage thresholds or required status checks; those belong to RM-02. It does not remediate application/business/auth/database/import/media/SEO/UI findings.

## Verification
- Final diff/file-list inspection confirms governance/documentation/workflow-only changes.
- GitHub reports `main` protected.
- PR #13 review submissions checked after protection activation: no human review has yet been submitted.
- No application runtime behavior or database schema is changed.

## Remaining exit action
Before RM-01 can be marked COMPLETE, PR #13 must receive at least one genuine independent human approval under the configured ruleset and then be merged through the protected-main PR path.

No AI self-review is accepted as independent approval. No destructive direct-push test is required to prove protection when GitHub server-side metadata already reports the branch as protected.
