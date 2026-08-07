#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <release.tar.gz> <release.tar.gz.sha256>" >&2
  exit 64
fi

artifact="$1"
checksum_file="$2"
app_root="${APP_ROOT:-/srv/gallery-mazhari}"
env_file="${BACKEND_ENV_FILE:-/etc/gallery-mazhari/backend.env}"
service_name="${BACKEND_SERVICE_NAME:-gallery-mazhari-backend.service}"
lock_file="${DEPLOY_LOCK_FILE:-/var/lock/gallery-mazhari-deploy.lock}"

for command in sha256sum tar node systemctl flock readlink; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

exec 9>"$lock_file"
flock -n 9 || { echo "another deployment is already running" >&2; exit 75; }

[ -f "$artifact" ] || { echo "release artifact not found" >&2; exit 66; }
[ -f "$checksum_file" ] || { echo "checksum file not found" >&2; exit 66; }
[ -r "$env_file" ] || { echo "backend environment file not readable: $env_file" >&2; exit 78; }

artifact_dir="$(cd "$(dirname "$artifact")" && pwd)"
artifact_name="$(basename "$artifact")"
checksum_name="$(basename "$checksum_file")"
(
  cd "$artifact_dir"
  sha256sum --check "$checksum_name"
)

revision="${artifact_name#gallery-mazhari-}"
revision="${revision%.tar.gz}"
case "$revision" in
  ''|*[!0-9a-f]*) echo "artifact revision is not a lowercase git SHA" >&2; exit 65 ;;
esac

releases_dir="${app_root}/releases"
release_dir="${releases_dir}/${revision}"
staging_dir="${releases_dir}/.${revision}.staging"
current_link="${app_root}/current"

mkdir -p "$releases_dir"
if [ -e "$release_dir" ]; then
  echo "release already exists: $release_dir" >&2
  exit 73
fi
rm -rf "$staging_dir"
mkdir -p "$staging_dir"
tar -xzf "$artifact" -C "$staging_dir" --strip-components=1

[ "$(cat "$staging_dir/REVISION")" = "$revision" ] || {
  echo "artifact revision metadata mismatch" >&2
  rm -rf "$staging_dir"
  exit 65
}
[ -f "$staging_dir/backend/dist/main.js" ] || { echo "backend build missing" >&2; exit 65; }
[ -f "$staging_dir/frontend/index.html" ] || { echo "frontend build missing" >&2; exit 65; }

mv "$staging_dir" "$release_dir"

set -a
# shellcheck disable=SC1090
. "$env_file"
set +a

(
  cd "$release_dir/backend"
  node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
)

previous_target=""
if [ -L "$current_link" ]; then
  previous_target="$(readlink -f "$current_link")"
fi

ln -sfn "$release_dir" "${current_link}.next"
mv -Tf "${current_link}.next" "$current_link"

if ! systemctl restart "$service_name"; then
  echo "backend restart failed; restoring previous release symlink" >&2
  if [ -n "$previous_target" ]; then
    ln -sfn "$previous_target" "${current_link}.rollback"
    mv -Tf "${current_link}.rollback" "$current_link"
    systemctl restart "$service_name" || true
  fi
  exit 70
fi

printf '%s\n' "$revision" > "${app_root}/LAST_DEPLOYED_REVISION"
echo "release activated: $revision"
