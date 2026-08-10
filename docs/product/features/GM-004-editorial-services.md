# GM-004 — Editorial bespoke services journey

## Contract

- Feature ID: `GM-004`
- Product area: consultation, custom request and Tehran home-trial presentation
- Dependencies: GM-007 semantic foundation, GM-008 controls and the existing consultation/custom-request domain paths
- Risk: L3 surface because customer data, uploads and a deposit journey are present; implementation is presentation-only

## Outcome

Create one calm warm-ivory service language across consultation, custom veil/dress requests and fitting at home. Mobile customers must be able to understand the steps and complete the existing forms without horizontal overflow, decorative blocking or unreliable WebKit behavior.

## Acceptance criteria

- Shared consultation controls use centralized semantic typography, spacing, border, radius, shadow, motion and control tokens.
- Custom request preserves its three steps, Jalali calendar, consent, image allowlist/limit, previews, validation and submission payload.
- Home trial preserves its selected items, Tehran fields, Jalali date, time, map point, deposit cart item and navigation behavior.
- Core headings, form fields and actions are visible without reveal animation, IntersectionObserver or decorative JavaScript.
- Controls provide at least 44px touch targets and layouts stay inside a 320px RTL viewport in Chromium and iPhone/WebKit.
- Existing SSR/SEO metadata, error/status semantics and business handlers remain intact.

## Security and media impact

- No upload, MIME, size, storage, filename, quarantine or server validation behavior changes.
- No customer fixture contains real data and no credential or production endpoint is introduced.
- The existing remote map dependency is not changed or represented as an authoritative location boundary.
- Home-trial map initialization is browser-gated so direct SSR never evaluates DOM or Leaflet APIs.

## Non-scope

- Backend/API/schema/auth changes.
- New services, payment semantics, map providers or upload capabilities.
- Contact page, admin UI and production activation.

## Verification and recovery

Run focused lint, unit tests, production SSR build and focused Playwright service journeys in mobile Chromium and iPhone/WebKit. Recovery is a single-PR revert; no data rollback or migration is required.

## Implementation evidence

- Consultation, custom-request and home-trial controls now share the centralized warm surface, typography, spacing, border, radius, shadow, motion and control tokens.
- Custom-request no longer depends on sticky presentation or `!important` hiding, while its calendar, consent, file input and three-step state remain unchanged.
- Home-trial is mobile-first without `100vh`; its selection, Tehran fields, schedule, map, deposit and cart action remain unchanged.
- Direct SSR previously executed `document` from Leaflet initialization on `/home-trial`. An `isPlatformBrowser` guard now keeps map initialization browser-only while preserving server-rendered headings and form content.
- Permanent RM-13 coverage verifies the three service routes at 320px in Chromium and iPhone/WebKit with a deterministic local Leaflet stub and 44px primary controls.
