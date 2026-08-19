# GM-042 — Storefront Redesign Phase 2

## Identity

- Feature ID: `GM-042`
- Title: Home experience, Hero and Header interaction polish
- Request owner: Gallery Mazhari owner
- Change class: `L2 frontend behavior`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies: GM-039 / PR #108, GM-041 / PRs #110 and #111, RM-17 SSR correction / PR #112

## Outcome and checkpoints

Phase 2 evolves the existing monochrome storefront through seven owner-gated checkpoints. Each checkpoint stops for explicit approval. Search intelligence, backend search and taxonomy changes remain outside this phase.

1. Audit and Home experience contract.
2. Header and Menu interaction polish.
3. Hero Slider.
4. Trust Strip.
5. Home composition and visual rhythm.
6. Responsive, motion and performance hardening.
7. Certification, documentation and focused PR.

## Step 2 acceptance criteria

1. The existing mobile drawer opens and closes with modestly softer motion while retaining deterministic WebKit visibility, pointer, focus, Escape, body-scroll and disclosure-reset behavior.
2. Drawer and Header Search use the scoped cream/glass functional accent with an opaque fallback, visible focus and mobile input sizing of at least 16px.
3. The canonical “مشاهده همه پوشاک عروس” link remains available as an ordinary submenu item rather than a large black feature card.
4. The shared sticky Header hides after intentional downward scrolling, reappears on upward scrolling, remains visible at the top and while Drawer/Search is active, and avoids raw-scroll Angular change detection.
5. Activating either Header brand link returns to `/` at the true page top, using immediate movement for reduced motion.
6. Existing taxonomy, Search submission, cart state, navigation routes, desktop mega-menu and SSR behavior remain unchanged.

## Scope

### Step 2 write surfaces

- Shared Header TypeScript, template and component-owned styles.
- Additive storefront Search surface tokens and their design contract.
- Focused Header Playwright regression coverage.
- Feature/backlog traceability.

### Explicit non-scope

- Hero/Home implementation, Trust Strip and Home composition.
- Search ranking, fuzzy/PostgreSQL search, suggestions or autocomplete.
- Backend, API, auth, database, migrations, taxonomy and deployment.
- Catalog, product detail, cart/checkout or Footer redesign.

## Architecture and impact

- The shared `HeaderComponent` remains the only Header owner.
- Scroll awareness uses a passive browser listener outside Angular and one `requestAnimationFrame` calculation at a time, with direction hysteresis and deterministic teardown.
- Browser globals are accessed through injected `DOCUMENT`; SSR performs no scroll initialization.
- `DrawerService` remains body-scroll authority and its state contract is unchanged.
- Search cream is a scoped semantic storefront role, not a global warm-theme migration.
- No source-of-truth, workflow, API, security, data, migration or deployment behavior changes.

## Verification and recovery

- Required evidence: frontend lint/unit/build, Stylelint, production SSR build, focused Header Playwright in desktop/mobile and WebKit-oriented regression coverage, reduced motion, keyboard/focus and overflow checks.
- Recovery: revert the focused GM-042 PR. No data or migration recovery is required.
- Branch: `feat/gm-042-storefront-redesign-phase-2`
- Merge remains exclusively owner-authorized.

## Step 3 acceptance criteria

1. The GM-039 static opening is replaced by one lightweight five-slide Hero; no second Hero or carousel package is added.
2. SSR deterministically renders slide one from a repository asset and does not wait for the Appearance API. Browser-only Appearance overrides remain decorative for the first two compatible images.
3. Autoplay advances at approximately three seconds, pauses during hover, focus and pointer interaction, and is disabled for reduced motion. Swipe advances exactly one slide per completed gesture.
4. The first image remains eager/high-priority and is covered by the existing route preload; only the active image is rendered, so inactive slides do not all eager-load.
5. Owner polish removes the bottom position/pause controls, adds two very small circular side arrows, moves the copy lower at roughly half scale, and uses a restrained crystal CTA on every slide.
6. Slide four routes to the canonical `/personalized-products` selection page. Only existing truthful dress and veil request workflows are linked; unavailable concepts are explicitly marked `به‌زودی` without invented forms.
7. YekanBakh is the primary Persian storefront font token. Header Search and its open field/submit action use the softer crystal treatment with a non-black focus state.
8. The drawer transition is deliberately more perceptible, its bottom consultation block is removed, and the owner-provided English Gallery Mazhari wordmark is used in both the site Header and drawer Header.

### Step 3 write surfaces and non-scope

- Home Hero TypeScript/template/component styles, the public personalized-products component/route, the existing Home LCP hint, focused Home/Hero tests, and owner-requested Header/token polish.
- No backend, API, database, migration, order, payment, CMS, taxonomy, Trust Strip, Step 4 or deployment changes.

## Step 4 acceptance criteria

1. One minimal Trust Strip appears directly after Hero and contains only: `از سال ۱۳۳۷`, `مشاوره تخصصی عروس`, `خرید حضوری و آنلاین`, and `ارسال مطمئن سراسر ایران`.
2. The existing oversized dark guarantee carousel and its unapproved claims are replaced, not duplicated.
3. Four monochrome line icons use compact Phase 1 spacing without cards, counters, statistics or oversized rounded containers.
4. Narrow widths use a readable single-column strip, mobile uses a compact two-column arrangement, and desktop uses one balanced horizontal row.
5. Reveal motion is finite and optional; reduced motion renders all content immediately without animation.
6. The strip is semantic, SSR-safe, reserves stable dimensions, wraps safely and creates no horizontal overflow.

### Step 4 write surfaces and non-scope

- Existing Home Trust component, its placement immediately after Hero, focused Trust Strip Playwright coverage, and this feature contract.
- No Step 5 Home composition work, other section redesign, backend, API, database, migration, invented claim, CMS, deployment or merge.

## Steps 5 and 6 outcome

- The GM-039 opening is replaced rather than stacked. Existing legitimate Home sections retain their data and workflow owners while the opening rhythm, gutters and monochrome transitions are normalized.
- Responsive hardening covers narrow mobile widths, orientation, Windows desktop, Header/Search state, Hero loading priority, reduced motion, keyboard/focus and horizontal overflow.
- The Trust area follows the final owner disposition: a three-line welcome heading and four approved monochrome claims in a compact mobile column, with finite alternating entry motion and an immediate reduced-motion fallback.
- No backend, API, database, taxonomy, payment, order, Search Engine or deployment behavior is changed.

## Step 7 certification contract

### Final scope

- Certify the shared Header interaction polish, five-slide Hero, canonical personalized-products selection route, Trust area and current Home composition.
- Reconcile GM-039 as the merged predecessor whose static opening is superseded by GM-042.
- Run permanent frontend, SSR, browser/CWV, accessibility, static-analysis, dependency/security, secret and governance gates on the exact PR head.
- Open one focused PR; do not merge and do not claim manual visual acceptance.

### Architecture summary

- `HeaderComponent` remains the sole Header owner. Its scroll handler is passive, requestAnimationFrame-coalesced, thresholded and torn down deterministically.
- Home owns one lightweight Hero with deterministic SSR slide one, one active image node, browser-only autoplay/gesture activation and teardown on destroy.
- `/personalized-products` is a frontend navigation surface. It links only truthful existing dress/veil request workflows and labels unavailable concepts without fake forms.
- Decorative Appearance configuration remains browser-only; SSR uses deterministic repository fallback content and does not wait on the external Appearance API.
- PostgreSQL/NestJS business authority, canonical taxonomy and commerce workflows are unchanged.

### Verification record

Local Step 7 evidence recorded before the PR:

- Frontend ESLint: passed.
- Frontend unit tests: 6 files / 19 tests passed.
- Stylelint over `src/**/*.css`: passed.
- Angular production Browser and SSR build: passed.
- Backend Jest: 35 suites / 140 tests passed; backend build passed.
- Backend ESLint: failed on the pre-existing backend baseline (282 errors, 5 warnings); no backend file is part of GM-042 and this phase does not authorize baseline cleanup.
- Focused Playwright batch: local orchestration exceeded the 120-second tool window and is not represented as passing; exact-head CI remains required.

The PR must record the final exact-head results for Quality Gates, RM-09, RM-12, RM-13 and RM-17. Lighthouse/WebKit evidence is CI-owned when the required local browser/toolchain is unavailable.

### Risks and recovery

- Manual owner visual acceptance remains pending, especially real iPhone typography, motion and image composition.
- The owner explicitly approved retaining the bundled local Yekan asset after verifying its mobile/browser rendering; the PR records that disposition rather than introducing a remote font dependency.
- Recovery is a single-PR revert. There is no migration, data rollback, cache invalidation or deployment recovery requirement.
