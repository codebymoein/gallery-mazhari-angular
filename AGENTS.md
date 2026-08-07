# AGENTS.md — Mandatory AI/Automation Entry Point

Applies to Codex, Claude, Cursor, ChatGPT, IDE agents, scripts, and human-assisted automation working in this repository.

## Mandatory pre-edit sequence
1. Confirm repository is `codebymoein/gallery-mazhari-angular`, fetch current `main`, record its SHA, and work on a non-`main` branch.
2. Read [`CONSTITUTION.md`](CONSTITUTION.md).
3. Read [`docs/handbook/README.md`](docs/handbook/README.md).
4. Read at minimum: engineering principles, system architecture, development rules, business workflows, testing/quality, Git/PR/releases, and AI-agent rules.
5. Read task-specific chapters: Angular for `src/`; NestJS/database for `backend/`; security for auth/input/files; media for uploads/images; deployment/operations for runtime changes; design system and SEO/performance/accessibility for UI.
6. Inspect the actual affected implementation and existing tests/docs before proposing edits.

## Hard rules
- Never create a replacement repository. Never push directly to `main`. Never merge a PR unless the human owner explicitly asks.
- Preserve Excel Inventory Import, Product Workflow, Photo/Media Queue, Staging/Publish Queue, stock lifecycle/audit, and other documented Gallery Mazhari workflows. Complexity alone is not grounds for deletion.
- Do not create a second product/inventory source of truth. Production durable data belongs in PostgreSQL through NestJS-controlled domain paths.
- Angular is not an authorization or business-integrity boundary. Privileged/invariant logic must be enforced by NestJS/database layers.
- No secrets, credentials, private data, production dumps, or destructive production commands in commits.
- No unrelated refactors. Keep the diff minimal and reversible.
- Schema changes require migrations and migration review. Do not enable production schema synchronization.
- Behavioral changes require tests; workflow/architecture changes require handbook updates.

## Before completion
- Review `git diff`/PR file list for accidental executable or generated changes.
- Run applicable repository checks described in [`docs/handbook/10-testing-quality.md`](docs/handbook/10-testing-quality.md).
- Validate documentation links when documentation changed.
- Report changed files, tests/checks, assumptions, unresolved risks, migration/deployment impact, and rollback path.
- Stop at the requested scope. An audit finding is not permission to remediate it.
