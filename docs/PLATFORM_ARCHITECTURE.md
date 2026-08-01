# Gallery Mazhari — Intelligent Product Platform Architecture

## Current system (integration spine)

| Layer | Technology |
|-------|------------|
| Storefront + Admin | Angular 18 (standalone, RTL, NgRx + signals) |
| API | NestJS 11 + Express, global prefix `/api` |
| ORM | TypeORM (`synchronize: true`) |
| DB | SQLite (dev) / Postgres (prod) via `DB_TYPE` |
| Legacy | WordPress/WooCommerce REST (catalog/CRM stubs) |

**Do not rewrite.** Extend Nest `products` + admin import/staging/manager flows.

## Target modules (Nest)

```
backend/src/platform/
  common/          text normalize, hashing, security helpers
  import/          Excel parse, mapping, dry-run, variations, inventory sync
  media/           ZIP/bulk upload, filename match, QC, derivatives (WebP/AVIF)
  taxonomy/        controlled attributes + internal hidden tags
  rules/           no-code merchandising rule engine + similarity scoring
  merchandising/   recommendations, collections, psychology widgets
  seo/             auto slug / meta / OG / JSON-LD
  jobs/            DB-backed background job queue
  audit/           immutable audit trail + import rollback snapshots
```

Full design: `docs/INTELLIGENT_INGESTION_ARCHITECTURE.md`.

## Product workflow (unpublished by default)

```
Imported → Validation Passed → Enrichment Pending → Media Pending
  → Ready for Review → Approved → Published
```

Legacy statuses map as:

| Legacy | Platform |
|--------|----------|
| `waiting_photo` | `media_pending` / draft |
| `ready_for_approval` | `ready_for_approval` |
| `published` | `published` |
| `rejected` | `rejected` |

New imports **never** auto-publish.

## Idempotency

- Import keyed by `(importFingerprint, productCode)` and natural keys `code` / `barcode`
- Re-running the same valid file updates in place; no duplicate products/variations/images
- Image match uses exact parsed product code + content hash

## Conflict / safety order (recommendations)

1. Safety & legal exclusions  
2. Publication status  
3. Inventory exclusions  
4. Manual exclusions  
5. Curated rules  
6. High-priority business rules  
7. Compatibility rules  
8. Behavioral ranking  
9. Fallback (or hide widget)

## Admin UI entry points

| Route | Purpose |
|-------|---------|
| `/admin/import` | Excel dry-run + commit (extended) |
| `/admin/platform` | Hub: jobs, media orphans, tags, rules, looks |
| `/admin/staging` | Photos / draft queue (existing) |
| `/admin/manager` | Approval / publish (existing) |

## Background jobs

DB table `platform_jobs` with chunked processing (no Redis required).  
Supports progress, retry, cancel, dead-letter.

## Security

JWT + `@Roles(ADMIN)` on all platform admin endpoints.  
ZIP path traversal / zip-bomb guards.  
Excel formula-injection sanitization on export.  
MIME + size validation for uploads.
