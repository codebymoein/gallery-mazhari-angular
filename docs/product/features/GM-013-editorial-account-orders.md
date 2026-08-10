# GM-013 — Editorial account and order history

## Contract

- Feature ID: `GM-013`
- Product area: private storefront account and order presentation
- Dependency: GM-007 semantic foundation and GM-008 shared controls
- Risk: L2; no backend, schema, authentication, order or payment-contract change

## Outcome

Bring the customer account and order-history routes into the warm ivory Gallery Mazhari editorial system. The experience must remain readable and calm on narrow RTL screens while preserving the existing order disclosure, status, repayment, Dream Canvas and planning paths.

## Acceptance criteria

- Account and order pages use centralized semantic surface, typography, spacing, border, radius, shadow and control tokens.
- Account quick actions and order disclosure controls provide at least 44px touch targets and visible keyboard focus.
- Empty and populated states remain visible without JavaScript reveal animation or IntersectionObserver dependency.
- Recent account activity is no longer suppressed by a presentation override.
- Order cards preserve status labels, totals, line items, customer metadata and the pending-payment action.
- Layout remains within a 320px viewport in Chromium and iPhone/WebKit.
- Existing RTL order, SSR, noindex metadata and business handlers remain intact.

## Non-scope

- Authentication and authorization behavior.
- Order persistence, tracking, status mapping, checkout restoration or payment semantics.
- Referral-program activation or its current local-only implementation.
- Backend/API/database changes, admin UI and production activation.

## Verification and recovery

Run focused lint, unit tests, production SSR build and focused Playwright journeys in mobile Chromium and iPhone/WebKit. Recovery is a single-PR revert; no data rollback or migration is required.

## Implementation evidence

- Both routes now consume the centralized warm surface, type, spacing, border, radius, shadow and control tokens without page-level `!important` overrides.
- The account's recent-activity surface is visible again; the local-only referral prototype remains inactive pending a separately governed durable service contract.
- Order status, detail disclosure, line items, customer metadata and pending-payment restoration/navigation handlers are unchanged.
- The permanent RM-13 matrix includes empty and populated account/order coverage at 320px, including 44px controls and the repayment route into checkout.
