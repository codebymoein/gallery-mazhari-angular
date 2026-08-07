# 18 — Documentation Governance

Documentation is versioned with the implementation.

## Hierarchy
1. `CONSTITUTION.md` — project governance.
2. `AGENTS.md` — mandatory automation entry point.
3. `docs/handbook/` — engineering operating rules.
4. Specialized architecture, API, deployment, design and security documents — detailed contracts and evidence.
5. Code comments — local rationale, not replacement architecture documentation.

If documents conflict, reconcile the conflict in the Pull Request or escalate it for owner decision.

## Required updates
A Pull Request MUST update documentation when it changes architecture boundaries, source of truth, persistent schema, API contracts, workflow states or transitions, authorization, deployment or rollback, backup assumptions, media/storage, design tokens, or required test/release gates.

## Writing standard
Use concrete paths, commands, states and verification criteria. Clearly label future architecture as planned. Never describe an unimplemented control as active. Remove stale instructions only after confirming they are obsolete.

## Link and freshness checks
Documentation changes must verify relative links resolve on the branch and references use current paths. The handbook index must include every normative chapter. Renames or moves require updating inbound links.

## Governance changes
Constitution changes require explicit rationale and owner approval. Handbook changes require review by someone able to validate the affected technical or domain area. Living Documentation means code and its governing contract should change together whenever practical.
