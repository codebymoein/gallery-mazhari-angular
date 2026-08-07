# Agent Task Manifest

Use one manifest per active material agent task. Copy this template into the PR description, issue, or a task-specific file. A material task MUST NOT begin writes until the applicable preflight items are complete.

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
- Relevant predecessor/dependency PRs checked:

## Fast preflight acknowledgement
- [ ] Repository identity verified from GitHub, not assumed from prompt/history.
- [ ] Current `main` SHA and relevant PR/branch state independently fetched.
- [ ] `AGENTS.md` read completely.
- [ ] `CONSTITUTION.md` read completely.
- [ ] Current/task-relevant `docs/PROJECT_MEMORY.md` context read.
- [ ] `docs/handbook/README.md` read and task-risk chapter set selected.
- [ ] Selected Handbook chapters actually read: ____________________
- [ ] `docs/remediation/MASTER_REMEDIATION_ROADMAP.md` hard gates + exact RM/PR/DoD read when this is remediation/audit work.
- [ ] Exact Wave/RM/PR scope, dependencies, finding IDs, deliverables and exit criteria identified when applicable.
- [ ] Actual affected implementation and existing tests/docs inspected.
- [ ] Compact mandatory pre-write report provided to the human owner before material mutation.

If any applicable box is incomplete, **STOP: write authorization is not established.** Do not expand reading merely to tick boxes; select by the risk matrix in `AGENTS.md`, and expand if task boundaries expand.

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

## Compact impact map
- Business workflows / source of truth:
- API / auth / security:
- Database / migration / data recovery:
- Media / SEO / accessibility / performance:
- Deployment / operations:
- Documentation:

## Verification and recovery
- Commands / required CI gates:
- Critical success + rejection/authorization/data-integrity cases:
- Browser/PostgreSQL/manual evidence when applicable:
- Code rollback / revert:
- Migration/data/deployment recovery when applicable:

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
