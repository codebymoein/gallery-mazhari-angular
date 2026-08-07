#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <target-release-sha>" >&2
  exit 64
fi

target_revision="$1"
app_root="${APP_ROOT:-/srv/gallery-mazhari}"
service_name="${BACKEND_SERVICE_NAME:-gallery-mazhari-backend.service}"
health_url="${BACKEND_READY_URL:-http://127.0.0.1:3000/api/ops/health/ready}"
lock_file="${DEPLOY_LOCK_FILE:-/var/lock/gallery-mazhari-deploy.lock}"

case "$target_revision" in
  ''|*[!0-9a-f]*) echo "target release must be a lowercase git SHA" >&2; exit 65 ;;
esac

for command in curl flock readlink systemctl; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

exec 9>"$lock_file"
flock -n 9 || { echo "deployment/rollback operation already running" >&2; exit 75; }

current_link="${app_root}/current"
target_dir="${app_root}/releases/${target_revision}"
[ -d "$target_dir" ] || { echo "target release does not exist: $target_dir" >&2; exit 66; }
[ -f "$target_dir/REVISION" ] || { echo "target release REVISION missing" >&2; exit 65; }
[ "$(cat "$target_dir/REVISION")" = "$target_revision" ] || {
  echo "target release revision metadata mismatch" >&2
  exit 65
}

previous_target=""
if [ -L "$current_link" ]; then
  previous_target="$(readlink -f "$current_link")"
fi

ln -sfn "$target_dir" "${current_link}.rollback"
mv -Tf "${current_link}.rollback" "$current_link"

if ! systemctl restart "$service_name"; then
  echo "rollback target restart failed" >&2
  if [ -n "$previous_target" ]; then
    ln -sfn "$previous_target" "${current_link}.failed-rollback"
    mv -Tf "${current_link}.failed-rollback" "$current_link"
    systemctl restart "$service_name" || true
  fi
  exit 70
fi

healthy=false
for _ in 1 2 3 4 5 6; do
  if curl --fail --silent --show-error --max-time 5 "$health_url" >/dev/null; then
    healthy=true
    break
  fi
  sleep 5
done

if [ "$healthy" != true ]; then
  echo "rollback target failed readiness probe" >&2
  if [ -n "$previous_target" ]; then
    ln -sfn "$previous_target" "${current_link}.failed-rollback"
    mv -Tf "${current_link}.failed-rollback" "$current_link"
    systemctl restart "$service_name" || true
  fi
  exit 70
fi

printf '%s\n' "$target_revision" > "${app_root}/LAST_DEPLOYED_REVISION"
echo "release rollback completed: $target_revision"
echo "database state was not rolled back"
