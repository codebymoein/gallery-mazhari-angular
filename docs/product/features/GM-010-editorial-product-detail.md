# GM-010 — Editorial product-detail experience

## Identity

- Feature ID: GM-010
- Title: Editorial product-detail experience
- Request owner: Gallery Mazhari owner
- Change class: L2 frontend behavior
- Priority: P1
- Related epic: EPIC-01
- Dependencies / related items: GM-001, GM-007, GM-008 and GM-005

## Problem / outcome

### Current problem

The product-detail page contains the complete commerce and consultation workflows, but accumulated CSS overrides, emoji controls and a dense hierarchy make the experience feel inconsistent with the new editorial catalog. The stylesheet also exceeds its component budget.

### Desired outcome

Visitors should experience an image-led Persian bridal editorial page with clear product identity, price, variant choices and primary actions while every existing business path remains available and reliable.

### Users / roles affected

Public storefront visitors and authorized admins using the existing product edit shortcut.

## Acceptance criteria

1. PDP gallery, identity, price, metadata, variants, actions and supporting information form one mobile-first RTL hierarchy using semantic design tokens.
2. Cart, dream board, rental, engraving, veil print, home trial, consultation and admin edit behavior remain unchanged.
3. Related and suggested products reuse the shared storefront product-card primitive.
4. Core PDP content is SSR-visible, does not depend on JS reveal animation and reflows without page overflow in Chromium/WebKit.
5. The product-detail component stylesheet is within the configured budget and introduces no `!important` patch.

## Scope

### In scope

- Product-detail template presentation and complete component stylesheet consolidation.
- Shared line icons for commerce actions and shared cards for related/suggested products.
- Product-detail browser regression coverage and delivery documentation.

### Explicit non-scope

- Changes to pricing, inventory, variant validation, cart payloads, rental calculations or customization fees.
- API, DTO, NestJS, PostgreSQL, auth/permission or media-storage changes.
- Home/Footer or checkout redesign.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Presentation and shared component imports only |
| SSR/hydration | yes | Deterministic template; no new browser globals |
| API/DTO contracts | no | Unchanged |
| NestJS business logic | no | Unchanged |
| Auth/permissions/audit | no | Existing admin permission gate preserved |
| PostgreSQL/schema/migration | no | None |
| Existing data compatibility | yes | Existing product projection and generated fallbacks retained |
| Protected business workflows | yes | All product commerce/consultation workflows explicitly preserved |
| Media/storage | no | Existing image resolver/directive retained |
| SEO | yes | Existing product SEO service and single H1 preserved |
| Accessibility | yes | Focus, 44px controls, semantic labels, reflow and reduced motion |
| Performance | yes | CSS consolidation removes budget warning; lazy related imagery retained |
| Deployment/config/monitoring | no | Standard immutable frontend artifact |
| Documentation | yes | Spec and backlog |

## Architecture / data design

- Existing capability/service that should own this change: `ProductDetailComponent` remains the orchestration owner; cart, dream canvas, home trial, catalog sync and SEO services are unchanged.
- New domain concept required: none.
- Source of truth: published product/catalog projection and existing NestJS-controlled commerce paths.
- Server-side invariants: unchanged.
- Database representation: none.

## Security and failure behavior

- Authorization: public read/commerce behavior and admin edit permission remain unchanged.
- Inputs: existing form constraints and component validation remain responsible for variants/customization/rental dates.
- Partial failure: product identity and core action hierarchy remain visible; existing error/status surfaces are preserved.
- Concurrency/idempotency: unchanged.
- Audit requirements: unchanged.

## UX / visual decision

- Approved state: tall image-led stage, quiet warm ivory information panel, compact semantic metadata, minimal line icons and restrained glass only for transient feedback.
- Reused primitives/tokens: GM-007 semantic tokens, GM-008 line icons and GM-005 shared product card.
- Mobile/RTL/accessibility: logical properties, no fixed purchase bar, 44px targets, touch gallery controls, safe-area notice and reduced-motion handling.

## Implementation plan

1. Consolidate the accumulated PDP style layers into one token-driven stylesheet.
2. Refine semantic hierarchy and reuse shared icons/cards without changing event handlers.
3. Add product-detail Chromium/WebKit regression evidence.

## Verification plan

- Unit tests: full frontend Vitest suite.
- Backend/integration tests: required CI; no backend diff.
- PostgreSQL/migration verification: not applicable locally; required CI remains.
- Browser/E2E tests: focused PDP desktop/mobile/WebKit plus existing critical journeys.
- SSR/SEO/accessibility/performance evidence: production SSR build, matrix visibility/reflow and standard CI budgets.
- Manual/staging acceptance: V2 visual/product acceptance.

## Recovery

- Code rollback/revert: revert focused GM-010 merge commit.
- Data/migration recovery: none.
- Feature disable/roll-forward: presentation-only revert; no data flag required.

## Delivery

- Planned branch: `feat/gm-010-editorial-product-detail`
- PR: #70 from verified `main` SHA `bb223c4382d9e0a7f6bea9fb5ad3a4d2ed619df4`
- Documentation to update: this specification and `docs/product/BACKLOG.md`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
