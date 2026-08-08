#!/usr/bin/env bash
set -euo pipefail

repo="${V2_DEPLOY_REPOSITORY:-codebymoein/gallery-mazhari-angular}"
api_url="https://api.github.com/repos/${repo}/releases?per_page=20"
app_root="${APP_ROOT:-/srv/gallery-mazhari}"
cache_root="${V2_DEPLOY_CACHE_ROOT:-/var/cache/gallery-mazhari/v2}"
legacy_browser_root="${V2_LEGACY_BROWSER_ROOT:-/var/www/gallery-mazhari/browser}"
legacy_backend_service="${V2_LEGACY_BACKEND_SERVICE:-gallery-mazhari-api.service}"
backend_service="${BACKEND_SERVICE_NAME:-gallery-mazhari-backend.service}"
ssr_service="${SSR_SERVICE_NAME:-gallery-mazhari-ssr.service}"
backend_ready_url="${BACKEND_READY_URL:-http://127.0.0.1:3000/api/ops/health/ready}"
backend_version_url="${BACKEND_VERSION_URL:-http://127.0.0.1:3000/api/ops/version}"
ssr_ready_url="${SSR_READY_URL:-http://127.0.0.1:4000/}"
ssr_ready_host="${SSR_READY_HOST:-v2.gallerymazhari.com}"

if [ "$(id -u)" -ne 0 ]; then
  echo "v2 auto-deploy must run as root" >&2
  exit 77
fi

for command in curl python3 sha256sum tar systemctl install mv readlink; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

release_json="$(mktemp)"
release_runner="$(mktemp)"
cleanup() {
  rm -f "$release_json" "$release_runner"
}
trap cleanup EXIT

curl --fail --silent --show-error --max-time 20 \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$api_url" > "$release_json"

mapfile -t release_fields < <(
  python3 - "$release_json" <<'PY'
import json
import re
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    releases = json.load(handle)

for release in releases:
    tag = str(release.get("tag_name", ""))
    if not tag.startswith("auto-v2-"):
        continue
    revision = tag.removeprefix("auto-v2-")
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        continue
    expected_artifact = f"gallery-mazhari-{revision}.tar.gz"
    expected_checksum = f"{expected_artifact}.sha256"
    assets = {asset.get("name"): asset.get("browser_download_url") for asset in release.get("assets", [])}
    artifact_url = assets.get(expected_artifact)
    checksum_url = assets.get(expected_checksum)
    if artifact_url and checksum_url:
        print(revision)
        print(artifact_url)
        print(checksum_url)
        break
PY
)

if [ "${#release_fields[@]}" -ne 3 ]; then
  echo "no complete auto-v2 release is available yet"
  exit 0
fi

revision="${release_fields[0]}"
artifact_url="${release_fields[1]}"
checksum_url="${release_fields[2]}"

if [ -f "${app_root}/LAST_DEPLOYED_REVISION" ] \
  && [ "$(tr -d '\r\n' < "${app_root}/LAST_DEPLOYED_REVISION")" = "$revision" ]; then
  echo "V2 is already on ${revision}"
  exit 0
fi

release_cache="${cache_root}/${revision}"
artifact="${release_cache}/gallery-mazhari-${revision}.tar.gz"
checksum="${artifact}.sha256"
install -d -m 0750 "$release_cache"

if [ ! -f "$artifact" ]; then
  curl --fail --location --silent --show-error --max-time 300 \
    "$artifact_url" -o "${artifact}.partial"
  mv "${artifact}.partial" "$artifact"
fi
if [ ! -f "$checksum" ]; then
  curl --fail --location --silent --show-error --max-time 30 \
    "$checksum_url" -o "${checksum}.partial"
  mv "${checksum}.partial" "$checksum"
fi

(
  cd "$release_cache"
  sha256sum --check "$(basename "$checksum")"
)

previous_revision=""
if [ -L "${app_root}/current" ] && [ -f "${app_root}/current/REVISION" ]; then
  previous_revision="$(tr -d '\r\n' < "${app_root}/current/REVISION")"
fi

legacy_was_active=false
if systemctl is-active --quiet "$legacy_backend_service"; then
  legacy_was_active=true
  systemctl stop "$legacy_backend_service"
fi

restore_legacy_backend() {
  if [ "$legacy_was_active" = true ]; then
    systemctl stop "$backend_service" "$ssr_service" >/dev/null 2>&1 || true
    systemctl start "$legacy_backend_service" || true
  fi
}

tar -xOf "$artifact" "release-${revision}/deploy/release.sh" > "$release_runner"
chmod 0750 "$release_runner"

set +e
APP_ROOT="$app_root" \
BACKEND_SERVICE_NAME="$backend_service" \
SSR_SERVICE_NAME="$ssr_service" \
bash "$release_runner" "$artifact" "$checksum"
deploy_status=$?
set -e

if [ "$deploy_status" -ne 0 ]; then
  echo "release activation failed for ${revision}" >&2
  restore_legacy_backend
  exit "$deploy_status"
fi

healthy=false
for _ in 1 2 3 4 5 6; do
  if curl --fail --silent --show-error --max-time 5 "$backend_ready_url" >/dev/null \
    && curl --fail --silent --show-error --max-time 5 -H "Host: ${ssr_ready_host}" "$ssr_ready_url" >/dev/null; then
    healthy=true
    break
  fi
  sleep 5
done

version_revision=""
if [ "$healthy" = true ]; then
  version_revision="$(
    curl --fail --silent --show-error --max-time 5 "$backend_version_url" \
      | python3 -c 'import json,sys; print(json.load(sys.stdin).get("revision", ""))'
  )" || true
fi

if [ "$healthy" != true ] || [ "$version_revision" != "$revision" ]; then
  echo "post-deploy health/provenance check failed for ${revision}" >&2
  if [ -n "$previous_revision" ] && [ -x "${app_root}/current/deploy/rollback-release.sh" ]; then
    APP_ROOT="$app_root" \
    BACKEND_SERVICE_NAME="$backend_service" \
    SSR_SERVICE_NAME="$ssr_service" \
    BACKEND_READY_URL="$backend_ready_url" \
    SSR_READY_URL="$ssr_ready_url" \
    SSR_READY_HOST="$ssr_ready_host" \
    bash "${app_root}/current/deploy/rollback-release.sh" "$previous_revision" || true
  else
    restore_legacy_backend
  fi
  exit 70
fi

# V2-only compatibility bridge: the current v2.gallerymazhari.com Nginx host is
# still a static browser-root host. Keep it updated atomically until that host
# is deliberately migrated to the canonical SSR reverse-proxy configuration.
publish_source="${app_root}/current/frontend/browser"
publish_parent="$(dirname "$legacy_browser_root")"
publish_name="$(basename "$legacy_browser_root")"
publish_next="${publish_parent}/${publish_name}.next"
publish_previous="${publish_parent}/${publish_name}.previous"

rm -rf "$publish_next"
install -d -m 0755 "$publish_next"
cp -a "${publish_source}/." "$publish_next/"
if [ ! -f "${publish_next}/index.html" ] && [ -f "${publish_next}/index.csr.html" ]; then
  cp "${publish_next}/index.csr.html" "${publish_next}/index.html"
fi
[ -f "${publish_next}/index.html" ] || {
  echo "V2 browser compatibility entry point is missing" >&2
  rm -rf "$publish_next"
  exit 66
}
chmod -R a+rX "$publish_next"

rm -rf "$publish_previous"
if [ -e "$legacy_browser_root" ]; then
  mv "$legacy_browser_root" "$publish_previous"
fi
if ! mv "$publish_next" "$legacy_browser_root"; then
  if [ -e "$publish_previous" ]; then
    mv "$publish_previous" "$legacy_browser_root" || true
  fi
  exit 70
fi

if [ "$legacy_was_active" = true ]; then
  systemctl disable "$legacy_backend_service" >/dev/null 2>&1 || true
fi

echo "V2 auto-deploy completed: ${revision}"
