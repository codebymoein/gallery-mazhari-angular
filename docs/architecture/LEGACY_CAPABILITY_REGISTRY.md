# Legacy Capability / Adapter Registry

Status: **RM-09 active registry**. This document records legacy or compatibility paths only after usage evidence is reviewed. It is not a blanket deletion list.

## Active capability ownership

| Capability | Canonical implementation | Legacy / duplicate path | Evidence and disposition |
| --- | --- | --- | --- |
| Public product catalog | `ProductsApiService` -> NestJS `GET /products/published` -> PostgreSQL; bounded projection via `PublishedCatalogSyncService` | `src/app/core/api/wordpress.service.ts` WooCommerce `/wc/v3` product/category client | Removed in PR-018 (#38). Git history shows the client was unchanged since the initial baseline and the only runtime consumer was the equally baseline-only NgRx `ProductEffects`. Current storefront catalog/search reads the server-backed published projection. |
| Product NgRx side effects | Server-backed storefront projection and current feature services | `src/app/core/store/product/product.effects.ts` | Removed in PR-018 (#38) after detaching it from root `EffectsModule`. It called only the removed WordPress client. Product reducer/selectors are retained because their remaining usage/deletion proof is a separate cleanup decision. |
| WordPress/WooCommerce integration authority | NestJS/PostgreSQL are authoritative; any future external integration must be an explicit backend adapter | Direct Angular WooCommerce business API calls | Forbidden for new code. Reintroduction requires an explicit adapter contract, owner, expiry/migration plan, and tests; Angular must not regain authoritative business writes. |
| One-off WordPress catalog migration tooling | Canonical Excel dry-run/confirm import, taxonomy, variation, inventory and media workflows implemented through the current NestJS/PostgreSQL platform | `scripts/prepare-wordpress-migration.mjs`, `scripts/reconcile-wordpress-with-inventory.mjs` | Retired in the first post-evidence PR-019+ deletion slice. Valid PR #40 RM-09 evidence classified both as unused file candidates; repository/package/tool-manifest searches found no consumer or supported command; Git history shows both entered only in the initial platform-progress commit; both depend on an external migration tree and the reconciliation script contained a developer-local Windows inventory path. They are historical one-off utilities, not supported production/import authority. |
| Storefront published cache | `PublishedCatalogSyncService` with server revision + TTL | Browser `publishedProducts` cache | Retained as a bounded non-authoritative projection, not legacy authority. Expired cache is rejected and local staging data is never merged. |
| Static/mock catalog generator | Runtime uses server-backed published products | `BRIDAL_SAMPLE_PRODUCTS` / fixture generator in `bridal-collection-categories.ts` | Runtime fixtures are disabled. Retained temporarily because the file also owns presentation types/category helpers; later deletion requires consumer migration and tests. |

## RM-09 deletion rules

1. No path is deleted solely because a static-analysis tool labels it unused.
2. Before deletion, search imports/consumers, inspect Git history/runtime registration, and identify the canonical replacement.
3. Protected business workflows are never simplified as cleanup.
4. WordPress/local compatibility must be isolated behind an explicit boundary with an owner and expiry, or removed when proven unused.
5. Each phased deletion PR must keep regression evidence and a rollback plan.
6. Static-analysis output is admissible deletion evidence only when the tool completed successfully enough to produce a structurally valid report over a non-zero project graph.
7. A GitHub Actions workflow-level `success` is not sufficient evidence when an analyzer job or step is configured with `continue-on-error`; the analyzer step/job result and uploaded artifact must be inspected.

## PR-018 scope decision

PR-018 / GitHub PR #38 is intentionally the first narrow deletion slice: remove the dormant direct WordPress product API path and its dormant NgRx effect registration. It does **not** remove product store reducers/selectors, static catalog presentation helpers, documentation archives, assets, dependencies, or any protected workflow. Those require independent usage proof in later RM-09 slices.

## PR-019 evidence outcome

PR-019 / GitHub PR #39 introduced a dedicated RM-09 static-analysis workflow after the older generic static report was shown to be invalid. Post-merge inspection of the actual PR-019 job and artifact found that the correction was still incomplete:

- `Dependency graph evidence` failed because dependency-cruiser still analyzed zero modules.
- The job carried `continue-on-error`, so the workflow could be surfaced as successful even though the analyzer job conclusion was failure.
- Knip and jscpd steps were skipped after the dependency step failed, so PR-019 produced no valid dead-code or duplication evidence.

Therefore **PR-019 is not deletion evidence**. No additional legacy path may be removed based on that run.

## Corrective evidence result

GitHub PR #40 corrected the RM-09 evidence workflow and produced the first admissible post-baseline analyzer set:

- dependency-cruiser analyzed a non-zero TypeScript graph (739 modules / 1428 dependencies) with zero configured rule errors;
- Knip produced structurally valid JSON with findings across 270 files;
- jscpd produced valid duplication JSON (67 clones / 703 duplicated lines, about 1.13%);
- analyzer health is blocking inside the dedicated evidence workflow; ordinary findings remain reportable debt rather than being confused with analyzer crashes.

Static findings still do not authorize deletion by themselves. Each post-PR-019+ removal requires candidate-specific consumer/import/package/runtime-history inspection and a canonical replacement/retirement decision.

## First evidence-backed removal slice

The first candidate selected from the valid PR #40 evidence is the historical WordPress catalog-migration tool pair:

- `scripts/prepare-wordpress-migration.mjs`
- `scripts/reconcile-wordpress-with-inventory.mjs`

Candidate-specific evidence before deletion:

- both appear as unused-file candidates in the valid Knip report;
- exact-name repository searches find no consumers;
- root `package.json` exposes no command for either script;
- the canonical operational tool manifest lists no supported WordPress migration command;
- each file has only the same initial `Publish current gallery platform progress` history entry and no subsequent maintained lifecycle;
- both operate on an external `gallery-mazhari-migration` directory rather than repository runtime state;
- `reconcile-wordpress-with-inventory.mjs` includes a developer-local `C:/Users/...` inventory-file default, confirming it is not a portable operational contract;
- the protected/current Excel import, dry-run/confirm, variation, taxonomy, inventory and media workflows remain implemented in the NestJS/PostgreSQL platform and are not altered by retiring these one-off utilities.

Rollback is a focused PR revert restoring the two scripts. No database, media, inventory or production data rollback is required.
