# GM-022 — Appearance Manager Stylelint Override

Status: IN_PROGRESS

## Goal
Preserve the intentional late `Management-center visual system` override layer in Appearance Manager without reporting its eight deliberate duplicate selectors as CSS debt.

## Why an override is safer than consolidation
The duplicate selectors are split across the base rules and a later visual-system override layer. Base responsive media queries sit between those layers. Moving either set of declarations would change cascade order and could change desktop/mobile computed styles.

## In scope
- Add a Stylelint override scoped only to `src/app/features/admin/appearance/appearance-manager.component.css`.
- Disable only `no-duplicate-selectors` for that file.
- Preserve every CSS declaration and its order.

## Out of scope
- Header viewport-height fallback finding.
- Global Stylelint rule weakening.
- CSS declaration movement, redesign, backend/API/data, dependencies.

## Verification
- Appearance Manager duplicate-selector findings: 8 → 0.
- Repository Stylelint report: 9 → 1, with only the separately tracked Header fallback remaining.
- Frontend lint, tests, production build.
- Design System Contract, accessibility, Browser/CWV and required quality gates.

## Rollback
Revert this focused PR if the scoped Stylelint exception proves too broad or future Appearance Manager CSS is restructured so the override is no longer needed.
