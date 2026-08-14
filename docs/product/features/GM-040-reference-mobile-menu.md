# GM-040 — Reference-led Mobile Menu

## Identity

- Feature ID: GM-040
- Title: Reference-led mobile drawer and submenu experience
- Request owner: Gallery Mazhari owner
- Change class: L2 frontend behavior
- Priority: P1
- Related epic: EPIC-01
- Dependencies / related items: GM-008 shared storefront header/navigation; GM-032/GM-038 mobile-header polish; GM-039 Fashion Editorial Home opening

## Problem / outcome

### Current problem
The mobile header is functionally complete, but the drawer still needs the final owner-requested hierarchy, branding, state-reset and motion refinement: dress collections are visually flat under bridal clothing, nested groups are not sufficiently distinguishable from top-level groups, the drawer header still uses a text wordmark instead of the owner-supplied Gallery Mazhari logo, reopening can preserve expanded disclosures, and the approved drawer/accordion animation is still faster than the intended deliberate fashion-editorial pacing.

### Desired outcome
The mobile drawer should feel like the supplied fashion reference: a light, minimal panel entering from the physical left, occupying almost the full viewport while leaving a narrow strip of the page visible; quiet hairline row dividers; deliberately slow finite motion; the owner-supplied Gallery Mazhari logo centered in the drawer header; a clean collapsed state every time the drawer is reopened; and a flat dusty taupe consultation action. Under `پوشاک عروس`, the existing European, Arabic and mermaid bridal-dress destinations are grouped under a single navigational `لباس عروس` disclosure, while `لباس نامزدی`, `کت‌وشلوار عقد`, `روبدوشامبر عروس` and the remaining bridal destinations stay alongside it. Nested disclosure chevrons use a simple current-color circular outline so they are visibly distinct from top-level chevrons without introducing a new icon language. The redundant `مشاهده همه پوشاک عروس` mobile-row is removed without changing canonical routes or taxonomy.

### Users / roles affected
Public storefront visitors using mobile/tablet drawer navigation.

## Acceptance criteria

1. At a 390px mobile viewport the drawer enters from the physical left and leaves a narrow visible strip of the page; RTL menu content remains right-aligned and readable.
2. The drawer uses the same light fashion-editorial surface and dusty taupe visual language as the approved GM-039 Home opening, without a dark feature card or heavy rounded search/card treatment.
3. The drawer header is minimal, uses the owner-supplied Gallery Mazhari logo centered within the drawer header instead of a text wordmark, retains a separate close control, and keeps the existing dialog/focus semantics.
4. Top-level and nested menu rows are separated by subtle hairline dividers. Top-level chevrons remain plain; nested disclosure chevrons are enclosed by a simple one-pixel `currentColor` circle.
5. Drawer entry and accordion reveals use a component-local tenfold scale derived from the canonical shared motion tokens. `prefers-reduced-motion: reduce` disables decorative motion while preserving visibility and interaction.
6. Under `پوشاک عروس`, `لباس عروس` is a nested navigation group containing exactly the existing `لباس عروس اروپایی`, `لباس عروس عربی` and `لباس عروس مدل ماهی` destinations. The remaining bridal items stay at the surrounding bridal submenu level and retain their existing order/routes.
7. The mobile-only `مشاهده همه پوشاک عروس` row is absent. Existing canonical bridal collection/subcategory links remain available through the grouped and surrounding menu rows; desktop navigation remains unchanged.
8. Every drawer opening starts from the initial collapsed hierarchy with the drawer navigation returned to its top position, regardless of which disclosures were expanded before the previous close.
9. Existing navigation destinations are preserved: bridal subcategories/collections, accessory category/subcategories, consultation, contact, account and orders.
10. Search remains available through the existing header search control; removing the redundant drawer search presentation must not remove search capability.
11. Drawer close, Escape, backdrop close, body-scroll behavior, focus entry/trap/restoration and WebKit reliability remain intact.
12. No horizontal overflow is introduced at 320px/390px, and touch targets remain at least the existing `--touch-target` size.
13. Desktop header and desktop mega-menu presentation remain unchanged by this slice.

## Scope

### In scope

- Mobile drawer composition and presentation.
- Mobile drawer physical opening edge/width.
- Drawer header, navigation rows, nested accordion presentation and footer CTA.
- Centered owner-supplied Gallery Mazhari logo in the mobile drawer header, stored as a scoped optimized static asset.
- A menu-only bridal-dress grouping that composes the three existing canonical bridal-dress destinations without changing their product classification or route identity.
- Removal of the mobile `مشاهده همه پوشاک عروس` row while preserving the canonical bridal destinations represented elsewhere in the hierarchy.
- A current-color circular affordance around nested disclosure chevrons only.
- Tenfold component-local drawer/submenu motion and reduced-motion treatment.
- Resetting nested/top-level drawer disclosures and drawer scroll position before each opening.
- Removal of redundant drawer-only search block and dark drawer feature card while retaining their destinations through existing controls/links.
- Focused Playwright regression evidence and product traceability.

### Explicit non-scope

- Desktop mega-menu redesign.
- Canonical product classification, category slugs, product routes or route semantics.
- Adding a third persisted/backend taxonomy level solely to represent the menu grouping.
- Search destination/query behavior, cart behavior or account/order semantics.
- Backend, API, authentication/authorization, PostgreSQL, migrations, media storage/pipeline or admin behavior.
- Global design-token value changes or a new theme/token authority.
- SEO metadata, release/deployment configuration or unrelated cleanup.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | Yes | Header drawer markup/styles/local UI reset only; existing route destinations preserved. |
| SSR/hydration | Low | Existing semantic navigation remains rendered; no browser-only state authority added. |
| API/DTO contracts | No | No API changes. |
| NestJS business logic | No | Canonical backend catalog classification remains authoritative and unchanged. |
| Auth/permissions/audit | No | Existing account/order routes unchanged. |
| PostgreSQL/schema/migration | No | The requested `لباس عروس` level is navigation grouping, not a new persisted product classification. |
| Existing data compatibility | No | Existing category/subcategory slugs remain unchanged. |
| Protected business workflows | No | Navigation presentation only. |
| Media/storage | Static asset only | One owner-supplied logo derivative is added under `src/assets/images`; no upload/media pipeline, object storage or backend media behavior changes. |
| SEO | No semantic route change | Crawlable links remain real anchors/router links with their existing canonical destinations. |
| Accessibility | Yes | Dialog/focus/keyboard/touch/reduced-motion must remain valid. |
| Performance | Low | CSS/markup/local state plus one optimized ~9 KB static logo asset; no dependency added. |
| Deployment/config/monitoring | No | Standard frontend artifact only. |
| Documentation | Yes | Feature spec and Backlog traceability. |

## Architecture / data design

- Existing capability/service that should own this change: `HeaderComponent` + existing `DrawerService` and catalog taxonomy data.
- New domain concept required: no persisted domain concept. `لباس عروس` is a navigation-only disclosure grouping over three existing canonical child destinations.
- Source of truth: existing Angular catalog category constants provide labels/slugs/routes for the grouped links; the grouping is expressed in drawer composition rather than duplicating or mutating canonical product classification.
- Backend authority: `backend/src/products/catalog-taxonomy.ts` continues to validate the three bridal-dress classifications directly under `bridal-clothing`; changing that contract would incorrectly turn an information-architecture request into a data migration.
- Drawer reset authority: `HeaderComponent` resets only transient drawer disclosure/scroll UI state before opening; no persisted browser/server state is introduced.
- Branding asset: the owner-supplied PNG is whitespace-trimmed/downscaled to a small transparent static derivative for the mobile drawer; this is a frontend asset optimization, not a media-domain or backend-storage workflow.
- Server-side invariants: unchanged.
- Database representation: unchanged.
- New model/path justification: none; no new service, DTO, table, migration or route is required.

## Security and failure behavior

- Public navigation remains public; protected destination authorization remains enforced by existing backend/route behavior.
- No new untrusted inputs are introduced.
- Search behavior remains in the existing header search path.
- No concurrency, idempotency or audit impact.

## UX / visual decision

- Approved intended state/interaction: physical-left near-full-width drawer modeled on the supplied fashion reference, with a warm near-white surface, centered owner-supplied Gallery Mazhari logo, fine separators, minimal rows, deliberately slow accordions and a flat dusty taupe CTA.
- Motion scaling: component-local duration aliases are composed from the canonical `--duration-base` and `--duration-slow` tokens rather than hardcoding a second motion system; main drawer and accordion durations are ten times the canonical slow duration and content/row reveals are ten times the canonical base duration.
- Branding: the mobile drawer replaces the text `Gallery Mazhari` wordmark with the owner-supplied logo derivative at `src/assets/images/gallery-mazhari-drawer-logo.png` and centers it independently of the close control. The image is decorative within a separately named home link, avoiding duplicate accessible branding text.
- Drawer reset: the drawer hierarchy and its scroll container are normalized before every open so no disclosure remains expanded from a prior session.
- Nested hierarchy marker: nested `details` chevrons use the existing line icon plus a one-pixel `currentColor` circle; top-level chevrons remain plain.
- Reused design-system primitives/tokens: `--touch-target`, semantic text/surface/border tokens, editorial motion tokens, and the GM-039 taupe `color-mix` treatment built from existing canonical palette tokens.
- Mobile/RTL/accessibility: physical drawer edge is intentionally left while content remains RTL; 320px and 390px overflow checks; focus-visible, Escape, backdrop close, focus restoration and reduced motion are mandatory.

## Implementation plan

1. Keep the existing canonical bridal taxonomy/routes unchanged and compose a drawer-only `لباس عروس` disclosure around the three existing bridal-dress entries.
2. Remove only the mobile `مشاهده همه پوشاک عروس` row; do not alter desktop or canonical route availability.
3. Replace the drawer text wordmark with an optimized derivative of the owner-supplied Gallery Mazhari logo and center it independently from the close control.
4. Reset drawer disclosure and scroll UI state before every open.
5. Style nested disclosure chevrons with a subtle circular outline while preserving the plain top-level chevron language.
6. Scale drawer, content and accordion motion to tenfold component-local aliases built from canonical duration tokens; preserve the instant reduced-motion path.
7. Extend Playwright evidence for grouping, removed redundant mobile row, exact preserved routes, centered supplied logo, reset-on-reopen, nested-chevron distinction, deliberate motion duration, left-edge geometry, focus behavior, mobile overflow and reduced motion.
8. Run exact-head repository gates and inspect the final PR diff/file list before handoff.

## Verification plan

- Unit tests: no isolated new domain logic expected; existing frontend unit suite remains required.
- Backend/integration tests: no backend behavior changes; repository gates and backend canonical-taxonomy tests remain authoritative.
- PostgreSQL/migration verification: no migration; permanent repository gate must remain green.
- Browser/E2E tests: 320px/390px mobile drawer geometry, exact bridal-dress grouping/routes, absence of mobile `مشاهده همه پوشاک عروس`, centered owner-supplied logo, reset-on-reopen hierarchy/scroll state, nested chevron circle, tenfold animation durations, focus restoration, Escape/backdrop close and overflow; existing cross-browser RM-13 matrix.
- SSR/SEO/accessibility/performance evidence: production build/SSR gates, accessibility, Design System Contract, RM-12/RM-13 and reduced-motion coverage.
- Manual/staging acceptance: owner review of the exact candidate on mobile after automated gates.

## Recovery

- Code rollback/revert: revert the focused GM-040 PR to restore the previous mobile drawer.
- Data/migration recovery: not applicable.
- Feature disable/roll-forward: focused CSS/markup/local-state/static-asset correction only if exact-candidate visual acceptance identifies a defect.

## Delivery

- Planned branch: `feat/gm-040-reference-mobile-menu`
- Pull request: #109 — GM-040 reference-led mobile menu
- Documentation to update: this specification and `docs/product/BACKLOG.md`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
