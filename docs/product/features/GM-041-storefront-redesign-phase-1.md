# GM-041 — Storefront Redesign Phase 1

## Identity

- Feature ID: `GM-041`
- Title: Monochrome storefront foundation, shared Header and cart indicator
- Request owner: Gallery Mazhari owner
- Change class: `L2 frontend behavior`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies / related items: supersedes the visual direction of GM-001 for explicitly migrated surfaces; overlaps unmerged PR #109 / GM-040, which remains untouched and is not a branch dependency

## Problem / outcome

The current storefront foundation is warm/editorial and the Header motion contract is split across multiple style owners. The approved redesign requires a modern monochrome, commerce-first system and a reliable responsive Header without globally restyling unrelated pages.

Phase 1 establishes an additive migration foundation, then updates the single shared Header across mobile and desktop and integrates its cart indicator with the existing NgRx cart count.

## Acceptance criteria

1. Additive semantic tokens express the approved monochrome surfaces, sharp geometry, 4px spacing rhythm, subtle elevation, restrained 200/250/300ms motion and visible focus without recoloring unmigrated pages.
2. Mobile Header and drawer preserve canonical navigation content/routes and behave reliably in iPhone/WebKit-oriented coverage, including focus, Escape, scroll restoration and reduced motion.
3. Header cart quantity comes reactively from the existing `CartService`/NgRx selector, including restore and quantity changes, with no direct Header storage access.
4. The same Header implementation remains responsive on desktop Chrome/Edge-oriented interaction and keyboard paths.
5. No backend, API, taxonomy, database, migration or checkout-integrity authority changes are introduced.

## Scope

### In scope

- Additive storefront design and motion migration roles.
- Shared responsive Header, mobile drawer and desktop mega-menu presentation/interaction.
- Existing NgRx-backed cart count presentation.
- Focused automated evidence, documentation and release-readiness reporting.

### Explicit non-scope

- Search intelligence, Home/Hero/Footer/catalog redesign, taxonomy changes, backend/API/auth/database work, checkout pricing/discount/availability authority, and unrelated cleanup.
- Automatic reuse or mutation of the unmerged GM-040 branch/PR.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Header presentation and existing cart selector consumption only; routes and menu data remain unchanged |
| SSR/hydration | yes | Browser-only interactions must remain outside the server render path |
| API/DTO contracts | no | Existing contracts unchanged |
| NestJS business logic | no | No backend write surface |
| Auth/permissions/audit | no | Existing route/auth behavior unchanged |
| PostgreSQL/schema/migration | no | No persistence change |
| Existing data compatibility | no | Client cart persistence format remains unchanged |
| Protected business workflows | no | All workflows and taxonomy are preserved |
| Media/storage | no | Existing brand assets are reused unless a later approved checkpoint proves otherwise |
| SEO | no | Navigation remains crawlable and routes remain stable |
| Accessibility | yes | Focus, keyboard, dialog semantics, reduced motion and touch targets are acceptance gates |
| Performance | yes | CSS/Angular only; no new dependency or persistent decorative runtime work |
| Deployment/config/monitoring | no | Standard frontend artifact only |
| Documentation | yes | Token contract, backlog and this feature specification |

## Architecture / data design

- Existing owners: `src/styles/tokens.css`, the shared `HeaderComponent`, `DrawerService`, `CartService` and NgRx cart selectors/reducer/effects.
- Source of truth: tokens remain centralized; navigation uses canonical catalog projections; cart count remains the client cart store projection.
- Server invariants: checkout price, discount, availability and order integrity remain NestJS/database authoritative.
- New domain or database concept: none.

## UX / visual decision

- Approved language: monochrome, sharp, image-led and commerce-first with restrained motion.
- Persian typography retains the existing IRANSansX/YekanBakh authority; no new font dependency is added.
- Mobile is implemented and validated first, followed by the same responsive Header on desktop.
- NONI is inspiration for restraint only; no brand identity, proprietary content or exact composition is copied.

## Implementation plan

1. Add the opt-in design/motion migration foundation without global visual adoption.
2. Root-cause and implement the mobile/iPhone Header behavior.
3. Integrate and verify the existing cart count authority.
4. Calibrate the same Header for desktop/Windows interaction.
5. Run certification gates, finalize documentation and prepare a focused PR without merging.

## Verification plan

- Frontend lint, relevant Vitest, production browser/SSR build.
- Focused Playwright for design tokens, mobile/WebKit drawer, cart states and desktop responsive behavior.
- Keyboard/focus, Escape, reduced motion, touch target, safe-area, overflow, resize and hydration review.
- Final exact-head CI and human visual acceptance before merge.

## Recovery

- Revert the focused GM-041 PR to restore the previous Header and leave legacy tokens intact.
- No data, migration or deployment recovery is required.

## Delivery

- Branch: `feat/storefront-redesign-phase-1-header`
- PR: focused GM-041 draft PR prepared at Phase 1 checkpoint 6; merge remains human-owner controlled
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`

## Certification record

- The additive storefront tokens are opt-in; legacy token values remain available for unmigrated surfaces.
- The shared responsive Header is the sole implementation for mobile and desktop. Menu labels, canonical category projections and routes are unchanged.
- The Safari/WebKit drawer fix consolidates transition ownership, uses deterministic `translate3d` motion, activates visibility immediately on open, delays hiding until close motion completes, and resets focus, scroll and disclosures on every close path.
- The cart badge consumes the existing `CartService`/NgRx item-count projection. The Header does not read persistence directly; checkout price, discount, availability and order integrity remain server-authoritative.
- Desktop calibration uses the same Header with monochrome surfaces, sharp geometry, keyboard focus, Escape dismissal and breakpoint-crossing cleanup.
- No backend, API, schema, migration, dependency, taxonomy or deployment configuration change is included.
- Recovery is a normal revert of the focused PR. No data recovery or migration rollback is required.

### Out-of-scope findings

- Open PR #109 / GM-040 overlaps Header work but was neither used as lineage nor modified. Reconciliation remains an owner/reviewer decision before either overlapping PR is merged.
- Home, catalog, search intelligence, Footer and other storefront surfaces retain their existing visual language until separately authorized phases.
- The stale Home visual-baseline assertion was aligned with the canonical accessible heading already rendered by `main`; Home implementation and copy were not changed.
