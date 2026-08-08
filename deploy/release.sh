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
backend_service_name="${BACKEND_SERVICE_NAME:-gallery-mazhari-backend.service}"
ssr_service_name="${SSR_SERVICE_NAME:-gallery-mazhari-ssr.service}"
runtime_group="${RELEASE_RUNTIME_GROUP:-gallerymazhari}"
lock_file="${DEPLOY_LOCK_FILE:-/var/lock/gallery-mazhari-deploy.lock}"

for command in sha256sum tar node systemctl flock readlink getent chgrp chmod; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

getent group "$runtime_group" >/dev/null 2>&1 || {
  echo "release runtime group does not exist: $runtime_group" >&2
  exit 78
}

restart_runtime() {
  systemctl restart "$backend_service_name" && systemctl restart "$ssr_service_name"
}

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

candidate_certifier="$staging_dir/deploy/certify-release-candidate.sh"
if [ ! -f "$candidate_certifier" ]; then
  echo "release candidate is incomplete: missing deploy/certify-release-candidate.sh" >&2
  rm -rf "$staging_dir"
  exit 66
fi

set +e
bash "$candidate_certifier" "$staging_dir" "$revision"
certification_status=$?
set -e
if [ "$certification_status" -ne 0 ]; then
  rm -rf "$staging_dir"
  exit "$certification_status"
fi

# Artifacts can be extracted under a restrictive deployment umask. Keep root as
# owner, but grant the dedicated runtime group read/traverse access before the
# immutable release is activated. World access remains explicitly denied.
chgrp -R "$runtime_group" "$staging_dir"
chmod -R g+rX,o-rwx "$staging_dir"

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

if ! restart_runtime; then
  echo "application runtime restart failed; restoring previous release symlink" >&2
  if [ -n "$previous_target" ]; then
    ln -sfn "$previous_target" "${current_link}.rollback"
    mv -Tf "${current_link}.rollback" "$current_link"
    restart_runtime || true
  fi
  exit 70
fi

printf '%s\n' "$revision" > "${app_root}/LAST_DEPLOYED_REVISION"
echo "release activated: $revision"
