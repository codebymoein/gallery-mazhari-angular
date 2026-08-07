# 13 — Media & Storage

Current platform media logic includes media assets, code-based filename matching, duplicate hashing, derivative generation with Sharp, orphan/quarantine states, and product attachment.

## Rules
- Original upload and derived asset identity/ownership must remain traceable to product/media records.
- File paths/URLs are references; PostgreSQL stores authoritative metadata/workflow state. Filesystem/object storage is not a substitute database.
- Validate type/size/archive safety before processing. Server controls destination paths and filenames.
- Preserve orphan and quarantine queues; unmatched files are not silently discarded or attached by guesswork.
- Derivatives are reproducible outputs. A derivative failure must not falsely mark the original workflow complete.
- Deleting a product must not blindly delete shared/referenced media; deletion needs reference and retention checks.

## Storage authority and visibility

`MediaStorageService` is the binary-storage boundary for platform media originals. Production MUST use the S3-compatible driver; local storage is development/test compatibility only.

- Object identity is content-addressed from the full SHA-256 hash. Public and private namespaces are distinct: `public/<prefix>/<hash>.<ext>` and `private/<prefix>/<hash>.<ext>`.
- Public product originals may have CDN/public URLs. Immutable public objects use long-lived immutable caching because the key changes when content changes.
- Quarantine/private objects MUST NOT receive a public HTTP URL or be written below a publicly served upload path.
- A provider write failure is a media-ingest failure; the application MUST NOT record a successful public attachment when durable binary storage failed.
- Existing product/media workflow state, duplicate detection, orphan handling, sequence-conflict quarantine and publication rules remain authoritative in NestJS/PostgreSQL.
- Object Storage credentials are backend secrets and MUST NOT be shipped to Angular.

PR-012 establishes the Object Storage/public-private/content-addressed foundation. The existing local Sharp derivative path remains compatibility behavior only when a local original path exists. Secure processing, metadata stripping/scanning, durable Object Storage derivatives and full media reconciliation are intentionally deferred to PR-013.

## Storage evolution
Moving from local uploads to S3-compatible/object storage/CDN requires an adapter/migration plan, stable public URL strategy, checksum verification, backfill/reconciliation, and rollback. No PR may delete legacy local originals merely because the new adapter exists; backfill/reconciliation evidence and recovery come first.

See [`../../MEDIA_DEPLOYMENT.md`](../../MEDIA_DEPLOYMENT.md), [`../operations/ENVIRONMENT.md`](../operations/ENVIRONMENT.md) and [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md).
