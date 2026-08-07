# 16 — Backup & Disaster Recovery

Backups are valid only when restorable.

## Coverage
Production recovery planning MUST cover PostgreSQL, uploaded/original media not reproducible elsewhere, deployment/configuration metadata needed to rebuild service, and secret recovery/rotation procedures outside the repository. Generated frontend artifacts and reproducible derivatives need not be primary backup targets if reliably regenerable.

## Policy requirements
- Automated scheduled backups with retention appropriate to business risk.
- At least one backup copy isolated from the primary server/failure domain.
- Encryption/access control for backups containing customer/business data.
- Periodic restore drills to a non-production environment with documented result, duration, and integrity checks.
- Defined RPO/RTO approved by the business before production-critical launch; do not invent guarantees unsupported by infrastructure.

## Incident recovery
Prioritize preserving evidence and preventing further writes when integrity is uncertain. Restore to a new/recovery environment when possible, validate schema/migrations, row counts/key workflows and media references, then deliberately cut over. Never overwrite newer production data casually.

## Change gate
Schema, storage, deployment, or media architecture changes must update backup coverage and restore procedure in the same PR when recovery assumptions change.
