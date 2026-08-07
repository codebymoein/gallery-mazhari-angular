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
5. [`docs/handbook/README.md`](docs/handbook/README.md) and mandatory/task-specific Handbook chapters
6. Task manifest and specialized project documentation
7. Implementation comments/convenience

A lower-precedence source may add detail but may not silently weaken a higher-precedence rule.

## Mandatory preflight — MUST complete before any write
1. Confirm the repository is exactly `codebymoein/gallery-mazhari-angular`.
2. Fetch current `main`, record its exact SHA, inspect open PRs/branches relevant to the task, and confirm the proposed working branch is based on the approved `main` lineage.
3. Read this `AGENTS.md` completely.
4. Read [`CONSTITUTION.md`](CONSTITUTION.md) completely.
5. Read [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md).
6. Read [`docs/handbook/README.md`](docs/handbook/README.md).
7. Read at minimum Handbook chapters: engineering principles, system architecture, development rules, business workflows, testing/quality, Git/PR/releases, and AI-agent rules.
8. Read task-specific chapters: Angular for `src/`; NestJS/database for `backend/`; security for auth/input/files; media for uploads/images; deployment/operations/observability/backup for runtime changes; design system and SEO/performance/accessibility for UI/public experience.
9. For any remediation/audit task, read [`docs/remediation/MASTER_REMEDIATION_ROADMAP.md`](docs/remediation/MASTER_REMEDIATION_ROADMAP.md) and identify the exact current Wave, RM, recommended PR slice, dependencies, finding IDs, deliverables, exit criteria, and explicit non-goals.
10. Read [`docs/governance/AGENT_TASK_MANIFEST.md`](docs/governance/AGENT_TASK_MANIFEST.md) and prepare the task manifest with exact base SHA, scope/non-scope, allowed write surfaces, verification plan, and rollback/recovery.
11. Follow [`docs/governance/BRANCH-COMMIT-CONVENTIONS.md`](docs/governance/BRANCH-COMMIT-CONVENTIONS.md).
12. Inspect the actual affected implementation and existing tests/docs before proposing edits.

## Mandatory pre-write report
Before the **first material write** of a task, the agent MUST report to the human owner:
- repository and current `main` SHA;
- governance documents actually read;
- current Wave / RM / PR slice and linked finding IDs;
- exact scope and explicit non-scope;
- expected changed files/write surfaces;
- business workflows and sources of truth affected;
- risks, migrations/data/deployment impact;
- tests/quality gates to run;
- rollback/roll-forward approach;
- proposed branch name.

If the human owner explicitly says to continue an already-approved task in the same verified state, the agent may continue without asking a redundant question, but it must still have performed and recorded the preflight. A new chat/session/agent must independently re-verify repository state rather than trusting copied SHAs or status text.

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
