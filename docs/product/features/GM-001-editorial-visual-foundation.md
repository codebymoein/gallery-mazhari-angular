# GM-001 — Editorial Visual Foundation

## Identity

- Feature ID: `GM-001`
- Title: Editorial Visual Foundation
- Request owner: Gallery Mazhari owner
- Change class: `L2 frontend behavior` (presentation plus motion/interaction contract)
- Priority: `P1`
- Related epic: `EPIC-01 — Storefront UX and visual refinement`
- Dependencies / related items: foundation for GM-002 Heritage Book Intro, GM-003 Wedding Planner, GM-004 Bespoke Services Journey, GM-005 Editorial Category Chapters and GM-006 Storefront Motion System.

## Problem / outcome

### Current problem
The storefront visual language is dominated by cool grey/near-white surfaces and conventional split-card styling. It does not express the warm, fashion-editorial, romantic and heritage-led direction approved by the owner. Shared palette tests currently freeze that older neutral contract.

### Desired outcome
Establish one warm, mobile-first editorial visual language across the public storefront, inspired by the light, fashion-led rhythm and motion character of the owner-selected noni reference without copying its assets, content or exact implementation. Replace grey-dominant surfaces with warm ivory, blush, burgundy and espresso roles; preserve accessibility, RTL, SSR, performance and existing business capabilities.

### Users / roles affected
Public storefront visitors on mobile and desktop. Admin visual density and protected admin workflows are explicitly not redesigned in this slice.

## Acceptance criteria

1. Canonical runtime design tokens expose the approved warm palette and no longer use grey as the dominant brand/page neutral.
2. Existing token consumers continue to use the same semantic token authority rather than gaining one-off color literals.
3. Home hero becomes mobile-first fashion/editorial: one primary bridal story, expressive display typography, restrained motion, a secondary accessories discovery moment and clear catalog/consultation actions.
4. Home remains SSR/hydration safe; the primary bridal image remains the only eager/high-priority Home LCP asset.
5. Motion respects `prefers-reduced-motion`; interactive controls retain visible keyboard focus and semantic links/buttons.
6. RTL/Persian reading order remains correct and English editorial accents use explicit `lang`/`dir` where needed.
7. Design-system Playwright assertions are updated to the new approved canonical token values and continue capturing Home/Catalog mobile/desktop evidence.
8. No API, database, authorization, product-state, inventory, media-workflow or publication semantics change.

## Scope

### In scope
- Canonical warm color, surface, text, border, gradient and motion token values.
- Token contract documentation.
- Home hero/editorial opening composition.
- Existing Home discovery modules remain mounted and functional below the redesigned opening.
- Design-system regression evidence updates.

### Explicit non-scope
- Persistent Wedding Planner state or planner backend/domain design.
- First-visit interactive book/flipbook.
- New custom-order, fitting-at-home or consultation backend capability.
- Catalog filtering/business logic changes.
- Admin redesign.
- New font binaries or third-party animation dependencies.
- Production release/GO.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Home template/styles and shared visual tokens; no durable state |
| SSR/hydration | yes | Home public route must stay deterministic and browser-only appearance fetch remains guarded |
| API/DTO contracts | no | existing appearance API usage unchanged |
| NestJS business logic | no | no backend change |
| Auth/permissions/audit | no | no privileged behavior |
| PostgreSQL/schema/migration | no | no persistence change |
| Existing data compatibility | no | product/catalog data contracts unchanged |
| Protected business workflows | no | all workflows preserved |
| Media/storage | no | existing assets and appearance image contract reused |
| SEO | yes | H1/content hierarchy remains intentional; route metadata unchanged |
| Accessibility | yes | contrast, focus, semantics, reduced motion and RTL are acceptance concerns |
| Performance | yes | Home LCP priority contract must be preserved; no new dependency |
| Deployment/config/monitoring | no | frontend artifact only |
| Documentation | yes | token contract and product feature specification updated |

## Architecture / data design

- Existing capability/service that should own this change: `src/styles/tokens.css` for shared visual authority; Home Angular feature for page-specific composition.
- New domain concept required: none.
- Source of truth: existing NestJS/PostgreSQL business authority remains unchanged; visual tokens are runtime design authority.
- Server-side invariants: none added.
- Database representation: none.
- New dependency: none.

## Security and failure behavior

- Public presentation only; no new authorization boundary.
- Appearance API remains non-authoritative decoration with deterministic fallback assets.
- If appearance loading fails, existing local hero assets still render.
- No user input, durable mutation, concurrency or audit requirement is introduced.

## UX / visual decision

- Direction: warm / editorial / romantic / fashion / heritage; avoid dominant cool grey, clinical white, SaaS cards and heavy shadows.
- Core palette: warm ivory, blush/rose, burgundy, espresso and restrained champagne accent.
- Typography: Persian UI stacks remain licensed/runtime-safe; English editorial accents use the existing serif stack. Visual hierarchy comes from scale, weight, spacing and composition rather than adding unreviewed font binaries.
- Motion: slow image drift/scale and text reveal only where meaningful; no scroll hijacking. Reduced-motion users receive an effectively static experience.
- Mobile first: primary layout is composed for narrow touch screens first, then expands to editorial desktop framing.

## Implementation plan

1. Update canonical design tokens and design-system contract.
2. Recompose Home opening while preserving existing data/image and LCP boundaries.
3. Update design-system E2E token assertions/evidence.
4. Run/record frontend, design-system, browser and production build gates through CI.

## Verification plan

- Unit tests: no new domain logic; existing Angular unit suite remains required.
- Backend/integration tests: not applicable to behavior scope; repository CI remains authoritative for unaffected gates.
- PostgreSQL/migration: not applicable.
- Browser/E2E: Design System Contract Home/Catalog desktop/mobile; existing critical journeys.
- SSR/SEO/accessibility/performance: production build, existing RM-12/RM-13/RM-14 permanent regression controls, reduced-motion and focus review.
- Manual/staging acceptance: owner visual acceptance on exact PR candidate before merge/release.

## Recovery

- Code rollback/revert: revert the focused GM-001 PR to restore prior token and Home composition.
- Data/migration recovery: none.
- Feature disable/roll-forward: no runtime flag required; roll forward by adjusting semantic tokens/Home CSS in a focused follow-up.

## Delivery

- Planned branch: `feat/gm-001-editorial-visual-foundation`
- Planned PR: focused GM-001 visual foundation PR to `main`
- Documentation to update: `docs/product/BACKLOG.md`, `docs/design/DESIGN_TOKEN_CONTRACT.md`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
