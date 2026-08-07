# Gallery Mazhari Angular — Master Remediation Roadmap

**Authoritative repository:** `codebymoein/gallery-mazhari-angular`  
**Audit baseline:** `main@a3c7af97ff447040433a041f83b785197595d26e`  
**Audit coverage:** 12 phases, 381 findings, 100% assigned to remediation programs  
**Rule:** No direct implementation from the raw finding list. Work proceeds only through the programs, gates, PR boundaries, and acceptance criteria in this roadmap.

## Executive conclusion

The project is not a failed or disposable codebase. It has a meaningful Angular/NestJS architecture, a sophisticated business-specific product workflow, useful test foundations, a real design-system base, and several production-oriented controls. The principal risk is **overlapping authority**: multiple data paths, legacy/local fallbacks, non-enforced design rules, incomplete session revocation, non-reproducible deployment, and missing mandatory quality gates.

The remediation strategy is therefore **preserve the business model, consolidate authority, enforce governance, and prove behavior with tests**. A rewrite is not recommended. Bulk deletion is not recommended. Feature development should be temporarily restricted until Wave 0 is complete.

## Audit inventory

- Critical: **16**
- High: **166**
- Medium: **189**
- Low: **7**
- Needs verification: **3**
- Total: **381**

## Non-negotiable business constraints

- The accounting Excel import remains an authoritative operational input.
- The publishing queue and detailed product states remain; they are not simplified into a generic draft/published workflow.
- Out-of-stock products preserve their history and can return to the correct workflow state.
- Rejected/trash records remain protected from routine imports.
- Product variations, photography, approval, publication, stock, and platform-enrichment workflows remain distinct where the business requires them.
- PostgreSQL/NestJS become the technical authority around those workflows; browser storage and legacy adapters cannot make independent business decisions.
- Visual cleanup must preserve the approved brand rather than redesigning it arbitrarily.

## Execution waves and hard gates

### Wave 0 — Stop new entropy

- **RM-00 — Baseline, branch reconciliation, and change freeze**
- **RM-01 — Repository governance and multi-agent operating system**
- **RM-02 — CI/CD and mandatory quality gates**
- **RM-16 — Configuration, secrets, and operational documentation**

### Wave 1 — Protect data and operations

- **RM-03 — Canonical architecture and source-of-truth consolidation**
- **RM-04 — Authentication, authorization, and session security**
- **RM-05 — Database schema, migrations, and environment parity**
- **RM-06 — Inventory import reliability and product workflow engine**
- **RM-07 — Admin/storefront synchronization and concurrency control**
- **RM-10 — Media storage, upload security, and image pipeline**
- **RM-11 — Deployment, backups, observability, and disaster recovery**
- **RM-15 — Business-critical automated test expansion**

### Wave 2 — Consolidate the codebase

- **RM-08 — Design system and CSS governance**
- **RM-09 — Legacy removal, dependency graph, and codebase cleanup**

### Wave 3 — Public experience and measurable quality

- **RM-12 — SEO rendering, structured data, sitemap, and redirects**
- **RM-13 — Performance, Core Web Vitals, and browser reliability**
- **RM-14 — Accessibility and inclusive interaction**

### Wave 4 — Production certification

- **RM-17 — Production certification and controlled launch**

### Hard gate rules

1. **No feature expansion before Wave 0 passes.** Emergency production fixes require a narrowly scoped exception PR.
2. **No source-of-truth cleanup by deletion.** Replacement behavior, tests, migration, and rollback must exist first.
3. **No database or import refactor without a restorable backup and PostgreSQL integration environment.**
4. **No authentication migration as a single big-bang release.** Use compatibility stages and tested session cutover.
5. **No CSS cleanup without visual baselines.** Otherwise regressions cannot be distinguished from intended change.
6. **No production certification while any unaccepted Critical finding remains.**

## Remediation programs

### RM-00 — Baseline, branch reconciliation, and change freeze

**Wave:** Wave 0  
**Priority:** P0  
**Estimated engineering effort:** 2–4 days  
**Owner:** Tech Lead + Repository Owner  
**Dependencies:** None  
**Ledger coverage:** Foundational prerequisite; no finding is assigned exclusively to this program.

**Objective:** Choose one immutable implementation baseline, reconcile the diverged branch, freeze uncontrolled changes, and capture reproducible evidence before remediation.

**Deliverables**
- Canonical base SHA and baseline tag
- Branch reconciliation decision record
- Clean working branch for remediation
- Baseline build/test/migration report
- Audit-delta report against chosen SHA

**Exit criteria**
- One exact SHA is declared in the ledger and README
- No work begins from a diverged or reused branch
- All current unmerged changes are split, retained, or rejected explicitly
- Baseline commands and their outputs are archived

### RM-01 — Repository governance and multi-agent operating system

**Wave:** Wave 0  
**Priority:** P0  
**Estimated engineering effort:** 3–5 days  
**Owner:** Repository Owner + Tech Lead  
**Dependencies:** RM-00  
**Ledger coverage:** 45 findings (Critical 3, High 20, Medium 22)  
**Finding IDs:** P10-F01–F45

**Objective:** Make multi-agent work safe, reviewable, attributable, and reversible.

**Deliverables**
- Protected main
- CODEOWNERS
- PR/issue templates
- Agent task manifest
- Branch/commit conventions
- AGENTS.md and PROJECT_MEMORY on main
- Automatic stale branch cleanup

**Exit criteria**
- Direct push to main is blocked
- Independent approval is required
- Merged branches are deleted
- Every PR has scope, tests, data impact, rollback, and base SHA
- Sensitive paths require designated review

### RM-02 — CI/CD and mandatory quality gates

**Wave:** Wave 0  
**Priority:** P0  
**Estimated engineering effort:** 5–8 days  
**Owner:** Platform/DevOps + Tech Lead  
**Dependencies:** RM-00, RM-01  
**Ledger coverage:** 23 findings (Critical 2, High 6, Medium 14, Low 1)  
**Finding IDs:** P1-F01, P1-F03, P9-F01–F04, P9-F20–F26, P9-F29–F36, P9-F41, P9-F45

**Objective:** Create mandatory, non-mutating quality gates that stop broken or unsafe changes before merge.

**Deliverables**
- GitHub Actions PR workflow
- Pure lint and lint:fix separation
- Build/test/coverage jobs
- Security and secret scans
- Stylelint/architecture/dead-code jobs
- PostgreSQL integration job
- Artifacts and status checks

**Exit criteria**
- All required checks run on every PR
- Main cannot merge on failed checks
- CI uses clean lockfile installs
- Coverage thresholds are explicit
- Migration-from-empty and schema drift checks pass

### RM-03 — Canonical architecture and source-of-truth consolidation

**Wave:** Wave 1  
**Priority:** P0  
**Estimated engineering effort:** 4–7 days  
**Owner:** Solution Architect + Frontend/Backend Leads  
**Dependencies:** RM-00, RM-02  
**Ledger coverage:** 2 findings (Medium 2)  
**Finding IDs:** P2-F01–F02

**Objective:** Declare the authoritative architecture and remove ambiguity about which layer owns each business capability.

**Deliverables**
- Architecture Decision Record
- Capability-to-service matrix
- Source-of-truth matrix
- Frontend/backend boundary rules
- Legacy adapter policy

**Exit criteria**
- PostgreSQL is declared authoritative business storage
- NestJS is the only command/write gateway
- Angular local storage is cache/UI state only
- Every capability has one primary service and API

### RM-04 — Authentication, authorization, and session security

**Wave:** Wave 1  
**Priority:** P0  
**Estimated engineering effort:** 8–14 days  
**Owner:** Security Lead + Backend Lead  
**Dependencies:** RM-02, RM-03, RM-05  
**Ledger coverage:** 16 findings (High 9, Medium 5, Low 1, Needs verification 1)  
**Finding IDs:** P3-F08, P4-F01–F11, P5-F09–F12

**Objective:** Make administrator and staff access revocable, least-privileged, auditable, and resistant to token theft and workflow bypass.

**Deliverables**
- Cookie-only or formally chosen auth model
- Session registry/token versioning
- Live account validation
- CSRF defense
- Granular permission matrix
- Bootstrap-admin lockdown
- Server-derived audit actors
- Sensitive endpoint hardening

**Exit criteria**
- Disabling a user revokes access immediately
- Permission changes take effect immediately
- JWT is not readable from browser storage
- Logout revokes the session
- Publish/status/restore/import cannot bypass permission or workflow rules

### RM-05 — Database schema, migrations, and environment parity

**Wave:** Wave 1  
**Priority:** P0  
**Estimated engineering effort:** 7–12 days  
**Owner:** Backend Lead + DBA  
**Dependencies:** RM-00, RM-02  
**Ledger coverage:** 8 findings (High 2, Medium 5, Needs verification 1)  
**Finding IDs:** P1-F02, P3-F01–F05, P3-F09–F10

**Objective:** Make database evolution reproducible and identical across local, CI, staging, and production.

**Deliverables**
- PostgreSQL-first development/integration path
- Complete migration chain
- Entity registry decoupling
- Duplicate timestamp resolution
- Conditional environment validation
- Schema drift tests
- Connection/timeout policy

**Exit criteria**
- Fresh PostgreSQL builds fully from migrations only
- synchronize is disabled outside disposable tests
- Entity schema equals migrated schema
- Migration order is deterministic
- Production DB variables are mandatory and validated

### RM-06 — Inventory import reliability and product workflow engine

**Wave:** Wave 1  
**Priority:** P0  
**Estimated engineering effort:** 12–20 days  
**Owner:** Product Domain Lead + Backend Lead  
**Dependencies:** RM-04, RM-05  
**Ledger coverage:** 23 findings (High 6, Medium 16, Low 1)  
**Finding IDs:** P5-F01–F08, P5-F13–F20, P5-F24–F30

**Objective:** Preserve the business-designed Excel and publishing workflow while adding transactionality, traceability, idempotency, and explicit state transitions.

**Deliverables**
- ImportBatch model
- File checksum/idempotency
- Preview/dry-run
- Transactional/chunked commit
- Row-level errors
- Retry/rollback
- Server-side new-product determination
- Canonical taxonomy
- State machine
- Concurrency lock
- Immutable workflow audit

**Exit criteria**
- A failed import leaves a known recoverable state
- The same file cannot be replayed accidentally
- Two imports cannot interleave
- Every transition is authorized and validated
- No browser storage determines business classification
- Published/stock/rejected behavior remains faithful to requirements

### RM-07 — Admin/storefront synchronization and concurrency control

**Wave:** Wave 1  
**Priority:** P0  
**Estimated engineering effort:** 10–16 days  
**Owner:** Frontend Lead + Backend Lead  
**Dependencies:** RM-03, RM-04, RM-05, RM-06  
**Ledger coverage:** 22 findings (Critical 3, High 12, Medium 7)  
**Finding IDs:** P6-F01–F22

**Objective:** Ensure the panel, storefront, and database always describe the same business reality.

**Deliverables**
- Server-backed inventory commands
- Removal of silent local-write fallback
- Direct catalog query layer
- Bounded cache with revision/TTL
- Conflict/version handling
- Realtime/poll refresh strategy
- Central typed API client
- Server audit trail

**Exit criteria**
- Local-only products never appear publicly
- Failed writes fail visibly
- Bulk inventory actions persist to PostgreSQL
- Two admins receive conflict feedback
- Storefront cache can be invalidated deterministically
- Legacy `/mazhari/v1` path is isolated or removed

### RM-08 — Design system and CSS governance

**Wave:** Wave 2  
**Priority:** P1  
**Estimated engineering effort:** 12–18 days  
**Owner:** Design System Lead + Frontend Lead  
**Dependencies:** RM-01, RM-02  
**Ledger coverage:** 43 findings (High 12, Medium 29, Low 2)  
**Finding IDs:** P2-F05–F07, P7-F01–F40

**Objective:** Turn the existing design foundation into one enforceable system so later agents cannot layer contradictory styles.

**Deliverables**
- Approved palette and font policy
- Canonical semantic tokens
- Mobile typography contract
- Style ownership map
- Global CSS decomposition
- Component library primitives
- Stylelint rules
- Visual regression suite
- Token/document synchronization

**Exit criteria**
- One source controls fonts/colors/spacing
- Feature styles live with their owner
- Broad class-fragment selectors are removed
- `!important` has documented exceptions only
- Yekan/mobile behavior is stable in visual tests
- Raw unauthorized design values fail CI

### RM-09 — Legacy removal, dependency graph, and codebase cleanup

**Wave:** Wave 2  
**Priority:** P1  
**Estimated engineering effort:** 8–14 days  
**Owner:** Tech Lead + Module Owners  
**Dependencies:** RM-03, RM-07, RM-08  
**Ledger coverage:** 38 findings (High 12, Medium 25, Low 1)  
**Finding IDs:** P2-F03–F04, P2-F08, P8-F01–F35

**Objective:** Remove duplicate and legacy paths only after proving usage and migrating behavior safely.

**Deliverables**
- Import/dependency graph
- Knip/dependency-cruiser/jscpd reports
- Capability implementation matrix
- Deprecated adapter registry
- Migration tool manifests
- Canonical docs archive
- Orphan asset scan
- Phased deletion PRs

**Exit criteria**
- Every capability has one active implementation
- No modern module imports forbidden legacy layers
- WordPress/local compatibility is either isolated with expiry or removed
- No deletion occurs without tests and runtime trace

### RM-10 — Media storage, upload security, and image pipeline

**Wave:** Wave 1–2  
**Priority:** P0  
**Estimated engineering effort:** 10–16 days  
**Owner:** Backend/Media Lead + DevOps  
**Dependencies:** RM-03, RM-05, RM-11 foundation  
**Ledger coverage:** 17 findings (Critical 2, High 8, Medium 6, Low 1)  
**Finding IDs:** P3-F06–F07, P5-F21–F23, P11-F04–F07, P11-F21–F27, P11-F46

**Objective:** Make media durable, secure, optimized, private/public aware, and independent of a single server disk.

**Deliverables**
- Canonical Object Storage architecture
- Public/private separation
- Signed upload or controlled upload flow
- Signature/MIME/size validation
- Metadata stripping and malware scan
- Derivative generation
- Content-addressed names
- CDN policy
- Media reconciliation and lifecycle

**Exit criteria**
- Replacing a server cannot lose media
- Private uploads are never public
- Immutable cache names are enforced
- Responsive derivatives are generated automatically
- Database references reconcile with stored objects

### RM-11 — Deployment, backups, observability, and disaster recovery

**Wave:** Wave 1  
**Priority:** P0  
**Estimated engineering effort:** 12–20 days  
**Owner:** DevOps/SRE + DBA  
**Dependencies:** RM-00, RM-02, RM-05  
**Ledger coverage:** 34 findings (Critical 3, High 25, Medium 6)  
**Finding IDs:** P11-F01–F03, P11-F08–F20, P11-F28–F31, P11-F36–F45, P11-F47–F50

**Objective:** Make production deployment reproducible, observable, backed up, restorable, and quickly reversible.

**Deliverables**
- Immutable build/deploy pipeline
- Staging and protected production environments
- Supervised backend process
- Atomic release/rollback
- Migration job and advisory lock
- Encrypted DB/media backups
- PITR/off-server copy
- Restore drill
- Health/version endpoints
- Structured logs/metrics/alerts
- Operational runbooks

**Exit criteria**
- Production maps to exact SHA/artifact hash
- Previous release rolls back within target time
- A clean environment is restored successfully from backup
- Backup failure alerts
- Health exposes build/migration status safely
- Deployment never copies partial releases over live files

### RM-12 — SEO rendering, structured data, sitemap, and redirects

**Wave:** Wave 3  
**Priority:** P1  
**Estimated engineering effort:** 12–20 days  
**Owner:** Frontend/SEO Lead + Backend Lead  
**Dependencies:** RM-03, RM-07, RM-10, RM-11  
**Ledger coverage:** 35 findings (Critical 2, High 18, Medium 15)  
**Finding IDs:** P12-F01–F32, P12-F75–F77

**Objective:** Make every public route crawlable with correct server-visible metadata, status codes, structured data, sitemap membership, and redirects.

**Deliverables**
- Angular SSR/prerender/hydration
- Central SEO resolver
- Metadata reset on navigation
- Dynamic entity metadata
- Dynamic sitemap index
- Structured data families
- Redirect registry
- 404/410 strategy
- Crawler/social-preview tests

**Exit criteria**
- Raw HTML for product/category routes contains correct metadata and JSON-LD
- Unknown URLs return true 404
- Unpublished products leave sitemap and resolve correctly
- No stale Product JSON-LD survives navigation
- Rich Results validation passes

### RM-13 — Performance, Core Web Vitals, and browser reliability

**Wave:** Wave 3  
**Priority:** P1  
**Estimated engineering effort:** 10–16 days  
**Owner:** Frontend Performance Lead  
**Dependencies:** RM-08, RM-10, RM-12  
**Ledger coverage:** 26 findings (High 14, Medium 12)  
**Finding IDs:** P12-F33–F58

**Objective:** Meet measurable mobile performance and browser reliability targets, especially for iPhone/Safari.

**Deliverables**
- Lighthouse CI and RUM
- CWV budgets
- Responsive image adoption
- Font loading/subsetting
- Lazy global widgets
- Route-aware preload
- CSS/bundle reduction
- WebKit/Firefox/Chromium matrix
- Network/CPU profiles

**Exit criteria**
- LCP/INP/CLS targets pass on agreed staging profiles
- WebKit regressions are permanent tests
- No unrelated catalog sync on routes that do not need it
- Images have responsive sources and intrinsic dimensions
- Initial budgets are tightened and enforced

### RM-14 — Accessibility and inclusive interaction

**Wave:** Wave 3  
**Priority:** P1  
**Estimated engineering effort:** 8–14 days  
**Owner:** Accessibility Lead + Frontend Lead  
**Dependencies:** RM-08, RM-15  
**Ledger coverage:** 14 findings (High 5, Medium 9)  
**Finding IDs:** P12-F59–F72

**Objective:** Make storefront and admin workflows operable by keyboard, screen reader, zoom, and assistive settings.

**Deliverables**
- Expanded Axe suite
- Keyboard journey tests
- Focus-management primitives
- Live-region patterns
- Form/table/dialog standards
- Contrast/reflow tests
- VoiceOver/NVDA protocol
- Accessibility acceptance checklist

**Exit criteria**
- Critical journeys complete with keyboard and screen reader
- Focus returns correctly after overlays
- Async errors/status are announced
- 200%/400% zoom and 320px reflow pass
- No serious, critical, or agreed moderate violations

### RM-15 — Business-critical automated test expansion

**Wave:** Wave 1–3  
**Priority:** P0  
**Estimated engineering effort:** 15–25 days  
**Owner:** QA Lead + Domain Owners  
**Dependencies:** RM-02, then follows each domain program  
**Ledger coverage:** 24 findings (High 12, Medium 12)  
**Finding IDs:** P9-F05–F19, P9-F27–F28, P9-F37–F40, P9-F42–F44

**Objective:** Build tests that prove business safety rather than merely code compilation.

**Deliverables**
- Auth/session integration tests
- PostgreSQL migration tests
- Import failure/idempotency/concurrency tests
- Panel/storefront consistency tests
- Order/payment/provider contract tests
- Backup/restore tests
- Browser critical journeys
- Console/network assertions

**Exit criteria**
- Each Critical/High remediation has a regression test where technically possible
- Checkout reaches verified order state in an isolated environment
- Import partial failure and replay are covered
- Stale/local catalog divergence is blocked by tests
- Tests are deterministic and reset their data

### RM-16 — Configuration, secrets, and operational documentation

**Wave:** Wave 0–1  
**Priority:** P1  
**Estimated engineering effort:** 4–7 days  
**Owner:** Tech Lead + DevOps  
**Dependencies:** RM-00, RM-01  
**Ledger coverage:** 6 findings (High 2, Medium 3, Needs verification 1)  
**Finding IDs:** P1-F04–F05, P11-F32–F35

**Objective:** Make configuration, secrets, operational instructions, and canonical documentation unambiguous.

**Deliverables**
- Canonical environment schemas
- Production placeholder rejection
- Secret management plan
- Documentation ownership/index
- Migration/tool manifests
- Architecture and runbook index
- Stale document archive

**Exit criteria**
- No operator can confuse WordPress and NestJS environment files
- Production refuses default secrets
- One canonical document exists per topic
- Secrets are not committed and have rotation procedures

### RM-17 — Production certification and controlled launch

**Wave:** Wave 4  
**Priority:** P0 release gate  
**Estimated engineering effort:** 5–10 days plus soak  
**Owner:** Release Manager + Business Owner + Tech Lead  
**Dependencies:** RM-01 through RM-16 relevant completion  
**Ledger coverage:** 5 findings (Critical 1, High 3, Medium 1)  
**Finding IDs:** P12-F73–F74, P12-F78–F80

**Objective:** Certify one immutable release against technical, operational, and business acceptance criteria before controlled production rollout.

**Deliverables**
- Staging certification report
- Open-risk acceptance register
- Release artifact/provenance
- Migration and rollback rehearsal
- SEO/performance/accessibility reports
- Business UAT
- Canary/controlled launch plan
- Post-launch monitoring window

**Exit criteria**
- Every ledger finding is Fix/Accepted/Deferred/Closed with owner and reason
- No unaccepted Critical remains
- High risks have explicit sign-off
- Rollback and restore are rehearsed
- Business-critical flows pass on exact production artifact

## Recommended PR sequence

| PR | Name | Programs | Scope |
|---|---|---|---|
| PR-001 | Governance baseline | RM-00, RM-01, RM-16 | Record SHA, reconcile branch, add AGENTS/PROJECT_MEMORY, templates, CODEOWNERS, branch rules documentation. No business-code change. |
| PR-002 | CI foundation | RM-02 | Non-mutating lint, builds, unit tests, security/secret scans, artifacts, required checks. |
| PR-003 | PostgreSQL migration integrity | RM-05, RM-15 | Disable synchronize, complete migrations, fresh-DB and drift tests. |
| PR-004 | Architecture contracts | RM-03 | ADRs, capability/source-of-truth matrices, forbidden dependency rules. |
| PR-005 | Session-security foundation | RM-04, RM-15 | Session registry/versioning, live user validation, cookie strategy and regression tests. |
| PR-006 | Permission and audit hardening | RM-04, RM-06 | Granular permissions, JWT-derived actor, transition authorization. |
| PR-007 | Import batch and idempotency | RM-06, RM-15 | ImportBatch, checksum, preview, replay protection. |
| PR-008 | Transactional import and variation sync | RM-06, RM-15 | Transactions/chunks, concurrency lock, rollback/error report. |
| PR-009 | Product state machine and taxonomy | RM-06 | Explicit transitions, canonical category validation, workflow preservation. |
| PR-010 | Server-only inventory commands | RM-07 | Replace local bulk mutations and silent local fallback. |
| PR-011 | Catalog query/cache contract | RM-07, RM-15 | Direct server query, revision/TTL, no local-only merge, stale/conflict UX. |
| PR-012 | Media storage foundation | RM-10, RM-11 | Object Storage, public/private split, content-addressed naming. |
| PR-013 | Secure media processing | RM-10 | Validation, scanning, metadata stripping, derivatives, reconciliation. |
| PR-014 | Deployment and backup baseline | RM-11 | Immutable artifacts, process supervision, atomic releases, backup jobs. |
| PR-015 | Restore, monitoring, and rollback | RM-11, RM-15 | Restore drill, health/version, logs, metrics, alerts, runbooks. |
| PR-016 | Design tokens and font contract | RM-08 | Approved palette/fonts, canonical tokens, visual baselines. |
| PR-017 | Global CSS decomposition | RM-08 | Remove feature patches/broad selectors, component ownership, Stylelint. |
| PR-018 | Legacy dependency isolation | RM-09 | Knip/dependency graph, deprecations, forbidden imports. |
| PR-019+ | Small legacy-removal PRs | RM-09 | One capability/path per PR after usage proof. |
| PR-020 | SSR/prerender foundation | RM-12 | Server-visible route metadata, hydration, true status handling. |
| PR-021 | Dynamic SEO platform | RM-12 | Entity metadata, JSON-LD cleanup, sitemap indexes, redirects. |
| PR-022 | Responsive image/font performance | RM-13, RM-10 | Optimized images, dimensions, font loading, route-aware preload. |
| PR-023 | Browser/CWV gate | RM-13, RM-02 | Lighthouse, RUM, WebKit/Firefox/Chromium, constrained profiles. |
| PR-024 | Accessibility primitives and tests | RM-14, RM-15 | Focus/live regions, keyboard flows, expanded Axe, manual protocol. |
| PR-025 | Release certification tooling | RM-17 | Crawler, smoke, artifact provenance, UAT and launch checklist. |

## Definition of Done for every remediation PR

- Linked finding IDs and program ID.
- Base SHA and exact changed-file scope.
- Acceptance criteria and explicit non-goals.
- Security, data, migration, media, SEO, and accessibility impact fields.
- Automated tests added or a documented reason why a test is not applicable.
- Build/lint/test/coverage and relevant browser results attached by CI.
- Rollback procedure; data rollback when applicable.
- Documentation and Project Memory updated when architecture or operations change.
- Independent review for protected paths.
- No unrelated cleanup bundled into the PR.

## Risk disposition rules

- **Fix:** remediation is required in the assigned program.
- **Accept risk:** business owner and technical owner sign a reason, impact, expiry/review date, and compensating control.
- **Defer:** owner, target milestone, dependency, and interim protection are mandatory.
- **Closed / Not an issue:** requires evidence, not opinion.
- **Needs verification:** must become one of the four statuses above before production certification.

## Coverage assurance

All 381 findings are assigned exactly once to a primary remediation program. Some programs naturally interact, but the primary ownership mapping prevents findings from being forgotten or counted only implicitly.

### Coverage manifest

- **RM-01:** P10-F01–F45
- **RM-02:** P1-F01, P1-F03, P9-F01–F04, P9-F20–F26, P9-F29–F36, P9-F41, P9-F45
- **RM-03:** P2-F01–F02
- **RM-04:** P3-F08, P4-F01–F11, P5-F09–F12
- **RM-05:** P1-F02, P3-F01–F05, P3-F09–F10
- **RM-06:** P5-F01–F08, P5-F13–F20, P5-F24–F30
- **RM-07:** P6-F01–F22
- **RM-08:** P2-F05–F07, P7-F01–F40
- **RM-09:** P2-F03–F04, P2-F08, P8-F01–F35
- **RM-10:** P3-F06–F07, P5-F21–F23, P11-F04–F07, P11-F21–F27, P11-F46
- **RM-11:** P11-F01–F03, P11-F08–F20, P11-F28–F31, P11-F36–F45, P11-F47–F50
- **RM-12:** P12-F01–F32, P12-F75–F77
- **RM-13:** P12-F33–F58
- **RM-14:** P12-F59–F72
- **RM-15:** P9-F05–F19, P9-F27–F28, P9-F37–F40, P9-F42–F44
- **RM-16:** P1-F04–F05, P11-F32–F35
- **RM-17:** P12-F73–F74, P12-F78–F80

## Final sequencing decision

The first implementation action is **not** an application-code refactor. It is RM-00: choose the exact base, reconcile the diverged branch, tag the baseline, and create a clean remediation branch. Immediately after that, RM-01 and RM-02 must make the process enforceable. Only then should the Critical data/auth/database/operations work begin.

## Final audit status

- Twelve audit phases: Complete
- Invalid earlier Phase 10: Removed and replaced
- Canonical repository lock: Active
- Findings parsed: 381
- Findings assigned: 381
- Unassigned findings: 0
- Duplicate primary assignments: 0
- Implementation authorization: Pending explicit approval of this roadmap and selection of the baseline SHA
