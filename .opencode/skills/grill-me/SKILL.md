---
name: grill-me
description: Interrogate unclear requirements before a major or irreversible implementation. Inspect repository evidence first, then ask only high-value unanswered questions in small prioritized batches.
---

# grill-me

Resolve meaningful requirement ambiguity before a large or irreversible change.

## When to use
- Creating a major feature.
- Changing architecture.
- Changing the database schema.
- Changing authentication or authorization.
- Integrating an external service.
- Changing destructive or irreversible behavior.
- Requirements contain meaningful ambiguity that affects behavior.

## When NOT to use
- Fixing a small obvious typo.
- Applying a clearly specified minor UI change.
- Performing a read-only review.
- The answer is already present in repository documentation / code.

## Inputs
- The feature/change request.
- Existing repository state (inspect first).

## Rules
- First inspect existing code and documentation; never ask what evidence answers.
- Ask questions in small, prioritized batches.
- Start with the highest-impact uncertainty.
- Explain briefly why each question matters.
- Offer recommended defaults when helpful.
- Separate blocking questions from optional preferences.
- Stop questioning once enough information exists.
- Produce a final requirements brief before implementation.

## Question areas (as relevant)
User/business goal, users and roles, scope and exclusions, desired behavior, user flow, data model, permissions, validation, error states, edge cases, compatibility, accessibility, security, performance, analytics, migration, rollout, acceptance criteria.

## Safety constraints
- Do NOT implement during this skill.
- Do not invent requirements; record real answers.

## Expected output
- Confirmed requirements.
- Assumptions.
- Exclusions.
- Open questions.
- Acceptance criteria.
- Implementation readiness status (ready / needs more answers).

## Completion criteria
- High-value unknowns resolved or explicitly deferred.
- Requirements brief produced.
- Readiness status stated.
