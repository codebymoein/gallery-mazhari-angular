# 16 — Backup & Disaster Recovery

Backups are valid only when restorable.

## Coverage
Production recovery planning MUST cover PostgreSQL, uploaded/original media not reproducible elsewhere, deployment/configuration metadata needed to rebuild service, and secret recovery/rotation procedures outside the repository. Generated frontend artifacts and reproducible derivatives need not be primary backup targets if reliably regenerable.

## PR-014 backup baseline

The scheduled baseline uses `gallery-mazhari-backup.timer` and a oneshot service that runs two fail-visible jobs:

- `backup-postgres.sh` creates a PostgreSQL custom-format dump, encrypts it with an `age` public recipient, emits SHA-256 evidence and uploads the encrypted dump/checksum to configured S3-compatible off-server storage. Plaintext backup retention is forbidden.
- `backup-media.sh` copy-syncs runtime media from the production Object Storage source to a distinct backup bucket/account with server-side encryption. It intentionally does not use `--delete`, so a source deletion does not erase the backup copy during a routine job.

Real credentials/private recovery keys MUST remain outside Git. `deploy/backup.env.example` contains only the non-secret contract. Backup bucket lifecycle/versioning and access policy are infrastructure responsibilities and MUST preserve the required retention window.

## Policy requirements
- Automated scheduled backups with retention appropriate to business risk.
- At least one backup copy isolated from the primary server/failure domain.
- Encryption/access control for backups containing customer/business data.
- Backup job failure MUST be visible and MUST NOT be represented as success.
- Periodic restore drills to a non-production environment with documented result, duration, and integrity checks.
- Defined RPO/RTO approved by the business before production-critical launch; do not invent guarantees unsupported by infrastructure.

## PR-015 non-production restore drill

`deploy/restore-postgres.sh` is the canonical PostgreSQL restore-drill helper. It is deliberately fail-closed:

- it refuses to execute when `NODE_ENV=production`;
- it requires the exact acknowledgement `RESTORE_CONFIRM_NON_PRODUCTION=I_UNDERSTAND_THIS_IS_NON_PRODUCTION`;
- the restore target is supplied separately as `RESTORE_DATABASE_URL` and MUST be a disposable/recovery database prepared for the drill;
- the private `age` identity is supplied through `RESTORE_AGE_IDENTITY_FILE` outside Git;
- the encrypted backup checksum is verified before decryption;
- decrypted plaintext exists only in a temporary file removed on exit;
- `pg_restore` runs with `--exit-on-error --no-owner --no-privileges` and does not silently continue after an integrity failure.

A restore drill is not complete merely because `pg_restore` exits zero. Record backup artifact/checksum, target environment, start/end time, schema/migration state, representative row counts, protected workflow smoke checks, media-reference reconciliation where applicable, and `/api/ops/health/ready` plus `/api/ops/version` evidence from the restored environment.

No production restore is authorized by this procedure. A production recovery event requires explicit incident authority, evidence preservation and deliberate cutover planning.

## Incident recovery
Prioritize preserving evidence and preventing further writes when integrity is uncertain. Restore to a new/recovery environment when possible, validate schema/migrations, row counts/key workflows and media references, then deliberately cut over. Never overwrite newer production data casually.

Application code rollback and data restore are separate decisions. `deploy/rollback-release.sh` never restores PostgreSQL. If older application code is not compatible with already-applied migrations, use a reviewed roll-forward/recovery plan instead of destructive database reversal.

## Change gate
Schema, storage, deployment, or media architecture changes must update backup coverage and restore procedure in the same PR when recovery assumptions change.
