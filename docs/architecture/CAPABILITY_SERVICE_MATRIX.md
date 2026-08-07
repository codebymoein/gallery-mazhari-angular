# Capability / Service Matrix

| Capability | Server owner | Persistence owner | Notes |
|---|---|---|---|
| Authentication and sessions | Auth module/services | PostgreSQL where durable state is required | Fail closed; server validates identity |
| Authorization | Guards/policy/service layer | PostgreSQL/config as designed | Angular checks are UX only |
| Product/variation lifecycle | Product/catalog services | PostgreSQL | Preserve lifecycle/state machine |
| Inventory/stock/audit | Inventory services | PostgreSQL | Server-only authoritative mutations |
| Excel inventory import | Import services | PostgreSQL | Preserve dry-run/confirm semantics |
| Catalog query | Catalog services | PostgreSQL | Cache is disposable |
| Taxonomy/SEO/merchandising | Catalog/admin services | PostgreSQL | Preserve intentional workflows |
| Media upload/queue/quarantine | Media services | PostgreSQL + configured object/file storage | Metadata and authorization remain server controlled |
| Publication/staging | Server publication services | PostgreSQL | Client requests transitions only |
| Legacy platform integration | Explicit adapter layer | External system only for mapped integration facts | No direct Angular business writes |

## Boundary rule

Controllers translate transport concerns; services own business rules; repositories/ORM own persistence access; Angular consumes contracts. New cross-boundary behavior requires tests and an ADR when it changes authority.