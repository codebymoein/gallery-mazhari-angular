# Gallery Mazhari Angular — Active Remediation Roadmap

**Repository:** `codebymoein/gallery-mazhari-angular`  
**Status:** Waves 0–3 completed on the approved `main` lineage. Only Wave 4 production certification remains active.  
**Historical record:** The original 381-finding remediation plan and completed PR sequence remain recoverable from Git history and merged PRs; completed implementation detail is intentionally not duplicated here.

## Governing rule

This file is the canonical remediation execution entry point only for work that is still active. Completed remediation is evidence/history, not an active task queue.

No agent may reopen completed RM work or implement from historical audit findings unless the human owner explicitly authorizes a new corrective task backed by current repository evidence.

## Completed remediation summary

- **Wave 0:** RM-00, RM-01, RM-02, RM-16 — baseline, governance, CI and operational configuration.
- **Wave 1:** RM-03, RM-04, RM-05, RM-06, RM-07, RM-10, RM-11, RM-15 — architecture authority, security, PostgreSQL, inventory/workflow, synchronization, media, deployment/recovery and critical tests.
- **Wave 2:** RM-08, RM-09 — design/CSS governance and evidence-backed legacy cleanup.
- **Wave 3:** RM-12, RM-13, RM-14 — SSR/SEO, browser/Core Web Vitals and accessibility regression evidence.

Canonical current-state detail belongs in `docs/PROJECT_MEMORY.md`. Merged PRs and Git history are the audit trail for completed slices.

## Wave 4 — Production certification

### RM-17 — Production certification and controlled launch

**Priority:** P0 release gate  
**Owners:** Release Manager + Business Owner + Tech Lead  
**Dependencies:** Completed relevant RM-01 through RM-16 work  
**Historical finding IDs:** P12-F73–F74, P12-F78–F80

### Objective

Certify one immutable release against technical, operational and business acceptance criteria before controlled production rollout.

### Remaining deliverables

- staging/production-like certification evidence for the exact release artifact;
- open-risk disposition and explicit owner acceptance where required;
- release artifact/provenance verification;
- migration/rollback/restore rehearsal evidence;
- SEO, performance and accessibility evidence for the exact release candidate;
- Business UAT;
- controlled/canary launch decision;
- post-launch monitoring window and incident/rollback readiness.

### Exit criteria

- Every remaining release risk is `Fix`, `Accepted`, `Deferred`, or `Closed` with owner and reason.
- No unaccepted Critical risk remains.
- High risks have explicit sign-off.
- Rollback and restore are rehearsed and evidenced.
- Business-critical flows pass against the exact production artifact.
- Human Business UAT and launch approval are recorded; automated checks do not replace them.

## Active release references

- `docs/release/PRODUCTION_CERTIFICATION.md`
- `docs/release/OPEN_RISK_REGISTER.md`
- `docs/PROJECT_MEMORY.md`
- `docs/handbook/14-deployment-operations.md`
- `docs/handbook/15-observability.md`
- `docs/handbook/16-backup-disaster-recovery.md`
- `docs/handbook/17-seo-performance-accessibility.md`

## Definition of Done for any new remediation/corrective PR

A newly authorized remediation/corrective PR must include:

- exact task/RM/finding identity where applicable;
- verified base SHA and focused changed-file scope;
- acceptance criteria and explicit non-goals;
- business workflow/source-of-truth impact;
- security, data, migration, media, SEO, accessibility, performance and deployment impact as applicable;
- automated tests or an explicit reason why a test is not applicable;
- applicable CI/build/lint/test/browser evidence from the exact final head;
- rollback/recovery plan;
- documentation/Project Memory update when architecture or operations change;
- independent human review for protected paths;
- no unrelated cleanup bundled into the PR.

## Risk disposition

- **Fix:** remediation is required in the authorized scope.
- **Accept risk:** business and technical owners record reason, impact and review/expiry where applicable.
- **Defer:** owner, target milestone, dependency and interim protection are recorded.
- **Closed / Not an issue:** requires evidence.
- **Needs verification:** cannot remain unresolved at production certification.

## What this file intentionally no longer contains

Completed per-finding inventories, estimated historical engineering effort, the full PR-001…PR-025 sequence, and obsolete pre-remediation instructions were removed from the active working tree to reduce agent context and stale-task risk. They remain available in repository history and merged PR records when historical evidence is required.
