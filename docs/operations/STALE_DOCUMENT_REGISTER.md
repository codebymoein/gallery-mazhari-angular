# Stale / Legacy Document Register

Status: **Classification register, not a deletion list.** RM-16 records authority and risk; later owner programs decide replacement/archive/deletion with evidence.

| Document | Classification | Current handling |
| --- | --- | --- |
| `.env.example` | Legacy/frontend compatibility | Kept with explicit warning; not the NestJS production environment contract. |
| `PRODUCTION_AUDIT.md` | Historical audit evidence | Retain; Master Remediation Roadmap controls remediation scope. |
| `IMPLEMENTATION_CHECKLIST.md` | Historical/project reference | Retain until owning program proves all active instructions are represented canonically. |
| `PHASE1_COMPLETION.md` | Historical milestone record | Retain as history; not an operational authority. |
| `MEDIA_DEPLOYMENT.md` | Specialized/legacy operational reference | Retain; media/deployment authority follows handbook and RM-10/RM-11. |
| Server deployment handoff documents | Specialized operational evidence | Retain; reconcile against canonical deployment handbook during RM-11. |
| WordPress compatibility documentation/configuration | Transitional compatibility | Retain only as explicitly labelled compatibility; must not define PostgreSQL/NestJS business authority. |

## Rules

1. Registration here does not authorize deletion.
2. A document may be archived/removed only after its owner verifies no active workflow, script, operator or compatibility path relies on it.
3. Conflicts are resolved in favor of `CONSTITUTION.md`, the Handbook, and the canonical index, with a PR documenting reconciliation.
4. New stale-document findings should be added here with an owner/program rather than silently deleting files.
