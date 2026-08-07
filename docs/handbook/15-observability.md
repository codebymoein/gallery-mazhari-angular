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

PR-015 configures the NestJS application logger to emit JSON records and emits one structured request-completion record containing request ID, method, path without query string, response status, and duration. The request ID is returned as `x-request-id`. Request bodies, authorization headers and query strings are deliberately excluded from the request log contract.

## Health and version contract
PR-015 exposes operational endpoints beneath the existing `/api` prefix:

- `GET /api/ops/health/live` proves the process event loop is serving requests.
- `GET /api/ops/health/ready` verifies PostgreSQL with a bounded `SELECT 1` dependency check and returns HTTP 503 when the dependency is unavailable.
- `GET /api/ops/version` exposes only safe release provenance: immutable release revision, workflow/build identifier and environment name. Production provenance is read from the release artifact `REVISION` and `BUILD.json` files when present.
- `GET /api/ops/metrics` emits Prometheus-text process uptime and memory gauges. It MUST NOT expose secrets, customer data or business payloads.

Health checks distinguish process availability from dependency readiness. A healthy frontend alone does not prove backend/database/job health.

## Alerting
Alert on actionable symptoms: sustained error rate, unavailable API/database, stuck/failed critical jobs, backup failure, disk/storage exhaustion. Avoid alerts that fire on normal business rejection such as a correctly blocked invalid import.

`deploy/health-check.sh` provides the host-level readiness probe used by operational monitoring. It fails visibly if either systemd process state or backend readiness fails and can optionally deliver a generic alert to `ALERT_WEBHOOK_URL`. The webhook credential/value belongs in protected host configuration, never Git.

Backup-job failure alerting and provider-level storage/disk alerts remain infrastructure responsibilities; a successful application health response must never mask a failed backup job.

## Verification
Backend tests cover readiness success/failure, safe version output and metrics shape. Deployment CI validates operational shell syntax and ShellCheck. Production/staging monitoring must additionally prove that readiness failure is observable and that the configured external alert destination receives a test notification before certification.
