# RM-02 — CI/CD and Mandatory Quality Gates

Status: **IN PROGRESS — final live verification and ruleset enforcement pending**  
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

1. frontend clean install, lint-regression gate, Vitest, coverage evidence and production build;
2. backend clean install, non-mutating lint-regression gate, Jest, coverage threshold and Nest build;
3. PostgreSQL migration-from-empty plus entity/migrated-schema drift check against an isolated PostgreSQL 16 service;
4. Playwright business-critical journeys with isolated CI-only runtime configuration;
5. production-dependency `npm audit` at high severity;
6. full-history Gitleaks secret scan;
7. aggregate check `Required quality gates` that fails unless every blocking job succeeds.

No production credential or production database is used by CI.

## Evidence-backed lint policy

The first clean runner execution exposed substantial pre-existing lint debt. Fixing hundreds of unrelated application lint errors in RM-02 would violate remediation ownership and expand this PR across import, payment, tests, UI and other business surfaces.

RM-02 therefore establishes a **no-regression baseline**, not a false zero-debt claim:

- Frontend baseline: **8 errors / 90 warnings**. CI fails if either count increases.
- Backend baseline: **283 errors / 6 warnings**. CI fails if either count increases.

The full lint outputs are retained as artifacts. Existing violations remain visible and must be reduced in their owning remediation programs; new lint debt is blocked immediately.

## Coverage policy

The first successful backend coverage run produced:

- Statements: **28.56%**
- Branches: **24.04%**
- Functions: **31.40%**
- Lines: **28.73%**

The backend Jest configuration now enforces evidence-backed global floors of **28% statements, 24% branches, 31% functions and 28% lines**. Coverage may improve without changing the threshold, but it may not regress below these floors.

Frontend coverage support is installed with `@vitest/coverage-v8` matching the repository Vitest line. The final frontend coverage floor will be recorded from the clean live runner before RM-02 exits; it is not guessed in advance.

## PostgreSQL evidence

A clean GitHub-hosted PostgreSQL 16 service successfully accepted the complete committed migration chain from an empty database. Six migrations were applied and `migration:show` reported them as executed. RM-02 does not rewrite migration timestamps or schema semantics; such cleanup remains RM-05 scope.

A blocking `schema:log` parity check is now part of the PostgreSQL job and must prove that the migrated schema matches the registered TypeORM entity schema before RM-02 can exit.

## E2E and accessibility ownership

A full Playwright baseline run executed **56 tests**. Business/routing/cart/backend/storefront journeys passed. One existing desktop accessibility assertion failed on `/catalog`:

- rule: `color-contrast`
- element text: `ثبت درخواست`
- observed contrast: **3.59:1**
- required contrast: **4.5:1**
- foreground: `#17130d`
- background: `#89682f`

The same `/catalog` accessibility test passed on the mobile project. This is a real UI/accessibility defect, not a CI configuration defect. RM-02 does not alter brand colors or accessibility presentation to make CI green; that remediation belongs to RM-14/RM-08.

Accordingly, business-critical Playwright journeys remain blocking, while the accessibility suite runs as a separate retained reporting job until its owning remediation program fixes the known violation. This preserves evidence without allowing unrelated accessibility work to expand RM-02.

## Reporting gates

Static debt tools run separately and upload artifacts:

- Stylelint CSS governance report;
- Dependency Cruiser architecture-boundary report;
- Knip dead-code/dependency report;
- Playwright accessibility report.

These are intentionally report-only during RM-02 because existing findings belong to later remediation programs. RM-02 exposes that debt but does not silently remediate or delete unrelated application behavior.

## Reproducibility

Application dependencies use `npm ci` from committed root/backend lockfiles. The initial runner exposed root lockfile drift; the lockfiles were regenerated by npm on the scoped RM-02 branch and subsequent root/backend `npm ci` steps passed.

Reporting-only tools that are not application dependencies are invoked at pinned versions so their results are repeatable without mutating project lockfiles.

## Security model

CI permissions default to `contents: read`. Temporary lockfile synchronization used a branch-scoped helper with write permission and was removed after the generated lockfile was committed. Test secrets are deterministic CI-only placeholders. PostgreSQL credentials exist only inside the ephemeral Actions service. Gitleaks scans repository history.

Production dependency audits (`--omit=dev --audit-level=high`) pass for both root and backend. `npm ci` may still report development/transitive audit debt; RM-02 does not run broad `npm audit fix` or breaking dependency upgrades without an owning remediation decision.

## Live verification already demonstrated

- [x] workflow triggers on PRs to `main`;
- [x] root and backend clean lockfile installs succeed;
- [x] frontend lint regression gate succeeds;
- [x] frontend unit tests succeed after correcting one stale versioned-asset expectation; runtime asset behavior was not changed;
- [x] frontend production build succeeds;
- [x] backend lint regression gate succeeds;
- [x] all 69 backend Jest tests succeed;
- [x] backend coverage is measured and baseline thresholds are explicit;
- [x] backend build succeeds;
- [x] PostgreSQL migration-from-empty succeeds;
- [x] production dependency audits succeed;
- [x] Gitleaks succeeds;
- [x] static-analysis artifacts are produced;
- [x] business-critical E2E behavior was shown healthy in the full baseline run apart from the separately owned accessibility assertion.

## Remaining exit criteria

RM-02 may be marked COMPLETE only when:

- [ ] frontend coverage baseline is captured and an explicit non-regression floor is enforced;
- [ ] PostgreSQL schema-drift check passes on the final branch;
- [ ] separated business-critical Playwright gate passes;
- [ ] final aggregate `Required quality gates` succeeds;
- [ ] `Required quality gates` is configured as a required GitHub ruleset status check;
- [ ] final PR evidence is recorded and the PR is ready for review.

## Explicit non-scope

RM-02 does not remediate application/business/auth/import/media/SEO/design/accessibility/dead-code findings revealed by the gates. It does not redesign workflows, change production schema semantics, rotate production credentials, or perform deployment work.

## Rollback

Revert the RM-02 PR and remove the corresponding required status-check rule if the workflow itself must be rolled back. No production data rollback is required because CI databases and credentials are ephemeral.
