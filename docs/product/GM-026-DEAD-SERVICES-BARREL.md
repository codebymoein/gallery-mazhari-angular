# GM-026 — Remove unused services barrel

## Scope

Remove only `src/app/core/services/index.ts`, an unused barrel export file reported by calibrated Knip and independently verified to have no repository references.

## Non-scope

- No service implementation is removed.
- No Angular route, component, template, API, backend, database, media, SEO, deployment or runtime behavior changes.
- No additional Knip findings are remediated in this slice.

## Evidence

The calibrated Knip baseline on `main@490869e38f7c60b309a2fbcef521b0dbcf62fa3e` reports this file as unused. Repository code search for `core/services/index` and imports through the services barrel returned no references.

## Acceptance

- Knip unused-file count decreases by at least one from the calibrated baseline.
- Frontend/backend/build/tests and exact-head required CI remain green.
- No runtime/service implementation file changes are present.

## Rollback

Revert this focused PR to restore the barrel file.
