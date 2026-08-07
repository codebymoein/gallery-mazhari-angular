# PR-020 — SSR / Prerender Foundation

Program: RM-12  
Wave: 3  
Base SHA: `5873726f0a2b7e012f46c55a9c49aee63a355eb2`

## Scope

This slice establishes the Angular SSR/hydration and deployment foundation required before dynamic SEO work in PR-021.

- Angular application-builder SSR output with browser and server bundles.
- Shared browser/server application configuration with hydration and event replay.
- Browser-only startup effects guarded from server execution.
- Server routing for public SSR routes, private/admin client routes, and a true 404 fallback.
- Supervised Node SSR runtime packaged in immutable release artifacts and proxied by Nginx.
- CI evidence that the production SSR bundle exposes route metadata in raw HTML and returns HTTP 404 for an unknown route.

## Explicit non-scope

- Dynamic product/category metadata resolution.
- JSON-LD lifecycle cleanup and structured-data families.
- Dynamic sitemap indexes and redirect registry.
- Core Web Vitals optimization or Lighthouse budgets.
- Accessibility remediation.
- Business workflow, authorization, persistence, migration or media changes.

## Acceptance evidence

The dedicated `RM-12 SSR Evidence` workflow builds the production server bundle, launches the generated Node server, asserts the homepage title/description/canonical in raw HTML, and asserts an unmatched URL returns HTTP 404 with the not-found document.

The normal repository Quality Gates remain mandatory and are not weakened or bypassed by this slice.

## Rollback

Revert PR-020 to restore the browser-only frontend build/deployment path. No database or durable business-data rollback is required.
