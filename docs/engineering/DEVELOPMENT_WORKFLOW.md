# Post-Remediation Development Workflow

Status: **Normative development workflow** for new features, product changes and non-emergency fixes after the remediation program.

This document supplements, and does not replace, `CONSTITUTION.md`, `AGENTS.md`, the Engineering Handbook, the Agent Task Manifest, and the repository PR contract. If rules conflict, higher-precedence governance wins.

## Purpose

The goal is to prevent feature growth from reintroducing overlapping authority, duplicate business logic, ad-hoc database fields, one-off UI styles, untested behavior, or opaque patches.

A user request is not direct authorization to change code. Every material change moves through the lifecycle below.

## Canonical lifecycle

`Idea / request -> Intake -> Classification -> Impact analysis -> Specification -> Implementation plan -> Focused branch -> Implementation + tests -> PR -> CI/review -> Staging acceptance when applicable -> Merge -> Release evidence / monitoring when applicable`

No material implementation begins before the request has a bounded scope and acceptance criteria.

## Change classification

### L1 — Presentation only
Examples: spacing, typography, approved color/token use, non-behavioral layout changes.

Expected impact: Angular/design system only. Backend, API and database changes are forbidden unless reclassification proves they are necessary.

### L2 — Frontend behavior
Examples: client interaction, sorting/filter UX using existing server contracts, form-flow improvements.

Expected impact: Angular/client state and existing APIs. No new domain authority may be created in browser state.

### L3 — Product feature
Examples: a new admin capability, merchandising rule, workflow option, persistent setting, new API behavior.

Expected impact may span Angular, NestJS, PostgreSQL and tests. Requires explicit domain/data/security assessment before implementation.

### L4 — Architecture / workflow / source-of-truth change
Examples: new workflow state, ERP integration, inventory authority change, auth model change, cross-domain service boundary change.

Requires a design decision record or equivalent architecture proposal, explicit owner approval, migration/recovery analysis where applicable, and updates to affected Handbook/architecture documentation.

When uncertain, classify upward until repository evidence proves the lower-risk class is sufficient.

## Mandatory impact analysis

Before implementation, record which surfaces are affected and why:

- user-facing behavior / UX;
- Angular components, routes, state and SSR/hydration;
- API contracts and DTO validation;
- NestJS business rules, authorization and audit;
- PostgreSQL entities, constraints, migrations and existing-data compatibility;
- protected Gallery Mazhari workflows and source-of-truth boundaries;
- media/storage;
- SEO, accessibility and performance;
- deployment, environment, observability and rollback;
- automated tests and documentation.

A surface marked `no impact` must be a reasoned conclusion, not an assumption.

## Design-before-code rules

- UI changes that materially alter appearance or interaction should have an agreed visual/behavioral outcome before broad implementation.
- Backend or persistent features must define authorization, validation, failure behavior, concurrency implications and rollback/recovery before code.
- New database fields must represent durable domain meaning. Do not add convenience booleans or parallel state when an existing model/capability should own the concept.
- Reuse established design tokens, services, domain paths and API conventions before creating new mechanisms.
- Do not broaden a feature PR into cleanup. Record unrelated debt separately.

## Implementation rules

- One focused branch/PR per logical capability.
- Branch from current verified `main`.
- Keep business invariants in NestJS/database layers; Angular guards are not authority.
- Behavior changes include proportionate automated tests in the same PR.
- Schema changes use forward migrations and include existing-data and recovery analysis.
- Do not bypass or weaken CI, security, accessibility, migration or release gates to ship a feature.
- Documentation changes travel with architecture, workflow, API, schema, security, design-system or operational behavior changes.

## Review gates

### Gate 1 — Product / design
The requested outcome and acceptance criteria are clear. For visual work, the intended result is agreed before large code changes.

### Gate 2 — Engineering
Architecture boundaries, security, data integrity, tests, documentation, rollback and CI are satisfactory.

### Gate 3 — Acceptance / release
Where staging or human acceptance is applicable, the exact candidate is verified before production. Production release follows existing release certification and deployment governance.

## Refactoring policy

Use the Boy Scout principle only inside the touched boundary and only when the refactor is small, behavior-preserving and makes the feature safer to implement. Large or unrelated refactors become separate backlog items/PRs.

Do not postpone necessary in-scope cleanup that is required to avoid duplicating authority or knowingly creating a defective abstraction.

## Emergency fixes

Urgent production fixes may use a narrower process, but still require:

- exact incident/problem statement;
- smallest safe scope;
- rollback/roll-forward path;
- applicable tests or explicit reason they cannot run;
- post-incident backlog item for any deferred structural work.

Emergency status is not permission to bypass security, data-integrity or direct-`main` rules.

## Completion

A feature is complete only when it satisfies `docs/engineering/DEFINITION_OF_DONE.md` and the repository PR/release requirements applicable to its risk class.
