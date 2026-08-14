# Product Backlog

Status: **Canonical intake list** for requested post-remediation product changes.

This file records requested work before implementation. A backlog entry is not implementation authorization. Material work moves from this list into a completed `FEATURE_TEMPLATE.md`-style specification and follows `docs/engineering/DEVELOPMENT_WORKFLOW.md`.

## Status values

- `INBOX` — captured, not analyzed;
- `TRIAGE` — impact/dependencies being analyzed;
- `READY` — scope and acceptance criteria are sufficient for implementation planning;
- `IN_PROGRESS` — active focused branch/PR exists;
- `ACCEPTANCE` — implementation complete; awaiting required product/staging acceptance;
- `DONE` — merged/released as applicable and Definition of Done satisfied;
- `DEFERRED` — intentionally postponed with reason;
- `REJECTED` — intentionally not proceeding, with reason.

## Backlog rules

1. Every material request gets a stable ID before code starts.
2. Do not combine unrelated requests into one item merely to reduce paperwork.
3. Small related L1 changes may be grouped into one bounded visual-change item if they share the same screen/component and acceptance review.
4. L3/L4 items require explicit impact analysis before `READY`.
5. Dependencies and conflicts are recorded rather than implemented silently.
6. `DONE` requires the repository Definition of Done, not just a merged commit.
7. Security/correctness incidents may use the emergency-fix workflow but must still be traceable.

## Items

| ID | Epic | Request | Class | Priority | Status | Dependencies / notes |
| --- | --- | --- | --- | --- | --- | --- |
| GM-001 | EPIC-01 | Warm editorial visual foundation, typography hierarchy, motion tokens and Home opening redesign | L2 | P1 | DONE | Merged via PR #58; foundation for GM-002/003/004/005/006 |
| GM-002 | EPIC-01 | First-visit heritage book experience with touch/page-turn storytelling and graceful skip/revisit behavior | L2 | P1 | REJECTED | Owner withdrew approval; the customer-facing implementation and local preference consumer are removed by the focused GM-002 corrective change. |
| GM-003 | EPIC-05 | Wedding Planner with ceremony/date setup, complete checklist, progress and contextual catalog/consultation actions | L3 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #60; manual V2 product/staging acceptance pending; PostgreSQL/NestJS authority; reuses existing customer auth |
| GM-004 | EPIC-05 | Bespoke services journey for custom veil/dress consultation, photo-led request entry points and Tehran fitting-at-home discovery | L3 | P1 | ACCEPTANCE | Merged via PR #74 with exact-head CI, browser/SSR, accessibility and release-smoke evidence; manual V2 product/staging acceptance pending; upload, map, deposit and submission semantics unchanged |
| GM-005 | EPIC-01 | Editorial category chapters and fashion-led mobile discovery instead of conventional card-grid presentation | L2 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #69; V2 visual/product acceptance pending; catalog authority/filtering semantics and indexable routes preserved |
| GM-006 | EPIC-01 | Storefront motion language: reveal, image drift, chapter transitions and gesture polish without scroll hijacking | L2 | P2 | ACCEPTANCE | Home motion foundation merged via PR #106; exact-head automated evidence complete; V2 visual/product acceptance pending; CSS-only finite transforms, no third-party animation dependency; reduced-motion required |
| GM-007 | EPIC-01 | WebKit-safe storefront hydration and centralized semantic foundation tokens | L2 | P1 | DONE | Merged via PR #66; WebKit reliability and semantic foundation delivered without page-by-page redesign or font download |
| GM-008 | EPIC-01 | Unified storefront controls, line icons and editorial header/mobile navigation | L2 | P1 | ACCEPTANCE | Merged via PR #67 with required exact-head evidence; V2 visual/product acceptance pending; search, cart, category, account, contact and consultation navigation semantics preserved |
| GM-009 | EPIC-01 | Restore WCAG AA contrast for contact branch guidance text | L1 | P1 | DONE | Merged via PR #68; semantic muted-text token restores desktop/mobile WCAG AA axe evidence |
| GM-010 | EPIC-01 | Editorial product-detail experience with image-led hierarchy and reliable commerce controls | L2 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #70; V2 visual/product acceptance pending; cart, rental, customization, home-trial, consultation and SEO semantics preserved |
| GM-011 | EPIC-01 | Cohesive editorial Home journey and warm ivory global Footer | L2 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #71; V2 visual/product acceptance pending; appearance, promotion, appointment, lookbook, testimonial and contact paths preserved |
| GM-012 | EPIC-01 | Editorial cart and checkout journey with calm mobile hierarchy and WebKit-safe controls | L2 | P1 | ACCEPTANCE | Merged via PR #72 with exact-head CI; V2 visual/product acceptance pending; cart, order, payment, coupon and home-trial semantics unchanged |
| GM-013 | EPIC-01 | Editorial customer account and order-history experience with accessible mobile detail disclosure | L2 | P1 | ACCEPTANCE | Merged via PR #73 with exact-head required gates, browser matrix, accessibility, SSR, static-analysis, security and release-smoke evidence; V2 visual/product acceptance pending; referral remains out of scope |
| GM-014 | EPIC-01 | Editorial promotion and bridal-inspiration journey across discounts, lookbook and look detail | L2 | P1 | ACCEPTANCE | Merged via PR #75 with exact-head Quality Gates, browser/CWV, SSR, static-analysis and release-smoke evidence; V2 visual/product acceptance pending; discount/style APIs, product projection and hotspot navigation unchanged |
| GM-015 | EPIC-05 | Warm editorial personal-styling chapter for Dream Profile and Catalog Builder | L2 | P1 | ACCEPTANCE | Merged via PR #76 with exact-head Quality Gates, browser/CWV, SSR, static-analysis and release-smoke evidence; V2 visual/product acceptance pending; consultation tags/payload, lookbook actions, share and AR semantics unchanged |
| GM-016 | EPIC-01 | Clear the pre-existing frontend ESLint error baseline without changing business behavior | L1 | P1 | DONE | Merged via PR #77 after exact-head Quality Gates, SSR, browser/CWV, static-analysis and RM-17 release-certification evidence passed; frontend lint errors cleared and the existing warning debt remains separately visible |
| GM-032 | EPIC-01 | Refine the mobile header wordmark, icon controls, drawer transition and submenu reveal motion | L2 | P1 | ACCEPTANCE | Implementation complete in PR #95; exact-head automated evidence and manual narrow-mobile visual/product acceptance are required before merge; navigation semantics/routes and desktop composition preserved |
| GM-039 | EPIC-01 | Fashion-editorial Home opening with full-width bridal hero and paired bridal/accessory store entries | L2 | P1 | IN_PROGRESS | Owner-approved slice on `feat/gm-039-home-opening-editorial`; appearance-driven hero and existing routes preserved; Header/Menu is explicitly a separate slice |
| GM-040 | EPIC-01 | Reference-led mobile drawer with physical-left entry, minimal hairline rows, accordion motion and flat taupe CTA | L2 | P1 | IN_PROGRESS | Owner requested final refinement in PR #109: much slower drawer/accordion motion, grouped bridal-dress navigation and circled nested chevrons; canonical product taxonomy/routes remain unchanged |

## Intake format

When capturing a new request, record at minimum:

`GM-### | EPIC-## | short outcome | L1/L2/L3/L4 or TBD | P0–P3 or TBD | INBOX | notes/dependencies`

The feature ID remains stable even if the title or implementation approach later changes.
