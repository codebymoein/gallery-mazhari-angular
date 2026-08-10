# GM-014 — Editorial inspiration and promotion routes

## Contract

- Feature ID: `GM-014`
- Product area: public discounts, lookbook and look-detail presentation
- Dependency: GM-007 semantic foundation, GM-008 shared controls and GM-010 product-detail journey
- Risk: L2; no backend, schema, product-publication, discount or style-contract change

## Outcome

Bring the promotion and bridal-inspiration routes into the warm ivory Gallery Mazhari editorial system. Visitors should be able to move from a current offer or a complete bridal look to the existing product route through a calm, image-led mobile experience.

## Acceptance criteria

- `/discounts`, `/looks` and `/look/:id` use centralized semantic color, typography, spacing, border, radius, shadow, motion and control tokens.
- Persian/RTL hierarchy remains readable at 320 CSS pixels and English editorial accents declare their language and direction.
- Category filters, gallery thumbnails and look hotspots provide touch-sized controls, keyboard focus and their existing interactions.
- Discount prices, category filtering, look content, product mapping and hotspot navigation retain their existing data/API contracts.
- Core headings and content remain visible without reveal animation or IntersectionObserver dependency.
- Chromium and iPhone/WebKit render the routes without horizontal page overflow.
- Reduced-motion users do not receive decorative image transitions.

## Non-scope

- Discount calculation, scheduling, eligibility or administration.
- Look/style publishing, hotspot authoring or product projection semantics.
- Product detail, cart, checkout, backend/API/database changes or production activation.
- A site-wide motion rollout under GM-006.

## Verification and recovery

Run lint with baseline comparison, unit tests, production browser and SSR builds, and the focused Playwright journey in Chromium and iPhone/WebKit. Recovery is a single-PR revert; no data rollback or migration is required.

## Implementation evidence

- All three routes consume the shared semantic warm-ivory, type, spacing, control, border, radius, shadow and motion contract without page-level hard-coded color values or `!important` overrides.
- Discount category filtering, product identifiers, look/style API reads, gallery selection, hotspot activation and product links retain their existing handlers and contracts.
- Permanent RM-13 coverage asserts visible core headings, 44px interactive controls, product destinations, no horizontal page overflow and reduced-motion behavior in Chromium and iPhone/WebKit.
