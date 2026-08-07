# New Agent / New Chat Bootstrap

Use this document when handing Gallery Mazhari Angular to a new ChatGPT chat, Codex session, Claude/Cursor agent, IDE agent, or other automation.

## Principle
Do not make a new agent trust copied status, remembered SHAs, or a previous agent's claims. Point it to the repository and let the repository governance drive the rest. The root [`../../AGENTS.md`](../../AGENTS.md) is the mandatory entry point and contains the Fast Preflight Protocol.

## Preferred minimal bootstrap prompt

```text
Repo: codebymoein/gallery-mazhari-angular — execute AGENTS.md Fast Preflight, independently verify current GitHub state, and perform only this task: <TASK>. Give the mandatory compact pre-write report before any write.
```

For remediation continuation, this is enough:

```text
Repo: codebymoein/gallery-mazhari-angular — execute AGENTS.md Fast Preflight and continue from the first unfinished action in the real current Master Remediation Roadmap state. Verify GitHub independently and give the compact pre-write report before any write.
```

The prompt intentionally does **not** repeat Constitution, business workflows, architecture rules, Roadmap details, SHA, PR status, or Handbook chapter lists. Those belong in the repository and must be loaded according to `AGENTS.md` rather than copied into every chat.

## Expected compliant startup
A compliant agent should:
1. verify repository identity, current `main` SHA, and relevant PR/branch state;
2. read `AGENTS.md` and the Tier 1 sources;
3. select Handbook chapters using the task-risk matrix instead of loading the entire Handbook;
4. for remediation, read Roadmap hard gates + exact RM/PR slice + Definition of Done rather than unrelated RM sections;
5. inspect affected code/tests/docs;
6. return the compact pre-write report;
7. make no material write until human authorization is established.

## Compact pre-write shape
The preferred response is a compact table or equivalent block:

`repo/main SHA | Wave/RM/PR/findings | scope | non-scope | write surfaces | workflow/source-of-truth impact | data/security/deploy risk | tests/gates | recovery | branch`

It must also name the governance and selected Handbook documents actually read. It should not reproduce those documents.

## When to expand reading
Fast Preflight is risk-based, not shallow. Expand beyond the minimum when the task touches another architecture, workflow, security, database, media, deployment, design, SEO/performance/accessibility, or operational boundary; when a selected document links another source as mandatory; or when sources conflict or are ambiguous.

## Enforcement limits
Repository documentation cannot technically force an arbitrary external chat product to read files it cannot access. Enforcement is strongest when the agent has repository access and honors `AGENTS.md`. GitHub branch protection, required CI checks, PR contracts and human merge control remain the machine/process enforcement layer when an agent ignores prose instructions.
