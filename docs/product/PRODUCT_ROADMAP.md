# Product Development Roadmap

Status: **Planning entry point** for post-remediation product development.

This roadmap organizes approved product work after the remediation program. It does not authorize implementation by itself. Each material change must still use `docs/product/FEATURE_TEMPLATE.md`, the repository governance preflight, a focused branch/PR, and `docs/engineering/DEFINITION_OF_DONE.md`.

## Operating principle

Do not convert a long wish list into one large branch. Group requests into product epics, prioritize them, then deliver one coherent feature slice at a time.

## Initial epic structure

### EPIC-01 — Storefront UX and visual refinement
Customer-facing layout, interaction, responsive behavior, design-system-aligned visual changes and browsing experience.

### EPIC-02 — Product and catalog management
Admin capabilities for product data, editing, variations, statuses and catalog operations while preserving canonical workflow authority.

### EPIC-03 — Merchandising and discovery
Featured/curated placement, collections, ordering, filters and discovery rules using explicit domain ownership rather than ad-hoc flags.

### EPIC-04 — Search and filtering
Search relevance, catalog filtering, sorting and scalable query behavior across storefront/admin where appropriate.

### EPIC-05 — Customer experience
Consultations, custom requests, customer-facing forms, communication and other approved customer journeys.

### EPIC-06 — SEO and content discoverability
Ongoing metadata/content/schema/search-engine improvements within the existing SSR/SEO governance and permanent regression gates.

### EPIC-07 — Admin productivity
Safe improvements to admin workflows, bulk operations, feedback, validation and efficiency without moving business authority into Angular.

### EPIC-08 — Analytics and decision support
Operational/product analytics, dashboards and privacy-safe measurements with explicit data ownership and retention decisions.

### EPIC-09 — Platform reliability and operations
Observability, performance, release/rollback, backup/restore, infrastructure and operational improvements beyond the certified baseline.

### EPIC-10 — External systems and ERP integration
Future integrations with ERP/CRM/other services. Any source-of-truth or workflow interaction is L4 unless proven otherwise.

## Prioritization

Each backlog item should receive a priority based on:

1. business/customer value;
2. operational pain or risk reduction;
3. dependency/unblocking value;
4. implementation/risk complexity;
5. release timing.

Suggested labels:

- `P0` — production blocker / critical business need;
- `P1` — high-value near-term work;
- `P2` — important but schedulable;
- `P3` — improvement / later consideration.

Priority does not waive engineering gates.

## Delivery policy

- Prefer vertical slices that leave the system working end-to-end.
- Do not batch unrelated visual, backend and database requests merely because they were requested together.
- Features sharing the same domain model may be sequenced together only when that reduces duplication without creating an oversized PR.
- Dependencies are explicit; a later feature must not secretly implement an unapproved prerequisite.
- Technical debt discovered during delivery is either an in-scope safety prerequisite or a separate backlog item.

## Current transition state

The Master Remediation Roadmap remains the historical/certification authority for the remediation program. PR-025 release-certification tooling is merged on `main`; production Business UAT, risk disposition and controlled-launch authorization remain governed by `docs/release/PRODUCTION_CERTIFICATION.md` and are not replaced by this product roadmap.

The first post-remediation development action is to populate `docs/product/BACKLOG.md` from the owner's requested changes and then select one bounded feature for specification and delivery.
