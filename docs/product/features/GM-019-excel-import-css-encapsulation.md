# GM-019 — Excel Import CSS encapsulation cleanup

## Outcome
Remove the unnecessary `::ng-deep` selector from the Excel Import row highlight without changing runtime behavior.

## Scope
- `src/app/features/admin/excel-import/excel-import.component.css`
- Replace `:host ::ng-deep .stg-row--new` with the component-scoped `.stg-row--new` selector.

## Rationale
The `.stg-row--new` class is applied directly to a `<tr>` in `excel-import.component.html`, so Angular emulated encapsulation already scopes the selector correctly and deep piercing is unnecessary.

## Non-scope
- Other `::ng-deep` usages.
- Duplicate CSS cleanup.
- Visual redesign.
- Dependency or Stylelint configuration changes.

## Verification
- Stylelint debt decreases by one error.
- Frontend lint/test/build remain green.
- Required CI gates pass on the exact PR head.

## Recovery
Revert the focused PR.
