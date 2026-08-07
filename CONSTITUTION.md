# Gallery Mazhari Engineering Constitution

Status: **Normative**. Scope: `codebymoein/gallery-mazhari-angular`. This document outranks implementation convenience. Exceptions require an explicit PR rationale, owner approval, tests/evidence, and documentation update.

## 1. Source of Truth
- This repository is the only code/documentation source of truth for this project. Do not create replacement repositories or shadow implementations.
- `main` represents reviewed integration state. All changes use branches and Pull Requests; no direct changes to `main`.
- PostgreSQL is the production system of record for durable application/business data. Browser storage, generated TypeScript data, caches, exports, WordPress, files, and queues must not silently become competing authorities.
- Existing transitional/compatibility paths may remain until deliberately migrated; they must not be expanded into a second product/inventory authority.

## 2. Architecture Boundaries
- **Angular** owns presentation, interaction, routing, client state, accessibility, client-side validation, and API orchestration. It must not become the authoritative executor of inventory, publication, pricing, payment, authorization, or workflow invariants.
- **NestJS** owns server APIs, authentication/authorization enforcement, business use cases, workflow transitions, validation, audit, integrations, jobs, and persistence orchestration.
- **PostgreSQL** owns durable relational state, constraints, transactional integrity, and production persistence. TypeORM schema changes require migrations; production `synchronize` is forbidden.
- Business invariants must be enforced server-side and, where appropriate, by database constraints. UI guards are usability controls, not security boundaries.

## 3. Business Workflow Preservation
The Gallery Mazhari workflows are intentional domain systems, not accidental complexity. Excel Inventory Import, dry-run/confirmation, product/variation workflow, media/photo matching and queues, staging/review, publish queue, stock lifecycle/audit, taxonomy/tagging, SEO enrichment, merchandising, orders, payments, consultations, custom requests, and related approval gates must not be removed, bypassed, collapsed, or silently reinterpreted merely to simplify code. Any semantic change requires documented business approval, migration/rollback analysis, and workflow tests.

## 4. Data Integrity
- Identifiers, product codes, barcodes, SKUs, parent-child relationships, stock, money, statuses, timestamps, and audit records must preserve meaning across imports and APIs.
- Destructive operations require explicit intent, authorization, auditability, and a recovery strategy.
- Import/reconciliation operations must be idempotent or explicitly duplicate-safe. Dry-run gates must not write authoritative product state.
- Schema changes are forward migrations with reviewed rollback/restore implications; never edit production schema manually as normal practice.

## 5. Security
- Deny by default for privileged operations; enforce authentication, roles/permissions, input validation, rate limits where abuse is plausible, safe file handling, and least privilege.
- Never commit secrets, credentials, private keys, production tokens, customer-sensitive exports, or database dumps.
- Uploaded archives/media must retain traversal, type, size and decompression protections. Client input is untrusted.
- Security fixes may not weaken business validation or audit trails to achieve compatibility.

## 6. Git Governance
- Branch from current `main`; use focused branches and reviewable commits.
- PRs must state scope, risk, tests, data/migration impact, security impact, documentation impact, and rollback plan when applicable.
- Do not mix unrelated refactors with feature/fix work. Generated/vendor artifacts are committed only when the project explicitly requires them.
- A PR that changes a governed workflow or architecture boundary must update the relevant Handbook page in the same PR.

## 7. Testing & Quality
- Changed behavior requires proportionate automated tests at the lowest useful layer plus integration/E2E coverage for critical journeys.
- Before merge, run the repository's applicable lint, unit tests, production build, backend tests/build, and Playwright suites. A skipped gate must be visible and justified in the PR.
- Critical workflows require regression coverage for success, rejection/invalid transition, authorization, and data-integrity cases.

## 8. Deployment & Rollback
- Deploy immutable, traceable revisions. Production changes must map to a commit/release.
- Database migrations precede code paths that require them and must be safe for the chosen rollout strategy.
- Every material release needs a rollback or roll-forward plan. Data loss is not an acceptable rollback mechanism.
- Backups must be restorable; restore procedures must be tested periodically.

## 9. Documentation
- Documentation is versioned Living Documentation. It changes with the system, not after it.
- `AGENTS.md` is the mandatory entry point for AI agents. `docs/handbook/README.md` is the handbook index.
- Normative statements use MUST/MUST NOT/SHOULD language and should name a verification method where practical.

## 10. AI Agent Governance
- AI agents must read `AGENTS.md`, this Constitution, the handbook index, and task-relevant chapters before editing.
- Agents must inspect current repository state; they may not infer architecture from generic Angular/NestJS conventions.
- Agents must preserve business workflows, minimize diff scope, disclose assumptions, run/record applicable checks, and never merge their own PR unless explicitly authorized by a human owner.
- Agents must not start remediation work merely because an audit finding exists; remediation requires an explicit task.

## 11. Design Consistency
- Existing design tokens, RTL/Persian behavior, responsive rules, accessibility semantics, and established Gallery Mazhari visual language are shared contracts.
- New UI must reuse system tokens/patterns before inventing one-off values. Visual simplification must not remove business capability.

## 12. Governance
Changes to this Constitution require a dedicated or clearly identified governance section in a PR explaining why the rule changes, what becomes newly allowed/forbidden, and how existing code is affected. Silent weakening of a constitutional rule is prohibited.
