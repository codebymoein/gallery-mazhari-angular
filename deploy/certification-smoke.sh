#!/usr/bin/env bash
set -euo pipefail

storefront_url="${STOREFRONT_URL:-http://127.0.0.1:4000}"
backend_url="${BACKEND_URL:-http://127.0.0.1:3000}"
expected_revision="${EXPECTED_REVISION:-}"
storefront_host="${STOREFRONT_HOST:-gallery-mazhari.ir}"

if [ -z "$expected_revision" ]; then
  echo "EXPECTED_REVISION is required" >&2
  exit 64
fi

case "$expected_revision" in
  ''|*[!0-9a-f]*) echo "EXPECTED_REVISION must be a lowercase git SHA" >&2; exit 65 ;;
esac

if [ "${#expected_revision}" -ne 40 ]; then
  echo "EXPECTED_REVISION must be a full 40-character git SHA" >&2
  exit 65
fi

for command in curl node; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

fetch_storefront() {
  local path="$1"
  local output="$2"
  curl --fail --silent --show-error --max-time 10 \
    -H "Host: ${storefront_host}" \
    "${storefront_url}${path}" > "$output"
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

for route in / /catalog /contact; do
  target="${tmp_dir}/$(printf '%s' "$route" | tr '/?' '__').html"
  fetch_storefront "$route" "$target"
  grep -Eiq '<title>[^<]+' "$target" || { echo "missing title on ${route}" >&2; exit 70; }
  grep -Eiq '<link[^>]+rel=["'"']canonical["'"']' "$target" || { echo "missing canonical on ${route}" >&2; exit 70; }
done

sitemap="${tmp_dir}/sitemap.xml"
fetch_storefront /sitemap.xml "$sitemap"
grep -q '<sitemapindex' "$sitemap" || { echo "sitemap index missing" >&2; exit 70; }

not_found="${tmp_dir}/404.html"
status="$(curl --silent --show-error --max-time 10 -o "$not_found" -w '%{http_code}' -H "Host: ${storefront_host}" "${storefront_url}/rm17-certification-not-found")"
[ "$status" = '404' ] || { echo "unknown route returned HTTP ${status}, expected 404" >&2; exit 70; }
grep -Eiq 'noindex' "$not_found" || { echo "404 response is missing noindex policy" >&2; exit 70; }

curl --fail --silent --show-error --max-time 10 "${backend_url}/api/ops/health/live" > "${tmp_dir}/live.json"
curl --fail --silent --show-error --max-time 10 "${backend_url}/api/ops/health/ready" > "${tmp_dir}/ready.json"
curl --fail --silent --show-error --max-time 10 "${backend_url}/api/ops/version" > "${tmp_dir}/version.json"

node - "${tmp_dir}/version.json" "$expected_revision" <<'NODE'
const fs = require('node:fs');
const [versionPath, expectedRevision] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const actual = payload.revision ?? payload.version?.revision;
if (actual !== expectedRevision) {
  console.error(`version endpoint revision mismatch: expected ${expectedRevision}, got ${actual}`);
  process.exit(70);
}
NODE

echo "release certification smoke passed for ${expected_revision}"
