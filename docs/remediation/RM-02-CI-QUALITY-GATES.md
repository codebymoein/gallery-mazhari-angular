# RM-02 — CI/CD and Mandatory Quality Gates

Status: **IN PROGRESS — workflow implementation under live PR verification**  
Wave: **0**  
Priority: **P0**  
Repository: `codebymoein/gallery-mazhari-angular`  
Base SHA: `d06d3cd850e6a5b6f2a43dc7fb1106dcfc2ddbde`  
Working branch: `chore/rm-02-ci-quality-gates`

## Roadmap coverage

- Ledger coverage: **23 findings**
- Finding IDs: `P1-F01`, `P1-F03`, `P9-F01–F04`, `P9-F20–F26`, `P9-F29–F36`, `P9-F41`, `P9-F45`
- Severity summary: Critical 2, High 6, Medium 14, Low 1

The repository does not currently contain the per-finding P1/P9 inventory text, so this program does not invent individual descriptions or claim per-finding closure without source evidence.

## Objective

Create reproducible, non-mutating automated gates that prevent broken or unsafe changes from entering `main`, while keeping pre-existing remediation debt visible and assigned to its owning RM program.

## Blocking PR gates

`.github/workflows/quality-gates.yml` runs these blocking jobs on every pull request to `main`:

1. frontend lint, Vitest and production build;
2. backend non-mutating lint, Jest and Nest build;
3. PostgreSQL migration chain against a fresh isolated PostgreSQL 16 service;
4. Playwright critical journeys with isolated CI-only runtime configuration;
5. production-dependency `npm audit` at high severity;
6. full-history Gitleaks secret scan;
7. aggregate check `Required quality gates` that fails unless every blocking job succeeds.

No production credential or production database is used by CI.

## Reporting gates

Static debt tools run separately and upload artifacts:

- Stylelint CSS governance report;
- Dependency Cruiser architecture-boundary report;
- Knip dead-code/dependency report.

These are intentionally report-only during RM-02 because existing findings may belong to RM-08/RM-09 or another remediation program. RM-02 must expose that debt but must not remediate or silently grandfather arbitrary code by changing unrelated application files.

## Reproducibility

Application dependencies use `npm ci` from the committed root/backend lockfiles. Reporting-only tools that are not yet application dependencies are invoked at pinned versions so their results are repeatable without mutating project lockfiles.

## Coverage policy

Backend Jest coverage is collected and archived on every PR. A numeric blocking threshold will be fixed from the first successful baseline run in this RM-02 PR rather than guessed before evidence exists. Frontend Vitest coverage tooling is not added by an unreviewed dependency change; its threshold/provider decision must be made from live runner evidence in this same RM-02 scope before completion.

RM-02 is not COMPLETE until coverage expectations are explicit and the final required checks have successful evidence.

## Security model

CI permissions default to `contents: read`. Test secrets are deterministic CI-only placeholders. PostgreSQL credentials exist only inside the ephemeral Actions service. Gitleaks scans history without committing or printing production credentials.

## Exit criteria

RM-02 may be marked COMPLETE only when:

- [ ] workflow runs on PRs to `main`;
- [ ] clean lockfile installs succeed;
- [ ] frontend lint/test/build pass;
- [ ] backend lint/test/build pass without mutating source files;
- [ ] coverage expectations are explicit and enforced or explicitly mapped to an evidence-backed baseline policy;
- [ ] PostgreSQL migration-from-empty check passes;
- [ ] dependency security and secret scans pass;
- [ ] Playwright gate passes;
- [ ] static analysis reports are produced and retained;
- [ ] `Required quality gates` is configured as a required GitHub ruleset status check;
- [ ] final PR evidence and artifacts are archived/linked.

## Explicit non-scope

RM-02 does not remediate application/business/auth/import/media/SEO/design/dead-code findings revealed by the gates. It does not redesign workflows, change production schema semantics, rotate production credentials, or perform deployment work.

## Rollback

Revert the RM-02 PR and remove the corresponding required status-check rule if the workflow itself must be rolled back. No production data rollback is required because CI databases and credentials are ephemeral.
