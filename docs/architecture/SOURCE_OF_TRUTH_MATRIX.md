# Source-of-Truth Matrix

| Capability / data | Authoritative source | Write boundary | Client responsibility |
|---|---|---|---|
| Product and variation records | PostgreSQL | NestJS | Render/edit through API |
| Inventory and stock lifecycle | PostgreSQL + audit records | NestJS | Display and request operations |
| Import batch/dry-run/confirm state | PostgreSQL | NestJS import services | Upload, preview, confirm |
| Taxonomy | PostgreSQL | NestJS | Query/select |
| SEO enrichment | PostgreSQL | NestJS | Edit through API |
| Merchandising/publication state | PostgreSQL | NestJS | Present controls |
| Media queue/orphan/quarantine metadata | PostgreSQL | NestJS media services | Upload/status UI |
| Authentication/session authority | Server-side validated session/token state | NestJS auth boundary | Hold only client credentials/session hints required by approved auth design |
| Authorization/permissions | Server-side policy/role data | NestJS guards/services | UX hints only; never authorization authority |
| Audit trail | PostgreSQL | NestJS | Read-only presentation |
| UI preferences | Browser storage permitted | Angular | Non-authoritative only |
| Cache | Browser/runtime cache permitted | Angular/API cache layer | Must be disposable and recoverable from authoritative API |
| Legacy WordPress/WooCommerce integration | External integration source as explicitly mapped | NestJS adapter | Never direct authoritative writes from Angular |

## Rule

When two sources disagree, the authoritative source in this table wins. Any exception requires an ADR and explicit migration/rollback plan.