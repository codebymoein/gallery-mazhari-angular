# 01 — Engineering Principles

## Enforceable principles
- **Correctness before convenience:** preserve business meaning and data integrity even when a shortcut is easier.
- **One authority per concern:** PostgreSQL/NestJS own durable business state; Angular owns experience/client orchestration. Compatibility sources may be read only under explicit migration/sync contracts.
- **Explicit state machines:** workflow statuses and allowed transitions must be named, validated server-side, tested, and auditable.
- **Safe by default:** privileged endpoints require explicit auth/permission; imports/uploads validate before mutation; destructive actions require recovery planning.
- **Small reversible changes:** one purpose per PR; no opportunistic redesign. A reviewer must be able to identify behavior, risk, and rollback from the PR.
- **Evidence over confidence:** claims such as “safe”, “fixed”, “compatible”, or “no regression” require tests, build output, diff inspection, or operational evidence.
- **No silent fallback:** degraded data sources, skipped validation, failed jobs, unavailable media, or migration problems must be observable; never silently substitute authoritative data.
- **Preserve intentional workflows:** do not flatten Gallery Mazhari domain processes into generic CRUD merely to reduce code.

## Definition of Done
A change is done only when: scope is implemented; applicable lint/tests/builds pass; data/security/deployment impact is assessed; documentation is synchronized; no unrelated files changed; and rollback/forward recovery is understood for material changes.

## Review questions
Reviewers MUST be able to answer: What source of truth changes? Which invariant changes? Which workflow changes? What happens on retry/failure? How is unauthorized access rejected? What test proves the critical behavior? How is the change reversed or recovered?
