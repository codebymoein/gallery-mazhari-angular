# GM-027 — Remove unused legacy API health service

Base: `main@d7949f964a3895ec85e6ed8969e57af1f1b6aab8`

## Scope
Remove only `src/app/core/services/api-health.service.ts` after calibrated Knip marked it unused and repository searches found no references to `ApiHealthService`, `checkHealth`, or `runFullDiagnostics`.

## Rationale
The service contains legacy WordPress/WooCommerce diagnostic calls (`/wp/v2/*`, `/wc/v3/*`) and is not part of the current NestJS runtime path.

## Non-scope
No active service, component, route, template, backend module, API contract, database, deployment, or business workflow changes.

## Verification
- Knip unused-file count should reduce from 11 to 10.
- Frontend/backend lint, test and build remain green.
- PostgreSQL, security, Playwright, RM-09, RM-12, RM-13 and RM-17 exact-head evidence remain green.

## Rollback
Revert the focused PR to restore the removed diagnostic service. No runtime data recovery is required.
