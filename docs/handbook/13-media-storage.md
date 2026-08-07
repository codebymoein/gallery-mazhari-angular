# 13 — Media & Storage

Current platform media logic includes media assets, code-based filename matching, duplicate hashing, derivative generation with Sharp, orphan/quarantine states, and product attachment.

## Rules
- Original upload and derived asset identity/ownership must remain traceable to product/media records.
- File paths/URLs are references; PostgreSQL stores authoritative metadata/workflow state. Filesystem/object storage is not a substitute database.
- Validate type/size/archive safety before processing. Server controls destination paths and filenames.
- Preserve orphan and quarantine queues; unmatched files are not silently discarded or attached by guesswork.
- Derivatives are reproducible outputs. A derivative failure must not falsely mark the original workflow complete.
- Deleting a product must not blindly delete shared/referenced media; deletion needs reference and retention checks.

## Storage evolution
Moving from local uploads to S3-compatible/object storage/CDN requires an adapter/migration plan, stable public URL strategy, checksum verification, backfill/reconciliation, and rollback. Do not embed provider credentials in Angular.

See [`../../MEDIA_DEPLOYMENT.md`](../../MEDIA_DEPLOYMENT.md) and [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md).
