# GM-015 — Editorial personal styling tools

## Contract

- Feature ID: `GM-015`
- Product area: private storefront Dream Profile and personal Catalog Builder
- Dependency: GM-007 semantic/WebKit foundation and GM-008 shared controls
- Risk: L2; presentation plus an SSR-safe browser-storage boundary, with no backend or workflow-contract change

## Outcome

Unify `/dream-canvas` and `/catalog-builder` as a warm ivory personal-styling chapter. The two tools should feel calm and editorial on a narrow Persian/RTL viewport while retaining every existing preference, consultation, lookbook, share and AR entry action.

## Acceptance criteria

- Both routes consume centralized semantic color, typography, spacing, border, radius, shadow, motion and control tokens.
- Core headings and form/catalog content are visible without reveal animation or IntersectionObserver dependency.
- Choice chips, inputs, remove buttons and primary actions provide at least 44px touch targets and visible keyboard state.
- Dream-profile tag generation and consultation payload semantics remain unchanged.
- Catalog title, selection removal/addition, PDF/share feedback and AR entry handlers remain unchanged.
- The global Dream Canvas service does not touch `localStorage` while the server shell is rendering; browser persistence remains intact.
- Chromium and iPhone/WebKit render both routes at 320 CSS pixels without horizontal page overflow.
- Decorative transitions honor reduced motion.

## Non-scope

- Replacing the current temporary lookbook/PDF demo with a durable production catalog service.
- Changing consultation persistence, preference tag mapping, product selection or AR behavior.
- Wedding Planner presentation, backend/API/database/schema changes and production activation.

## Verification and recovery

Run lint with baseline comparison, unit tests including the platform-storage boundary, production browser/SSR build, focused Stylelint/token audit and focused Chromium/iPhone-WebKit journeys. Recovery is a single-PR revert; no data rollback or migration is required.

## Implementation evidence

- Dream Profile and Catalog Builder now use the shared warm-ivory surface, Persian/display type, spacing, control, border, radius, shadow and motion contracts without page-level hard-coded colors or `!important` overrides.
- `DreamCanvasService` explicitly avoids browser storage on the server platform while retaining in-memory selection updates and browser restore/persist behavior; dedicated unit coverage verifies both paths.
- Permanent RM-13 coverage verifies the existing consultation payload/tag path, catalog naming/removal/share feedback, 44px controls, no horizontal overflow and reduced-motion behavior in Chromium and iPhone/WebKit.
