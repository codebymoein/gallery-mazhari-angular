# GM-025 — Knip graph calibration

## Objective
Make Knip dead-code evidence trustworthy before any code deletion by teaching it the actual Angular and NestJS entry/project boundaries.

## Base
`main@04bda51b0bc38adc1207bb9b4dab59b09463d6f4`

## Current evidence defect
The repaired GM-024 Knip run produced structured JSON, but the first-pass report marked known runtime entry files such as `backend/src/main.ts`, `backend/src/app.module.ts`, active controllers/services, and repository tooling as unused files. This demonstrates an incomplete module graph, not safe deletion candidates.

## In scope
- add an explicit Knip v6 configuration;
- model the root Angular application and `backend` NestJS package as separate workspaces;
- declare the Angular browser/server/SSR entry files;
- declare the NestJS runtime and TypeORM data-source entry files;
- define TypeScript project boundaries for application, e2e, backend source, and backend tests;
- compare the resulting exact-head Knip artifact with the GM-024 baseline.

## Out of scope
- deleting or refactoring any product code;
- suppressing findings with broad `ignore` rules;
- changing Angular/NestJS runtime behavior;
- dependency, database, migration, API, media, SEO, deployment, or business workflow changes.

## Acceptance
- Knip runs successfully with zero stderr/tool crashes;
- known active runtime entry files are no longer reported as unused files;
- findings reduce to a materially more credible baseline;
- any remaining candidate dead code is triaged in later focused tasks;
- all exact-head project quality gates remain green.

## Recovery
Revert this focused configuration PR to return to the previous zero-config Knip behavior. No runtime or data recovery is required.
