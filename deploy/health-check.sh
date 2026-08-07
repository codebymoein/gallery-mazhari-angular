#!/usr/bin/env bash
set -euo pipefail

ready_url="${BACKEND_READY_URL:-http://127.0.0.1:3000/api/ops/health/ready}"
alert_webhook_url="${ALERT_WEBHOOK_URL:-}"
service_name="${BACKEND_SERVICE_NAME:-gallery-mazhari-backend.service}"

for command in curl systemctl; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

if systemctl is-active --quiet "$service_name" && \
  curl --fail --silent --show-error --max-time 5 "$ready_url" >/dev/null; then
  echo "backend readiness check passed"
  exit 0
fi

message="Gallery Mazhari backend readiness check failed on $(hostname)"
echo "$message" >&2

if [ -n "$alert_webhook_url" ]; then
  curl --fail --silent --show-error \
    --max-time 10 \
    -H 'Content-Type: application/json' \
    --data "{\"text\":\"${message}\"}" \
    "$alert_webhook_url" >/dev/null || {
      echo "alert webhook delivery failed" >&2
      exit 70
    }
fi

exit 1
