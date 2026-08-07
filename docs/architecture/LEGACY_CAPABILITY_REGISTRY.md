# Legacy Capability / Adapter Registry

Status: **RM-09 active registry**. This document records legacy or compatibility paths only after usage evidence is reviewed. It is not a blanket deletion list.

## Active capability ownership

| Capability | Canonical implementation | Legacy / duplicate path | Evidence and disposition |
| --- | --- | --- | --- |
| Public product catalog | `ProductsApiService` -> NestJS `GET /products/published` -> PostgreSQL; bounded projection via `PublishedCatalogSyncService` | `src/app/core/api/wordpress.service.ts` WooCommerce `/wc/v3` product/category client | Removed in PR-018. Git history shows the client was unchanged since the initial baseline and the only runtime consumer was the equally baseline-only NgRx `ProductEffects`. Current storefront catalog/search reads the server-backed published projection. |
| Product NgRx side effects | Server-backed storefront projection and current feature services | `src/app/core/store/product/product.effects.ts` | Removed in PR-018 after detaching it from root `EffectsModule`. It called only the removed WordPress client. Product reducer/selectors are retained in this slice because their remaining usage/deletion proof is a separate cleanup decision. |
| WordPress/WooCommerce integration authority | NestJS/PostgreSQL are authoritative; any future external integration must be an explicit backend adapter | Direct Angular WooCommerce business API calls | Forbidden for new code. Reintroduction requires an explicit adapter contract, owner, expiry/migration plan, and tests; Angular must not regain authoritative business writes. |
| Storefront published cache | `PublishedCatalogSyncService` with server revision + TTL | Browser `publishedProducts` cache | Retained as a bounded non-authoritative projection, not legacy authority. Expired cache is rejected and local staging data is never merged. |
| Static/mock catalog generator | Runtime uses server-backed published products | `BRIDAL_SAMPLE_PRODUCTS` / fixture generator in `bridal-collection-categories.ts` | Runtime fixtures are disabled. Retained temporarily because the file also owns presentation types/category helpers; later deletion requires consumer migration and tests. |

## RM-09 deletion rules

1. No path is deleted solely because a static-analysis tool labels it unused.
2. Before deletion, search imports/consumers, inspect Git history/runtime registration, and identify the canonical replacement.
3. Protected business workflows are never simplified as cleanup.
4. WordPress/local compatibility must be isolated behind an explicit boundary with an owner and expiry, or removed when proven unused.
5. Each phased deletion PR must keep regression evidence and a rollback plan.

## PR-018 scope decision

PR-018 is intentionally the first narrow deletion slice: remove the dormant direct WordPress product API path and its dormant NgRx effect registration. It does **not** remove product store reducers/selectors, static catalog presentation helpers, documentation archives, assets, dependencies, or any protected workflow. Those require independent usage proof in later RM-09 slices.
