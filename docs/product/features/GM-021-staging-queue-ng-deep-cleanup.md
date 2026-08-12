# GM-021 — Staging Queue `::ng-deep` Cleanup

Status: IN_PROGRESS

## Goal
Remove unnecessary `:host ::ng-deep` prefixes from staging-queue table selectors while preserving the exact declarations and responsive behavior.

## Why this is safe
The `.adm-table` markup targeted by these selectors is declared directly in `staging-queue.component.html`, so Angular's component-scoped styles can target it without piercing child-component encapsulation.

## In scope
- `src/app/features/admin/staging-queue/staging-queue.component.css`
- Remove only the `:host ::ng-deep ` prefix from selectors that target elements rendered directly by the staging queue template.

## Out of scope
- Appearance Manager duplicate/override cleanup.
- Changes to declarations, breakpoints, layout, behavior, API, data, or dependencies.
- Global Stylelint configuration or suppressions.

## Verification
- Stylelint debt decreases by exactly the number of removed staging-queue `::ng-deep` findings.
- Frontend lint, tests, production build.
- Accessibility and critical journeys.
- Browser/CWV evidence.
- Required quality gates on the exact PR head.

## Rollback
Revert the focused PR if the staging table responsive presentation regresses.