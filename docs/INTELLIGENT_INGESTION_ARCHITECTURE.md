# Gallery Mazhari — Intelligent Product Ingestion, Enrichment & Merchandising

**Operator contract:** upload Excel + product image ZIP. Everything else is automatic, validated, auditable, and unpublished until approved.

This document is the system design for Parts 1–12. Implementation lives under `backend/src/platform/` and `src/app/features/admin/platform-hub/`.

---

## 1. System overview

```
┌─────────────┐   ZIP    ┌──────────────────┐
│  Operator   │─────────▶│  Media Match     │──▶ orphan / attach / quarantine
└──────┬──────┘          │  + Derivatives   │
       │ Excel           └──────────────────┘
       ▼
┌──────────────────┐     ┌──────────────────┐
│ Excel Import     │────▶│ Dry-Run Report   │──▶ BLOCK if errors
│ Parser+Mapper    │     │ Validation Gate  │
└────────┬─────────┘     └────────┬─────────┘
         │ confirm                │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│ Commit Job       │────▶│ Products + Vars  │
│ (chunked, DB Q)  │     │ Inventory Audit  │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ├─▶ Hidden Tag Engine    │
         ├─▶ SEO Generator        │
         ├─▶ Collection Engine    │
         └─▶ Workflow (draft→…)   │
                                  ▼
                    ┌─────────────────────────┐
                    │ Similarity + Rules      │
                    │ Psychology Widgets      │
                    │ Public Recommendations  │
                    └─────────────────────────┘
```

**Spine rule:** extend Nest `products` + platform module. Do not create a second product system.

---

## 2. Database schema (logical)

| Table | Purpose | Keys / indexes |
|-------|---------|----------------|
| `staging_products` | Catalog spine (simple/variable/variation) | unique `code`; idx `barcode`, `status`, `parentCode`, `category`, `collection` |
| `platform_product_variations` | Variation SKU/barcode/stock/attrs | unique `sku`, unique `barcode`; idx `parentCode` |
| `platform_import_runs` | Dry-run + commit + rollback snapshot | idx `fingerprint`, `status` |
| `platform_mapping_templates` | Header fingerprint → column map | unique `headerFingerprint` |
| `platform_media_assets` | Image assets + derivatives JSON | idx `productCode`, `contentHash`, `status` |
| `platform_inventory_audits` | Stock delta trail | idx `productCode`, `importId` |
| `platform_taxonomy_tags` | Controlled hidden taxonomy | unique `canonicalValue`; `publicDisplay=false` default |
| `platform_product_tags` | Product↔tag with confidence/evidence | idx `productId`, `tagValue`, `approvalState` |
| `platform_attribute_values` | Size/color/material/… axes | unique `(axis, canonicalValue)` |
| `platform_merch_rules` | Explainable merchandising rules | idx `priority`, `enabled` |
| `platform_curated_looks` | Manual + auto collections | idx `status` |
| `platform_reco_events` | Widget analytics | idx `eventType`, `createdAt` |
| `platform_jobs` | Background queue | idx `status`, `type` |
| `platform_audit_logs` | Immutable audit | idx `action`, `entityType`, `importId` |

**Product `seo` JSON shape:**

```json
{
  "slug": "13700189-european-bridal-dress",
  "metaTitle": "…",
  "metaDescription": "…",
  "canonical": "https://gallery-mazhari.ir/product/13700189",
  "altTexts": { "primary": "…" },
  "openGraph": { "title": "…", "description": "…", "image": "…" },
  "jsonLd": { "@type": "Product", … }
}
```

**Media `derivatives` JSON shape:**

```json
{
  "thumb.webp": "/uploads/…",
  "medium.webp": "/uploads/…",
  "large.webp": "/uploads/…",
  "retina.webp": "/uploads/…",
  "thumb.avif": "/uploads/…",
  "medium.avif": "/uploads/…",
  "large.avif": "/uploads/…",
  "original": "/uploads/…"
}
```

---

## 3. Part 1 — Intelligent Excel Import Engine

### Data flow

1. Upload Excel → `parseExcelBuffer` (SheetJS)
2. Header fingerprint → saved mapping template or auto `suggestColumnMapping` (FA/EN aliases)
3. `runExcelDryRun` validates every row **without writing products**
4. Persist report on `platform_import_runs`
5. Admin reviews report
6. `confirm` only if **no blocking errors** (`canCommit=true`)
7. Background job `import.commit` upserts products/variations, tags, SEO, inventory audits

### Auto-detections

| Detection | Mechanism |
|-----------|-----------|
| Categories | Mapped category/subcategory; unknown → `review` |
| Parent products | `parentCode` column + variation detector |
| Variations | Distinct size/color/barcode axes |
| Duplicate SKUs | In-file code frequency + unique DB constraint |
| Duplicate barcodes | In-file + cross-product conflict |
| Inventory | Numeric parse; stale-file conflict vs `inventoryUpdatedAt` |
| Status | Never auto-publish; set `draft` / `media_pending` / `pending_*` |
| Missing fields | code, name, stock required; price/category warnings |
| Invalid values | Negative stock, non-numeric price |

### Validation gate

```
blockingErrors = issues where severity === 'error'
canCommit = blockingErrors.length === 0 && mappingConfidence OK
confirmImport → 400 import_blocked_validation if !canCommit
```

---

## 4. Part 2 — Smart Variable Product Detection

### Algorithm (`variation-detector.ts`)

1. Group rows by `parentCode` (normalized, leading zeros preserved)
2. If no parent → `simple`
3. Inspect child axes: size, color, material; unique barcodes required
4. Classify:
   - `size_variations` / `color_variations` / `size_color_variations` when axes diverge
   - `uncertain` + `requiresReview` when evidence weak (single child, unclear axes, dup barcodes)
5. Commit creates:
   - Parent `productType=variable`
   - Child rows as `platform_product_variations` (SKU, barcode, attrs, stock, photos)
   - Parent stock = 0 (aggregate from variations)

**Never force variable** without confidence ≥ 0.75.

Future axes (heel height, length, pattern) map through `platform_attribute_values` + Excel column aliases.

---

## 5. Part 3 — Image Auto-Match Engine

### Filename contract

```
{productCode}.jpg          → featured (primary)
{productCode}-2.jpg        → gallery sequence 2
{productCode}_3.webp       → gallery sequence 3
```

### Flow

1. ZIP extract with path-traversal + zip-bomb guards
2. MIME allowlist + size bounds
3. SHA-256 exact duplicate → quarantine
4. Parse code → attach if product exists, else **orphan (pending queue)**
5. First/base image = featured; remainder = gallery
6. Generate derivatives (WebP/AVIF × thumb/medium/large/retina)
7. Upload report: attached / orphans / quarantined / products_without_images

---

## 6. Part 4 — Smart Hidden Tag Engine

- Tags stored in `platform_product_tags` with `publicDisplay=false` on taxonomy
- Never exposed on storefront product pages as chips
- Every suggestion carries `confidence` + `evidence[]` + `ruleOrModel`
- Thresholds: ≥0.85 auto-approve internal; 0.6–0.85 pending; else suggested
- Synonym collapse via aliases (`European` / `اروپایی` → `European Style`)

Canonical families include: style, mood, ceremony, color, fabric, silhouette, accessory compatibility, price/luxury tier, season, collection, brand family.

---

## 7. Part 5 — Smart Relationship Engine

### Similarity score (weighted)

```
score =
  0.28 * tagJaccard(source, candidate) +
  0.18 * styleMatch +
  0.14 * colorFamilyMatch +
  0.16 * complementaryCategory +
  0.08 * ceremonyMatch +
  0.08 * priceAffinity +
  0.08 * inventoryHealth +
  curatedBoost + weakBehavioral(≤0.3)
```

**Hard exclusions (conflict order):** safety → unpublished → OOS → manual exclude → curated → rules → compatibility → behavioral → fallback.

Complementary map: bridal dress ↔ shoes, tiara, veil, jewelry, gloves, bouquet, accessories.

Future AI: replace/augment `tagJaccard` with embedding cosine; keep exclusion order and explainability.

---

## 8. Part 6 — Smart Collection Engine

Auto-collections from tag clusters:

| Collection | Seed tags |
|------------|-----------|
| Garden Wedding | Garden, Outdoor Wedding |
| Luxury Classic | Luxury, Classic |
| Minimal Ceremony | Minimal, Formal |
| Royal Collection | Princess, Luxury, Formal |
| European Collection | European Style |
| Arabic Collection | Arabic Style |

Operator can also create/edit `platform_curated_looks` manually. Auto looks stay `draft` until approved.

---

## 9. Part 7 — Selling Psychology Widgets

Widget keys (copy only; scoring shared):

| Key | Persian / EN label |
|-----|-------------------|
| `complete_your_bridal_look` | تکمیل استایل عروس شما |
| `customers_also_completed` | مشتریان نیز استایل خود را با این‌ها کامل کردند |
| `perfect_match` | هماهنگی کامل |
| `mazhari_stylist` | پیشنهاد استایلیست مظهری |
| `frequently_chosen_together` | اغلب با هم انتخاب می‌شوند |
| `recommended_for_your_style` | پیشنهادی برای سبک شما |
| `luxury_combination` | ترکیب لوکس |

**Urgency:** show low-stock hint only when `0 < available ≤ lowStockThreshold` from real inventory. Never fake scarcity or fake “X people viewing”.

---

## 10. Part 8 — SEO Auto-Generation

On import commit / enrichment:

- Slug from code + transliterated name keywords
- Meta title / description (FA bridal tone, length-bounded)
- Canonical URL
- Image alt texts
- Open Graph + Twitter
- JSON-LD `Product` (+ `Offer` when price/stock known)

Applied to `product.seo` JSON; storefront `SeoService` consumes for PDP.

---

## 11. Part 9 — Image Optimization

Sharp pipeline (best-effort; originals always kept):

| Variant | Max edge | Formats |
|---------|----------|---------|
| thumb | 320 | webp, avif |
| medium | 800 | webp, avif |
| large | 1600 | webp, avif |
| retina | 2400 | webp |

Storefront: `srcset` + lazy loading; serve AVIF/WebP with original fallback.

---

## 12. Part 10 — Admin Experience

`/admin/platform` hub tabs:

- Import History + Validation Report + Skipped / Duplicates / Errors
- Media: Pending (orphans), Quarantine, Products without images
- Workflow queue
- Tags / Rules / Looks / Jobs / Audit
- Inventory summary (SKUs, stock units, OOS, low stock, media coverage)

---

## 13. Part 11 — Safety

| Control | Behavior |
|---------|----------|
| Dry Run | Default; no writes except report row |
| Validation gate | Blocks confirm on errors |
| Rollback | Restore product fields from import change-set |
| Versioning | Rule versions; import fingerprints |
| Logs / Audit | `platform_audit_logs` immutable append |
| Undo | Rollback endpoint + job cancel |

---

## 14. Part 12 — Performance (13k → 100k+)

- Indexed natural keys (`code`, `barcode`, `status`, `parentCode`, tags)
- Import commit: batch progress every 25 rows; avoid loading full catalog per row where possible
- Recommendations: load published+in-stock candidates with tag join (not N+1 per candidate)
- Media derivatives async-capable via jobs
- Pagination on admin lists (`take` limits)
- Postgres for prod; SQLite for local
- Future: Redis job queue, CDN for derivatives, embedding index for AI similarity

### N+1 avoidance rules

- Prefer `In(codes)` / join queries for tags when scoring
- Cache taxonomy aliases in memory per request
- Recommendation catalog: single `find` + one tag query grouped by `productId`

---

## 15. API design (summary)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/platform/import/dry-run` | Admin | Validate Excel |
| POST | `/api/platform/import/:id/confirm` | Admin | Commit if gate passes |
| POST | `/api/platform/import/:id/rollback` | Admin | Undo |
| GET | `/api/platform/import/runs` | Admin | History |
| POST | `/api/platform/media/upload-zip` | Admin | Bulk images |
| GET | `/api/platform/media/report` | Admin | Full media health |
| GET | `/api/platform/media/missing` | Admin | Products without images |
| GET | `/api/platform/inventory/summary` | Admin | Inventory KPIs |
| POST | `/api/platform/collections/auto-generate` | Admin | Seed curated looks |
| GET | `/api/platform/public/recommendations/:code` | Public | Widget data |

Full table: `docs/PLATFORM_API.md`.

---

## 16. Security

- JWT + `ADMIN` on mutating platform routes
- MIME/size validation; ZIP traversal & bomb limits
- Excel formula-injection sanitization on text normalize
- Hidden tags never marked `publicDisplay`
- No auto-publish from import
- Uploads outside web root policy via controlled `/uploads` static serve

---

## 17. Future AI integration

| Capability | Hook |
|------------|------|
| Vision style/color | Replace keyword tag rules with model suggestions (same confidence gate) |
| Embedding similarity | Swap Jaccard for cosine; keep exclusion order |
| OCR from hang tags | Feed Excel missing fields as suggestions, not silent writes |
| Copy generation | SEO/description drafts into enrichment queue |
| Behavioral models | Fill `behavioral` score component only with real event weight ≤ 0.3 until volume proves |

All AI outputs remain explainable suggestions until confidence thresholds pass.
