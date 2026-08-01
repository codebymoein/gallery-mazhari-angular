# Deployment, Migration, Rollback

## Migration (DB)

TypeORM `synchronize: true` creates/alters platform tables on boot:

- `platform_jobs`, `platform_audit_logs`, `platform_import_runs`, `platform_mapping_templates`
- `platform_product_variations`, `platform_media_assets`, `platform_inventory_audits`
- `platform_taxonomy_tags`, `platform_product_tags`, `platform_attribute_values`
- `platform_merch_rules`, `platform_curated_looks`, `platform_reco_events`
- Extended columns on `staging_products` (barcode, price, enrichment, workflow fields, …)

**Staging/Prod recommendation:** take a DB backup before first deploy with the new entities. Plan a future cutover to explicit migrations.

## Deploy

```bash
# Backend
cd backend
npm ci
npm run build
# set DB_TYPE=postgres (or sqlite for smoke), FRONTEND_ORIGIN, JWT secrets from .env.example
npm run start:prod

# Frontend
cd ..
npm ci
npm run build:prod
# serve dist/gallery-mazhari-angular behind your web server
```

Env files: `backend/.env` (never commit), root `.env` for WP legacy if needed.

## Rollback application

1. Redeploy previous git revision of frontend + backend  
2. Restore DB backup taken before migrate  
3. Or use **import rollback** API for a single import ID without full DB restore  

## Backup

- Postgres: `pg_dump` before import batches and releases  
- SQLite: copy `backend/data/gallery-mazhari.sqlite`  
- Uploads: backup `backend/uploads/`
