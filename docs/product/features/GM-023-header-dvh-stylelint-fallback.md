# GM-023 — Header dynamic viewport Stylelint fallback

## Outcome
Clear the final repository Stylelint finding without changing Header runtime CSS or mobile-drawer behavior.

## Evidence
The remaining finding is `declaration-block-no-duplicate-properties` in `src/app/layout/header/header.component.css`, where the drawer intentionally declares `height: 100vh` followed immediately by `height: 100dvh`.

The first declaration is the legacy viewport fallback. Browsers that support dynamic viewport units use the later `100dvh` value. The declaration order is therefore intentional compatibility behavior, not accidental duplication.

Stylelint documents `consecutive-duplicates-with-different-values` as an allowed compatibility pattern for older-browser fallbacks. GM-023 enables that secondary option only for the Header component stylesheet.

## Scope
- Keep the Header CSS declarations and their ordering unchanged.
- Keep the global duplicate-property rule enabled.
- Add a file-scoped Header override that permits only consecutive duplicate properties with different values.

## Non-scope
- Header redesign or navigation behavior changes.
- Removing the `100vh` compatibility fallback.
- Global Stylelint weakening.
- Angular TypeScript, backend, API, persistence, deployment, dependencies, or business workflows.

## Acceptance
- Repository Stylelint report goes from one finding to zero.
- Header runtime CSS is byte-for-byte unchanged by this task.
- Frontend lint/test/production build pass.
- Design System Contract, accessibility/critical journeys, Browser/CWV and required quality gates pass on the exact PR head.

## Recovery
Revert the focused GM-023 PR to restore the prior Stylelint configuration. No data, schema, deployment or runtime recovery is required.
