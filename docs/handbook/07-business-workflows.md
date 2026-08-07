# 07 — Business Workflows

These workflows encode Gallery Mazhari operations and MUST be preserved unless a business-approved PR explicitly changes them.

## Product ingestion lifecycle
The designed path is: Excel upload → mapping/fingerprint → dry-run → validation gate → human confirmation → background commit/upsert → inventory audit/enrichment → media/review states → publication eligibility. Dry-run MUST NOT mutate authoritative product state; blocking errors MUST prevent commit. Re-upload/retry must be duplicate-safe and stale inventory conflicts must not silently overwrite newer stock.

## Products and variations
The existing product spine remains authoritative. Parent/variation detection, code/barcode/SKU identity, category/taxonomy, stock and media relationships must survive imports. Uncertain variation classification requires review rather than forced simplification.

## Canonical taxonomy and classification
`backend/src/products/catalog-taxonomy.ts` is the server-side classification authority for admin catalog assignment. A catalog mutation MUST supply a canonical parent/category slug pair and its matching labels; mismatched or unknown relationships are rejected before product mutation. `src/app/shared/data/catalog-categories.ts` is the Angular presentation projection and CI regression coverage MUST keep its hierarchy synchronized with the server contract. Excel may provide provisional classification for newly ingested rows, but subsequent inventory files MUST NOT overwrite an administrator's established catalog assignment.

## Photo/media queue
Filename/code matching, orphan handling, quarantine, derivative generation, featured/gallery ordering, and products-without-images review are intentional. Missing/unmatched media must remain visible in a queue/state; do not silently discard or auto-publish around the gate.

## Staging / publish queue
Draft, media-pending, review/pending and published concepts are deliberate workflow states. Publication is an explicit transition and must validate required business/media/SEO conditions defined by current rules. Bulk actions need the same invariants as single-item actions.

Product transition authority lives in `backend/src/products/product-workflow.policy.ts`. Manual status override may advance `waiting_photo → ready_for_approval`, return `ready_for_approval → waiting_photo`, or move eligible states to `rejected`. A rejected product may only restore to its recorded `trashedFromStatus`. `published` requires the dedicated publish command and its publication guards; `awaiting_stock` is inventory-managed and cannot be forced through generic status override. Platform review transitions MUST use the same policy and validate a bulk batch before the first workflow write.

## Stock lifecycle
Stock is business-critical. Imports and operational changes must preserve latest-known inventory semantics, record deltas/audit evidence, prevent negative/invalid values unless a documented domain rule allows them, and avoid stale-file overwrite. A known product reaching zero stock moves to `awaiting_stock` with its resumable prior state recorded; a later positive inventory import restores that state. Rejected products remain outside routine Excel mutation.

The admin inventory view MUST NOT persist business state to browser storage or report a local mutation as durable. Base stock and inventory pricing remain controlled by the Excel inventory workflow. Supported inventory bulk promotion uses the authenticated server-side discount command and durable `DiscountRule` records; unsupported local-only `onSale` flags and manual stock-zero overrides are not business commands. API failure must leave the authoritative state unchanged and be surfaced to the operator.

## Other protected workflows
Orders/payment transitions, consultations, custom requests, notification delivery, taxonomy/tag approval, merchandising/collections, SEO enrichment, and admin permissions must retain their state/audit semantics.

Canonical ingestion detail: [`../INTELLIGENT_INGESTION_ARCHITECTURE.md`](../INTELLIGENT_INGESTION_ARCHITECTURE.md). Inventory-specific rules: [`../DAILY_INVENTORY_RULES.md`](../DAILY_INVENTORY_RULES.md).

## Change gate
Any workflow semantic change MUST include before/after state diagram or transition table, business rationale/approval, migration/data impact, rejection-path tests, audit impact, and rollback/forward recovery.
