# 15 — Observability

Observability must make failures diagnosable without exposing sensitive data.

## Minimum signals
- API: startup/config failures, request errors, latency/status aggregates, auth abuse indicators.
- Database: connectivity, migration state, slow/erroring queries, pool/resource pressure.
- Jobs/imports: job/import ID, type, state, attempt, duration, failure reason, processed/rejected counts.
- Media: attached/orphan/quarantined/failed derivative counts.
- Business workflows: failed/invalid transitions and publication/import rejection counts without logging sensitive payloads.

## Logging rules
Use structured, searchable context (request/job/import/entity identifiers). Never log passwords, reset tokens, JWTs, secrets, full payment credentials, or unnecessary customer PII. Errors exposed to clients are safe summaries; diagnostic detail stays server-side.

## Health
Health checks distinguish process availability from dependency readiness where practical. A healthy frontend alone does not prove backend/database/job health.

## Alerting
Alert on actionable symptoms: sustained error rate, unavailable API/database, stuck/failed critical jobs, backup failure, disk/storage exhaustion. Avoid alerts that fire on normal business rejection such as a correctly blocked invalid import.
