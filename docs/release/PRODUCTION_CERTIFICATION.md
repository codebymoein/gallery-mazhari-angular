# Production Certification Protocol

This document is the RM-17 release gate for one immutable Gallery Mazhari release candidate. It is not permission to deploy to production. Production cutover requires the explicit business/release-owner approval recorded in the release evidence.

## Candidate identity

Record before certification:

- Git SHA (full 40 characters):
- PR / release tag:
- Release artifact workflow run:
- Artifact filename:
- Artifact SHA-256:
- Certification workflow run:
- Staging environment identifier:
- Certification date/time:
- Release Manager:
- Technical Owner:
- Business Owner:

The Git SHA in `REVISION`, `BUILD.json`, the backend `/api/ops/version` response, the reviewed commit and the certified artifact MUST all match.

## Automated evidence required

All evidence must come from the exact candidate SHA:

- Required Quality Gates are green.
- RM-09 static-analysis evidence is green.
- RM-12 SSR/crawler evidence is green.
- RM-13 browser/CWV evidence is green.
- RM-14 accessibility suite is green and the manual acceptance protocol is completed for the candidate.
- Deployment Tooling checks are green, including encrypted PostgreSQL restore drill.
- RM-17 release-candidate provenance validation is green.
- RM-17 production-like smoke/crawler probe is green.
- Release artifact checksum verifies successfully.

A rerun from a different head SHA is not evidence for this candidate.

## Staging certification

Deploy the immutable candidate artifact to the designated staging environment using the documented release procedure. Record the exact artifact and checksum used. Do not rebuild on the server.

After activation verify and capture evidence for:

1. `GET /api/ops/health/live`.
2. `GET /api/ops/health/ready`.
3. `GET /api/ops/version` and exact SHA match.
4. SSR raw HTML for `/`, `/catalog` and `/contact` with title/canonical metadata.
5. `/sitemap.xml` and child sitemap availability.
6. A deliberately unknown URL returns HTTP 404 with noindex policy.
7. Storefront catalog discovery and navigation.
8. Cart and checkout safe-state/critical-path checks using approved test data.
9. Admin sign-in and the primary authorized admin navigation path.
10. Import/media/publish/order/payment workflows applicable to the release using non-production test data and the existing business-critical regression protocol.
11. No new sustained server errors, readiness failures or alert storms during the staging observation window.

## Rollback and restore rehearsal

Certification requires recorded rehearsal evidence, not only the existence of scripts.

### Release rollback rehearsal

In staging/recovery only, record:

- source candidate SHA;
- rollback target SHA;
- start/end time;
- observed rollback duration;
- backend readiness after switch;
- SSR storefront response after switch;
- `/api/ops/version` revision after switch;
- confirmation that PostgreSQL data was not rolled backward;
- whether automatic previous-symlink restoration was exercised after any failed target probe.

### Database restore rehearsal

Use the documented non-production restore drill. Record:

- encrypted backup artifact/checksum;
- disposable recovery target;
- restore start/end time;
- schema/migration state;
- representative protected workflow row counts;
- media-reference reconciliation where applicable;
- `/api/ops/health/ready` and `/api/ops/version` after recovered application validation.

A production database restore is not authorized by this protocol.

## Business UAT

The Business Owner or delegated UAT owner must explicitly record Pass/Fail for the critical workflows that apply to the release. At minimum review:

- storefront product discovery and product detail behavior;
- consultation/contact entry points;
- cart/checkout/order path appropriate to the configured provider/test mode;
- admin authentication and authorized navigation;
- Excel inventory dry-run/confirm behavior;
- product/variation lifecycle and taxonomy;
- media/photo queue and publish/staging workflow;
- stock/audit behavior;
- representative SEO/merchandising output.

A technical CI pass cannot substitute for Business UAT sign-off.

## Open-risk gate

Complete `OPEN_RISK_REGISTER.md` for every known release risk. Every item must be one of Fix, Accepted, Deferred or Closed/Not an issue with the required evidence. No unaccepted Critical item may remain. High risks require explicit owner sign-off before launch.

## Controlled launch plan

Before production activation record:

- launch window and on-call owner;
- exact candidate SHA/artifact/checksum;
- backup-readiness confirmation;
- rollback target SHA and migration compatibility review;
- canary/controlled traffic or operational rollout method;
- monitoring dashboards/log views used during launch;
- alert destination test result;
- abort thresholds (readiness failure, sustained error rate, critical workflow failure, data-integrity concern);
- post-launch monitoring window and owner.

Production activation is a separate explicit human decision.

## Final disposition

- Technical certification: `PASS | FAIL`
- Accessibility/manual protocol: `PASS | FAIL`
- Business UAT: `PASS | FAIL`
- Risk register approved: `YES | NO`
- Rollback rehearsal: `PASS | FAIL`
- Restore rehearsal: `PASS | FAIL`
- Launch authorization: `GO | NO-GO`

Required signatures/approvals:

- Release Manager:
- Technical Owner:
- Business Owner:
- Date/time:

If any required gate is incomplete, the release remains NO-GO.
