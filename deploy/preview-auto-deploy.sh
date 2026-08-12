#!/usr/bin/env bash
set -euo pipefail

repo="${PREVIEW_DEPLOY_REPOSITORY:-codebymoein/gallery-mazhari-angular}"
preview_root="${PREVIEW_BROWSER_ROOT:-/var/www/gallery-mazhari-preview/browser}"
cache_root="${PREVIEW_DEPLOY_CACHE_ROOT:-/var/cache/gallery-mazhari/preview}"
state_root="${PREVIEW_STATE_ROOT:-/srv/gallery-mazhari-preview}"
releases_api_url="https://api.github.com/repos/${repo}/releases?per_page=30"

if [ "$(id -u)" -ne 0 ]; then
  echo "preview auto-deploy must run as root" >&2
  exit 77
fi

for command in curl python3 sha256sum tar install mv; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

releases_json="$(mktemp)"
cleanup() {
  rm -f "$releases_json"
}
trap cleanup EXIT

curl --fail --silent --show-error --max-time 20 \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$releases_api_url" > "$releases_json"

mapfile -t preview_fields < <(
  python3 - "$releases_json" <<'PY'
import json
import re
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    releases = json.load(handle)

pattern = re.compile(r"^preview-pr-(\d+)-([0-9a-f]{40})$")
for release in releases:
    if release.get("draft") or not release.get("prerelease"):
        continue
    match = pattern.fullmatch(str(release.get("tag_name", "")))
    if not match:
        continue
    pr_number, revision = match.groups()
    expected_artifact = f"gallery-mazhari-preview-{revision}.tar.gz"
    expected_checksum = f"{expected_artifact}.sha256"
    assets = {
        asset.get("name"): asset.get("browser_download_url")
        for asset in release.get("assets", [])
    }
    artifact_url = assets.get(expected_artifact)
    checksum_url = assets.get(expected_checksum)
    if artifact_url and checksum_url:
        print(pr_number)
        print(revision)
        print(artifact_url)
        print(checksum_url)
        break
PY
)

if [ "${#preview_fields[@]}" -eq 0 ]; then
  echo "no complete PR preview release is available yet"
  exit 0
fi
if [ "${#preview_fields[@]}" -ne 4 ]; then
  echo "preview release metadata is incomplete" >&2
  exit 65
fi

pr_number="${preview_fields[0]}"
revision="${preview_fields[1]}"
artifact_url="${preview_fields[2]}"
checksum_url="${preview_fields[3]}"

install -d -m 0755 "$state_root" "$(dirname "$preview_root")"
install -d -m 0750 "$cache_root"

if [ -f "${state_root}/LAST_PREVIEW_REVISION" ] \
  && [ "$(tr -d '\r\n' < "${state_root}/LAST_PREVIEW_REVISION")" = "$revision" ] \
  && [ -f "${preview_root}/PREVIEW.json" ]; then
  echo "preview is already on PR #${pr_number} ${revision}"
  exit 0
fi

release_cache="${cache_root}/${revision}"
artifact="${release_cache}/gallery-mazhari-preview-${revision}.tar.gz"
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

publish_parent="$(dirname "$preview_root")"
publish_name="$(basename "$preview_root")"
publish_next="${publish_parent}/${publish_name}.next"
publish_previous="${publish_parent}/${publish_name}.previous"

rm -rf "$publish_next"
install -d -m 0755 "$publish_next"
tar -xzf "$artifact" -C "$publish_next"

python3 - "$publish_next/PREVIEW.json" "$revision" "$pr_number" <<'PY'
import json
import sys

path, revision, pr_number = sys.argv[1:4]
with open(path, encoding="utf-8") as handle:
    payload = json.load(handle)
if payload.get("revision") != revision:
    raise SystemExit("preview manifest revision mismatch")
if str(payload.get("pull_request")) != pr_number:
    raise SystemExit("preview manifest pull-request mismatch")
PY

[ -f "${publish_next}/index.html" ] || {
  echo "preview browser entry point is missing" >&2
  rm -rf "$publish_next"
  exit 66
}
chmod -R a+rX "$publish_next"

rm -rf "$publish_previous"
if [ -e "$preview_root" ]; then
  mv "$preview_root" "$publish_previous"
fi
if ! mv "$publish_next" "$preview_root"; then
  if [ -e "$publish_previous" ]; then
    mv "$publish_previous" "$preview_root" || true
  fi
  exit 70
fi

printf '%s\n' "$revision" > "${state_root}/LAST_PREVIEW_REVISION"
printf '%s\n' "$pr_number" > "${state_root}/LAST_PREVIEW_PR"

echo "PR preview published: PR #${pr_number} ${revision}"
