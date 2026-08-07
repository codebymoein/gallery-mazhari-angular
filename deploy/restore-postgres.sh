#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <backup.dump.age> <backup.dump.age.sha256>" >&2
  exit 64
fi

backup="$1"
checksum_file="$2"
confirmation="${RESTORE_CONFIRM_NON_PRODUCTION:-}"
target_url="${RESTORE_DATABASE_URL:-}"
identity_file="${RESTORE_AGE_IDENTITY_FILE:-}"

[ "${NODE_ENV:-}" != "production" ] || {
  echo "restore is forbidden when NODE_ENV=production" >&2
  exit 77
}
[ "$confirmation" = "I_UNDERSTAND_THIS_IS_NON_PRODUCTION" ] || {
  echo "set RESTORE_CONFIRM_NON_PRODUCTION=I_UNDERSTAND_THIS_IS_NON_PRODUCTION" >&2
  exit 77
}
[ -n "$target_url" ] || { echo "RESTORE_DATABASE_URL is required" >&2; exit 78; }
[ -r "$identity_file" ] || { echo "restore age identity is not readable" >&2; exit 78; }
[ -f "$backup" ] || { echo "backup not found" >&2; exit 66; }
[ -f "$checksum_file" ] || { echo "checksum file not found" >&2; exit 66; }

for command in age sha256sum pg_restore mktemp; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

backup_dir="$(cd "$(dirname "$backup")" && pwd)"
checksum_name="$(basename "$checksum_file")"
(
  cd "$backup_dir"
  sha256sum --check "$checksum_name"
)

plain_dump="$(mktemp)"
cleanup() {
  rm -f "$plain_dump"
}
trap cleanup EXIT

age --decrypt -i "$identity_file" -o "$plain_dump" "$backup"
pg_restore \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  --dbname "$target_url" \
  "$plain_dump"

echo "non-production PostgreSQL restore completed"
