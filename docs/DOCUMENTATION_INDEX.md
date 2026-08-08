# Canonical Documentation Index

Status: **Normative ownership/index document** for repository documentation.

## Precedence

1. `CONSTITUTION.md`
2. `AGENTS.md`
3. `docs/handbook/`
4. Canonical operational/domain documents listed below
5. Historical/specialized reference documents
6. Code comments

If documents conflict, the conflict must be reconciled in a PR; do not silently choose the more convenient instruction.

## Canonical entry points

| Topic | Canonical document | Owner |
| --- | --- | --- |
| Engineering governance | `CONSTITUTION.md` | Repository Owner + Tech Lead |
| Agent entry point | `AGENTS.md` | Repository Owner + Tech Lead |
| Engineering operating rules | `docs/handbook/README.md` | Tech Lead + domain owners |
| Project operational context | `docs/PROJECT_MEMORY.md` | Tech Lead |
| Remediation execution | Master Remediation Roadmap + `docs/remediation/` records | Tech Lead + RM owner |
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

## Historical and specialized references

Files such as `PRODUCTION_AUDIT.md`, `IMPLEMENTATION_CHECKLIST.md`, `PHASE1_COMPLETION.md`, `MEDIA_DEPLOYMENT.md`, server handoffs and older architecture/workflow notes remain evidence unless explicitly archived or replaced. Their existence does not make them higher authority than the canonical entry points above.

See `docs/operations/STALE_DOCUMENT_REGISTER.md` for documents with known legacy/context risk.

## Documentation rules

- One canonical entry point per operational topic.
- Specialized documents may add detail but must not contradict the canonical owner.
- Never describe a planned control as already implemented.
- Renames/moves require inbound link updates.
- Deletion/archive requires proof that the document is obsolete and has no active operational consumer.
