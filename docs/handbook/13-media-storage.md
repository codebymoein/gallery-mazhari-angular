# 13 — Media & Storage

Current platform media logic includes media assets, code-based filename matching, duplicate hashing, secure image sanitization, derivative generation with Sharp, orphan/quarantine states, product attachment and storage reconciliation.

## Rules
- Original upload and derived asset identity/ownership must remain traceable to product/media records.
- File paths/URLs are references; PostgreSQL stores authoritative metadata/workflow state. Filesystem/object storage is not a substitute database.
- Validate type/size/archive safety before processing. Server controls destination paths and filenames.
- Preserve orphan and quarantine queues; unmatched files are not silently discarded or attached by guesswork.
- Derivatives are reproducible outputs. A derivative failure must not falsely mark the original workflow complete.
- Deleting a product must not blindly delete shared/referenced media; deletion needs reference and retention checks.

## Storage authority and visibility

`MediaStorageService` is the binary-storage boundary for platform media originals and derivatives. Production MUST use the S3-compatible driver; local storage is development/test compatibility only.

- Object identity is content-addressed from the full SHA-256 hash. Public and private namespaces are distinct: `public/<prefix>/<hash>.<ext>` and `private/<prefix>/<hash>.<ext>`.
- Public product originals/derivatives may have CDN/public URLs. Immutable public objects use long-lived immutable caching because the key changes when content changes.
- Quarantine/private objects MUST NOT receive a public HTTP URL or be written below a publicly served upload path.
- A provider write failure is a media-ingest failure; the application MUST NOT record a successful public attachment when durable binary storage failed.
- Existing product/media workflow state, duplicate detection, orphan handling, sequence-conflict quarantine and publication rules remain authoritative in NestJS/PostgreSQL.
- Object Storage credentials are backend secrets and MUST NOT be shipped to Angular.

## Secure processing

Production media ingest MUST pass the server-owned pipeline before attachment:

`signature/size validation → malware scan → image decode/dimension validation → metadata stripping/re-encode → dedupe → storage → derivative storage → attach`

- Production requires `MEDIA_MALWARE_SCAN_MODE=http` and `MEDIA_MALWARE_SCAN_URL`; scanner outage, timeout, malformed response or malware result fails closed into quarantine rather than public attachment.
- Sharp decode is authoritative for accepted image structure. Images over `12000×12000` or 80 million pixels are rejected.
- Public bytes are re-encoded without EXIF/IPTC/XMP/ICC metadata.
- Responsive derivatives are generated as content-addressed WebP/AVIF buffers and persisted through `MediaStorageService`.
- Derivative generation/storage failure leaves the item unsuccessful/quarantined; it may not be represented as fully processed.

## Reconciliation

`GET /platform/media/reconciliation` is protected by authentication/roles and the `media.manage` permission. It is read-only and reports:

- missing original storage keys;
- missing derivative storage keys;
- attached media records with missing product references;
- product photos without corresponding media assets;
- legacy/non-content-addressed references;
- provider errors encountered during existence checks.

The report does not authorize deletion, backfill or mutation. Legacy local originals remain until a later approved migration/recovery slice proves safe removal.

## Storage evolution
Moving from local uploads to S3-compatible/object storage/CDN requires an adapter/migration plan, stable public URL strategy, checksum verification, backfill/reconciliation, and rollback. No PR may delete legacy local originals merely because the new adapter exists; backfill/reconciliation evidence and recovery come first.

See [`../../MEDIA_DEPLOYMENT.md`](../../MEDIA_DEPLOYMENT.md), [`../operations/ENVIRONMENT.md`](../operations/ENVIRONMENT.md) and [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md).
