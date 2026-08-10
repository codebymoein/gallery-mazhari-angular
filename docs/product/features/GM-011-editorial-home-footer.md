# GM-011 — Editorial Home and Footer

## Identity

- Feature ID: GM-011
- Title: Editorial Home and Footer
- Request owner: Gallery Mazhari owner
- Change class: L2 frontend behavior
- Priority: P1
- Related epic: EPIC-01
- Dependencies / related items: GM-001, GM-007, GM-008, GM-005 and GM-010

## Problem / outcome

### Current problem

The Home opening has an editorial foundation, but the long landing journey and dark legacy Footer still read as separate visual systems. Dense sections, inconsistent transitions and a utility-heavy Footer weaken the premium Persian bridal narrative, especially on mobile.

### Desired outcome

Visitors should move from the bridal opening through discovery, appointment and social proof in one warm ivory editorial rhythm, ending in a calm, useful and brand-led Footer. Existing data sources, routes and customer actions must remain intact.

### Users / roles affected

Public storefront visitors on mobile and desktop, including iPhone/WebKit users.

## Acceptance criteria

1. Home has a coherent mobile-first Persian/RTL hierarchy with a high-impact bridal opening, clear discovery path and restrained editorial transitions.
2. The global Footer uses the warm ivory/cream design system, retains every real branch/support/link path and provides accessible mobile disclosure controls.
3. Core Home and Footer content is SSR-visible and does not depend on JavaScript reveal animation.
4. Existing appearance, promotion, appointment, lookbook, testimonial, FAQ and trust behavior remains owned by the existing components/services.
5. Chromium and WebKit regression coverage verifies Home visibility, CTA routes, Footer reachability/disclosures, no horizontal overflow and reduced-motion behavior.

## Scope

### In scope

- Home composition and presentation within the existing Home component tree.
- Global Footer template/presentation and its existing local disclosure behavior.
- Shared line-icon reuse where appropriate.
- Focused Home/Footer browser evidence and delivery documentation.

### Explicit non-scope

- Catalog, product-detail, header, cart, checkout, admin or account redesign.
- New APIs, DTOs, data models, authentication behavior or customer workflow semantics.
- Production activation or deployment-host changes.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | yes | Presentation/composition and local Footer disclosure only |
| SSR/hydration | yes | Deterministic content remains server-rendered |
| API/DTO contracts | no | Existing consumers unchanged |
| NestJS business logic | no | Unchanged |
| Auth/permissions/audit | no | Unchanged |
| PostgreSQL/schema/migration | no | None |
| Existing data compatibility | yes | Existing optional API content and fallbacks retained |
| Protected business workflows | yes | Consultation, catalog and support routes preserved |
| Media/storage | no | Existing asset and appearance resolution retained |
| SEO | yes | One Home H1 and organization semantics retained |
| Accessibility | yes | Focus, touch targets, disclosure state, reflow and reduced motion |
| Performance | yes | Existing eager hero/lazy secondary loading retained |
| Deployment/config/monitoring | no | Standard immutable frontend artifact |
| Documentation | yes | Spec and backlog |

## Architecture / data design

- Existing capability/service that should own this change: `HomeComponent` remains the composition owner; its child components retain their own API and interaction behavior. `FooterComponent` retains branch, support and disclosure ownership.
- New domain concept required: none.
- Source of truth: existing published storefront APIs and component fallbacks; NestJS-controlled paths remain authoritative.
- Server-side invariants: unchanged.
- Database representation: none.

## Security and failure behavior

- Authorization and input validation: unchanged.
- Partial failure: optional API-backed sections keep their existing empty/fallback states while the primary Home narrative remains visible.
- Concurrency/idempotency and audit requirements: unchanged.

## UX / visual decision

- Approved state: Persian editorial cover, warm ivory chapter rhythm, burgundy/espresso accents, minimal line iconography and restrained image motion.
- Reused primitives/tokens: GM-007 semantic tokens and GM-008 line icons/controls.
- Mobile/RTL/accessibility: logical properties, dynamic viewport units with fallback, safe-area gutters, 44px controls, visible focus and no scroll hijacking.

## Implementation plan

1. Refine Home composition and its visual chapter transitions without changing child behavior.
2. Replace the dark utility Footer presentation with a warm editorial information architecture while retaining links and structured data.
3. Add focused Chromium/WebKit regression evidence.

## Verification plan

- Unit tests: full frontend Vitest suite.
- Browser/E2E tests: focused mobile Chromium and WebKit Home/Footer journeys plus required CI matrices.
- SSR/SEO/accessibility/performance evidence: production SSR build and standard CI gates.
- Manual/staging acceptance: V2 visual/product acceptance after separately gated artifact activation.

## Recovery

- Code rollback/revert: revert focused GM-011 merge commit.
- Data/migration recovery: none.
- Feature disable/roll-forward: presentation-only revert; no data flag required.

## Delivery

- Planned branch: `feat/gm-011-editorial-home-footer`
- Planned PR: focused PR from verified `main` SHA `8c04b29be3a6a29a07af94a6649cc8b5978e3e54`
- Documentation to update: this specification and `docs/product/BACKLOG.md`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
