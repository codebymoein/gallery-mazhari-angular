#!/usr/bin/env bash
set -euo pipefail

repo="${V2_DEPLOY_REPOSITORY:-codebymoein/gallery-mazhari-angular}"
main_api_url="https://api.github.com/repos/${repo}/commits/main"
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

main_json="$(mktemp)"
release_json="$(mktemp)"
release_runner="$(mktemp)"
cleanup() {
  rm -f "$main_json" "$release_json" "$release_runner"
}
trap cleanup EXIT

curl --fail --silent --show-error --max-time 20 \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$main_api_url" > "$main_json"

revision="$(
  python3 - "$main_json" <<'PY'
import json
import re
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)

revision = str(payload.get("sha", ""))
if not re.fullmatch(r"[0-9a-f]{40}", revision):
    raise SystemExit("GitHub main response did not contain a valid commit SHA")
print(revision)
PY
)"

runtime_matches_revision() {
  [ -L "${app_root}/current" ] || return 1
  [ -f "${app_root}/current/REVISION" ] || return 1
  [ "$(tr -d '\r\n' < "${app_root}/current/REVISION")" = "$revision" ] || return 1
  systemctl is-active --quiet "$backend_service" || return 1
  systemctl is-active --quiet "$ssr_service" || return 1
  curl --fail --silent --show-error --max-time 5 "$backend_ready_url" >/dev/null || return 1
  curl --fail --silent --show-error --max-time 5 -H "Host: ${ssr_ready_host}" "$ssr_ready_url" >/dev/null || return 1
  local live_revision
  live_revision="$(curl --fail --silent --show-error --max-time 5 "$backend_version_url" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("revision", ""))')" || return 1
  [ "$live_revision" = "$revision" ]
}

if [ -f "${app_root}/LAST_DEPLOYED_REVISION" ] \
  && [ "$(tr -d '\r\n' < "${app_root}/LAST_DEPLOYED_REVISION")" = "$revision" ] \
  && runtime_matches_revision; then
  echo "V2 is already healthy on ${revision}"
  exit 0
fi

tag="auto-v2-${revision}"
release_api_url="https://api.github.com/repos/${repo}/releases/tags/${tag}"
release_http_status="$(
  curl --silent --show-error --max-time 20 \
    -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    --output "$release_json" \
    --write-out '%{http_code}' \
    "$release_api_url"
)"

if [ "$release_http_status" = "404" ]; then
  echo "exact-main V2 release is not available yet: ${tag}"
  exit 0
fi
if [ "$release_http_status" != "200" ]; then
  echo "GitHub release lookup failed for ${tag}: HTTP ${release_http_status}" >&2
  exit 69
fi

mapfile -t release_fields < <(
  python3 - "$release_json" "$revision" <<'PY'
import json
import sys

release_path, revision = sys.argv[1:3]
with open(release_path, encoding="utf-8") as handle:
    release = json.load(handle)

expected_tag = f"auto-v2-{revision}"
if str(release.get("tag_name", "")) != expected_tag:
    raise SystemExit("release tag does not match exact main revision")
if not bool(release.get("prerelease")):
    raise SystemExit("exact-main V2 release is not marked prerelease")

expected_artifact = f"gallery-mazhari-{revision}.tar.gz"
expected_checksum = f"{expected_artifact}.sha256"
assets = {asset.get("name"): asset.get("browser_download_url") for asset in release.get("assets", [])}
artifact_url = assets.get(expected_artifact)
checksum_url = assets.get(expected_checksum)
if artifact_url and checksum_url:
    print(artifact_url)
    print(checksum_url)
PY
)

if [ "${#release_fields[@]}" -ne 2 ]; then
  echo "exact-main V2 release exists but its immutable assets are not complete yet: ${tag}"
  exit 0
fi

artifact_url="${release_fields[0]}"
checksum_url="${release_fields[1]}"
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
  if [ -n "$previous_revision" ] && [ "$previous_revision" != "$revision" ] && [ -x "${app_root}/current/deploy/rollback-release.sh" ]; then
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

printf '%s\n' "$revision" > "${app_root}/LAST_DEPLOYED_REVISION"

if [ "$legacy_was_active" = true ]; then
  systemctl disable "$legacy_backend_service" >/dev/null 2>&1 || true
fi

echo "V2 auto-deploy completed and verified: ${revision}"
