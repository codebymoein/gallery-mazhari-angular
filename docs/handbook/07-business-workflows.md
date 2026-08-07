# 07 — Business Workflows

These workflows encode Gallery Mazhari operations and MUST be preserved unless a business-approved PR explicitly changes them.

## Product ingestion lifecycle
The designed path is: Excel upload → mapping/fingerprint → dry-run → validation gate → human confirmation → background commit/upsert → inventory audit/enrichment → media/review states → publication eligibility. Dry-run MUST NOT mutate authoritative product state; blocking errors MUST prevent commit. Re-upload/retry must be duplicate-safe and stale inventory conflicts must not silently overwrite newer stock.

## Products and variations
The existing product spine remains authoritative. Parent/variation detection, code/barcode/SKU identity, category/taxonomy, stock and media relationships must survive imports. Uncertain variation classification requires review rather than forced simplification.

## Photo/media queue
Filename/code matching, orphan handling, quarantine, derivative generation, featured/gallery ordering, and products-without-images review are intentional. Missing/unmatched media must remain visible in a queue/state; do not silently discard or auto-publish around the gate.

## Staging / publish queue
Draft, media-pending, review/pending and published concepts are deliberate workflow states. Publication is an explicit transition and must validate required business/media/SEO conditions defined by current rules. Bulk actions need the same invariants as single-item actions.

## Stock lifecycle
Stock is business-critical. Imports and operational changes must preserve latest-known inventory semantics, record deltas/audit evidence, prevent negative/invalid values unless a documented domain rule allows them, and avoid stale-file overwrite.

## Other protected workflows
Orders/payment transitions, consultations, custom requests, notification delivery, taxonomy/tag approval, merchandising/collections, SEO enrichment, and admin permissions must retain their state/audit semantics.

Canonical ingestion detail: [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md). Inventory-specific rules: [`../DAILY_INVENTORY_RULES.md`](../DAILY_INVENTORY_RULES.md).

## Change gate
Any workflow semantic change MUST include before/after state diagram or transition table, business rationale/approval, migration/data impact, rejection-path tests, audit impact, and rollback/forward recovery.
