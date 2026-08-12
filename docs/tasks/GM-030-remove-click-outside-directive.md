# GM-030 — Remove unused click-outside directive

Base SHA: `476395dbf9afc11662a38ae406cf8a2992474628`

Scope: remove only `src/app/shared/directives/click-outside.directive.ts` after calibrated Knip identified it as unused and repository search found no references to `ClickOutsideDirective` or `[appClickOutside]`.

Non-scope: no component/template/route/backend/API/database/media/SEO/deployment changes and no other Knip findings.

Verification target: Knip unused-file count decreases from 8 to 7 and all exact-head CI gates remain green.

Rollback: revert this focused PR to restore the directive.
