# GM-020 — CSS duplicate cleanup

## Goal
Reduce the remaining Stylelint duplicate-property/duplicate-selector debt without changing storefront or admin behavior.

## Scope
- Remove the literal duplicate `overflow-x` and `-webkit-overflow-scrolling` declarations in `src/styles/admin-theme.css`.
- Keep the intentional `100vh` → `100dvh` progressive-enhancement fallback in `header.component.css`, with a narrowly scoped Stylelint exception documenting why the duplicate is intentional.
- Consolidate the duplicated `.contact__maps` selector by moving `gap: .4rem` into its original declaration block.

## Out of scope
- `appearance-manager.component.css` override-layer duplicate selectors.
- Remaining `::ng-deep` usage in staging queue.
- Stylelint rule changes or global suppressions.
- Visual redesign, token changes, dependencies, API/backend/data behavior.

## Verification
- Stylelint duplicate debt decreases by four findings without introducing new findings.
- Frontend lint/test/build remain green.
- Accessibility, critical journeys, browser/CWV and required quality gates pass on the exact PR head.

## Rollback
Revert the focused PR if any visual or browser regression appears.
