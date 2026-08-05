# AGENTS.md — Gallery Mazhari (gallery-mazhari-angular)

Operational instructions for AI coding agents working in this repository.

# Project Identity

- **Project name:** Gallery Mazhari (gallery-mazhari-angular)
- **Purpose:** A Persian (Farsi), full-stack, RTL e-commerce platform for bridal apparel, accessories, and related services. It includes a responsive customer storefront (Angular), a business/admin panel, and an independent REST API (NestJS).
- **Current lifecycle stage:** Active development; a production snapshot has been published and the payment gateway was recently migrated. Not yet at final production deployment (external services, production database, email/SMS, and payment still require environment-specific setup).
- **Primary users:** Brides and shoppers (storefront) and shop staff/managers (admin panel).
- **Business-critical areas:** Product catalog & inventory staging/publishing workflow, checkout + payment (Zibal gateway), orders & reservations, consultations/custom requests (customer leads), admin authorization (ADMIN/STAFF roles with permissions), and media/image handling.

# Mandatory Startup Protocol

Every new agent or new session MUST complete each step below BEFORE modifying any file:

1. Read `AGENTS.md` completely.
2. Read `docs/PROJECT_MEMORY.md` completely.
3. Read the relevant README and package/config files (at minimum `README.md`, `package.json`, `backend/package.json`).
4. Run `git status`.
5. Inspect recent changes and existing uncommitted work (`git log --oneline -15`, then diff any uncommitted files).
6. Identify the requested task and the files it affects.
7. Load the relevant skill(s) from `.opencode/skills/` (see Skill Selection below).
8. State clearly:
   - current understanding
   - assumptions
   - proposed plan
   - expected files to change
   - verification plan
9. Do NOT edit any file until this startup protocol is complete.

# Operating Rules

- **Understand before editing.** Read the relevant code before changing it.
- **Prefer minimal, targeted changes.** Do not refactor unrelated code.
- **Preserve existing architecture and coding conventions.**
- **Reuse existing functions and components** before creating new ones.
- **Avoid duplicated code.**
- **Avoid unnecessary dependencies.** Do not install packages or update dependencies without explicit user approval.
- **Never delete or rename files** without explicit user approval.
- **Never overwrite unrelated user changes.**
- **Never expose or commit secrets** (`.env`, tokens, keys, credentials). `.gitignore` is NOT a substitute for care.
- **Never modify environment secrets.**
- **Never run destructive commands** (`git reset --hard`, `git clean`, force-push, dropping data) without explicit approval.
- **Never push, force-push, reset, rebase, merge, or rewrite Git history without explicit approval.**
- **Never commit unless the user explicitly requests it.**
- **Never claim a test passed unless it was actually run.**
- **Clearly distinguish verified facts from assumptions.** Mark unknown facts as `UNKNOWN` or `TO BE CONFIRMED`.
- When requirements are ambiguous and materially affect behavior, ask targeted questions. For small, reversible tasks, avoid unnecessary questioning and proceed with documented assumptions.
- **Explain planned changes before implementation.**
- **After implementation, review the diff and verify the result.**
- **Prefer production-ready solutions over temporary patches.**
- Consider security, accessibility, performance, maintainability, and scalability.
- Keep responses concise but include decisions, risks, and verification results.
- Communicate with the user in **Persian** when the user writes in Persian.
- Keep code, identifiers, filenames, Git messages, and technical artifacts in **English** unless the project convention requires otherwise.

# Repository Map

- `src/app/core/` — Angular services (39+ files), guards, interceptors, NgRx store (cart, product)
- `src/app/features/` — Storefront feature modules and the admin panel sub-features
- `src/app/layout/` — Global header and footer
- `src/app/shared/` — Shared models, static data, directives, and reusable components
- `src/styles/` — Design tokens, typography, RTL, patterns, global, and admin theme CSS
- `src/environments/` — `environment.ts` (dev) and `environment.prod.ts` (prod)
- `backend/src/` — NestJS modules: auth, users, products, orders, payments, discounts, gallery, consultations, custom-requests, notifications, appearance, platform, database
- `backend/src/platform/` — Import, media, merchandising, workflow, taxonomy, rules, audit, jobs, seo
- `backend/src/database/migrations/` — TypeORM migrations
- `docs/` — Architecture, API, deployment, and platform documentation
- `e2e/` — Playwright end-to-end tests
- `deploy/` — Production provisioning, nginx, and admin bootstrap scripts
- `scripts/` — Helper/diagnostic scripts

# Technology Stack

- **Frontend:** Angular 21, TypeScript ~5.9, RxJS 7, NgRx 21 (cart + product stores), Angular Signals (used across many services), CSS design tokens (RTL)
- **Backend:** NestJS 11, TypeORM, Passport + JWT (cookie + bearer), bcrypt, class-validator, @nestjs/throttler, helmet, sharp
- **Database:** `better-sqlite3` (local development) / PostgreSQL (`pg`) for production
- **Payments:** Zibal gateway (recently migrated from Zarinpal)
- **Other frontend libs:** Chart.js, Leaflet (maps), `xlsx` (installed from an external SheetJS tarball), Angular CDK
- **Tooling:** Angular CLI, ESLint (angular-eslint), Prettier (backend), Vitest (frontend), Jest (backend), Playwright (e2e)
- **Infrastructure/deployment:** Node.js/npm; deploy scripts for nginx reverse proxy over NestJS; NestJS serves `uploads/` statically; backend binds to `127.0.0.1` in production behind a reverse proxy

# Commands

Verified commands (run from repo root unless a prefix is shown):

- **Install:** `npm install` then `npm --prefix backend install`
- **Frontend dev server:** `npm start` (alias `npm run dev`)
- **Backend dev server:** `npm run backend:start`
- **Frontend build:** `npm run build` (dev) / `npm run build:prod`
- **Backend build:** `npm --prefix backend run build`
- **Frontend lint:** `npm run lint` (note: repo currently has pre-existing lint errors/warnings — see PROJECT_MEMORY)
- **Backend lint (auto-fix):** `npm --prefix backend run lint` — this runs ESLint with `--fix`; use with care
- **Frontend type-check / dev build:** `npm run typecheck`
- **Frontend unit tests:** `npm test` (Vitest)
- **Backend unit tests:** `npm --prefix backend test -- --runInBand` (Jest)
- **End-to-end tests:** `npm run e2e` (Playwright; requires the app/backend to be running) — TO BE CONFIRMED in a clean environment
- **Database migrations:** `npm --prefix backend run migration:run|revert|show`
- **Full local verification:** `npm run verify:local`

> If a command cannot be verified in the current environment, label its result `TO BE CONFIRMED`.

# Architecture and Conventions

- **Storefront routing:** lazy-loaded components via `loadComponent`, with per-route Persian SEO metadata in `src/app/app.routes.ts`.
- **State management:** NgRx for cart and product state; many services use Angular Signals (`signal`, `computed`) for local/admin state.
- **Injections:** Angular 21 pattern, `inject()` used in newer services; constructor injection in others (preserve the file's existing style).
- **Path aliases (from `tsconfig.json`):** `@app/*`, `@core/*`, `@shared/*`, `@features/*`, `@assets/*`, `@env/*`. Vitest maps `@env` and `@shared` only.
- **Backend module layout:** each domain module groups `*.controller.ts`, `*.module.ts`, `*.service.ts`, `dto/`, `entities/`.
- **Backend API prefix:** all routes under `/api`.
- **Auth/authorization:** JWT + cookie (`mazhari_admin_session`) and bearer; `@Roles(...)`/`@Permissions(...)` guards on protected controllers; public endpoints are throttled. Admin panel guards on the frontend mirror backend role/perm checks.
- **Validation:** global `ValidationPipe` with `whitelist`, `transform`, `forbidNonWhitelisted`.
- **Errors:** backend returns exception classes; frontend API interceptor normalizes errors into `{ code, message, status, details, timestamp }`.
- **Styling:** CSS design tokens and RTL-first CSS; Tailwind is listed as a dev dependency but is NOT directly used in `src/styles` (TO BE CONFIRMED whether any component uses it).
- **Tests:** Vitest specs alongside frontend code; Jest specs in backend modules; Playwright E2E in `e2e/`. Never claim a test ran unless it was actually executed.
- **Database access:** TypeORM repositories and `QueryBuilder`; queries are parameterized (avoid raw string interpolation into SQL).
- **Secrets/security:** Never commit `.env`, `backend/data/*.sqlite`, `backend/uploads/`, `*.log`, or `*.key`. These are git-ignored.

# Change Workflow

Follow this sequence for any change:

1. **Inspect** — complete the Mandatory Startup Protocol.
2. **Plan** — describe intent, files, and verification.
3. **Confirm scope when necessary** — ask if requirements are ambiguous or affect behavior.
4. **Implement minimally** — smallest coherent change, reusing existing code.
5. **Run focused verification** — the specific lint/type-check/tests/build relevant to the change.
6. **Review the diff** — confirm no unintended changes.
7. **Update documentation and project memory** — only when the work is substantial.
8. **Report**:
   - changed files
   - reason for each change
   - tests run and their real results
   - remaining risks
   - recommended next step

# Risk Controls

High-risk areas requiring extra care and usually explicit approval:

- **Payments (Zibal)** — altering verify/request logic affects real money; verify against the Zibal contract and tests.
- **Authorization/permissions** — changing roles or permission checks on backend controllers or admin guards can cause privilege escalation or lockout. Prefer narrowing, never loosening, without approval.
- **Database schema / migrations** — TypeORM `synchronize` runs only outside production; schema changes should use migrations. Never drop data.
- **Uploads & media** — file handling in `backend/src/platform/media`; respect size/type limits; avoid path traversal or unsafe filenames.
- **Dependency changes** — do not install/update packages; current `xlsx` is a remote tarball and `typeorm` version is unusual (see Known Issues in PROJECT_MEMORY).
- **Secrets** — never print or commit tokens/keys; redact if accidentally discovered.
- **Git history** — only commit/push when explicitly requested; never rewrite history.
- **Large monolith components** — some components (e.g. product-detail ~2300 lines) are large; avoid broad refactors without a dedicated task.

# Definition of Done

A task is done only when ALL of the following are true:

- requested behavior is implemented
- unrelated behavior is preserved
- relevant checks have been run (and results are truthful)
- no known secret is exposed
- no unexplained generated file is added
- no unnecessary dependency is introduced
- the final diff is reviewed
- documentation and project memory are updated when needed

# Skill Selection

Load the matching skill from `.opencode/skills/` for the type of work:

- New session or unfamiliar project → `project-onboarding`
- Unclear or major feature → `grill-me`
- Feature design → `feature-planning`
- Implementation or refactoring → `senior-engineering`
- Bug → `bug-investigation`
- Security review → `security-audit`
- Performance review → `performance-audit`
- Testing → `qa-testing`
- Reviewing changes → `code-review`
- Git operations → `git-workflow`
- Ending or transferring a session → `session-handoff`
