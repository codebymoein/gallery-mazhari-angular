# Gallery Mazhari Production Audit

Audit date: 2026-07-31  
Scope: Angular application and the included NestJS backend  
Status: **Application remediation complete; ready for production-like staging and gateway/server acceptance testing**

## Remediation update

The critical application-side blockers identified in the original audit have now been implemented:

- Durable backend orders, order lines, payment linkage, hashed tracking tokens, admin APIs, and customer tracking API.
- Atomic stock reservation, conditional stock updates, release after failed/cancelled payment, and expiry of stale reservations.
- Idempotent paid callback handling and server-authoritative payment status reconciliation.
- Admin order Kanban now reads/writes the NestJS order API instead of treating browser storage as authoritative.
- Admin authentication moved from JavaScript-readable bearer storage to an HttpOnly cookie with server logout.
- Global and endpoint-specific rate limits added.
- Helmet/HSTS backend headers and an example production Nginx/CSP configuration added.
- Versioned order migration added and verified with run/show/revert on an isolated SQLite database.
- Angular upgraded from 18 to 21 with matching CDK/NgRx versions.
- Production dependency audits now report zero vulnerabilities for both frontend and backend.
- Backend verification now passes 16 suites and 64 tests, including order stock/token/idempotency tests.

Remaining items are deployment acceptance tasks requiring real infrastructure or credentials: run the migration against a backed-up staging copy of the production database, configure production environment variables, validate the real gateway callback/refund contract, install the supplied web-server rules, and execute browser/device/payment smoke tests against the deployed staging environment.

## Audit summary

The application has a solid Angular foundation: standalone components, route-level lazy loading, a real 404 route, production optimization, typed DTOs in important backend paths, global request validation, granular admin route guards, backend role/permission guards, and passing builds/tests. The public catalog and admin tooling are substantial and the current production bundle remains within configured budgets.

The launch blocker is the order architecture. Payment transactions are persisted server-side, but customer orders are stored only in browser `localStorage`; there is no backend order entity/API linking verified payments, inventory decrement, admin fulfilment, and customer tracking. This makes paid-order recovery and admin synchronization unreliable. The audit also found high-severity advisories in Angular 18, missing abuse controls, a production database migration risk (fixed during this audit), host-header-derived public URLs (fixed), and an unsafe legacy upload flow (fixed).

### Critical issues

1. **Authoritative backend order lifecycle.** Resolved in application code; deployment migration and real gateway acceptance testing remain.
2. **Production database schema was configured with `synchronize: true`.** Fixed: production now requires explicit migrations.

### High-priority issues

1. Angular 18.2.14 advisories were resolved by upgrading Angular/CDK/NgRx to version 21.
2. Payment/media public URLs trusted the inbound host. Fixed by `BACKEND_PUBLIC_URL`.
3. Legacy gallery upload trusted MIME metadata and wrote before validation. Fixed with decode-before-write validation.
4. Checkout used unrelated local/payment order numbers and cleared carts before payment success. Containment fix applied.
5. Backend rate limiting is implemented globally with stricter authentication, payment, import, and upload limits.
6. Admin sessions now use an HttpOnly cookie; session storage contains display/role metadata only.

### Medium-priority issues

1. No usable Angular unit-test or lint architect target.
2. Public SPA SEO is client-rendered; crawlers and link unfurlers may receive generic metadata.
3. Initial bundle is 759.38 kB raw; Excel import is 486.86 kB raw.
4. Multiple large services/components and broad `any` usage increase regression risk.
5. Runtime logs, local SQLite data, uploads, and screenshots are tracked or present in the repository.
6. Production security headers are not defined in this repository.
7. Login/bootstrap/payment endpoints have no explicit request throttling or lockout controls.

### Low-priority issues

1. Production console statements remain in diagnostic and fallback paths.
2. The static sitemap covers only four URLs and excludes dynamic products/categories/looks.
3. Several CSS/component files are very large and difficult to maintain.
4. Static environment configuration still contains legacy WordPress fields and empty notification placeholders.

### Needs confirmation

1. Whether the deployed reverse proxy already sets CSP, HSTS, frame, MIME, referrer, and permissions headers.
2. Whether `backend/data/gallery-mazhari.sqlite` and `backend/uploads` are disposable development data or operational data requiring backup/migration.
3. Whether public self-registration is intended.
4. Whether `bootstrap-admin` should remain available after first provisioning.
5. Whether WordPress is still a production dependency or legacy code.
6. Payment gateway production credentials, webhook/callback contract, refund behavior, and reconciliation procedure.
7. Required browser support matrix and whether SSR/prerender hosting is available.

## 1. Project structure

### PS-01 — Runtime and operational data in the repository

- Severity: Medium
- Location: `.runlogs/`, root `*.log`, `backend/data/gallery-mazhari.sqlite`, `backend/uploads/`, root viewport PNG files
- Problem: Generated logs, local database state, uploaded media, and audit screenshots are mixed with source.
- Risk: Sensitive/customer data leakage, large repository growth, accidental deployment of stale state, merge conflicts.
- Recommended fix: Back up and classify the data, migrate required media/database state to managed storage, then remove tracked runtime artifacts with a dedicated reviewed commit. Ignore rules were added; no data was deleted.
- Exact change: `.gitignore` now excludes these paths for new files.
- Backend/server confirmation required: Yes.

### PS-02 — Environment separation is present but incomplete

- Severity: Medium
- Location: `src/environments/*`, `backend/.env.example`
- Problem: Angular dev/prod API origins are separated, but deployment-critical backend origin, database, JWT, CORS, and gateway settings depend on external environment configuration.
- Risk: Incorrect production origin, insecure defaults, failed callbacks, or accidental local database use.
- Recommended fix: Validate all production-required variables at startup and maintain a deployment-secret inventory outside source control. `BACKEND_PUBLIC_URL` validation was added.
- Backend/server confirmation required: Yes.

### PS-03 — Oversized source units

- Severity: Low
- Location: `staging-queue.service.ts` (~808 lines), `platform-hub.component.ts` (~784), `product-detail.component.ts` (~505), several 500–978 line CSS files
- Problem: Multiple responsibilities are concentrated in large units.
- Risk: Harder review/testing and higher regression probability.
- Recommended fix: Extract cohesive facades, form models, and presentational sections only when covered by tests; do not redesign.
- Backend/server confirmation required: No.

## 2. Angular code quality

### CQ-01 — Frontend quality gates are not configured

- Severity: Medium (fixed)
- Location: `package.json`, `angular.json`, `tsconfig.spec.json`
- Resolution: Angular ESLint and template-accessibility rules are configured; lint passes with zero errors. Vitest is configured and 6 focused utility tests pass. `verify:local` composes lint, frontend unit/build, backend unit/build, and Playwright E2E.
- Risk: Regressions, template errors, unused code, and accessibility issues reach production.
- Recommended fix: Add Angular ESLint and a supported unit runner, then cover guards, cart reducers/effects, checkout callback reconciliation, route params, and API failures.
- Backend/server confirmation required: No.

### CQ-02 — Weak typing remains common

- Severity: Medium
- Location: `api-health.service.ts`, `wordpress.service.ts`, payment gateway response parsing, cart summary helpers
- Problem: Broad `any` and loosely shaped remote responses bypass compile-time guarantees.
- Risk: Runtime failures after API shape changes.
- Recommended fix: Introduce response interfaces and runtime validation at external boundaries; use `unknown` before narrowing.
- Backend/server confirmation required: Yes for API contracts.

### CQ-03 — Subscription lifecycle is inconsistent

- Severity: Medium
- Location: services and components found by `subscribe(` scan
- Problem: Some components use `takeUntilDestroyed` or explicit unsubscribe, while long-lived service subscriptions and several component subscriptions rely on lifetime assumptions.
- Risk: Duplicate work and leaks during repeated navigation or service re-instantiation.
- Recommended fix: Standardize on signals/async pipe or `takeUntilDestroyed`; explicitly document intentional root-service subscriptions.
- Backend/server confirmation required: No.

### CQ-04 — Forms primarily use template-driven state

- Severity: Low
- Location: checkout and multiple admin editors
- Problem: Complex validation and cross-field rules are manually coordinated.
- Risk: Inconsistent touched/error states and difficult unit testing.
- Recommended fix: Move checkout/payment/admin mutation forms to typed reactive forms incrementally.
- Backend/server confirmation required: No.

## 3. Security

### SEC-01 — Vulnerable Angular baseline

- Severity: High
- Location: root `package.json` / lockfile
- Problem: `npm audit --omit=dev` reports 11 high-severity Angular/NgRx-family findings on the installed Angular 18 line.
- Risk: XSS, sanitization bypass, XSRF token leakage, information leakage, and client DoS depending on feature exposure.
- Recommended fix: Create a tested migration branch and upgrade Angular, CLI, CDK, and NgRx together to a currently supported compatible line. Do not use `npm audit fix --force`.
- Backend/server confirmation required: No.

### SEC-02 — JavaScript-readable admin token

- Severity: High
- Location: `admin-auth.service.ts`, `api.interceptor.ts`
- Problem: Admin access tokens are stored in `sessionStorage`.
- Risk: Any XSS can exfiltrate an admin bearer token.
- Recommended fix: Prefer short-lived Secure, HttpOnly, SameSite cookies plus CSRF protection and server-side refresh/session revocation. Until migrated, enforce a strict CSP and minimize token lifetime.
- Backend/server confirmation required: Yes.

### SEC-03 — Missing abuse protection

- Severity: High
- Location: auth login/register/bootstrap, payments/create, upload/import endpoints
- Problem: No rate limiter, login backoff, or endpoint-specific upload concurrency control is configured.
- Risk: Credential stuffing, setup-key guessing, payment spam, memory/CPU exhaustion.
- Recommended fix: Add proxy-level and NestJS throttling keyed by trusted client IP/account; stricter limits for auth/payment and concurrent upload processing.
- Backend/server confirmation required: Yes.

### SEC-04 — Public URL host poisoning

- Severity: High (fixed)
- Location: payment callback and media URL construction
- Problem: URLs were derived from request protocol/Host.
- Risk: Gateway callbacks or stored media links could point to an attacker-controlled host.
- Exact change: Added `getPublicBackendUrl`, `BACKEND_PUBLIC_URL`, production fail-closed behavior, and tests.
- Backend/server confirmation required: Set the production variable.

### SEC-05 — Unsafe legacy image persistence

- Severity: High (fixed)
- Location: `backend/src/gallery/gallery.controller.ts`
- Problem: Original extension and client MIME were trusted; validation occurred after disk write.
- Risk: Disguised active content or rejected files in a public directory.
- Exact change: Memory upload, Sharp decoding, allowlist of JPEG/PNG/WebP/AVIF, UUID filename and server-selected extension, write only after validation.
- Backend/server confirmation required: Confirm reverse proxy sends `nosniff` and safe media content types.

### SEC-06 — Backend parser advisory

- Severity: Medium
- Location: backend `file-type` 16.x
- Problem: A malformed ASF parser input can trigger an infinite loop. Audit recommends a major update.
- Risk: Availability impact where attacker-controlled content reaches the affected parser.
- Recommended fix: Confirm affected call paths, cap processing time/size, and test migration to `file-type >=21.3.1` (or remove it if Sharp-only detection suffices).
- Backend/server confirmation required: No.

### SEC-07 — Security headers absent from app configuration

- Severity: Medium
- Location: deployment/reverse proxy
- Recommended baseline:
  - `Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https://media.gallery-mazhari.ir; connect-src 'self' https://api.gallery-mazhari.ir; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; upgrade-insecure-requests`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` after HTTPS validation
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
  - `X-Frame-Options: DENY` as legacy defense
- Risk: Weaker XSS/clickjacking/MIME/privacy defenses.
- Backend/server confirmation required: Yes; adjust CSP for real gateway/media/font hosts and AR camera needs.

## 4. Routing

### RT-01 — Public/admin routes are lazy loaded and 404 exists

- Severity: Informational
- Location: `src/app/app.routes.ts`
- Finding: Public pages, parameterized product/category/look routes, guarded admin children, redirects, and wildcard not-found routing are present.
- Recommended verification: Test every direct URL on the production host with SPA fallback and invalid IDs/slugs.
- Backend/server confirmation required: Yes for rewrite configuration.

### RT-02 — Frontend guards are not authorization boundaries

- Severity: Medium
- Location: admin route guards and backend controllers
- Problem: Client guards improve UX but can be bypassed.
- Risk: Any backend endpoint lacking guards would remain callable.
- Recommended fix: Maintain an automated authorization matrix covering every mutation. Several endpoints have backend guards, but platform routes grant broad STAFF access at controller level.
- Backend/server confirmation required: Yes.

### RT-03 — Static link/route behavior lacks automated coverage

- Severity: Low (fixed for primary routes)
- Location: header, footer, home modules, admin shell
- Recommended fix: Add Playwright route smoke tests and a crawler for static `routerLink`/href targets.
- Backend/server confirmation required: No.

## 5. Shopping / checkout flow

### SHOP-01 — No durable order domain

- Severity: Critical
- Location: `OrderService`, payments backend, admin order services
- Problem: Orders are browser-local; payment transactions do not become fulfilment orders or decrement/reserve inventory.
- Risk: Paid orders can disappear, overselling can occur, admin may not see purchases, customer/admin states diverge.
- Recommended fix: Add backend Order/OrderLine/StatusHistory entities and APIs. In one DB transaction, create a pending order from server-priced products, reserve stock, link payment transaction, then idempotently mark paid and commit/decrement stock after gateway verification. Expire reservations and restore stock. Admin and customer views must read this API.
- Backend/server confirmation required: Yes.

### SHOP-02 — Callback reconciliation and premature cart clearing

- Severity: High (containment fixed)
- Location: checkout component and `OrderService`
- Problem: Local and payment order numbers differed; cart cleared before payment completion.
- Risk: Lost carts on cancelled/failed payment and no local status reconciliation.
- Exact change: Persist backend-issued order number locally, keep cart through redirect, clear only on `paid`, mark matching local order `processing`, and make paid callbacks idempotent.
- Backend/server confirmation required: Durable backend implementation still required.

### SHOP-03 — Coupon authority differs between UI and backend

- Severity: Medium
- Location: cart coupon logic vs `DiscountsService` in payment calculation
- Problem: UI discount display is local, while the server independently prices products; coupon identity is not sent in the payment DTO.
- Risk: Customer sees a different payable amount or misleading discount.
- Recommended fix: Quote endpoint should return signed/server-authoritative totals, discount lines, shipping, and expiry before payment.
- Backend/server confirmation required: Yes.

### SHOP-04 — Payment callback state is exposed via query string

- Severity: Medium
- Location: `/checkout?payment=...`
- Problem: UI trusts status text in the URL for presentation.
- Risk: A user can forge the success screen, even though this does not mark backend payment paid.
- Recommended fix: Return an opaque transaction reference and have the frontend query an authenticated or possession-bound backend status endpoint.
- Backend/server confirmation required: Yes.

## 6. Admin panel synchronization

### ADM-01 — Orders are not synchronized

- Severity: Critical
- Location: local order/admin services vs payments backend
- Problem: Admin order state is not a durable projection of verified payment/order data.
- Risk: Fulfilment failure and inconsistent customer communication.
- Recommended fix: Use the backend order API as the single source of truth with audit history and optimistic concurrency/versioning.
- Backend/server confirmation required: Yes.

### ADM-02 — Product/catalog backend is substantially integrated

- Severity: Informational
- Location: Products, Platform, Discounts, Appearance modules
- Finding: Published product, import, media, discount, appearance, taxonomy, look, and workflow endpoints exist; public catalog services consume backend data with local fallbacks.
- Risk: Local fallbacks may hide production sync failures.
- Recommended fix: Disable mutation fallbacks in production; surface explicit degraded/error states and monitor sync failures.
- Backend/server confirmation required: Yes.

### ADM-03 — Broad platform STAFF access

- Severity: Medium
- Location: controller-level platform guards
- Problem: Platform routes use role guards broadly, while not every mutation has a granular permission decorator.
- Risk: Staff may access import, taxonomy, rules, media, workflow, or audit operations beyond job scope.
- Recommended fix: Add permissions per endpoint and test role/permission combinations.
- Backend/server confirmation required: Yes.

### ADM-04 — Production TypeORM synchronization

- Severity: Critical (fixed)
- Location: `backend/src/app.module.ts`
- Problem: `synchronize: true` could alter production schema automatically.
- Risk: Destructive or uncontrolled schema changes.
- Exact change: synchronization is disabled when `NODE_ENV=production`.
- Required follow-up: Create versioned TypeORM migrations and test backup/restore.
- Backend/server confirmation required: Yes.

## 7. UI/UX

### UX-01 — Accessibility foundation is visible but unverified

- Severity: Medium (automated gate added)
- Location: templates throughout public/admin UI
- Finding: Many images have alt text, controls have labels, semantic sections/nav are used, and RTL is explicit.
- Resolution: axe-core WCAG 2 A/AA checks now cover home, catalog, contact, cart, and admin login on desktop and mobile Chrome. Serious/critical violations were fixed, including calendar ARIA semantics, keyboard access to scrollable content/overlays, keyboard hotspot placement, and contrast tokens.
- Recommended fix: Run axe on every route/state; keyboard-test menus, modals, checkout steps, admin tables, focus restoration, and error announcements; verify contrast.
- Backend/server confirmation required: No.

### UX-02 — Error/loading/empty states vary by feature

- Severity: Medium
- Location: catalog, checkout, admin tools, media-heavy widgets
- Problem: Some flows have explicit states, others silently fall back to local data or log to console.
- Risk: Users/admins cannot distinguish empty content from failed synchronization.
- Recommended fix: Standard shared loading/empty/error components and retry actions; production admin mutations must never silently succeed locally.
- Backend/server confirmation required: Yes for retry semantics.

### UX-03 — Mobile checkout needs device testing

- Severity: Medium (basic automated coverage added)
- Location: checkout CSS/template
- Resolution: Mobile Chrome E2E covers checkout/cart empty states and viewport overflow. Full paid checkout still requires a configured test gateway.
- Recommended fix: Test 320/375/390/768 widths, Persian keyboard/input, validation scrolling, gateway return, and long address/product text.
- Backend/server confirmation required: No.

## 8. Performance

### PERF-01 — Bundle sizes

- Severity: Medium
- Location: production build
- Evidence: Initial 759.38 kB raw / ~180.29 kB transfer; Excel import 486.86 kB raw / ~133.78 kB transfer; admin dashboard 241.96 kB raw.
- Recommended fix: Keep XLSX exclusively behind admin lazy routes, analyze initial bundle composition, ensure devtools are disabled in production, and defer non-critical home widgets.
- Backend/server confirmation required: No.

### PERF-02 — Media delivery needs production policy

- Severity: Medium
- Location: uploads/media derivatives and deployment
- Problem: Derivatives exist, but cache headers/CDN behavior and responsive `srcset` coverage are not demonstrated.
- Recommended fix: Immutable hashed media URLs where possible, AVIF/WebP derivatives, width/height, `srcset`/`sizes`, CDN caching, and broken-image fallback.
- Backend/server confirmation required: Yes.

### PERF-03 — Large uploads use memory storage

- Severity: High
- Location: platform ZIP endpoints up to 200 MB and up to 200 media files
- Problem: Concurrent requests can consume substantial process memory.
- Risk: Application-level DoS.
- Recommended fix: Stream to quarantined temporary storage/object storage, enforce aggregate limits, concurrency queues, timeouts, rate limits, and worker processing.
- Backend/server confirmation required: Yes.

## 9. SEO

### SEO-01 — Client-side metadata is implemented

- Severity: Informational
- Location: route SEO data and `SeoService`
- Finding: Titles, descriptions, robots, canonical, OG/Twitter tags, and product JSON-LD hooks exist.
- Backend/server confirmation required: No.

### SEO-02 — SPA rendering limits discoverability

- Severity: Medium
- Location: Angular browser build
- Problem: Per-route metadata is set after JavaScript runs.
- Risk: Search crawlers/social bots may see only generic index metadata; product/category pages may not index reliably.
- Recommended fix: SSR or prerender public catalog/product/category/look routes; keep cart/checkout/account/admin client-only and noindex.
- Backend/server confirmation required: Hosting capability.

### SEO-03 — Sitemap is incomplete/static

- Severity: Medium (static routes improved)
- Location: `src/sitemap.xml`
- Resolution: Discounts, accessories, and looks were added. Dynamic product/category/look URLs still require a deployment-time or backend-generated sitemap.
- Risk: Dynamic products/categories/looks are harder to discover and stale URLs persist.
- Recommended fix: Generate sitemap from published backend content during deploy or serve it dynamically; include only canonical active pages.
- Backend/server confirmation required: Yes.

### SEO-04 — Structured data lifecycle

- Severity: Low
- Location: `SeoService`
- Problem: Product JSON-LD is added, but removal/replacement when navigating away must be explicitly tested.
- Risk: Stale product schema on non-product routes in SPA sessions.
- Recommended fix: Remove product JSON-LD on every non-product navigation and validate with schema tools.
- Backend/server confirmation required: No.

## 10. Error handling and stability

### ERR-01 — Gateway/order failure recovery is incomplete

- Severity: High
- Location: payments and checkout
- Problem: No authoritative status endpoint, reconciliation job, timeout state, or fulfilment-order creation.
- Risk: Ambiguous payments and manual recovery.
- Recommended fix: Idempotent callbacks/webhooks, status polling, reconciliation job, immutable gateway event log, and operational alerting.
- Backend/server confirmation required: Yes.

### ERR-02 — Error interceptor logs production details

- Severity: Low
- Location: API/error interceptors and diagnostic services
- Problem: Console logging remains; some logs include response metadata/diagnostics.
- Risk: Information exposure and noisy production consoles.
- Recommended fix: Gate diagnostics behind `environment.debug`, redact data, and send structured errors to an approved monitoring service.
- Backend/server confirmation required: Monitoring choice.

### ERR-03 — Invalid IDs/slugs need explicit E2E verification

- Severity: Medium
- Location: product/category/look/admin CRM routes
- Problem: Components handle data independently; consistent 404/empty behavior is not centrally tested.
- Recommended fix: Add invalid, unpublished, deleted, and malformed parameter tests; backend should return correct 400/404 without leaking internals.
- Backend/server confirmation required: Yes.

## 11. Cleanup

No files were deleted during this audit.

### Safe cleanup list (after backup/confirmation)

1. `.runlogs/` and root/backend `*.log` — generated runtime diagnostics; safe after extracting needed incident evidence.
2. `build-prod-1.log` and `frontend-runtime.log` — generated build/runtime output.
3. `desktop-1440.png`, `tablet-768.png`, `mobile-320.png` — local visual captures if not intentional design baselines.
4. `.angular/`, `dist/`, coverage folders — reproducible build/cache output.
5. `backend/data/gallery-mazhari.sqlite` — remove from Git only after backup and database migration confirmation; **do not delete operational data**.
6. `backend/uploads/` — remove from Git only after media backup/object-storage migration and reference validation.

### Not confirmed safe to remove

- Test files: they are valuable and currently pass.
- Documentation and implementation checklists: may be release evidence.
- Local fallback catalog data: currently participates in degraded behavior; remove only after backend-only production behavior is agreed.
- WordPress services/config: usage and migration status need confirmation.

## 12. Production readiness

### PR-01 — Builds/tests

- Severity: Informational
- Evidence: frontend production build and strict development typecheck pass; backend build passes; 16 backend suites / 64 tests pass; 2 frontend suites / 6 tests pass; Angular lint passes with zero errors; Playwright contains 56 desktop/mobile browser/API checks, including axe WCAG gates.
- Remaining gap: 85 explicit-`any` warnings remain concentrated in the legacy WordPress adapter and loosely shaped compatibility models.

### PR-02 — Database migrations and backups

- Severity: Critical
- Problem: Production auto-sync is now disabled, but no migration/restore evidence was established.
- Required fix: Generate/review migrations, rehearse upgrade and rollback against a production-like copy, schedule backups, and verify restore.
- Local evidence: the order migration successfully completed `show → run → show → revert → show` against a fresh isolated SQLite database. Backup scheduling and restore against a production-like copy remain operational/server tasks.
- Backend/server confirmation required: Yes.

### PR-03 — Deployment variables

- Severity: High
- Required: `NODE_ENV=production`, strong `JWT_SECRET`, one-time/disabled admin setup key, Postgres settings, exact `FRONTEND_ORIGIN`, `BACKEND_PUBLIC_URL=https://api.gallery-mazhari.ir`, gateway secrets, media storage, HTTPS.
- Backend/server confirmation required: Yes.

### PR-04 — Server routing/cache/headers

- Severity: High
- Required: SPA fallback excluding `/api` and `/uploads`, immutable hashed static assets, correct media cache policy, compression, request/body limits, security headers, trusted proxy configuration, HTTPS redirect.
- Backend/server confirmation required: Yes.

## Prioritized action plan

1. **Block commerce launch** until backend orders, payment linkage, stock reservation/decrement, admin fulfilment, and reconciliation are implemented and E2E tested.
2. Add versioned database migrations and rehearse backup/restore; production schema sync is already disabled.
3. Configure `BACKEND_PUBLIC_URL`, exact CORS origins, HTTPS, trusted proxy rules, headers, rate limits, and upload concurrency limits.
4. Migrate Angular/NgRx in a dedicated branch and rerun build, unit, E2E, accessibility, and visual regression checks.
5. Replace browser admin tokens with an HttpOnly session design and CSRF protection.
6. Add Angular lint/unit targets plus Playwright E2E for public/admin/checkout flows.
7. Move runtime DB/media/logs out of Git after verified backups.
8. Add SSR/prerender and dynamic sitemap for public SEO routes.
9. Refactor large units incrementally behind tests and remove production mutation fallbacks.

## Final launch checklist

- [x] Durable backend orders and order lines exist.
- [x] Payment create/callback/status are idempotent and linked to orders.
- [x] Stock reservation, decrement, expiry, and cancellation behavior are covered in application code/tests.
- [x] Admin reads and fulfils the backend order record.
- [x] Local migration run/revert rehearsal passes.
- [ ] Production-like backup restore passes.
- [x] Angular security upgrade completed.
- [x] Production `npm audit` findings reduced to zero.
- [ ] Strong production secrets are injected externally; none are in frontend bundles.
- [ ] Exact CORS and public origins configured.
- [ ] HTTPS, HSTS, CSP, frame, MIME, referrer, and permissions headers verified.
- [ ] Auth/payment/upload rate limits verified.
- [ ] SPA rewrites, 404s, API routes, uploads, base href, and asset paths verified.
- [x] Frontend unit/lint/accessibility gates and Playwright E2E pass locally.
- [x] Automated mobile and desktop Chrome smoke tests pass.
- [ ] Monitoring, redaction, alerting, backup, rollback, and incident contacts are ready.
- [ ] robots/sitemap/canonical/structured data validated in production.

## Public website testing checklist

- [x] Primary public routes and 404 direct URLs are covered; dynamic category/product happy paths remain data-dependent.
- [x] Invalid product/look/collection identifiers render safely.
- [ ] Loading, empty, API error, slow network, broken media, offline recovery.
- [ ] Header/footer/menu/search/filter links remain broader than current coverage; browser back/forward passes.
- [ ] RTL/numeral/zoom manual review remains; automated overflow, keyboard semantics, ARIA, and serious/critical contrast checks pass.
- [ ] 320/375/390/768/1024/1440 widths and major supported browsers.
- [ ] Title/description/canonical pass for primary public routes; production robots/OG/JSON-LD validation remains.

## Admin panel testing checklist

- [ ] Login failure/success/expiry/logout/direct URL and inactive user.
- [ ] Every role/permission combination tested against UI and API directly.
- [ ] Product create/edit/publish/unpublish/status/price/stock/category/images.
- [ ] Category/taxonomy/rules/discount/appearance/look changes reflected publicly.
- [ ] Invalid/incomplete content never breaks public rendering.
- [ ] Upload valid/invalid/spoofed/oversized/corrupt images and ZIP bombs/traversal cases.
- [ ] Import dry-run/confirm/rollback, stale input, duplicate codes, partial failure.
- [ ] Order list/detail/status/audit once backend order domain exists.
- [ ] API failures never silently report successful admin mutation.

## Shopping and checkout testing checklist

- [x] Add/update/remove/empty cart and refresh persistence.
- [ ] Stock boundaries and return navigation.
- [ ] Server and UI prices, discounts, customization fees, shipping, and currency match.
- [x] Required checkout fields expose accessible validation errors and valid input advances.
- [ ] Persian phone/postal edge cases, long input, and backend validation.
- [ ] Payment disabled, gateway timeout, create failure, cancel, fail, success, duplicate callback.
- [ ] Refresh callback, forged query string, abandoned transaction, retry, multiple tabs.
- [ ] Cart retained on failure/cancel and cleared only after verified success.
- [ ] Paid order persists across devices/session loss and appears in admin.
- [ ] Stock cannot oversell under concurrent checkout.
- [ ] Reconciliation, refund/cancel, fulfilment, and customer status history are correct.

## Changes applied during this audit

1. Added validated, configured backend public URL handling with production fail-closed behavior.
2. Disabled TypeORM automatic schema synchronization in production.
3. Hardened legacy gallery uploads with decode-before-write validation and server-generated names/extensions.
4. Reconciled local checkout records to backend payment order numbers.
5. Prevented cart clearing before verified payment success.
6. Made already-paid callback processing idempotent at the transaction level.
7. Added focused public URL tests and repository ignore rules; deleted nothing.
8. Added Playwright E2E coverage for public routes, 404 metadata, admin-route protection, empty cart/checkout states, viewport overflow, and backend reachability.
9. Configured E2E to start the Angular and NestJS applications together and run against installed Chrome when the Playwright CDN is unavailable.
10. Migrated Angular dev-server configuration from the obsolete `browserTarget` property to `buildTarget`; 16/16 E2E checks pass on desktop and mobile projects.
11. Added Angular ESLint, template accessibility linting, Vitest, axe-core Playwright checks, and a single `verify:local` quality command.
12. Fixed 45 lint errors without disabling accessibility enforcement; lint now passes with zero errors and keeps legacy typing warnings visible.
13. Added 6 frontend unit tests for Jalali conversion/round trips and asset URL/fallback behavior.
14. Expanded Playwright from 16 to 56 desktop/mobile checks covering direct routes, metadata, invalid identifiers, navigation history, accessibility, backend reachability, admin-route protection, cart quantity persistence/removal, checkout validation, empty states, 404, and overflow.
15. Fixed WCAG issues in calendar semantics, keyboard-operable overlays/hotspots, mobile scroll regions, and low-contrast text; axe serious/critical checks pass for all five tested routes on both projects.
16. Explicitly disabled production source maps and enabled optimization, license extraction, hashed output, and unnamed production chunks.
17. Added missing static public routes to `sitemap.xml`; dynamic entries remain a server/deployment concern.
18. Successfully rehearsed the order migration run and rollback on a fresh isolated SQLite database.
19. Added accessible checkout error announcements and input/error relationships with `aria-invalid` and `aria-describedby`.
20. Moved consultation submission and Telegram/SMS notifications to the backend; requests now persist server-side and the admin consultation view refreshes from the same API.
21. Added configurable Telegram/SMS notification modes, multiple responsible recipients, automatic SMS fallback, delivery logging, protected admin settings/test endpoints, and paid-order/consultation message templates.
22. Added and locally rehearsed the notification/consultation database migration plus a deployment guide for DirectAdmin, Telegram BotFather, and domestic SMS providers.
