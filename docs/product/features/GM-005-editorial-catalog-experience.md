# GM-005 — Editorial catalog experience

## Identity

- Feature ID: GM-005
- Title: Editorial category chapters and shared product discovery
- Request owner: Gallery Mazhari owner
- Change class: L2 frontend behavior
- Priority: P1
- Related epic: EPIC-01
- Dependencies / related items: GM-001 visual foundation, GM-007 WebKit-safe tokens, GM-008 shared controls/header

## Problem / outcome

### Current problem

Category, collection, generic catalog and search results use separate card implementations and a conventional grid presentation. This creates visual drift, duplicated gallery behavior and a weak fashion-editorial hierarchy on mobile.

### Desired outcome

Public discovery routes should open with a clear editorial chapter, use one reusable product-card primitive, remain comfortable in Persian RTL on small screens and preserve reliable access to every published product.

### Users / roles affected

All public storefront visitors. No admin or privileged workflow changes.

## Acceptance criteria

1. Category hubs, subcategory listings and bridal collection routes use a warm editorial chapter hierarchy and remain usable at 320 CSS pixels.
2. Product lists, generic catalog results and search results use one shared, accessible product-card component with swipeable galleries where multiple images exist.
3. Published-product refresh, taxonomy paths, size filtering, progressive loading, product links, pricing visibility and consultation-category behavior remain unchanged.
4. Core headings, navigation and product cards are present in SSR output and visible without reveal JavaScript.
5. Chromium and WebKit regression coverage proves card visibility, no horizontal page overflow and preserved progressive loading.

## Scope

### In scope

- Shared storefront product-card component.
- Category hub, category products, bridal collection, generic catalog and search-result presentation.
- Responsive/RTL/WebKit regression coverage and delivery documentation.

### Explicit non-scope

- Product-detail redesign, Home/Footer redesign and motion-program expansion.
- Product, inventory, pricing, search-ranking or publication business logic.
- API, NestJS, PostgreSQL, authentication, media storage or deployment configuration.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Shared presentation component and route templates; route/state semantics preserved |
| SSR/hydration | yes | Standalone component is deterministic and browser globals remain guarded |
| API/DTO contracts | no | No contract changes |
| NestJS business logic | no | No backend changes |
| Auth/permissions/audit | no | Public read-only presentation |
| PostgreSQL/schema/migration | no | No data changes |
| Existing data compatibility | yes | Existing `BridalSampleProduct`/search projections are mapped without mutation |
| Protected business workflows | no | Publication, inventory and consultation ownership unchanged |
| Media/storage | no | Existing resolved image URLs only |
| SEO | yes | Existing route-specific SEO services, canonical paths and H1s preserved |
| Accessibility | yes | Semantic links/headings, visible focus, 44px filters, reflow and reduced motion |
| Performance | yes | Lazy images and current progressive product batching retained |
| Deployment/config/monitoring | no | Standard immutable frontend artifact |
| Documentation | yes | Feature specification and backlog status |

## Architecture / data design

- Existing capability/service that should own this change: `PublishedCatalogSyncService`, catalog data projections and route components remain owners of data and state.
- New domain concept required: none; `StorefrontProductCardComponent` is presentation only.
- Source of truth: published catalog projection supplied through the existing NestJS-controlled publication path.
- Server-side invariants: unchanged.
- Database representation: none.

## Security and failure behavior

- Authorization: public storefront read access remains unchanged.
- Untrusted inputs: existing route/search services continue to validate and project values; this slice adds no HTML injection.
- Partial failure: broken images remain hidden/fallback-backed while names and product links stay available.
- Concurrency/idempotency: unchanged.
- Audit requirements: none.

## UX / visual decision

- Approved state: mobile-first Persian fashion editorial chapters, tall imagery, restrained line details and warm ivory/cream surfaces.
- Reused primitives/tokens: GM-007 semantic colors, type, gutters, borders, radii, shadows, motion and focus tokens; GM-008 line icon.
- Mobile/RTL/accessibility: two-column minimum layout, logical CSS properties, horizontal tab scrolling isolated from page overflow, visible focus and reduced-motion support.

## Implementation plan

1. Add the shared product-card primitive and migrate duplicated product list templates.
2. Establish category/collection editorial chapter layouts without changing route or product projection logic.
3. Add Chromium/WebKit regression evidence for SSR-visible content, progressive loading and reflow.

## Verification plan

- Unit tests: existing published-catalog projection suite plus frontend Vitest suite.
- Backend/integration tests: not affected; repository backend CI remains required.
- PostgreSQL/migration verification: not applicable.
- Browser/E2E tests: focused editorial catalog test plus existing browser-reliability matrix.
- SSR/SEO/accessibility/performance evidence: production SSR build, server HTML smoke, axe/reflow and CI gates.
- Manual/staging acceptance: V2 visual acceptance after immutable artifact activation.

## Recovery

- Code rollback/revert: revert the focused GM-005 merge commit.
- Data/migration recovery: none.
- Feature disable/roll-forward: no flag is needed; reusable UI can be reverted without data impact.

## Delivery

- Planned branch: `feat/gm-005-editorial-catalog`
- Planned PR: #69, from verified `main` SHA `bb8d5ac8a1724877b0b335b9c24e8fe04f4914c1`
- Documentation to update: this specification and `docs/product/BACKLOG.md`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
