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
| — | — | Backlog ready for owner requests | — | — | INBOX | Add new requests below; do not implement directly from this placeholder. |

## Intake format

When capturing a new request, record at minimum:

`GM-### | EPIC-## | short outcome | L1/L2/L3/L4 or TBD | P0–P3 or TBD | INBOX | notes/dependencies`

The feature ID remains stable even if the title or implementation approach later changes.
