# Pull Request Contract

## Purpose and scope
- Remediation / task ID:
- Roadmap Wave / PR slice (or `N/A` for non-remediation):
- Linked finding IDs (or `N/A`):
- Base SHA:
- Head branch:
- In scope:
- Explicitly out of scope:
- Adjacent RM/findings explicitly not being remediated:

## Governance preflight
- Governance documents actually read:
- Roadmap dependencies verified:
- Agent Task Manifest location / acknowledgement:
- Human authorization being acted on:

## Changes
- Files / areas changed:
- Business workflow impact:
- Source-of-truth / architecture impact:
- Data / schema / migration impact:
- Security / authorization impact:
- Media/storage impact:
- SEO/accessibility/performance impact:
- Deployment / operations impact:
- Documentation updated:

## Verification
- Commands actually run:
- Passed checks:
- Failed checks:
- Blocked / not-run checks and reason:
- Regression coverage added or updated:
- Final CI run / head SHA used as evidence:

## Risk and recovery
- Known risks:
- Rollback / roll-forward plan:
- Data recovery / backup requirement:
- Compatibility / migration notes:

## Governance checklist
- [ ] Repository identity was verified as `codebymoein/gallery-mazhari-angular` from GitHub.
- [ ] Current `main` SHA was independently fetched before work began.
- [ ] `AGENTS.md`, `CONSTITUTION.md`, `docs/PROJECT_MEMORY.md`, handbook index, mandatory chapters, and task-relevant chapters were read.
- [ ] For remediation work, `docs/remediation/MASTER_REMEDIATION_ROADMAP.md` was read and the exact Wave/RM/PR/finding scope was identified.
- [ ] The mandatory pre-write report was provided before material mutation.
- [ ] Branch was created from the current approved `main` lineage.
- [ ] No unrelated findings, adjacent RM work, opportunistic cleanup, or refactors are included.
- [ ] Protected Gallery Mazhari workflows remain intact unless this PR contains explicit business approval for a semantic change.
- [ ] PostgreSQL/NestJS remain authoritative for durable business state and business-rule enforcement.
- [ ] No secret, credential, production dump, private customer data, or runtime artifact is committed.
- [ ] Schema changes, if any, use a reviewed forward migration.
- [ ] Quality gates were not weakened/bypassed merely to obtain a passing run.
- [ ] Final diff and file list were inspected against the declared scope.
- [ ] Test results above are actual results; unrun checks are not represented as passing.
- [ ] Sensitive paths have an appropriate human review request when required.
- [ ] Merge authorization comes from the human owner; the agent is not self-authorizing approval.
