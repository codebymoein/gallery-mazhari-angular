# GM-024 — Static analysis evidence reliability

## Outcome
Make the non-blocking static-analysis artifact in `Quality Gates` produce trustworthy architecture and dead-code evidence instead of stale tool crashes or zero-module reports.

## Current evidence
The latest `static-analysis-reports` artifact shows:

- `knip@5.62.0` crashes under the Node 22 / current TypeScript environment with `TypeError: ts.getDefaultLibFilePath is not a function`;
- the legacy dependency-cruiser invocation reports `0 modules, 0 dependencies cruised`;
- the dedicated `RM-09 Static Analysis Evidence` workflow already uses dependency-cruiser `17.3.1` with explicit TypeScript globs and rejects zero-module JSON, and Knip `6.29.0` with structured JSON validation.

The two CI paths therefore drifted. GM-024 aligns the `Quality Gates` evidence path with the already-valid RM-09 tool versions and validation semantics.

## Scope
- Update only the `static-analysis-report` architecture/dead-code commands in `.github/workflows/quality-gates.yml`.
- Keep CSS Stylelint evidence unchanged.
- Use dependency-cruiser `17.3.1`, explicit `src/**/*.ts` and `backend/src/**/*.ts` inputs, JSON evidence, and reject empty/zero-module output.
- Use Knip `6.29.0`, JSON reporter, and reject missing/invalid structured evidence.
- Preserve the job as non-blocking debt evidence; this task improves evidence validity rather than changing debt disposition policy.

## Non-scope
- No Angular, NestJS, database, API, deployment, or business-workflow changes.
- No dependency or lockfile changes.
- No dead-code deletion or architecture refactor.
- No new finding is automatically authorized for remediation.
- No weakening of the dedicated RM-09 workflow.

## Acceptance
- `reports/dependency-cruiser.json` parses and contains at least one analyzed module.
- dependency-cruiser stderr and exit status remain captured as evidence.
- `reports/knip.json` parses and contains an `issues` array.
- Neither report is replaced by a tool crash stack trace.
- Existing Stylelint report remains valid.
- Required exact-head repository workflows pass.

## Recovery
Revert the focused GM-024 PR to restore the previous reporting commands. No data, schema, runtime, migration, or deployment recovery is required.
