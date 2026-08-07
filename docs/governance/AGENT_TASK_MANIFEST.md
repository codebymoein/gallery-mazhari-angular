# Agent Task Manifest

Use one manifest per active material agent task. Copy this template into the PR description, issue, or a task-specific file. A material task MUST NOT begin writes until the required-reading and preflight sections are complete.

## Identity
- Task / RM / Finding ID:
- Roadmap PR slice (if remediation):
- Current Wave:
- Human owner:
- Agent / tool:
- Repository: `codebymoein/gallery-mazhari-angular`
- Base branch: `main`
- Verified base SHA:
- Working branch:
- Open predecessor/dependency PRs checked:

## Governance preflight acknowledgement
- [ ] Repository identity verified from GitHub, not assumed from prompt/history.
- [ ] Current `main` SHA independently fetched.
- [ ] `AGENTS.md` read completely.
- [ ] `CONSTITUTION.md` read completely.
- [ ] `docs/PROJECT_MEMORY.md` read.
- [ ] `docs/handbook/README.md` read.
- [ ] Mandatory Handbook chapters 01, 02, 03, 07, 10, 11 and 12 read.
- [ ] Task-specific Handbook chapters read.
- [ ] `docs/remediation/MASTER_REMEDIATION_ROADMAP.md` read for remediation/audit work.
- [ ] Exact Wave/RM/PR scope, dependencies, finding IDs, deliverables and exit criteria identified from the Roadmap.
- [ ] Actual affected implementation and existing tests/docs inspected.
- [ ] Mandatory pre-write report provided to the human owner before material mutation.

If any box above that applies to the task is incomplete, **STOP: write authorization is not established.**

## Authorization
- Requested outcome:
- In scope:
- Roadmap deliverables in scope:
- Linked finding IDs:
- Acceptance / exit criteria:
- Explicit non-scope:
- Adjacent RM/findings explicitly forbidden:
- Allowed write surfaces:
- Forbidden / protected surfaces:
- Business workflow semantic changes authorized: **none unless explicitly listed**
- Destructive operations authorized: **none unless explicitly listed**
- Merge authorization: **human owner only unless explicitly delegated**

## Impact map
- Business workflows touched:
- Protected workflows confirmed preserved:
- Source of truth affected:
- API contracts affected:
- Database/schema/migration impact:
- Authentication/authorization impact:
- Security/input/file impact:
- Media/storage impact:
- SEO/accessibility/performance impact:
- Deployment/operations impact:
- Documentation impact:

## Verification plan
- Commands to run:
- Required CI jobs/gates:
- Critical success cases:
- Rejection/invalid-transition cases:
- Authorization cases:
- Retry/idempotency/data-integrity cases:
- PostgreSQL/migration cases:
- Browser/E2E cases:
- Manual evidence required:

## Recovery plan
- Code rollback / revert approach:
- Migration rollback / roll-forward:
- Data recovery/backup requirement:
- Deployment rollback (if applicable):

## Handoff / completion
- Current head SHA:
- Final changed files:
- Final scope compared with manifest:
- Checks actually run/results:
- CI run used as completion evidence:
- CI head SHA matches final PR head: [ ]
- Blocked/non-blocking checks and reason:
- Unresolved risks:
- Documentation/Project Memory updated where required: [ ]
- Rollback / roll-forward confirmed:
- Next permitted Roadmap action:

## Anti-self-authorization rule
An agent may not satisfy a missing human approval, business decision, risk acceptance, protected-path review, or merge authorization by writing its own acknowledgement here. This manifest records authority; it does not create authority.
