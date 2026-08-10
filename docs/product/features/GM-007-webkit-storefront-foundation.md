# GM-007 — WebKit Storefront Reliability and Foundation

## Identity

- Feature ID: `GM-007`
- Related epic: `EPIC-01 — Storefront UX and visual refinement`
- Change class: `L2 frontend behavior`
- Priority: `P1`
- Owner authorization: explicit continuation and merge authorization in the active owner session
- Base SHA: `36d650b12ab1c84b5fd2902ff10a8f7fa3b32364`
- Dependencies: GM-001 merged through PR #58; GM-002 removal merged through PR #65

## Problem and outcome

The public catalog reads the disposable published-product cache during route initialization, while the authoritative snapshot refresh starts after browser rendering. On a cold visit or slower mobile browser, the snapshot can arrive after Collection, Category and Catalog have already projected an empty cache. The sync service updates its cache/version, but those pages do not consume the version signal, so product content remains incomplete until a reload.

The storefront foundation also lacks explicit semantic roles for several approved design concerns and has mobile WebKit risks around dynamic viewport height, safe areas, body scroll locking and `content-visibility`-driven scroll geometry.

The outcome is a reliable mobile-first storefront that refreshes product projections without reload, keeps core content visible independently of reveal animation, uses stable WebKit viewport/scroll behavior, and exposes one centralized warm editorial token contract without redesigning individual pages.

## Acceptance criteria

1. A delayed successful `GET /products/published` refresh updates Collection, Category and Catalog projections without navigation or reload.
2. The cache remains a disposable TTL-bounded projection; no browser source becomes authoritative.
3. WebKit regression coverage proves delayed refresh, product visibility, incremental scroll completion, stable horizontal width and visible core page content.
4. Product cards no longer rely on `content-visibility`/intrinsic geometry for correctness.
5. The app shell and mobile drawer have `vh` fallbacks, dynamic viewport enhancement and safe-area handling; body scroll locking restores the prior inline state.
6. Canonical tokens centrally cover colors, typography, spacing, radii, borders, shadows, glass, motion, easing, controls, z-index and responsive gutters.
7. Existing warm ivory/cream values and RTL/Persian behavior remain authoritative. Existing approved Yekan-family stacks remain, but no font binary is downloaded or added without license/provenance.
8. SSR metadata, hydration, SEO, protected workflows and existing API/business logic remain intact.

## Scope

### In scope

- Reactive invalidation of public catalog projections after a successful server snapshot refresh.
- Collection/Category/Catalog client refresh regression coverage.
- WebKit viewport, safe-area, scroll lock and product-card geometry reliability.
- Additive semantic token aliases and design-contract evidence.
- Documentation of the confirmed root cause and token roles.

### Explicit non-scope

- Page-by-page storefront redesign or new page composition.
- Backend/API/database/schema/auth changes.
- Inventory, staging, publication, pricing or product workflow changes.
- New durable/browser authority or a second product source of truth.
- Downloading or committing an unlicensed font.
- New animation dependency, glass CTA component or broad motion rollout.
- Existing `/contact` accessibility debt.
- Production deployment or RM-17 launch authorization.

## Impact and recovery

- Business/data authority: unchanged; NestJS/PostgreSQL remain authoritative.
- SSR/SEO: existing server-rendered route shell and metadata remain; client refresh corrects the post-hydration projection without changing canonical URLs.
- Accessibility/performance: core headings/content remain visible; reduced-motion contract remains; removal of card content containment favors reliability over speculative paint optimization.
- Security/data/migrations/deployment: no impact.
- Rollback: revert the focused GM-007 commit/PR. No data recovery or migration rollback is required.

## Verification

- Targeted frontend tests for cache refresh and drawer scroll-state recovery where practical.
- Playwright WebKit delayed-snapshot and incremental-scroll regression.
- Design-system token contract assertions and mobile/desktop evidence.
- Frontend lint, Vitest and production browser/SSR build.
- Repository CI gates including browser matrix, SSR, accessibility debt reporting, Lighthouse and design-system contract.
