# AGENTS.md — Mandatory AI/Automation Entry Point

Applies to Codex, Claude, Cursor, ChatGPT, IDE agents, scripts, and human-assisted automation working in this repository.

> **STOP RULE:** An agent that has not completed the mandatory preflight below has **no authorization to edit, create, delete, rename, commit, merge, migrate, deploy, or otherwise mutate project state**. Reading the repository and reporting status are allowed. If any required governance document is missing, unreadable, contradictory, or cannot be verified, stop and report the blocker instead of guessing.

## Canonical execution authority
For remediation work, the canonical execution plan is [`docs/remediation/MASTER_REMEDIATION_ROADMAP.md`](docs/remediation/MASTER_REMEDIATION_ROADMAP.md). Raw audit findings are evidence, not independent implementation authorization. No agent may select a visible finding and remediate it outside the Roadmap program/PR scope currently authorized by the human owner.

Normative precedence for agent work:
1. Human owner's explicit current task and safety constraints
2. [`CONSTITUTION.md`](CONSTITUTION.md)
3. This `AGENTS.md` entry contract
4. [`docs/remediation/MASTER_REMEDIATION_ROADMAP.md`](docs/remediation/MASTER_REMEDIATION_ROADMAP.md) for remediation sequencing/scope
5. [`docs/handbook/README.md`](docs/handbook/README.md) and task-relevant Handbook chapters
6. Task manifest and specialized project documentation
7. Implementation comments/convenience

A lower-precedence source may add detail but may not silently weaken a higher-precedence rule.

## Fast Preflight Protocol — MUST complete before any write
The purpose of Fast Preflight is to preserve governance while avoiding unnecessary context loading. **Fast does not mean optional.** Read the smallest authoritative set that is sufficient for the actual task, and expand only when the task crosses additional risk boundaries.

### Tier 1 — always required
1. Confirm the repository is exactly `codebymoein/gallery-mazhari-angular`.
2. Fetch current `main`, record its exact SHA, inspect relevant open/merged PRs and branches, and verify the intended working branch lineage.
3. Read this `AGENTS.md` completely.
4. Read [`CONSTITUTION.md`](CONSTITUTION.md) completely.
5. Read the current-state/task-relevant portion of [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md); read more only when needed to resolve history or constraints.
6. Read [`docs/handbook/README.md`](docs/handbook/README.md) to select only the chapters required by the task-risk matrix below.
7. Read [`docs/governance/AGENT_TASK_MANIFEST.md`](docs/governance/AGENT_TASK_MANIFEST.md) and prepare exact base SHA, scope/non-scope, write surfaces, verification, and recovery.
8. Follow [`docs/governance/BRANCH-COMMIT-CONVENTIONS.md`](docs/governance/BRANCH-COMMIT-CONVENTIONS.md).
9. Inspect the actual affected implementation and existing tests/docs before proposing edits.

### Tier 2 — remediation/audit work
For remediation/audit tasks, read from [`docs/remediation/MASTER_REMEDIATION_ROADMAP.md`](docs/remediation/MASTER_REMEDIATION_ROADMAP.md):
- the execution waves / hard gates;
- the exact current RM section;
- the exact recommended PR slice and its dependencies;
- linked finding IDs, deliverables and exit criteria;
- the Roadmap Definition of Done and risk-disposition rules.

Do **not** consume the entire Roadmap line-by-line when unrelated RM sections are not needed. Expand to adjacent sections only when a declared dependency or ambiguity requires it. Raw findings do not grant additional scope.

### Tier 3 — Handbook task-risk matrix
Read only the chapters whose risk boundary applies, plus any chapter explicitly linked by the selected chapter:
- **All material code changes:** `03-development-rules.md`, `10-testing-quality.md`, `11-git-pr-releases.md`, `12-ai-agent-rules.md`.
- **Architecture/source-of-truth/workflow semantics:** also `01-engineering-principles.md`, `02-system-architecture.md`, `07-business-workflows.md`.
- **Angular/UI/client state:** also `04-frontend-angular.md`; add `08-design-system.md` and/or `17-seo-performance-accessibility.md` only when UI/design/public-experience behavior is touched.
- **NestJS/API/business logic:** also `05-backend-nestjs.md`; add `09-security.md` for auth/permissions/input/security-sensitive changes.
- **Database/schema/migrations/import persistence:** also `06-database-postgresql.md` and `07-business-workflows.md`.
- **Uploads/images/media:** also `09-security.md` and `13-media-storage.md`.
- **Deployment/runtime/operations:** also `14-deployment-operations.md`, `15-observability.md`, and/or `16-backup-disaster-recovery.md` according to impact.
- **Documentation/governance-only:** `11-git-pr-releases.md`, `12-ai-agent-rules.md`, `18-documentation-governance.md`; architecture/workflow chapters are required only if their rules are being changed.

If uncertain whether a boundary applies, read the chapter. Token efficiency never overrides safety, data integrity, security, or business-workflow preservation.

## Mandatory compact pre-write report
Before the **first material write** of a task, report one compact table or equivalent block containing:

`repo/main SHA | current Wave/RM/PR/findings | scope | non-scope | write surfaces | workflows/source-of-truth impact | data/security/deploy risk | tests/gates | recovery | branch`

Also name the governance/Handbook documents actually read. Do not restate their full contents. If a required document is unavailable or contradictory, stop and report the blocker.

A new chat/session/agent must independently re-verify repository state rather than trusting copied SHAs or status text. If the human owner explicitly says to continue an already-approved task in the same verified session/state, do not ask a redundant confirmation, but still re-check any state that may have changed before writing.

## Optional external agent skills and ECC policy
External agent systems such as ECC, provider plugins, MCP servers, skills, hooks, review loops, or design helpers are **capabilities, not project authority**. They may improve execution but MUST remain subordinate to the precedence and scope rules above.

- Do not vendor, copy, or mirror a full external agent framework or its skill library into this repository merely to make it available to an agent. Prefer harness-level installation/configuration so repository context stays small.
- If ECC is available in the active harness, select only the smallest task-relevant skills. For storefront UI/UX work, the preferred set is `frontend-design-direction`, `design-system`, `angular-developer`, `make-interfaces-feel-better`, `accessibility`, and `browser-qa`.
- `plan-canvas` may be used for owner-facing design planning/review when useful, but it does not replace repository tests, browser evidence, or explicit owner acceptance.
- Generic external verification loops MUST defer to this repository's Tier A/B/C model. An external skill may recommend additional checks, but it may not expand an isolated frontend task into unrelated backend/database/release suites without a real risk boundary or an explicit task contract.
- External design or motion guidance may inform implementation, but it MUST NOT introduce React/Next/Framer-specific dependencies or patterns into this Angular application unless separately justified and owner-approved.
- External tools MUST reuse the repository's existing design tokens, Angular/SSR architecture, canonical taxonomy, API/data ownership, and protected workflows rather than creating parallel authorities.
- Hooks, MCP servers, shell commands, and plugin permissions MUST be reviewed/trusted in the agent harness before use. Installation of a plugin is not blanket authorization for repository writes, direct `main` changes, destructive commands, secret access, or quality-gate bypasses.
- ECC or any other optional agent framework MUST NOT become a prerequisite for maintaining this repository. If unavailable, agents continue using `AGENTS.md`, the Constitution, the selected Handbook chapters, and the task contract.

## Risk-based verification rule
Verification MUST be proportionate to the actual final diff and risk boundaries. Before running checks, classify the task using [`docs/handbook/10-testing-quality.md`](docs/handbook/10-testing-quality.md) Tier A, B, or C and record that tier in the task/PR evidence.

- Do not run `npm run verify:local`, full backend/database/security/release suites, the entire Playwright matrix, or unrelated certification gates by default for an isolated frontend presentation change.
- Run focused frontend checks for frontend-only work and escalate only when behavior, routing/state, SSR/accessibility/SEO/performance, backend/API, data/schema, security, workflow, dependency, deployment, or release boundaries are actually touched.
- A task/release/certification contract may explicitly require broader evidence; such an explicit requirement overrides the normal tier minimum.
- CI may run broader permanent regression controls. Do not disable or weaken CI to obtain a pass, and do not reproduce every unrelated CI job locally unless it is applicable to the change or explicitly required.
- A failing relevant gate is never grounds to downgrade the tier or mark the gate not applicable.

## Hard rules
- Never create a replacement repository. Never push directly to `main`. Never modify historical merged PRs.
- Work on one focused branch/PR slice at a time. Do not mix governance hardening, adjacent remediation programs, cleanup, or opportunistic fixes into the active PR unless the Roadmap explicitly groups them.
- Never merge a PR unless the human owner explicitly authorizes merge. Passing CI is necessary but not by itself merge authorization.
- Preserve Excel Inventory Import, Dry Run / Confirm Import, Product / Variation Workflow, Photo / Media Queue, Orphan / Quarantine, Staging / Publish Queue, stock lifecycle/audit, taxonomy, SEO enrichment, merchandising, and other documented Gallery Mazhari workflows. Complexity alone is never grounds for deletion or simplification.
- Do not create a second product/inventory source of truth. Production durable data belongs in PostgreSQL through NestJS-controlled domain paths.
- Angular is not an authorization or business-integrity boundary. Privileged/invariant logic must be enforced by NestJS/database layers.
- Browser/local storage may not become authoritative for business classification, inventory, workflow state, authorization, publication, pricing, or durable production data.
- No secrets, credentials, private data, production dumps, or destructive production commands in commits.
- No unrelated refactors. Keep the diff minimal, reviewable, attributable, and reversible.
- Schema changes require forward migrations and migration review. Do not enable production schema synchronization.
- Behavioral changes require tests; workflow/architecture/operations changes require relevant Handbook/Project Memory updates.
- Do not start an adjacent remediation program or unassigned audit finding merely because it is visible.
- Do not reuse stale/diverged branches as remediation bases. Create a fresh focused branch from the approved `main` lineage unless the verified current Roadmap PR branch is already the authorized branch.
- Never weaken, skip, alter, or bypass a quality gate merely to make a PR pass. Fix in-scope regressions; document known out-of-scope baseline debt.
- A failed or partial operation must not be represented as successful. Do not claim tests, deployment, merge, or completion without evidence.
- CODEOWNERS/sensitive-path review rules are governance controls; an AI agent's own review is not independent human approval.

## Remediation completion gate
A remediation PR is not complete merely because code was written. It MUST satisfy the Roadmap Definition of Done, including linked RM/finding IDs, exact base SHA/scope, applicable tests and CI evidence, impact fields, rollback/recovery, documentation updates where required, and no unrelated cleanup. The agent MUST verify the final PR head SHA against the CI run used as evidence.

## Before completion
- Review final diff/PR file list for accidental executable, generated, secret, unrelated, or out-of-scope changes.
- Run applicable repository checks described in [`docs/handbook/10-testing-quality.md`](docs/handbook/10-testing-quality.md).
- Validate documentation links when documentation changed.
- Report branch, base/current SHA, changed files, tests/checks, assumptions, unresolved risks, migration/deployment impact, rollback path, and next permitted Roadmap action.
- Ensure the PR uses `.github/pull_request_template.md` contract fields and the Agent Task Manifest acknowledgement.
- Stop at the requested scope. An audit finding is not permission to remediate it.
