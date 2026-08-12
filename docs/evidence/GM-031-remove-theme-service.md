# GM-031 — Remove unused theme service

Base: `main@c8766939ff767e7c795047d202db2af58c9ce5d9`

Scope: remove only `src/app/core/services/theme.service.ts` after calibrated Knip reported it unused and repository search found no references to `ThemeService`, `gm-theme`, `dark-mode`, or the service-owned `data-theme` activation path.

Non-scope: CSS redesign, appearance-manager changes, component/template routing, backend/API/database/data/media/SEO/deployment changes, or any other Knip finding.

Acceptance: Knip unused-file count decreases from 7 to 6 and all exact-head quality, static-analysis, SSR, browser/CWV, and release-certification gates remain green.

Rollback: revert the focused PR to restore the removed service. No data recovery is required.
