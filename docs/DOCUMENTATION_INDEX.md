# Canonical Documentation Index

Status: **Normative ownership/index document** for repository documentation.

## Precedence

1. `CONSTITUTION.md`
2. `AGENTS.md`
3. `docs/handbook/`
4. Canonical operational/domain documents listed below
5. Retained specialized/reference documents
6. Code comments

If documents conflict, reconcile the conflict in a focused PR; do not silently choose the more convenient instruction.

## Canonical entry points

| Topic | Canonical document | Owner |
| --- | --- | --- |
| Engineering governance | `CONSTITUTION.md` | Repository Owner + Tech Lead |
| Agent entry point | `AGENTS.md` | Repository Owner + Tech Lead |
| Engineering operating rules | `docs/handbook/README.md` | Tech Lead + domain owners |
| Project operational context | `docs/PROJECT_MEMORY.md` | Tech Lead |
| Active remediation/release work | `docs/remediation/MASTER_REMEDIATION_ROADMAP.md` | Tech Lead + RM/release owner |
| Post-remediation product planning / backlog | `docs/product/PRODUCT_ROADMAP.md` + `docs/product/BACKLOG.md` | Product Owner + Tech Lead |
| Feature/change specification | `docs/product/FEATURE_TEMPLATE.md` | Product Owner + Tech Lead + domain owner |
| Post-remediation development lifecycle | `docs/engineering/DEVELOPMENT_WORKFLOW.md` | Tech Lead + domain owners |
| Product development Definition of Done | `docs/engineering/DEFINITION_OF_DONE.md` | Tech Lead + QA + domain owners |
| Environment configuration | `docs/operations/ENVIRONMENT.md` | Backend/DevOps |
| Secrets and rotation | `docs/operations/SECRETS.md` | Security/DevOps |
| Commands/migrations/tools | `docs/operations/TOOL_MANIFEST.md` | Tech Lead + DevOps |
| Platform architecture | `docs/PLATFORM_ARCHITECTURE.md` | Solution Architect |
| Platform API | `docs/PLATFORM_API.md` | Backend Lead |
| Deployment | `docs/handbook/14-deployment-operations.md` then `docs/PLATFORM_DEPLOYMENT.md` | DevOps |
| Production certification / controlled launch | `docs/release/PRODUCTION_CERTIFICATION.md` + `docs/release/OPEN_RISK_REGISTER.md` | Release Manager + Business Owner + Tech Lead |
| Security | `docs/handbook/09-security.md` then `SECURITY.md` | Security Lead |
| Design system | `docs/handbook/08-design-system.md` then `DESIGN_SYSTEM.md` | Design System Lead |
| Business workflows | `docs/handbook/07-business-workflows.md` plus specialized workflow docs | Domain Owner |

## Retained specialized/reference documents

- `PRODUCTION_AUDIT.md` — historical audit evidence retained while production certification is active; never direct implementation authority.
- `MEDIA_DEPLOYMENT.md` — media/deployment specialization retained because current media operations still reference it.
- server deployment handoff material — retained only while useful to current deployment/release operations.
- older workflow/architecture references — retained only where a current canonical document still points to them for detail.

Obsolete early-phase reports and duplicate feature trackers should not remain in the active working tree merely for history; Git history and merged Pull Requests provide that record.

See `docs/operations/STALE_DOCUMENT_REGISTER.md` for retained documents with known legacy/context risk.

## Documentation rules

- One canonical entry point per operational topic.
- Specialized documents may add detail but must not contradict the canonical owner.
- Completed roadmap detail belongs in Git/PR history unless it is still required for an active operational/release decision.
- Never describe a planned control as already implemented.
- Renames/moves require inbound link updates.
- Deletion/archive requires proof that the document is obsolete and has no active operational consumer.
