# 14 — Deployment & Operations

Existing deployment references include Nginx configuration examples and platform/server handoff documentation. Production deployment must remain traceable to a reviewed revision.

## Release sequence
1. Verify approved commit and required checks.
2. Confirm environment configuration/secrets and backup/restore readiness.
3. Apply compatible database migrations in the documented order.
4. Deploy backend/frontend artifacts from the approved revision.
5. Run health and critical smoke checks.
6. Observe errors/jobs/database/media before declaring success.

## Operational rules
- No manual production code edits as normal deployment practice.
- Environment variables are validated; production secrets are not copied into repository files.
- Static/media paths, API proxying, HTTPS/security headers and cache policy must be explicit in reverse-proxy configuration.
- Long-running jobs and migrations require operational visibility; do not terminate/retry blindly.

## Rollback
Every material release defines whether code rollback is safe with the migrated schema. Prefer backward-compatible migrations and roll-forward data repair when irreversible data transformations exist. Never restore an old database snapshot over newer valid business transactions without explicit incident authority.

References: [`../PLATFORM_DEPLOYMENT.md`](../PLATFORM_DEPLOYMENT.md), [`../SERVER_DEPLOYMENT_HANDOFF_FA.md`](../SERVER_DEPLOYMENT_HANDOFF_FA.md), [`../../deploy/nginx.conf.example`](../../deploy/nginx.conf.example).
