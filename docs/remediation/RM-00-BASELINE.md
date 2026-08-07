# RM-00 — Baseline, Branch Reconciliation, and Change Freeze

Status: **IN PROGRESS**  
Wave: **0**  
Priority: **P0**  
Repository: `codebymoein/gallery-mazhari-angular`

## Canonical baseline

- Canonical implementation SHA: `1703dc79fae78d7d7ed97a1966b25787458a8e98`
- Canonical branch at selection time: `main`
- Audit source baseline: `a3c7af97ff447040433a041f83b785197595d26e`
- RM-00 working branch: `chore/rm-00-baseline-reconciliation`
- Intended immutable tag: `rm-baseline-2026-08-07`

The canonical baseline is the reviewed `main` state after PR #11 (engineering governance) and is 22 commits ahead of the audit source baseline with no commits behind it.

## Scope

RM-00 establishes a single immutable starting point before any finding remediation. It does **not** remediate application findings and does not authorize changes to business workflows, source-of-truth boundaries, authentication, database schema, imports, media, stock, taxonomy, SEO, merchandising, deployment, dependencies, or UI behavior.

Ledger coverage: foundational prerequisite; no finding is assigned exclusively to RM-00.

## Required evidence

- [x] Exact repository confirmed.
- [x] Exact `main` SHA recorded.
- [x] Governance entry point, Constitution, Handbook index, and mandatory chapters reviewed.
- [x] Clean RM-00 branch created from the canonical SHA.
- [x] Diverged branch identified and reconciliation policy recorded.
- [x] Audit delta from the audit baseline to the selected SHA recorded.
- [ ] Immutable baseline tag created.
- [ ] Executable baseline verification completed and archived.

The two unchecked items are not being represented as complete. The current GitHub connector exposes branch/file/PR operations but no tag-creation action, and this execution environment cannot clone the repository because outbound DNS/network access is unavailable. See `rm-00/BASELINE-VERIFICATION.md` for exact evidence and required follow-up commands.

## Change freeze rule

Until RM-00 exits, remediation work MUST start only from the canonical baseline or a branch explicitly derived from it. The diverged branch `agent/publish-current-gallery-progress` MUST NOT be merged wholesale, reused as a remediation base, or cherry-picked without task-specific review.

No adjacent remediation program is authorized by this document.

## RM-00 records

- [`rm-00/BRANCH-RECONCILIATION.md`](rm-00/BRANCH-RECONCILIATION.md)
- [`rm-00/BASELINE-VERIFICATION.md`](rm-00/BASELINE-VERIFICATION.md)
- [`rm-00/AUDIT-DELTA.md`](rm-00/AUDIT-DELTA.md)

## Exit gate

RM-00 may be marked complete only when:

1. the immutable tag points to `1703dc79fae78d7d7ed97a1966b25787458a8e98`;
2. baseline verification commands have actual archived results rather than assumed results;
3. the branch reconciliation decision remains explicit and no mixed-scope branch is used as a remediation base; and
4. the final diff remains documentation/governance-only for RM-00.
