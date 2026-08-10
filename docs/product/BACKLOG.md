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
| GM-004 | EPIC-05 | Bespoke services journey for custom veil/dress consultation, photo-led request entry points and Tehran fitting-at-home discovery | L3 | P1 | INBOX | Reuse existing consultation/custom-request/home-trial domain paths before adding any new backend concept |
| GM-005 | EPIC-01 | Editorial category chapters and fashion-led mobile discovery instead of conventional card-grid presentation | L2 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #69; V2 visual/product acceptance pending; catalog authority/filtering semantics and indexable routes preserved |
| GM-006 | EPIC-01 | Storefront motion language: reveal, image drift, chapter transitions and gesture polish without scroll hijacking | L2 | P2 | INBOX | Depends on GM-001 motion tokens; no third-party animation dependency without review |
| GM-007 | EPIC-01 | WebKit-safe storefront hydration and centralized semantic foundation tokens | L2 | P1 | DONE | Merged via PR #66; WebKit reliability and semantic foundation delivered without page-by-page redesign or font download |
| GM-008 | EPIC-01 | Unified storefront controls, line icons and editorial header/mobile navigation | L2 | P1 | ACCEPTANCE | Focused visible redesign slice on the GM-007 foundation; implementation and local evidence complete, exact-head CI/merge pending |
| GM-009 | EPIC-01 | Restore WCAG AA contrast for contact branch guidance text | L1 | P1 | DONE | Merged via PR #68; semantic muted-text token restores desktop/mobile WCAG AA axe evidence |
| GM-010 | EPIC-01 | Editorial product-detail experience with image-led hierarchy and reliable commerce controls | L2 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #70; V2 visual/product acceptance pending; cart, rental, customization, home-trial, consultation and SEO semantics preserved |
| GM-011 | EPIC-01 | Cohesive editorial Home journey and warm ivory global Footer | L2 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #71; V2 visual/product acceptance pending; appearance, promotion, appointment, lookbook, testimonial and contact paths preserved |
| GM-012 | EPIC-01 | Editorial cart and checkout journey with calm mobile hierarchy and WebKit-safe controls | L2 | P1 | ACCEPTANCE | Merged via PR #72 with exact-head CI; V2 visual/product acceptance pending; cart, order, payment, coupon and home-trial semantics unchanged |
| GM-013 | EPIC-01 | Editorial customer account and order-history experience with accessible mobile detail disclosure | L2 | P1 | ACCEPTANCE | Implementation and local browser evidence complete; exact-head CI/merge pending; order status, repayment and customer-data behavior preserved; referral remains out of scope |

## Intake format

When capturing a new request, record at minimum:

`GM-### | EPIC-## | short outcome | L1/L2/L3/L4 or TBD | P0–P3 or TBD | INBOX | notes/dependencies`

The feature ID remains stable even if the title or implementation approach later changes.
