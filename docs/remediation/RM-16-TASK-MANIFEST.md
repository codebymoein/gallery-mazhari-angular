# RM-16 Agent Task Manifest

## Identity
- Task / RM / Finding ID: RM-16 / `P1-F04–F05`, `P11-F32–F35`
- Human owner: Repository owner (`codebymoein`)
- Agent / tool: ChatGPT via GitHub connector
- Repository: `codebymoein/gallery-mazhari-angular`
- Base branch: `main`
- Base SHA: `04582b3c6a5413eca3459d63ff07f4fb4e3e22b4`
- Working branch: `chore/rm-16-config-secrets-docs`
- Pull request: `#17`

## Authorization
- Requested outcome: Complete RM-16 and close the remaining Wave 0 configuration/secrets/documentation program.
- In scope: environment contracts, production placeholder-secret rejection, secret rotation procedure, documentation ownership/index, tool/migration manifest, stale-document classification.
- Explicit non-scope: RM-03 architecture consolidation; RM-04 auth/session redesign; RM-05 schema/migration remediation; RM-06 import workflow; RM-10 media architecture; RM-11 deployment infrastructure; RM-09 bulk cleanup.
- Allowed write surfaces: `.env.example`, `backend/.env.example`, `backend/src/config/`, minimal `backend/src/app.module.ts` wiring, `docs/` governance/operations/remediation files.
- Forbidden / protected surfaces: business workflow modules, payment/import/media/catalog logic, database entities/migrations, Angular feature behavior, production data/secrets.
- Destructive operations authorized: none.
- Merge authorization: human owner explicitly authorized completion of this RM; merge only after required checks pass.

## Required reading
- [x] `AGENTS.md`
- [x] `CONSTITUTION.md`
- [x] `docs/PROJECT_MEMORY.md`
- [x] `docs/handbook/README.md`
- [x] mandatory handbook chapters
- [x] security, deployment/operations and documentation-governance chapters
- [x] affected environment implementation/examples

## Impact map
- Business workflows touched: none.
- Source of truth affected: no business-data authority change; configuration authority is clarified.
- API contracts affected: none.
- Database/schema/migration impact: none.
- Authentication/authorization impact: no model/session change; only production JWT/setup placeholder configuration rejection.
- Security/input/file impact: production secret/config safety strengthened.
- Deployment/operations impact: operators receive canonical environment and secret procedures; no infrastructure deployment change.
- Documentation impact: canonical operations/index documents added and Project Memory/Handbook index updated.

## Verification plan
- Commands/checks: RM-02 required GitHub Actions workflow; backend unit tests/build; Gitleaks; dependency audit; frontend/E2E regression gates.
- Critical success cases: valid non-placeholder production JWT config passes.
- Rejection cases: short/default production JWT and configured placeholder admin key are rejected.
- Authorization cases: not applicable to RM-16.
- Retry/idempotency/data-integrity cases: no data mutation.
- Manual evidence required: PR diff review confirms no real secret and no unrelated business/schema changes.

## Handoff / completion
- Current head SHA: update from PR evidence after final verification commit.
- Changed files: recorded by PR.
- Checks actually run/results: recorded after GitHub Actions completes.
- Blocked checks: none expected.
- Unresolved risks: existing schema/auth/deployment debt remains with owning RMs.
- Rollback / roll-forward: revert RM-16 PR; no data migration required.
- Next permitted action: after RM-16 merge, declare Wave 0 complete and enter Wave 1 according to roadmap dependency order.
