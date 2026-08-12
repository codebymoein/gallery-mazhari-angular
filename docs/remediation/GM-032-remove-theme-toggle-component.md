# GM-032 — Remove unused theme-toggle component

## Scope

Remove the orphaned standalone `ThemeToggleComponent` and its dedicated template/styles only.

Files removed:
- `src/app/shared/components/theme-toggle/theme-toggle.component.ts`
- `src/app/shared/components/theme-toggle/theme-toggle.component.html`
- `src/app/shared/components/theme-toggle/theme-toggle.component.css`

## Evidence

The calibrated Knip baseline on `main@bdc5c4c11709193847dbeabdd9ce5e8c233ae916` reports `theme-toggle.component.ts` as unused. Repository search found no references to `ThemeToggleComponent` or selector `app-theme-toggle`. The component imported `ThemeService`, which was independently proven unused and removed in GM-031, confirming this folder is an orphaned UI island rather than an active application path.

## Non-scope

No active component, template, route, CSS system, backend/API/database/data/media/SEO/deployment behavior is changed.

## Acceptance

- Knip unused-file count decreases from 6 to 5.
- No orphan theme-toggle companion files remain.
- Frontend/backend/build/tests, PostgreSQL, governance, security, Playwright, RM-09, RM-12, RM-13 and RM-17 exact-head evidence remain green.

## Rollback

Revert the focused PR to restore the three component files; no runtime/data recovery is required.
