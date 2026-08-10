# GM-012 — Editorial cart and checkout journey

## Contract

- Feature ID: `GM-012`
- Product area: public storefront commerce presentation
- Dependency: GM-007 semantic foundation and GM-008 shared controls
- Risk: L2; no backend, schema, authentication or payment-contract change

## Outcome

Bring the cart and checkout into the warm ivory Gallery Mazhari editorial system. The mobile journey must feel calm, legible and premium while keeping every existing cart, home-trial, coupon, address, delivery, payment and gateway-result action intact.

## Acceptance criteria

- Empty and populated cart states use the semantic warm surface, border, radius, shadow and control tokens.
- Cart line items remain photography-led and readable without horizontal overflow at a 320px viewport.
- Checkout preserves its existing step state, validation, payment providers and order submission handlers while using a clear mobile-first hierarchy.
- Core content and actions render without reveal animation or IntersectionObserver dependency.
- Sticky behavior is desktop-only and does not obscure content or safe-area controls on iPhone/WebKit.
- Existing RTL order, keyboard focus, reduced-motion behavior, SSR and SEO contracts remain intact.
- Regression evidence covers empty and populated commerce states in Chromium and iPhone/WebKit.

## Non-scope

- Orders and account redesign (next focused slice).
- Cart, order, payment, coupon, authentication or home-trial business logic.
- Backend/API/database changes, admin UI and production activation.

## Verification and recovery

Run focused lint, unit tests, production build and the applicable RM-13 Playwright journeys in desktop Chromium and mobile WebKit. Recovery is a single-PR revert; no data rollback or migration is required.

## Implementation evidence

- The cart and checkout presentation now consumes the centralized warm surface, border, radius, shadow, spacing and control tokens; legacy compact/hard-coded overrides were removed from the touched surfaces.
- The WebKit checkout failure was traced to `overflow-x: clip` being applied jointly to `html` and `body`. After vertical scrolling, WebKit retained a valid button rectangle while hit-testing returned the root HTML element and produced an inflated document height. Keeping clipping on `html` alone removes the nested clipped body; an explicit `body` width prevents the RTL mobile scrollbar gutter from creating a horizontal scroll range. Together they preserve the window scroll root, correct paint/hit-testing, infinite catalog loading and drawer scroll restoration.
- The permanent RM-13 browser matrix now includes the cart/checkout behavior suite. The added 320px regression verifies visible core content, no horizontal document overflow and 44px controls.
- Local evidence: 15/15 Vitest tests, production SSR build, 3/3 desktop Chrome cart/checkout tests and 3/3 iPhone/WebKit cart/checkout tests. Repository-wide lint remains at the pre-existing 7 errors and 30 warnings outside this slice; focused lint has no in-scope error.
