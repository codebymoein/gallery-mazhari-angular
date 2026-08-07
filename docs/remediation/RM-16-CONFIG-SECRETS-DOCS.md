# RM-16 — Configuration, Secrets, and Operational Documentation

Status: **VERIFYING**

Wave: **Wave 0 — Stop new entropy**  
Base SHA: `04582b3c6a5413eca3459d63ff07f4fb4e3e22b4`  
Branch: `chore/rm-16-config-secrets-docs`  
Pull request: `#17`

## Ledger coverage

- `P1-F04–F05`
- `P11-F32–F35`

## Objective

Make configuration, secret handling, operational instructions and documentation authority unambiguous without redesigning business workflows, authentication, database schema, deployment or media systems.

## Changes in this program

- Canonical NestJS environment contract documented.
- Root `.env.example` explicitly classified as legacy/frontend compatibility only.
- Production runtime rejects placeholder/short JWT secrets and known configured placeholder secret values.
- Secret rotation and exposure response documented.
- Tool/migration command manifest added.
- Canonical documentation ownership index added.
- Legacy/stale documentation registered without bulk deletion.

## Explicit non-scope

- No authentication/session redesign (RM-04).
- No schema/migration remediation or schema-drift fix (RM-05).
- No import/product workflow change (RM-06).
- No media/storage redesign (RM-10).
- No deployment/backup infrastructure implementation (RM-11).
- No legacy code or document bulk deletion (RM-09 / owning program).

## Verification plan

- Backend unit tests including `backend/src/config/env.validation.spec.ts`.
- Backend build.
- RM-02 required quality gates on the PR.
- Gitleaks required check.
- PR diff review to confirm no secret value or unrelated business change.

## Exit criteria mapping

| Roadmap criterion | Evidence |
| --- | --- |
| No operator can confuse WordPress and NestJS environment files | Root and backend examples are explicitly classified; `docs/operations/ENVIRONMENT.md` names the canonical runtime contract. |
| Production refuses default secrets | `validateEnvironment()` rejects short/placeholder production secret values with regression tests. |
| One canonical document exists per topic | `docs/DOCUMENTATION_INDEX.md` defines precedence and topic owners. |
| Secrets are not committed and have rotation procedures | Required Gitleaks + `docs/operations/SECRETS.md`. |

## Verification evidence

GitHub Actions is required on PR #17. Completion must not be claimed until the required `Required quality gates` check passes.

## Rollback

Revert this PR. Runtime rollback restores the previous environment validator behavior; no schema or persistent data migration is involved.
