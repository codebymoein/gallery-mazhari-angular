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
The mobile header is functionally complete, but the drawer still reads as a generic application menu: it opens from the RTL inline-start edge, includes a dense search block and a dark promotional card, uses heavier panel styling, and does not match the owner-approved fashion reference for the next visual phase.

### Desired outcome
The mobile drawer should feel like the supplied fashion reference: a light, minimal panel entering from the physical left, occupying almost the full viewport while leaving a narrow strip of the page visible; quiet hairline row dividers; small chevrons; smooth accordion reveals; and a flat dusty taupe consultation action. The result must remain Gallery Mazhari's own implementation and continue to use the existing design tokens, taxonomy and routes.

### Users / roles affected
Public storefront visitors using mobile/tablet drawer navigation.

## Acceptance criteria

1. At a 390px mobile viewport the drawer enters from the physical left and leaves a narrow visible strip of the page; RTL menu content remains right-aligned and readable.
2. The drawer uses the same light fashion-editorial surface and dusty taupe visual language as the approved GM-039 Home opening, without a dark feature card or heavy rounded search/card treatment.
3. The drawer header is minimal, includes the Gallery Mazhari wordmark and close control, and keeps the existing dialog/focus semantics.
4. Top-level and nested menu rows are separated by subtle hairline dividers and use small chevrons that rotate when expanded.
5. Bridal and accessory submenus expand/collapse with restrained finite motion; `prefers-reduced-motion: reduce` disables decorative motion while preserving visibility and interaction.
6. Existing navigation destinations are preserved: bridal category/subcategories/collections, accessory category/subcategories, consultation, contact, account and orders.
7. Search remains available through the existing header search control; removing the redundant drawer search presentation must not remove search capability.
8. Drawer close, Escape, backdrop close, body-scroll behavior, focus entry/trap/restoration and WebKit reliability remain intact.
9. No horizontal overflow is introduced at 320px/390px, and touch targets remain at least the existing `--touch-target` size.
10. Desktop header and desktop mega-menu presentation remain unchanged by this slice.

## Scope

### In scope

- Mobile drawer composition and presentation.
- Mobile drawer physical opening edge/width.
- Drawer header, navigation rows, nested accordion presentation and footer CTA.
- Removal of redundant drawer-only search block and dark drawer feature card while retaining their destinations through existing controls/links.
- Drawer/submenu motion and reduced-motion treatment.
- Focused Playwright regression evidence and product traceability.

### Explicit non-scope

- Desktop mega-menu redesign.
- Category taxonomy, product routes or route semantics.
- Search destination/query behavior, cart behavior or account/order semantics.
- Backend, API, authentication/authorization, PostgreSQL, migrations, media storage or admin behavior.
- Global design-token value changes or a new theme/token authority.
- SEO metadata, release/deployment configuration or unrelated cleanup.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | Yes | Header drawer markup/styles only; existing route destinations preserved. |
| SSR/hydration | Low | Existing semantic navigation remains rendered; no browser-only state authority added. |
| API/DTO contracts | No | No API changes. |
| NestJS business logic | No | No backend changes. |
| Auth/permissions/audit | No | Existing account/order routes unchanged. |
| PostgreSQL/schema/migration | No | No persistence changes. |
| Existing data compatibility | No | No data changes. |
| Protected business workflows | No | Navigation presentation only. |
| Media/storage | No | No media changes. |
| SEO | No semantic route change | Crawlable links remain real anchors/router links. |
| Accessibility | Yes | Dialog/focus/keyboard/touch/reduced-motion must remain valid. |
| Performance | Low | CSS/markup only; no dependency or new media. |
| Deployment/config/monitoring | No | Standard frontend artifact only. |
| Documentation | Yes | Feature spec and Backlog traceability. |

## Architecture / data design

- Existing capability/service that should own this change: `HeaderComponent` + existing `DrawerService` and catalog taxonomy data.
- New domain concept required: none.
- Source of truth: existing Angular catalog category constants for navigation presentation; NestJS/PostgreSQL authority is unchanged.
- Server-side invariants: none added or moved.
- Database representation: none.
- New model/path justification: none; no new service or state path is required.

## Security and failure behavior

- Public navigation remains public; protected destination authorization remains enforced by existing backend/route behavior.
- No new untrusted inputs are introduced.
- Search behavior remains in the existing header search path.
- No concurrency, idempotency or audit impact.

## UX / visual decision

- Approved intended state/interaction: physical-left near-full-width drawer modeled on the supplied fashion reference, with a warm near-white surface, fine separators, minimal rows, small chevrons, smooth accordions and a flat dusty taupe CTA.
- Reused design-system primitives/tokens: `--touch-target`, semantic text/surface/border tokens, editorial motion tokens, and the GM-039 taupe `color-mix` treatment built from existing canonical palette tokens.
- Mobile/RTL/accessibility: physical drawer edge is intentionally left while content remains RTL; 320px and 390px overflow checks; focus-visible, Escape, backdrop close, focus restoration and reduced motion are mandatory.

## Implementation plan

1. Recompose the existing mobile drawer markup without changing navigation destinations or desktop markup.
2. Restyle the drawer and nested rows using canonical tokens and the approved GM-039 fashion surface/taupe language.
3. Align drawer/submenu motion to a restrained left-entry/accordion interaction with an effective reduced-motion path.
4. Extend Playwright evidence for left-edge geometry, preserved routes, focus behavior, accordions, mobile overflow and reduced motion.
5. Run exact-head repository gates and inspect the final PR diff/file list before handoff.

## Verification plan

- Unit tests: no isolated new domain logic expected; existing frontend unit suite remains required.
- Backend/integration tests: no backend behavior changes; repository gates remain authoritative.
- PostgreSQL/migration verification: no migration; permanent repository gate must remain green.
- Browser/E2E tests: 320px/390px mobile drawer geometry, routes, accordion behavior, focus restoration, Escape/backdrop close and overflow; existing cross-browser RM-13 matrix.
- SSR/SEO/accessibility/performance evidence: production build/SSR gates, accessibility, Design System Contract, RM-12/RM-13 and reduced-motion coverage.
- Manual/staging acceptance: owner review of the exact candidate on mobile after automated gates.

## Recovery

- Code rollback/revert: revert the focused GM-040 PR to restore the previous mobile drawer.
- Data/migration recovery: not applicable.
- Feature disable/roll-forward: focused CSS/markup correction only if exact-candidate visual acceptance identifies a defect.

## Delivery

- Planned branch: `feat/gm-040-reference-mobile-menu`
- Planned PR: GM-040 reference-led mobile menu
- Documentation to update: this specification and `docs/product/BACKLOG.md`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
