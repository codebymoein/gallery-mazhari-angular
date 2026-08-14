# GM-039 — Fashion Editorial Home Opening

## Identity

- Feature ID: `GM-039`
- Title: Fashion-editorial Home opening with bridal hero and paired store entries
- Request owner: Gallery Mazhari owner
- Change class: `L2 frontend behavior`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies / related items: GM-001 visual foundation, GM-006 motion foundation, GM-011 Home journey; GM-038 header/menu work remains a separate slice.

## Problem / outcome

### Current problem
The current Home opening overlays campaign copy, several actions and an accessory chapter card on the bridal image. That composition conflicts with the newly approved fashion-editorial direction and the supplied video reference, where imagery carries the opening and navigation choices are presented as restrained flat controls below it.

### Desired outcome
Make the bridal photograph the only visible content in the Home hero. Place exactly two primary store-entry actions immediately below it — `پوشاک عروس` and `فروشگاه اکسسوری` — side by side on both mobile and desktop. Keep the interaction minimal, rectangular and warm dusty-rose/taupe using the existing design-token authority.

### Users / roles affected
Public storefront visitors on mobile, tablet and desktop.

## Acceptance criteria

1. The Home opening starts with one full-width bridal image and no visible hero title, paragraph, overlay CTA, accessory mini-card or scroll label.
2. The existing appearance-driven bridal image source remains authoritative, including the deterministic fallback and eager/high-priority LCP attributes.
3. A semantic page `h1` remains available to assistive technology without appearing visually over the hero.
4. Immediately below the image, exactly two entry actions are visible: `پوشاک عروس` routes to `/catalog`; `فروشگاه اکسسوری` routes to `/accessories`.
5. The two actions remain in one row at narrow mobile and desktop widths, maintain usable touch targets, and do not overflow or wrap their labels unexpectedly.
6. The actions use a flat rectangular fashion-editorial treatment derived from existing tokens; no page-local raw brand colors, pill radius, heavy card shadow or competing design-system authority is introduced.
7. Hero/CTA motion is finite and restrained; `prefers-reduced-motion` disables decorative animation.
8. Existing Home sections below the opening, header/menu behavior, routes, API contracts, backend logic, PostgreSQL, media pipeline and protected workflows are unchanged.

## Scope

### In scope
- `src/app/features/home/home.component.html`
- `src/app/features/home/home.component.css`
- `src/app/features/home/home.motion.css`
- Focused Home Playwright coverage for opening visibility, routes, side-by-side layout and reduced motion.
- Product backlog/spec traceability for GM-039.

### Explicit non-scope
- Header or mobile drawer redesign.
- Menu taxonomy or route changes.
- Redesigning Heritage, category showcase, promotions, appointment, lookbook, real brides, FAQ or trust sections.
- Backend, API, auth, PostgreSQL, migrations, media storage, SEO metadata or deployment changes.
- Global token value changes.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Home opening markup/styles only; existing route targets are reused. |
| SSR/hydration | no | Static semantic markup and current image binding remain SSR-safe. |
| API/DTO contracts | no | No contract changes. |
| NestJS business logic | no | No backend changes. |
| Auth/permissions/audit | no | Public navigation only. |
| PostgreSQL/schema/migration | no | No data changes. |
| Existing data compatibility | no | Existing appearance payload/fallback remains compatible. |
| Protected business workflows | no | No workflow semantics touched. |
| Media/storage | no | Existing hero-image source is reused. |
| SEO | no material contract change | Semantic H1 remains in the document; metadata/routes remain unchanged. |
| Accessibility | yes | Visually hidden H1, focus-visible behavior, touch targets and reduced-motion must remain valid. |
| Performance | yes | Preserve one eager/high-priority hero LCP image and stable dimensions; no new dependency. |
| Deployment/config/monitoring | no | No operational changes. |
| Documentation | yes | This specification and Backlog status are updated. |

## Architecture / data design

- Existing capability/service that should own this change: `HomeComponent` plus `AppearanceApiService` for decorative hero appearance.
- New domain concept required: none.
- Source of truth: existing Angular Home presentation; existing appearance API/fallback for hero image.
- Server-side invariants: unchanged.
- Database representation: none.
- New model/path: not required.

## Security and failure behavior

- Authorization: public route.
- Untrusted inputs: unchanged appearance response; existing fallback behavior remains.
- Partial failure: appearance fetch failure continues to render the deterministic local bridal image.
- Concurrency/idempotency: not applicable.
- Audit requirements: none.

## UX / visual decision

- Approved intended state/interaction: Fashion Editorial; bridal image is the sole visible hero content; two equal entry actions sit directly underneath and stay side by side on mobile and desktop.
- Reused design-system primitives/tokens: existing page/brand color tokens, typography tokens, touch-target and motion tokens; no raw theme literals.
- Mobile/RTL/accessibility: RTL-safe two-column grid, readable non-wrapping labels where possible, minimum touch target, visible focus, reduced-motion path.

## Implementation plan

1. Replace the current overlay-heavy hero composition with the single bridal media surface and semantic visually-hidden H1.
2. Add the paired store-entry navigation strip below the hero using existing route semantics and tokens.
3. Remove obsolete hero-specific CSS/motion selectors rather than layering overrides.
4. Update focused Playwright evidence for the new approved opening.

## Verification plan

- Unit tests: existing frontend test suite.
- Backend/integration tests: unchanged but repository Quality Gates remain required.
- PostgreSQL/migration verification: unchanged; repository gate remains required.
- Browser/E2E tests: Home opening links visible, correct href semantics, side-by-side geometry at mobile/desktop, hero LCP image visible, reduced-motion disables decoration.
- SSR/SEO/accessibility/performance evidence: exact-head required workflows plus semantic H1 and preserved image dimensions/priority.
- Manual/staging acceptance: owner visual review on mobile and desktop before merge.

## Recovery

- Code rollback/revert: revert the focused GM-039 PR.
- Data/migration recovery: none.
- Feature disable/roll-forward: restore the prior Home opening markup/styles if visual acceptance is rejected.

## Delivery

- Planned branch: `feat/gm-039-home-opening-editorial`
- Planned PR: focused GM-039 Home opening PR.
- Documentation to update: `docs/product/BACKLOG.md`, this specification.
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
