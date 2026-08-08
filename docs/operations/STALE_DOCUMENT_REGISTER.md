# Stale / Legacy Document Register

Status: **Classification register, not a deletion list.** This file tracks retained documents with known legacy/context risk. Documents proven obsolete and removed from the working tree are not kept here merely as historical clutter; Git history remains the recovery mechanism.

| Document | Classification | Current handling |
| --- | --- | --- |
| `.env.example` | Legacy/frontend compatibility | Kept with explicit warning; not the NestJS production environment contract. |
| `PRODUCTION_AUDIT.md` | Historical audit evidence | Retained while production certification remains active; not implementation authority. |
| `MEDIA_DEPLOYMENT.md` | Specialized/legacy operational reference | Retained because current media/storage documentation and prior media remediation still reference it. Authority follows the Handbook and canonical operations docs. |
| Server deployment handoff documents | Specialized operational evidence | Retained while they remain useful to current release/deployment operations; reconcile against the canonical deployment handbook. |
| WordPress compatibility documentation/configuration | Transitional compatibility | Retain only where an actual compatibility consumer still exists; it must not define PostgreSQL/NestJS business authority. |

## Recently retired from the working tree

- `PHASE1_COMPLETION.md` — obsolete early-phase report describing the removed direct WordPress architecture.
- `IMPLEMENTATION_CHECKLIST.md` — obsolete Angular 18/WordPress feature tracker superseded by the canonical product backlog/roadmap and current architecture.

Both remain recoverable from Git history.

## Rules

1. Registration here does not authorize deletion.
2. A retained document may be archived/removed only after its owner verifies no active workflow, script, operator or compatibility path relies on it.
3. Conflicts are resolved in favor of `CONSTITUTION.md`, `AGENTS.md`, the Handbook and the canonical documentation index.
4. Historical evidence should not be kept in the active working tree when it is both obsolete and fully recoverable from Git, unless an active release/operational process still consumes it.
