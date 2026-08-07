# 11 — Git, Pull Requests & Releases

## Branching
`main` is protected by process: no direct development. Branch from current `main`. Use descriptive prefixes such as `feat/`, `fix/`, `docs/`, `chore/`, `security/`.

## Commits
Commits must be scoped and intelligible. Do not combine generated churn, dependency upgrades, refactors and business behavior unless inseparable. Never rewrite shared history without explicit coordination.

## Pull Request contract
Every PR states: purpose/scope; base SHA when relevant; files/areas changed; business workflow impact; data/migration impact; security impact; tests/checks; deployment impact; rollback/roll-forward; docs updated; known risks. Critical workflow changes require business approval evidence.

## Review
Author/agent must inspect final diff and file list. Reviewers check architecture boundaries, data integrity, authorization, tests, documentation and accidental deletions. AI-generated code receives the same review standard as human code.

## Releases
A release maps to a reviewed commit/tag and has deploy evidence. Database migration order is explicit. Production smoke checks cover API health and critical storefront/admin paths. Failed releases use the documented rollback/roll-forward plan; never “fix forward” blindly while data integrity is unknown.

AI agents MUST NOT merge their own PR unless the human owner explicitly instructs that merge.
