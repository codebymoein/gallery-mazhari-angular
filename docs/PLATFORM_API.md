# Platform API Reference

Base: `{backendApiBaseUrl}` = e.g. `http://localhost:3000/api`  
Auth: `Authorization: Bearer <jwt>` unless noted public.

## Import

| Method | Path | Notes |
|--------|------|-------|
| POST | `/platform/import/dry-run` | multipart `file`, optional `mappingJson`, `confirmUncertainMapping`, `sourceTimestamp` |
| POST | `/platform/import/:id/confirm` | body `{ inventoryStrategy?: 'full_replace'\|'incremental' }` → background job. **Blocked** with `import_blocked_validation` when dry-run `canCommit=false` |

| POST | `/platform/import/:id/rollback` | optional `{ productCodes?: string[] }` |
| GET | `/platform/import/runs` | history |
| GET | `/platform/import/runs/:id` | detail + report |
| GET/POST | `/platform/import/templates` | mapping templates |

## Media

| Method | Path |
|--------|------|
| POST | `/platform/media/upload` multipart `files` |
| POST | `/platform/media/upload-zip` multipart `file` |
| GET | `/platform/media/orphans` |
| GET | `/platform/media/quarantine` |
| POST | `/platform/media/reattach-orphans` |
| GET | `/platform/media/report` | attached / orphans / quarantine / missing / derivatives |
| GET | `/platform/media/missing?limit=` | products without images |

## Inventory & Collections

| Method | Path |
|--------|------|
| GET | `/platform/inventory/summary` | SKUs, units, OOS, low stock, media coverage |
| POST | `/platform/collections/auto-generate` | draft curated looks from hidden tags |
| GET | `/platform/widgets` | psychology widget catalog |

## Workflow

| Method | Path |
|--------|------|
| GET | `/platform/workflow/queue?status=` |
| POST | `/platform/workflow/approve` `{ productIds, publish?, scheduleAt? }` |
| POST | `/platform/workflow/reject` `{ productIds, reason }` |
| GET | `/platform/workflow/compare/:id` |

## Merchandising

| Method | Path |
|--------|------|
| GET/POST | `/platform/rules` |
| GET | `/platform/rules/simulate/:productCode` |
| GET | `/platform/recommendations/:productCode` |
| GET | `/platform/public/recommendations/:productCode` (public) |
| POST | `/platform/recommendations/events` |
| GET | `/platform/recommendations/analytics` |
| GET/POST | `/platform/taxonomy`, `/platform/taxonomy/merge` |
| GET | `/platform/tags/pending` |
| POST | `/platform/tags/:id/approve` |
| GET/POST | `/platform/looks` |
| GET/POST | `/platform/attributes` |

## Jobs / Audit

| Method | Path |
|--------|------|
| GET | `/platform/jobs`, `/platform/jobs/:id` |
| POST | `/platform/jobs/:id/cancel` |
| GET | `/platform/audit` |

## Legacy products (unchanged)

`/products/import`, `/products/:id/photos`, `/products/:id/publish`, `/products/published`
