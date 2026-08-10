# GM-008 — Shared Controls and Editorial Navigation

## Identity

- Feature ID: `GM-008`
- Title: Unified storefront controls, line icons and editorial header/mobile navigation
- Request owner: Gallery Mazhari owner
- Change class: `L2 frontend behavior`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies / related items: GM-001 visual foundation and GM-007 WebKit/token foundation

## Problem / outcome

### Current problem

The public header uses duplicated inline icons, one-off control styling and a dense mobile drawer. Its visual language does not yet communicate the approved warm editorial direction, and shared buttons have competing gold/ghost implementations.

### Desired outcome

Customers get a calm, premium, Persian-first navigation experience with one accessible line-icon system, one progressive crystal control language and reliable touch/keyboard behavior in iPhone WebKit.

### Users / roles affected

All public storefront visitors. Admin routes and privileged workflows are unaffected.

## Acceptance criteria

1. The storefront header has a visibly warm ivory editorial treatment on mobile and desktop, using semantic tokens and logical properties.
2. Header, search, cart and drawer actions use one reusable current-color line-icon component with accessible labels supplied by their controls.
3. Shared primary, glass and quiet button/control variants have usable non-blur fallbacks and enhance progressively when backdrop filtering is supported.
4. Mobile navigation exposes the complete existing bridal/accessory hierarchy, provides at least 44px targets, closes reliably, restores scroll position and manages focus on open/close.
5. Search, cart count, account, consultation, contact and category routing behavior remain unchanged.
6. Core navigation content is present in SSR output and is not hidden behind JavaScript reveal animation.
7. Chromium and WebKit regression coverage proves navigation visibility, focus behavior, submenu access, no horizontal overflow and scroll-lock restoration.
8. No unlicensed font is downloaded or committed; the approved Yekan-first fallback stack remains centralized until licensed local assets are supplied.

## Scope

### In scope

- Shared semantic button and icon-control patterns.
- A typed reusable storefront line-icon component.
- Public header, desktop mega menus, mobile drawer/submenus and search presentation.
- Drawer focus entry/restoration and existing WebKit-safe body scroll locking.
- Unit/E2E, visual evidence and product documentation.

### Explicit non-scope

- Catalog/category card and filter redesign.
- Product-detail redesign.
- Home section and Footer redesign.
- Backend, API, auth, PostgreSQL, inventory or protected workflow changes.
- New font binaries or third-party UI/animation dependencies.
- Production deployment or RM-17 launch certification.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | Yes | Shared icon component and public header presentation/interaction |
| SSR/hydration | Yes | Markup remains deterministic; browser-only focus work runs after user interaction |
| API/DTO contracts | No | Existing contracts untouched |
| NestJS business logic | No | Untouched |
| Auth/permissions/audit | No | Existing account route only |
| PostgreSQL/schema/migration | No | No persistence change |
| Existing data compatibility | No | Category data and links are reused |
| Protected business workflows | No | Inventory/import/publish/order workflows untouched |
| Media/storage | No | Existing logo asset reused |
| SEO | Yes | Semantic navigation and SSR links are preserved |
| Accessibility | Yes | Labels, focus, targets, reduced motion and dialog semantics |
| Performance | Yes | No dependency added; compact inline SVG paths and progressive blur |
| Deployment/config/monitoring | No | Standard frontend artifact only |
| Documentation | Yes | Backlog and this specification |

## Architecture / data design

- Existing capability/service that should own this change: standalone Angular `HeaderComponent`, `DrawerService`, catalog category data and global design-system styles.
- New domain concept required, if any: none.
- Source of truth: existing catalog category constants and NestJS-backed storefront product paths remain authoritative.
- Server-side invariants: unchanged.
- Database representation, if any: none.
- Why an existing model/path cannot satisfy the requirement, if a new one is introduced: not applicable.

## Security and failure behavior

- Who is authorized? Public storefront controls remain public; existing account route handles its own authorization.
- What inputs are untrusted and how are they validated? Search text remains trimmed and passed through Angular router query parameters.
- What happens on partial failure? Navigation links and controls remain usable without blur support and without animation.
- Concurrency/idempotency implications: none.
- Audit requirements: none.

## UX / visual decision

- Approved intended state/interaction: mobile-first warm ivory bar, restrained burgundy/champagne accents, editorial whitespace, minimal line icons and a calm off-canvas hierarchy.
- Reused design-system primitives/tokens: GM-007 color, typography, spacing, radius, border, shadow, glass, motion, control, z-index and gutter tokens.
- Mobile/RTL/accessibility considerations: logical properties, safe-area padding, 44px controls, native details/summary, visible focus, reduced motion and focus restoration.

## Implementation plan

1. Consolidate shared buttons and icon controls with progressive glass support.
2. Add a typed standalone line-icon component and adopt it in the header.
3. Recompose header/mega-menu/drawer styles and add deterministic focus management.
4. Add unit/E2E/visual regression evidence and run repository gates.

## Verification plan

- Unit tests: icon rendering contract and header focus/navigation behavior where practical.
- Backend/integration tests: no backend change; baseline backend gates still run before delivery.
- PostgreSQL/migration verification: not applicable.
- Browser/E2E tests: Chromium and WebKit header, drawer, submenu, search, focus, scroll and overflow coverage.
- SSR/SEO/accessibility/performance evidence: production SSR build, deterministic nav links, accessibility assertions and visual screenshots.
- Manual/staging acceptance: inspect merged exact-SHA V2 artifact at mobile and desktop sizes.

## Recovery

- Code rollback/revert: revert the focused GM-008 commit/PR.
- Data/migration recovery: not applicable.
- Feature disable/roll-forward path when applicable: restore the previous header markup/styles; no data rollback.

## Delivery

- Planned branch: `feat/gm-008-shared-controls-header`
- Planned PR: focused GM-008 PR into `main`
- Documentation to update: product backlog and this feature specification
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
