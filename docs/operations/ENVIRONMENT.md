# Canonical Environment Contract

Status: **Normative operational documentation** for RM-16.

## Ownership

- NestJS runtime configuration: `backend/.env.example` + `backend/src/config/env.validation.ts`.
- Angular/browser configuration: must contain public/browser-safe values only. Root `.env.example` is legacy/frontend compatibility documentation and is not a production secret contract.
- Production durable data: PostgreSQL through NestJS. WordPress environment values are compatibility-only and do not define business authority.
- Media binary storage: production uses server-side S3-compatible Object Storage. PostgreSQL remains authoritative for media metadata/workflow state.

## Environment classes

### Local development

`NODE_ENV=development`. SQLite may be used only as the documented local-development compatibility path. Development placeholder secrets are allowed only because the environment is explicitly non-production. `MEDIA_STORAGE_DRIVER=local` is permitted for development and writes public originals under `uploads/media` and private/quarantine content outside the public upload tree under `storage/private/media`. Malware scanning may be explicitly disabled in local development.

### Test / CI

`NODE_ENV=test` unless a test intentionally exercises production validation. CI credentials must be ephemeral, non-production and supplied by the workflow/environment rather than committed as secrets. Tests may use the local driver or mocked S3 transport and may mock the malware scanner boundary.

### Production

`NODE_ENV=production`. Production must use the NestJS backend contract and PostgreSQL deployment variables. A media-capable runtime uses `MEDIA_STORAGE_DRIVER=s3` and `MEDIA_MALWARE_SCAN_MODE=http` with a configured scanner endpoint. A deliberately media-incapable runtime may use `MEDIA_STORAGE_DRIVER=disabled`; all storage reads and writes then fail closed with HTTP 503 and no S3 or scanner configuration is accepted as operational media capability. Real secret values are supplied by the deployment secret store/environment, never by committed `.env` files.

The runtime validator rejects:

- a missing or shorter-than-32-character `JWT_SECRET`;
- documented/default placeholder values for configured secret fields such as `JWT_SECRET`, `ADMIN_SETUP_KEY`, `DB_PASSWORD`, `SMTP_PASSWORD`, and `MEDIA_S3_SECRET_ACCESS_KEY`;
- `MEDIA_STORAGE_DRIVER=local` in production;
- incomplete S3-compatible media configuration in production;
- disabled/invalid malware scan mode in production;
- a missing `MEDIA_MALWARE_SCAN_URL` in production.

## Canonical backend variables

| Variable | Purpose | Production classification |
| --- | --- | --- |
| `NODE_ENV` | runtime class | required by deployment policy |
| `PORT` | backend listener | non-secret |
| `FRONTEND_ORIGIN` | CORS allowlist | non-secret, environment-specific |
| `BACKEND_PUBLIC_URL` | canonical backend URL | non-secret |
| `TRUST_PROXY` | trusted proxy mode | security-sensitive configuration |
| `DB_TYPE` | database engine selector | production must be PostgreSQL |
| `DB_HOST` / `DB_PORT` | PostgreSQL endpoint | environment-specific |
| `DB_USERNAME` | PostgreSQL principal | sensitive identifier |
| `DB_PASSWORD` | PostgreSQL credential | secret |
| `DB_NAME` | PostgreSQL database | environment-specific |
| `JWT_SECRET` | JWT signing secret | secret; production placeholder rejection enforced |
| `JWT_EXPIRES_IN` | token lifetime | security-sensitive configuration |
| `ADMIN_SETUP_KEY` | bootstrap/setup protection | secret when configured |
| `MEDIA_STORAGE_DRIVER` | media binary backend | production must be `s3`, or explicitly `disabled` for fail-closed maintenance/V2 operation |
| `MEDIA_S3_ENDPOINT` | S3-compatible API endpoint | environment-specific, server-only |
| `MEDIA_S3_REGION` | signing region (`auto` where provider supports it) | environment-specific |
| `MEDIA_S3_BUCKET` | media bucket/container | environment-specific |
| `MEDIA_S3_ACCESS_KEY_ID` | Object Storage principal | sensitive identifier; server-only |
| `MEDIA_S3_SECRET_ACCESS_KEY` | Object Storage credential | secret; server-only and placeholder-rejected |
| `MEDIA_PUBLIC_BASE_URL` | public media/CDN origin used only for public objects | non-secret |
| `MEDIA_MALWARE_SCAN_MODE` | malware scanning boundary | production must be `http` |
| `MEDIA_MALWARE_SCAN_URL` | server-side scanner endpoint | security-sensitive, server-only |
| `ADMIN_RECOVERY_EMAIL` | recovery recipient | sensitive operational config |
| `SMTP_HOST` / `SMTP_PORT` | mail endpoint | environment-specific |
| `SMTP_USER` | mail principal | sensitive identifier |
| `SMTP_PASSWORD` | mail credential | secret |
| `SMTP_FROM` | sender identity | non-secret |

## Media storage contract

- Object keys are server-generated from the SHA-256 content hash: `public/<hash-prefix>/<hash>.<ext>` or `private/<hash-prefix>/<hash>.<ext>`.
- Public product originals may resolve through `MEDIA_PUBLIC_BASE_URL`; immutable public objects receive a one-year immutable cache policy.
- Quarantine/private objects never receive a public HTTP URL. Application metadata stores a non-public `private-object://...` reference instead.
- S3 credentials never appear in Angular environments, API responses, logs, committed files, or public URLs.
- Production media scanning is fail-closed: scanner errors, timeouts, invalid responses and infected results do not proceed to public storage/attachment.
- `MEDIA_STORAGE_DRIVER=disabled` is an explicit unavailable state: media storage reads and writes return HTTP 503 and must not be represented as working media infrastructure.
- Accepted images are decoded and re-encoded server-side before public storage; metadata is stripped and image dimensions/pixel counts are bounded.
- Responsive derivatives are stored through the same media storage boundary and remain content-addressed.
- `GET /platform/media/reconciliation` is a read-only protected report for storage/database drift; it does not repair or delete objects.

## Rules

1. Never commit real `.env` files or credentials.
2. Never place a secret in Angular/browser configuration; values shipped to the browser are public.
3. Production operators must start from the backend contract, not from the root legacy `.env.example`.
4. Production secret injection happens outside Git using the deployment platform/secret store.
5. A configuration rename/removal requires updating this document, `backend/.env.example`, validation code, deployment docs and CI where applicable.
6. Configuration changes do not authorize schema, authentication, import or deployment redesign outside the owning remediation program.
7. Object Storage is binary storage, not a competing business database. PostgreSQL/NestJS remain authoritative for media identity, workflow status, product attachment and audit.

## Verification

- Backend tests cover production placeholder rejection, required Object Storage configuration and production malware-scanner requirements.
- Media scanner tests cover clean/infected/unavailable/invalid-response behavior.
- Secure processing tests cover decode failure, metadata stripping and derivative generation.
- Reconciliation tests cover missing objects, dangling references and provider errors.
- RM-02 Gitleaks remains a required repository check.
- The backend build/tests must pass after environment-validation changes.
