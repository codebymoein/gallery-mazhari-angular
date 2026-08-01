# Gallery Mazhari Intelligent Product Platform — Administrator Guide

## Operator happy path (2 actions)

1. **Upload Excel** → Admin → **پلتفرم هوشمند** → Dry Run → review report → Confirm import  
2. **Upload image package** → Media tab → multi-file or ZIP named by product code  

Imported products stay **Draft / Pending Review** until an authorized admin approves (and optionally publishes).

## Excel Dry Run

- Validates headers (FA/EN), duplicates, prices, inventory, categories, parent/child grouping  
- Shows new / updated / unchanged / variations / review rows  
- **Commits nothing** until Confirm  
- Re-running the same file is **idempotent** (fingerprint)

### Suggested columns

| Field | Example headers |
|-------|-----------------|
| Product code | کد کالا, SKU, code |
| Parent code | کد مادر, parent code |
| Barcode | بارکد, barcode |
| Name | نام کالا |
| Category | طبقه / زیردسته |
| Inventory | موجودی, stock |
| Size / Color | سایز, رنگ |
| Price | قیمت |

Save mapping as e.g. **Gallery Mazhari Accounting Export V1**.

## Image naming

- `13700189.jpg` → primary  
- `13700189-2.jpg` / `13700189_2.jpg` → gallery #2  
- Exact product-code match only (no prefix guessing)  
- Unknown products → **Orphan queue**  
- Duplicates / corrupt / unsafe ZIP paths → **Quarantine** (not auto-deleted)

## Workflow states

`draft` → `pending_*_review` / `enrichment_pending` / `media_pending` → `approved` → `published`  
Also supports legacy: `waiting_photo`, `ready_for_approval`, `rejected`, `archived`

## Rule Engine

IF conditions (category, style, inventory, tags, …) THEN actions (boost, exclude, recommend category, stop, …).  
Use **Simulator** with a product code to see matched rules and explainable scores.  
Out-of-stock and unpublished products are never recommended.

## Rollback

Platform → Import history → Rollback restores previous product values and detaches variations created by that import ID.

## Security

All `/api/platform/*` admin routes require JWT + `admin` role.  
Public recommendations: `GET /api/platform/public/recommendations/:productCode`
