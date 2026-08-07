# New Agent / New Chat Bootstrap

Use this document when handing Gallery Mazhari Angular to a new ChatGPT chat, Codex session, Claude/Cursor agent, IDE agent, or other automation.

## Principle

Do not make the new agent trust copied status, remembered SHAs, or a previous agent's claims. Point it to the repository and require it to independently verify current GitHub state and read the repository governance before any mutation.

The root [`../../AGENTS.md`](../../AGENTS.md) is the mandatory entry point. This bootstrap does not replace it.

## Minimal bootstrap prompt

```text
Work only in the authoritative repository:
codebymoein/gallery-mazhari-angular

Before any edit/write/commit/merge/deploy action, independently inspect GitHub and complete the repository's mandatory governance preflight.

Read in this order:
1. AGENTS.md — completely
2. CONSTITUTION.md — completely
3. docs/PROJECT_MEMORY.md
4. docs/handbook/README.md
5. every Handbook chapter required by AGENTS.md for this task
6. docs/remediation/MASTER_REMEDIATION_ROADMAP.md — completely for remediation/audit work
7. docs/governance/AGENT_TASK_MANIFEST.md
8. actual implementation/tests/docs relevant to the current task

Do not trust a copied SHA or project-status statement. Fetch current main SHA and relevant open/merged PR state yourself.

Before the first material write, report:
- verified repository and current main SHA
- governance documents actually read
- current Wave / RM / recommended PR slice and finding IDs
- dependencies
- exact in-scope and explicit non-scope
- expected changed files/write surfaces
- business workflows/source-of-truth impact
- risks and migration/data/deployment impact
- tests and required CI gates
- rollback/roll-forward plan
- proposed branch

Until that report is complete, do not modify project state.

Never create another repository. Never write directly to main. Never broaden scope to adjacent findings. Preserve the intentional Gallery Mazhari business workflows and obey Constitution/AGENTS/Roadmap/Handbook even when a simpler implementation would be easier.

After the preflight, perform only the task I give you below:
<PUT THE CURRENT TASK HERE>
```

## Recommended handoff style

The human owner normally only needs to replace the final placeholder with a concise task such as:

```text
Continue PR-009 according to the Master Remediation Roadmap and stop when that PR's Definition of Done is satisfied.
```

or:

```text
Continue Wave 1 from the first unfinished Roadmap PR. Verify current GitHub state first; do not trust the status copied into this prompt.
```

## What a compliant agent should do next

A compliant agent should first read and report, not immediately code. Its first substantive response should identify the real current `main` SHA, current Roadmap scope, relevant findings and dependencies, expected write surfaces, tests and rollback. If it starts editing before doing that, stop the session and redirect it to `AGENTS.md`.

## Enforcement limits

Repository documentation cannot technically force every arbitrary external chat product to read files it cannot access. Enforcement is strongest when the agent has repository access and honors repository instruction files such as `AGENTS.md`. GitHub branch protection, required CI checks, PR contracts and human merge control remain the machine/process enforcement layer when an agent ignores prose instructions.
