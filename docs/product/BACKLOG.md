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
| GM-002 | EPIC-01 | First-visit heritage book experience with touch/page-turn storytelling and graceful skip/revisit behavior | L2 | P1 | DONE | Merged via PR #59; first-visit heritage journey available on Home |
| GM-003 | EPIC-05 | Wedding Planner with ceremony/date setup, complete checklist, progress and contextual catalog/consultation actions | L3 | P1 | ACCEPTANCE | Implementation and automated evidence complete in PR #60; manual V2 product/staging acceptance pending; PostgreSQL/NestJS authority; reuses existing customer auth |
| GM-004 | EPIC-05 | Bespoke services journey for custom veil/dress consultation, photo-led request entry points and Tehran fitting-at-home discovery | L3 | P1 | INBOX | Reuse existing consultation/custom-request/home-trial domain paths before adding any new backend concept |
| GM-005 | EPIC-01 | Editorial category chapters and fashion-led mobile discovery instead of conventional card-grid presentation | L2 | P1 | INBOX | Depends on GM-001; preserve catalog authority/filtering semantics and indexable routes |
| GM-006 | EPIC-01 | Storefront motion language: reveal, image drift, chapter transitions and gesture polish without scroll hijacking | L2 | P2 | INBOX | Depends on GM-001 motion tokens; no third-party animation dependency without review |

## Intake format

When capturing a new request, record at minimum:

`GM-### | EPIC-## | short outcome | L1/L2/L3/L4 or TBD | P0–P3 or TBD | INBOX | notes/dependencies`

The feature ID remains stable even if the title or implementation approach later changes.
