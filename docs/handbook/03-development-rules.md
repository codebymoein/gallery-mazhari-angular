# 03 — Development Rules

## Before editing
- Update/fetch `main`, record base SHA, create a focused branch, read `AGENTS.md` and relevant handbook chapters.
- Inspect affected code, tests, models, API contracts, and specialized docs. Search for all consumers before changing shared types/statuses.

## Code rules
- TypeScript changes MUST preserve strict typing; avoid `any` unless boundary data is narrowed immediately and the reason is documented.
- Validate untrusted data at API/file boundaries. Normalize only where domain rules explicitly permit it; product codes/leading zeros must not be accidentally coerced.
- Do not duplicate constants, status vocabularies, category rules, or business algorithms across UI/backend when one layer is authoritative.
- No unrelated formatting/refactor churn. No dead-code deletion without proving it is not part of a workflow, migration, operational script, or compatibility path.
- Environment-specific values belong in validated configuration, not source literals. Secrets never belong in frontend environments.

## Dependency rules
A new dependency requires: demonstrated need, maintained package, license/security consideration, bundle/runtime impact review, lockfile update, and removal of redundant alternatives where safe. Do not upgrade unrelated dependencies in a feature PR.

## Failure behavior
Expected domain rejection uses explicit errors/statuses; unexpected failures are logged without leaking secrets. Retryable jobs/actions must be idempotent or guarded against duplicate effects.

## Completion checks
Inspect changed paths, run applicable tests/build/lint, check migrations/API docs when relevant, and update handbook/specialized docs for contract changes.
