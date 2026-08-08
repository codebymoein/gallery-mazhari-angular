# Definition of Done — Product Development

Status: **Normative completion checklist** for product/feature changes after remediation.

A change is not `Done` merely because code exists or a local screen appears correct. Apply only the items relevant to the change, but every skipped item must be genuinely not applicable rather than silently omitted.

## Requirement and scope

- [ ] Requested outcome is documented.
- [ ] Change class (L1–L4) is recorded.
- [ ] Acceptance criteria are explicit and verifiable.
- [ ] Scope and non-scope are bounded.
- [ ] Related/dependent backlog items are identified where needed.

## Architecture and domain

- [ ] Existing capability/service ownership was inspected before adding a new path.
- [ ] No competing source of truth or duplicate business authority was introduced.
- [ ] Angular remains presentation/client orchestration, not business/authorization authority.
- [ ] NestJS/database enforce privileged and durable invariants where applicable.
- [ ] Protected Gallery Mazhari workflows were preserved or explicitly approved for semantic change.
- [ ] Material architecture/workflow decisions are recorded in the appropriate architecture documentation/decision record.

## Data and backend

- [ ] API input/output contracts are validated and compatible as required.
- [ ] Authorization and rejection paths are tested for privileged behavior.
- [ ] Persistent changes use reviewed forward migrations.
- [ ] Existing production data compatibility was considered.
- [ ] Constraints, concurrency/idempotency and audit behavior were considered where relevant.
- [ ] Rollback/roll-forward and data recovery implications are documented for material changes.

## Frontend and user experience

- [ ] Intended behavior/visual result is accepted for material UI changes.
- [ ] Existing design tokens/components/patterns are reused before one-off styling.
- [ ] RTL/Persian behavior remains correct.
- [ ] Loading, empty, success and error states are handled where applicable.
- [ ] Accessibility, keyboard and responsive behavior are verified proportionately.
- [ ] SSR/hydration/SEO behavior is verified for affected public routes.

## Testing and quality

- [ ] Changed behavior has automated coverage at the lowest useful layer.
- [ ] Critical cross-layer journeys have integration/E2E coverage where appropriate.
- [ ] Regression cases cover success plus important invalid/rejection/conflict paths.
- [ ] Applicable lint, unit, build, backend, PostgreSQL and browser gates pass on the final PR head.
- [ ] Security/dependency/secret/static-analysis gates are not weakened or bypassed.
- [ ] Final diff/file list was inspected for unrelated changes, generated artifacts, secrets and accidental deletions.

## Documentation and operations

- [ ] API/schema/workflow/architecture/security/design/operations documentation was updated when behavior changed.
- [ ] Canonical documentation links remain valid.
- [ ] Environment/configuration changes are documented without secrets.
- [ ] Deployment/monitoring/rollback impact is documented where applicable.

## Acceptance and release

- [ ] Human/product acceptance is complete when the feature requires subjective business or visual approval.
- [ ] Staging evidence exists for material cross-layer or release-sensitive changes.
- [ ] PR contract contains exact scope, impacts, checks, risks and recovery.
- [ ] CI evidence corresponds to the final PR head SHA.
- [ ] Merge occurs only with human owner authorization under repository governance.
- [ ] Production deployment, when applicable, maps to a reviewed exact revision and follows the release certification protocol.

## Final rule

If an item reveals an unresolved correctness, security, data-integrity or business-workflow risk, the feature is not Done. Record and resolve the risk or obtain the explicit human risk disposition required by repository governance; do not hide it behind a checked box.
