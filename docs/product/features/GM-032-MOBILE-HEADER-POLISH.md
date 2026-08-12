# GM-032 — Mobile Header Polish

## Identity
- Feature ID: `GM-032`
- Title: Mobile header wordmark, controls and motion polish
- Request owner: human owner
- Change class: `L2 frontend behavior`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies / related items: extends the established GM-008 header and GM-001 motion-token foundation; unrelated GM-030 and GM-031 cleanup work remains out of scope.

## Problem / outcome

### Current problem
On narrow mobile viewports the header still uses the image logo plus a small caption, while menu/search/cart controls inherit framed/glass icon-button chrome. The drawer switches `display` at the open state, so its transform cannot provide a complete enter/exit transition, and mobile `details` submenus appear abruptly even though their chevrons already animate.

### Desired outcome
At mobile widths, present a clean Latin `Gallery Mazhari` wordmark using the approved English editorial typography and dark brand token; render menu, search and cart as visually consistent frameless line-icon controls while preserving accessible touch targets; animate drawer entry/exit and submenu reveal using existing motion tokens. Desktop composition and all navigation/search/cart semantics remain unchanged.

### Users / roles affected
Public storefront visitors using narrow/mobile viewports.

## Acceptance criteria
1. Below `48rem`, the image logo is not visually shown and the header visibly presents the exact Latin wordmark `Gallery Mazhari` in the approved English editorial stack and dark brand color.
2. Below `48rem`, menu, search and cart retain semantic controls and touch-target sizing, share the same line-icon sizing, and have no visible background/border frame; the cart count badge remains functional.
3. Opening and closing the mobile drawer visibly transitions with existing design-system motion tokens without changing body scroll locking, focus restoration, Escape handling or backdrop behavior.
4. Opening mobile category and nested accessory submenus has a restrained reveal effect and keeps the existing chevron rotation; `prefers-reduced-motion: reduce` removes meaningful motion.
5. At `48rem` and wider, the current image-logo/header composition remains unchanged.
6. Existing search, cart, account, category, contact and consultation routes/actions are unchanged.

## Scope

### In scope
- Mobile-only header wordmark presentation.
- Mobile menu/search/cart visual-control treatment.
- Drawer/backdrop transition mechanics.
- Mobile `details` submenu reveal motion and reduced-motion handling.
- Focused browser regression coverage and task documentation.

### Explicit non-scope
- Desktop navigation redesign.
- Navigation taxonomy, routes, search semantics or cart behavior.
- Backend/API/auth/database/data/media/SEO authority changes.
- Dependencies, deployment/configuration or unrelated cleanup.
- Independent GM-030 and GM-031 cleanup work.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Header template/CSS only; routes and state semantics preserved. |
| SSR/hydration | no | No data fetching, route or hydration contract change. |
| API/DTO contracts | no | No API changes. |
| NestJS business logic | no | No backend changes. |
| Auth/permissions/audit | no | Existing account navigation only. |
| PostgreSQL/schema/migration | no | No persistence changes. |
| Existing data compatibility | no | No data changes. |
| Protected business workflows | no | No workflow semantics change. |
| Media/storage | no | Existing logo asset remains for tablet/desktop. |
| SEO | no | Header link destinations and public routes are unchanged. |
| Accessibility | yes | Preserve semantic controls, focus, Escape, touch targets and reduced motion. |
| Performance | yes | Mobile stops painting the logo image in the header layout; no new assets/dependencies. |
| Deployment/config/monitoring | no | No runtime configuration changes. |
| Documentation | yes | Backlog and this focused specification. |

## Architecture / data design
- Existing capability/service that should own this change: `HeaderComponent`, existing `DrawerService`, shared `LineIconComponent`, and design tokens.
- New domain concept required: none.
- Source of truth: existing Angular presentation state and existing server/domain authorities are unchanged.
- Server-side invariants: none affected.
- Database representation: none.

## Security and failure behavior
- Authorization: not applicable; public presentation only.
- Untrusted inputs: existing search input behavior is unchanged.
- Partial failure / concurrency / audit: not applicable.

## UX / visual decision
- Approved intended state/interaction: owner explicitly requested a Latin text logo, frameless minimal unified mobile icons, animated drawer opening and animated submenu reveals.
- Reused design-system primitives/tokens: `--font-serif-en`, `--color-matte-black`, existing touch-target, duration and easing tokens, and existing shared line icons.
- Mobile/RTL/accessibility: retain RTL structure while marking the Latin wordmark `lang="en" dir="ltr"`; maintain full control hit areas, keyboard/focus behavior and reduced-motion support.

## Implementation plan
1. Split the brand presentation into a mobile Latin wordmark and the existing tablet/desktop logo/caption without changing the home link.
2. Add mobile-scoped frameless icon-control overrides and repair drawer/backdrop visibility transitions so enter and exit motion can run.
3. Add token-based reveal motion for mobile category/nested submenus with reduced-motion handling.
4. Add focused Playwright assertions for the mobile presentation and interaction contract.

## Verification plan
- Unit tests: no isolated domain logic changed; browser behavior is the useful layer.
- Backend/integration tests: not applicable.
- PostgreSQL/migration verification: not applicable.
- Browser/E2E: focused mobile header assertions in the critical storefront suite plus existing design-system/accessibility coverage.
- Build/quality: frontend lint, relevant tests, production build, exact-head CI.
- Manual/staging acceptance: representative narrow-mobile visual review before merge.

## Recovery
- Code rollback/revert: revert the focused GM-032 PR.
- Data/migration recovery: none.
- Feature disable/roll-forward: restore prior header CSS/template behavior; no persistent state migration required.

## Delivery
- Planned branch: `feat/gm-032-mobile-header-polish`
- Planned PR: focused GM-032 PR against `main`
- Documentation to update: `docs/product/BACKLOG.md` and this specification.
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
