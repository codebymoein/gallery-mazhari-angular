# Canonical Environment Contract

Status: **Normative operational documentation** for RM-16.

## Ownership

- NestJS runtime configuration: `backend/.env.example` + `backend/src/config/env.validation.ts`.
- Angular/browser configuration: must contain public/browser-safe values only. Root `.env.example` is legacy/frontend compatibility documentation and is not a production secret contract.
- Production durable data: PostgreSQL through NestJS. WordPress environment values are compatibility-only and do not define business authority.

## Environment classes

### Local development

`NODE_ENV=development`. SQLite may be used only as the documented local-development compatibility path. Development placeholder secrets are allowed only because the environment is explicitly non-production.

### Test / CI

`NODE_ENV=test` unless a test intentionally exercises production validation. CI credentials must be ephemeral, non-production and supplied by the workflow/environment rather than committed as secrets.

### Production

`NODE_ENV=production`. Production must use the NestJS backend contract and PostgreSQL deployment variables. Real secret values are supplied by the deployment secret store/environment, never by committed `.env` files.

The runtime validator rejects:

- a missing or shorter-than-32-character `JWT_SECRET`;
- documented/default placeholder values for configured secret fields such as `JWT_SECRET`, `ADMIN_SETUP_KEY`, `DB_PASSWORD`, and `SMTP_PASSWORD`.

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
| `ADMIN_RECOVERY_EMAIL` | recovery recipient | sensitive operational config |
| `SMTP_HOST` / `SMTP_PORT` | mail endpoint | environment-specific |
| `SMTP_USER` | mail principal | sensitive identifier |
| `SMTP_PASSWORD` | mail credential | secret |
| `SMTP_FROM` | sender identity | non-secret |

## Rules

1. Never commit real `.env` files or credentials.
2. Never place a secret in Angular/browser configuration; values shipped to the browser are public.
3. Production operators must start from the backend contract, not from the root legacy `.env.example`.
4. Production secret injection happens outside Git using the deployment platform/secret store.
5. A configuration rename/removal requires updating this document, `backend/.env.example`, validation code, deployment docs and CI where applicable.
6. Configuration changes do not authorize schema, authentication, import or deployment redesign outside the owning remediation program.

## Verification

- Backend tests cover production placeholder rejection.
- RM-02 Gitleaks remains a required repository check.
- The backend build/tests must pass after environment-validation changes.
