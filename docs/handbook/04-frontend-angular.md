# 04 — Frontend: Angular

The frontend is Angular 21 with feature routes/components, `core` services/interceptors/guards, shared models/utilities/components, NgRx for selected product/cart state, and RTL/Persian presentation.

## Responsibilities
Angular MAY own rendering, interaction, routing, client state, optimistic UX, formatting, accessibility, and client-side validation. Angular MUST NOT be the sole enforcement point for authorization, stock correctness, publish eligibility, payment state, import validity, or durable workflow transitions.

## Structure
- Feature-specific UI stays under `src/app/features/<feature>`; reusable UI/models/utilities under `shared`; cross-cutting API/auth/interceptor/state services under `core`.
- Prefer typed API services over ad-hoc `HttpClient` calls in components.
- Components should orchestrate view state; complex domain transformations belong in testable services/utilities or backend authority.
- Route guards improve UX but backend permissions remain mandatory.

## State/data
Server data remains server-authoritative. NgRx/local storage caches must define refresh/invalidation behavior and may not silently override fresher server state. Transitional generated catalog/WordPress data must have an explicit fallback/migration contract.

## UI quality
Use existing tokens in `src/styles/tokens.css`, global/RTL/typography patterns and [`../../DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md). Preserve Persian RTL, keyboard navigation, focus states, semantic HTML, responsive behavior, image dimensions/loading strategy, and error/loading/empty states.

## Verification
Frontend behavior changes require unit tests where logic is isolated and Playwright coverage for critical user journeys. Run `npm run lint`, `npm test`, and `npm run build:prod` as applicable.
