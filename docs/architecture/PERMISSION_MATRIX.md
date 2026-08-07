# Permission Matrix

Status: canonical security contract for Wave 1 / PR-006.

Authentication establishes a live server-side principal. Authorization for protected business mutations is evaluated by NestJS from that live principal on every request. Browser-provided actor names are never authoritative.

## Roles

- `admin`: administrative superuser. The permission guard permits all granular permissions, while role guards still protect admin-only account-management routes.
- `staff`: least-privileged operator. A staff account must hold every permission required by the endpoint.
- `customer`: never authorized for admin/platform mutation routes.

## Granular permissions

| Permission | Capability |
| --- | --- |
| `inventory.import.manage` | Excel dry-run, confirm, mapping templates, legacy import command |
| `inventory.restore.manage` | Import rollback and product restore |
| `publishing.queue.manage` | Queue approval/rejection, publish and status transitions |
| `publishing.published.manage` | Unpublish an already published product |
| `catalog.manage` | Product catalog/category edits |
| `media.manage` | Product photo changes, controlled uploads, orphan reattachment |
| `taxonomy.manage` | Taxonomy/tag/attribute mutations |
| `merchandising.manage` | Collections, rules and curated-look mutations |
| `operations.jobs.manage` | Cancel background jobs |
| `audit.read` | Read immutable operational audit history |

## Actor contract

Audit actors for authenticated commands come only from `request.user`, which is produced by `JwtStrategy` after validating the revocable server-side session and loading the live user. Request bodies may carry historical compatibility fields, but controllers must overwrite/ignore actor fields before invoking business services.

## Enforcement rules

1. Authentication and role checks run before granular permission checks.
2. Permission changes take effect on the next request because JWT claims are not used as the source of role/permissions.
3. Sensitive workflow transitions cannot rely only on Angular guards or UI visibility.
4. New admin/platform mutation endpoints must declare a permission or document why the endpoint is admin-only.
5. `admin` bypass of the granular list is intentional; staff never receives an implicit bypass.
