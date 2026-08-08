#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <release-dir> <expected-git-sha>" >&2
  exit 64
fi

release_dir="$1"
expected_sha="$2"

case "$expected_sha" in
  ''|*[!0-9a-f]*) echo "expected revision must be a lowercase git SHA" >&2; exit 65 ;;
esac

if [ "${#expected_sha}" -ne 40 ]; then
  echo "expected revision must be a full 40-character git SHA" >&2
  exit 65
fi

for command in node sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

required_paths=(
  "REVISION"
  "BUILD.json"
  "frontend/browser/index.html"
  "frontend/server/server.mjs"
  "backend/dist/main.js"
  "deploy/release.sh"
  "deploy/rollback-release.sh"
  "deploy/health-check.sh"
)

for path in "${required_paths[@]}"; do
  if [ ! -e "${release_dir}/${path}" ]; then
    echo "release candidate is incomplete: missing ${path}" >&2
    exit 66
  fi
done

actual_revision="$(tr -d '\r\n' < "${release_dir}/REVISION")"
if [ "$actual_revision" != "$expected_sha" ]; then
  echo "release revision mismatch: expected ${expected_sha}, got ${actual_revision}" >&2
  exit 65
fi

node - "$release_dir/BUILD.json" "$expected_sha" <<'NODE'
const fs = require('node:fs');
const [manifestPath, expectedSha] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.revision !== expectedSha) {
  console.error(`BUILD.json revision mismatch: expected ${expectedSha}, got ${manifest.revision}`);
  process.exit(65);
}
if (!manifest.workflow_run || String(manifest.workflow_run).trim() === '') {
  console.error('BUILD.json workflow_run is missing');
  process.exit(66);
}
NODE

find "${release_dir}" -type f -print0 \
  | sort -z \
  | xargs -0 sha256sum \
  > "${release_dir}/CERTIFICATION_FILE_HASHES.sha256"

printf '%s\n' "$expected_sha" > "${release_dir}/CERTIFIED_REVISION"
echo "release candidate provenance validated: ${expected_sha}"
