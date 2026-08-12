# GM-033 — Remove unused floating-actions component

## Scope

Remove the orphaned standalone `FloatingActionsComponent` and its dedicated template/styles only.

Files removed:
- `src/app/shared/components/floating-actions/floating-actions.component.ts`
- `src/app/shared/components/floating-actions/floating-actions.component.html`
- `src/app/shared/components/floating-actions/floating-actions.component.css`

## Evidence

The calibrated Knip baseline on `main@0faea9552139ba669f7fa6158d0c3dc9672cc28a` reports `floating-actions.component.ts` as unused. Repository search found no references to `FloatingActionsComponent`, selector `app-floating-actions`, or the component path. The orphaned component also imported the already-removed `BookingService`, confirming it is not part of the active runtime graph.

## Non-scope

No active component, header, template, route, backend/API/database/data/media/SEO/deployment behavior is changed.

## Acceptance

- Knip unused-file count decreases from 5 to 4.
- No orphan floating-actions companion files remain.
- Frontend/backend/build/tests, PostgreSQL, governance, security, Playwright, RM-09, RM-12, RM-13 and RM-17 exact-head evidence remain green.

## Rollback

Revert the focused PR to restore the three component files; no runtime/data recovery is required.
