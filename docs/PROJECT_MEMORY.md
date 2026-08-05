# Project Memory

## Last Updated
- **Date:** 2026-08-06
- **Updated by:** AI agent
- **Repository branch:** `agent/publish-current-gallery-progress`
- **Latest inspected commit:** `7a5950aa` — "Migrate payment gateway to Zibal, harden backend/deploy security, refine mobile UI, fix lint errors"

## Project Objective

Build and maintain a production-ready Persian (Farsi), RTL e-commerce platform for bridal apparel and accessories, sold through a responsive Angular storefront and managed via a staff/admin Angular panel backed by a NestJS REST API.

## Current State

Implemented and functioning:
- Full storefront: home, catalog, categories/subcategories, product detail, cart, checkout, orders, account, discounts, collections, lookbook, dream-canvas, catalog-builder, consultation, home-trial, custom-requests, contact.
- Admin panel: dashboard, orders kanban, CRM clients/profiles, inventory hub/category, marketing, appearance manager, Excel import, platform hub, published products, staging queue, manager dashboard, user manager, activity log, client insights, custom-requests admin. Routes guard on `adminPermissionGuard(...)`/roles.
- NestJS backend with auth (JWT cookie+JWT bearer, ADMIN/STAFF/CUSTOMER roles, `@Roles`/`@Permissions`), users, products, orders, payments (Zibal), discounts, gallery, consultations, custom-requests, notifications, appearance, and a large platform module (import, media, merchandising, workflow, taxonomy, rules, audit, jobs, seo).
- Local SQLite database with TypeORM `synchronize` in non-production; PostgreSQL for production.
- Zibal payment gateway integrated (recently migrated from Zarinpal).

Verified as of last session:
- Backend unit tests (Jest): 69 passed / 18 suites.
- Frontend unit tests (Vitest): 6 passed / 2 files.
- Frontend build (`npm run typecheck` / `ng build`): passes.
- Backend build (`nest build`): passes.
- Frontend lint: currently 3 pre-existing errors + ~90 warnings (accessibility `<label>` rules and `any` warnings); see Known Issues.

## Current Workstream

**Production hardening & release stabilization.** Recent commits focus on publishing the current platform state, mobile (iPhone/Android) rendering fixes, and the payment gateway migration to Zibal. Production deployment (external services, PostgreSQL, email/SMS, payment credentials) is still pending environment-specific setup.

## Completed Work

Chronological (most recent first):
1. `7a5950aa` — Migrated payment gateway to **Zibal**, hardened backend/deploy security (bind API to `127.0.0.1` in production, hardened nginx config, added deploy scripts), refined mobile UI, fixed lint errors. Committed and pushed to `agent/publish-current-gallery-progress`.
   - Lint fixes included: `const removed` (dead variable) in `staging-queue.service.ts`, ternary side-effects → if/else in `custom-requests-admin.component.ts`, `marketing-hub.component.ts`, `dream-canvas.component.ts`, and removed an unnecessary escape in `dream-canvas-widget.component.ts`.
2. `ac84b14a` — Align iPhone and Android home rendering.
3. `1c3a1b71` — Simplify mobile consultation flow.
4. `007e480b` — Fix mobile home rendering on Safari.
5. `081e51b3` — Publish current gallery platform progress.
6. `d78d07a2` — Publish secure full-stack Gallery Mazhari snapshot.
7. `8a355239` — Fix cart store leaks/totals, harden interceptors, lazy-load catalog routes, patch xlsx, drop axios.
8. `bc4dfc42` — Untrack `backend/node_modules` and `backend/dist`.
9. `ad73455f` — Baseline commit before production audit.

## Decisions and Rationale

- **Zibal over Zarinpal:** payment provider migrated to Zibal; verify flow uses a `trackId` corresponding to the transaction authority. Rationale: business/provider requirement.
- **JWT + cookie (`mazhari_admin_session`) and JWT bearer:** admin frontend stores the session token in `sessionStorage` and sends it as a bearer token; the cookie path is set to `/api`. Rationale: httpOnly cookie reduces XSS token theft; bearer used by the SPA interceptor.
- **Separate NestJS API from frontend Angular SPA:** cleanly decouples storefront logic (data served from API) from the SPA (rendering).
- **`@Roles`/`@Permissions` on backend controllers and mirrored permission guards on frontend admin routes:** authorization is enforced server-side; the frontend guards mirror them for UX.
- **SQLite for local dev, PostgreSQL for production, `synchronize` only outside production:** fast local iteration without migration friction; production uses explicit migrations (`backend/src/database/migrations`).
- **CSS design tokens + RTL-first styles:** consistent theming and Persian RTL layout without a heavy CSS framework.
- **`xlsx` installed from a remote SheetJS tarball and `typeorm` at an unusual version:** existing decisions; flagged as risk (see Known Issues and Risks).

## Architecture Summary

- **Frontend (Angular 21):** lazy-loaded routes with per-route SEO metadata; NgRx store for cart and product state; many services and admin state use Angular Signals. Interceptors add headers and normalize errors. Guards (`adminPermissionGuard`, `managerRoleGuard`, etc.) protect admin routes.
- **Backend (NestJS 11 + TypeORM):** domain modules each with controller/service/module/dto/entities. Global `ValidationPipe` (whitelist + transform + forbidNonWhitelisted), helmet, throttler, CORS restricted to `FRONTEND_ORIGIN`. All routes under `/api`.
- **API prefix:** everything under `/api`.
- **Production topology:** nginx reverse proxy → NestJS bound to `127.0.0.1`; NestJS serves `uploads/` statically; PostgreSQL database.

## Repository Map

- `src/app/core/` — services, guards, interceptors, NgRx store (cart, product)
- `src/app/features/` — storefront modules + admin panel sub-features
- `src/app/layout/` — header, footer
- `src/app/shared/` — models, static data, directives, components
- `src/styles/` — `tokens.css`, `typography.css`, `rtl.css`, `patterns.css`, `global.css`, `admin-theme.css`
- `src/environments/` — `environment.ts`, `environment.prod.ts`
- `backend/src/` — auth, users, products, orders, payments, discounts, gallery, consultations, custom-requests, notifications, appearance, platform, database (migrations)
- `backend/src/platform/` — import, media, merchandising, workflow, taxonomy, rules, audit, jobs, seo
- `docs/` — architecture/API/deployment/platform docs (e.g. `PLATFORM_API.md`, `PLATFORM_ARCHITECTURE.md`, `SERVER_DEPLOYMENT_HANDOFF_FA.md`)
- `e2e/` — Playwright specs (accessibility, backend, cart-and-checkout, ios-rendering, routing-and-seo, storefront)
- `deploy/` — provisioning + nginx + admin bootstrap scripts
- `scripts/` — helper/diagnostic scripts

## Setup and Commands

```powershell
npm install
npm --prefix backend install
Copy-Item backend/.env.example backend/.env  # then set secrets locally
npm start                                    # frontend dev server (localhost:4200)
npm run backend:start                        # backend dev server (localhost:3000/api)
npm run build                                # frontend dev build
npm run build:prod                           # frontend production build
npm run typecheck                            # frontend type-check / dev build
npm run lint                                 # frontend lint (pre-existing errors)
npm test                                     # frontend unit tests (Vitest)
npm --prefix backend test -- --runInBand     # backend unit tests (Jest)
npm --prefix backend run build               # backend build
npm run e2e                                  # Playwright (requires servers running)
npm run verify:local                         # full local verification pipeline
npm --prefix backend run migration:run       # run DB migrations
```

## Known Issues

Confirmed problems only (up to 2026-08-06):
- **Frontend lint debt:** `npm run lint` reports ~3 errors and ~90 warnings. Errors are `@angular-eslint/template/label-has-associated-control` for the `app-jalali-date-input` widget used inside `<label>` elements (marketing-hub component and product-detail), plus many `@typescript-eslint/no-explicit-any` warnings. These are pre-existing and do not block the build.
- **`staging-queue.service.ts`:** the `removed` counter in `applyExcelImportLocal` is never incremented (declared `const removed = 0`), so import logs always report 0 removed while out-of-stock products are instead routed to `awaiting_stock`. Behavior may be intentional; confirm before changing.
- **`api.interceptor.ts` reads legacy `auth_token` key** from `localStorage` for the Authorization header; the current admin flow stores its token in `sessionStorage` (see `admin-auth.service.ts`). The legacy read appears unused for the admin path.

## Risks

- **Security — Dependabot:** GitHub reports 16 vulnerabilities on the default branch (7 high, 9 moderate) as of the last push; these were NOT triaged. See `https://github.com/codebymoein/gallery-mazhari-angular/security/dependabot`.
- **Payments (Zibal):** altering request/verify logic affects real money; must be validated against the Zibal contract and tests.
- **Authorization:** changes to `@Roles`/`@Permissions` or admin guards risk privilege escalation or lockout; prefer narrowing.
- **Dependencies:** `xlsx` is installed from a remote SheetJS tarball; `typeorm` is at an unusual version (`^1.1.0`). Both may complicate upgrades or auditing. Do not change without approval and verification.
- **Schema/migrations:** `synchronize` is active in non-production only; production schema changes must use migrations. Never drop data.
- **Uploads/media:** file handling must respect size/type limits and avoid path traversal/unsafe filenames.
- **Large components:** `product-detail` (~2300 lines) and similar are big and hard to maintain/test; avoid broad refactors without a dedicated task.
- **Legacy WP remnants:** `wordpress.service.ts`, `wp-json` config, and legacy storage keys remain; not fully migrated to the NestJS API path.

## Open Questions

- Is out-of-stock handling in `applyExcelImportLocal` intentionally leaving `removed` at 0? (see Known Issues)
- Should the legacy WordPress API path and `wordpress.service.ts` be removed once the NestJS API path is complete?
- Confirm the intended **production** payment provider credentials and domain before final deployment.
- Are the 16 Dependabot findings reachable in the deployed configuration, or are some dev-only/transitive?

## Pending Tasks

### P0 — Critical
- **Triage 16 Dependabot vulnerabilities (7 high / 9 moderate).**
  - Status: Pending
  - Affected area: dependencies (root + backend)
  - Acceptance criteria: each finding classified (reachable vs not), high-severity addressed or documented with a mitigation plan.
  - Recommended next action: run `gh adv query` / open Dependabot and classify; do not mass-update without approval.

### P1 — High
- **Resolve frontend lint errors** (3 accessibility `<label>` errors) and decide how to handle `no-explicit-any` warnings.
  - Status: Pending
  - Affected area: `marketing-hub.component.html`, `product-detail.component.html`, shared `jalali-date-input` widget, ESLint config
  - Acceptance criteria: `npm run lint` exits clean (or explicitly-documented exemptions).
  - Recommended next action: properly associate the custom date widget with a control or configure the rule; run `npm run lint`.
- **Confirm `removed` counter behavior** in `staging-queue.service.ts` and fix if it is a bug.
  - Status: Pending
  - Affected area: `src/app/core/services/staging-queue.service.ts`
  - Acceptance criteria: import logs reflect real removals (or documented intent) and tests pass.
  - Recommended next action: inspect the import flow and decide whether removal counting is needed.

### P2 — Normal
- **Decide fate of legacy WordPress path** (`wordpress.service.ts`, `wp-json` config, legacy storage keys).
  - Status: Pending
  - Affected area: `src/app/core/api/wordpress.service.ts`, `src/environments/*`, core services
  - Acceptance criteria: single API path in use; no dead config.
  - Recommended next action: trace usage before any removal.
- **Review `xlsx`/`typeorm` dependency sources and versions.**
  - Status: Pending
  - Affected area: `package.json`, `backend/package.json`
  - Acceptance criteria: documented rationale or updated to stable sources with tests passing.
  - Recommended next action: research availability; propose a change with approval.
- **Break down large monolith components** (e.g. `product-detail`) into smaller components.
  - Status: Pending
  - Affected area: `src/app/features/product-detail/`, similar large features
  - Acceptance criteria: behavior preserved, tests pass, components are smaller and reusable.
  - Recommended next action: scope a dedicated refactor task.

### P3 — Optional
- **Add HTTP security headers / CSP** review and tighten where safe (currently `contentSecurityPolicy: false` in helmet).
  - Status: Pending
  - Affected area: `backend/src/main.ts`
  - Acceptance criteria: CSP enabled without breaking the SPA; documented.
  - Recommended next action: test CSP directives against the running app.

## Last Session Handoff

- **Task requested:** Connect to GitHub, perform the previously reported roadmap work step-by-step, push, and report.
- **Work performed:** Inspected the repo; discovered pre-existing uncommitted work (Zibal migration, security hardening, mobile UI). Re-verified authorization guards were already present. Fixed 5 lint errors. Ran verification (backend Jest 69 passing, Vitest 6 passing, frontend build passing, backend build passing, lint 8→3 errors). Committed everything together and pushed.
- **Files changed:** 60 files in commit `7a5950aa` (payments service/DTO/entity, main.ts, deploy scripts, nginx config, e2e specs, CSS/HTML/TS UI files, and 5 lint fixes).
- **Commands/tests run:** `npm --prefix backend test -- --runInBand` (all passed), `npx vitest run` (all passed), `npm run typecheck` (passed), `npm --prefix backend run build` (passed), `npx eslint ...` (3 pre-existing errors remain).
- **Result:** commit `7a5950aa` pushed to `origin/agent/publish-current-gallery-progress`; working tree clean.
- **Unresolved items:** frontend lint still has 3 pre-existing errors (a11y) + warnings; 16 Dependabot findings untriaged; legacy WP remnants; `xlsx`/`typeorm` dependency questions.
- **Exact recommended next step:** Triage the 16 Dependabot vulnerabilities (P0), then address the 3 lint accessibility errors (P1).

## Memory Update Rules

- Read this file at the start of every session.
- Update only verified facts; preserve useful history.
- Remove or mark stale information instead of silently deleting.
- Never place credentials or secrets here.
- Update **Last Session Handoff** before ending substantial work.
