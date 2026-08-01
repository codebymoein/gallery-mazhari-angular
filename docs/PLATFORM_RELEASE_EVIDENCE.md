# Platform Release Evidence — 2026-07-28 (ingestion hardening)

## Test results (automated)

```
Platform suites: 8 passed
Platform tests:  42 passed
```

Coverage areas (platform):

- Text normalize (Persian/Arabic digits, formula injection, leading zeros)
- Image filename parse + exact code match + primary/gallery roles + conflicts
- Variation detection (size, color, single-child review, duplicate barcodes)
- Excel dry-run (new/updated/unchanged, duplicates, stale inventory, **canCommit gate**)
- Rule engine (OOS/unpublished exclusion, scoring with **tag Jaccard**, conflict detection)
- Tagging (expanded bridal hidden taxonomy, confidence + evidence)
- SEO engine (slug, meta, OG, JSON-LD, no fake ratings)
- Similarity + auto collections + inventory urgency ethics

## Backend build

`npx nest build` — **success** (exit 0) after SEO / Sharp derivatives / merchandising updates.

## Architecture deliverable

`docs/INTELLIGENT_INGESTION_ARCHITECTURE.md` — Parts 1–12 design (schema, flows, algorithms, APIs, safety, performance, AI hooks).

## This session — implemented hardening

| Area | Status |
|------|--------|
| Validation gate (`canCommit` + confirm block) | Done |
| SEO auto-generation on import commit | Done |
| Sharp WebP/AVIF derivatives (soft-fail) | Done |
| Expanded hidden bridal tags | Done |
| Tag Jaccard similarity in scoring | Done |
| Auto collection engine (draft looks) | Done |
| Psychology widgets + real low-stock urgency | Done |
| Media health + missing images + inventory summary | Done |
| Product indexes (status, barcode, parent, category, collection) | Done |
| Admin hub validation report / media KPIs / auto looks | Done |
| PDP SEO + multi psychology widgets | Done |

## Acceptance mapping (summary)

| Criterion | Status |
|-----------|--------|
| Excel Dry Run | Implemented (server) |
| No import before validation passes | **canCommit gate** |
| Idempotent import | Fingerprint + unique code/barcode |
| Parent/variations | Detector + `platform_product_variations` |
| Image exact match / orphan / quarantine / derivatives | Media service |
| No auto-publish | Workflow defaults to draft/review |
| Hidden tags confidence+evidence | Tagging engine + pending queue |
| Similarity + rules + collections | Merchandising + collection engine |
| OOS excluded; urgency only if real low stock | scoreCandidate + inventoryUrgencyLabel |
| Rollback + audit | ImportService.rollback + AuditService |
| Background jobs | DB `platform_jobs` |
| Angular responsive admin | Platform hub |
| Automated platform tests | 42 passed |
| Staging E2E / production staging deploy | **Not executed in this environment** |

## Known limitations

1. Nest roles remain `admin|customer` — staff/manager split still frontend-enforced for some legacy screens.
2. A/B testing tables prepared conceptually via rule `testMode` only — full experiment service deferred.
3. Near-duplicate image perceptual hash not implemented (exact SHA-256 only).
4. Recommendation catalog currently capped at 5000 published/approved for scoring (scale path documented).
5. No Docker/CI in repo yet.
6. Full staging environment regression requires running API + admin login locally.

## Production-readiness verdict

**NO-GO for full production cutover** until staging E2E of Dry Run → Confirm → Media ZIP → Approve → Publish → Rollback is signed off on the real staging stack.

**GO for staged rollout of the platform module to staging** for operator UAT (architecture documented; platform unit tests green; legacy path intact).
