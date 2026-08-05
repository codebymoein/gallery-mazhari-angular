---
name: feature-planning
description: Turn a confirmed feature request into an implementation-ready plan. Inspect related code, define scope, impact, risks, acceptance criteria, and a verification plan. Do not implement unless asked.
---

# feature-planning

Produce an implementation-ready plan from a confirmed feature request.

## When to use
- A feature/change has been confirmed (requirements clear or clarified via `grill-me`).
- A plan is needed before coding.

## When NOT to use
- Requirements still ambiguous (use `grill-me` first).
- The user asked for implementation directly (may still plan briefly then implement).
- Trivial one-line changes.

## Inputs
- Confirmed feature request / acceptance criteria.
- Related repository code.

## Workflow
1. Inspect related implementation and existing patterns.
2. Summarize the requested behavior.
3. Define scope and non-scope.
4. Identify affected components, APIs, data, permissions, tests, documentation.
5. Identify reuse opportunities (existing functions/components/services).
6. Identify risks and edge cases.
7. Define acceptance criteria.
8. Produce an ordered implementation plan.
9. Produce a verification plan.
10. Do NOT implement unless explicitly asked.

## Safety constraints
- Read-only unless the user explicitly asks for implementation.
- Reuse existing code; avoid new dependencies.

## Expected output
- Objective and user story.
- Scope and non-scope.
- Current and desired behavior.
- Affected files or modules.
- Data and API impact.
- Security and performance considerations.
- Edge cases.
- Acceptance criteria.
- Ordered implementation steps.
- Test plan.
- Rollback considerations.

## Completion criteria
- Plan is specific enough for an agent to implement without guessing.
- Acceptance criteria and verification plan defined.
