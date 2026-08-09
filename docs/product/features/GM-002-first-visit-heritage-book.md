# GM-002 — First-Visit Heritage Book

## Identity

- Feature ID: GM-002
- Title: First-Visit Heritage Book
- Request owner: Gallery Mazhari owner
- Change class: L2 frontend behavior
- Priority: P1
- Related epic: EPIC-01 — Storefront UX and visual refinement
- Dependencies / related items: GM-001 Editorial Visual Foundation (merged on `main`); GM-003 Wedding Planner remains separate.

## Problem / outcome

### Current problem
The storefront now has a warm editorial visual foundation, but a first-time visitor still enters directly into a conventional webpage flow. Gallery Mazhari's history since 1337 is not introduced as a memorable opening ritual.

### Desired outcome
First-time visitors to Home receive a short, optional, mobile-first heritage-book experience that bridges Gallery Mazhari's history into the modern storefront. The experience must be elegant, brief, skippable, replayable and safe for SSR/hydration, performance and reduced-motion users.

### Users / roles affected
Public storefront visitors only. No admin, staff, authenticated workflow or business authority is affected.

## Acceptance criteria

1. On a browser's first Home visit, the book opens after hydration without changing the server-rendered Home document or blocking SEO content.
2. The experience contains a concise cover plus heritage/story pages and a final entry page, with clear next/back controls and a persistent Skip action.
3. Completing or skipping records only a local presentation preference so repeat visits do not auto-open the book; this preference is not business data or application authority.
4. A visible but restrained replay control allows a visitor to reopen the heritage story later.
5. Keyboard Escape closes the experience; controls are semantic, focus-visible and touch-target compliant.
6. `prefers-reduced-motion: reduce` removes page-turn transforms and uses an effectively static/fade presentation.
7. The Home LCP image priority contract remains unchanged and no new eager/high-priority media is introduced.
8. Existing Home routes/actions remain available after dismissal and no new backend/API/database/deployment dependency is added.

## Scope

### In scope
- Standalone Angular Heritage Book component under Home.
- First-visit presentation preference stored in browser local storage.
- Page navigation, Skip, close and replay behavior.
- Responsive RTL presentation with CSS-only page-turn treatment.
- Reuse of existing approved storefront imagery with an archival treatment until a curated Gallery Mazhari archive image is supplied.
- Playwright coverage for first visit, completion/revisit, reduced motion and LCP-priority preservation.
- Backlog status update.

### Explicit non-scope
- Wedding Planner persistence/domain or GM-003 implementation.
- New planner route or fake unavailable service actions.
- Backend/API/auth/business logic.
- PostgreSQL/schema/migrations.
- Upload/media pipeline changes or new image provenance.
- New animation dependencies, font binaries or third-party design assets.
- Production release authorization.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Home gains a standalone presentational component and browser-only preference state; no route change. |
| SSR/hydration | yes | Overlay starts closed during SSR and opens only after browser render/hydration. |
| API/DTO contracts | no | No API use. |
| NestJS business logic | no | No backend change. |
| Auth/permissions/audit | no | Public presentation only. |
| PostgreSQL/schema/migration | no | No persistent domain data. |
| Existing data compatibility | no | No data model change. |
| Protected business workflows | no | No workflow semantics touched. |
| Media/storage | no | Reuses existing local storefront asset; no upload/storage mutation. |
| SEO | low | Existing crawlable Home remains server-rendered and unaffected by the client-only overlay. |
| Accessibility | yes | Dialog semantics, semantic buttons, focus visibility, Escape and reduced motion required. |
| Performance | yes | No dependency; no additional eager/high-priority media; overlay image is lazy. |
| Deployment/config/monitoring | no | Normal frontend artifact only. |
| Documentation | yes | This feature spec and backlog status. |

## Architecture / data design

- Existing capability/service that should own this change: Angular Home feature; no domain service required.
- New domain concept required: none.
- Source of truth: none beyond component state; `localStorage` stores only the optional presentation preference `gallerymazhari:heritage-intro:v1`.
- Server-side invariants: none.
- Database representation: none.
- No existing business model should own a non-authoritative first-visit visual preference.

## Security and failure behavior

- Authorization: public UI; no privileged behavior.
- Untrusted input: none beyond browser storage string presence; the value is not interpolated or trusted as data.
- Partial failure: storage read/write failures degrade gracefully; the current session can still open/close the book and the site remains usable.
- Concurrency/idempotency: repeated set/remove operations are harmless presentation preferences.
- Audit: not required.

## UX / visual decision

- Approved intended state: a short editorial book/album ritual, not a vintage-themed site redesign. The rest of Home remains modern and warm.
- Reused design-system primitives/tokens: ivory, espresso, burgundy, champagne, rose, butter, typography and editorial motion tokens from GM-001.
- Mobile/RTL/accessibility: mobile-first single-page book framing; wider view adds book depth. Native buttons/links, logical CSS, visible focus and reduced motion are mandatory.
- The first version reuses an existing Gallery Mazhari bridal asset with monochrome/sepia archival treatment; swapping to a verified archive photograph later is an asset/content update, not a reason to block the interaction architecture.

## Implementation plan

1. Add a standalone `HeritageBookComponent` with browser-after-render first-visit detection and guarded local preference access.
2. Mount it at the beginning of Home while preserving existing hero/LCP priorities.
3. Add CSS-only page transition, responsive book composition, focus states and reduced-motion behavior.
4. Add Playwright behavior/regression coverage and update the backlog status.

## Verification plan

- Unit tests: component behavior is small and browser-dependent; Playwright is the lowest useful behavioral layer for storage/render/motion interaction.
- Backend/integration tests: not applicable.
- PostgreSQL/migration verification: not applicable.
- Browser/E2E tests: first visit opens, Skip/completion prevents auto-open, replay works, keyboard Escape works, reduced-motion style contract holds.
- SSR/SEO/accessibility/performance evidence: existing RM-12, RM-13, Design System and Quality Gates must pass on final PR head; Home LCP priority assertion remains.
- Manual/staging acceptance: owner visually reviews exact V2 candidate before merge/release acceptance.

## Recovery

- Code rollback/revert: revert the focused GM-002 PR.
- Data/migration recovery: none.
- Feature disable/roll-forward: removing the Home component mount disables the intro without affecting business data; versioning the preference key permits a future intentional replay policy change.

## Delivery

- Planned branch: `feat/gm-002-first-visit-heritage-book`
- Planned PR: focused GM-002 PR to `main`
- Documentation to update: `docs/product/BACKLOG.md`; this specification.
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
