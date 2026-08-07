#!/usr/bin/env bash
set -euo pipefail

backup_root="${BACKUP_ROOT:-/var/backups/gallery-mazhari}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
remote_uri="${BACKUP_S3_URI:-}"
endpoint="${BACKUP_S3_ENDPOINT:-}"
recipient="${BACKUP_AGE_RECIPIENT:-}"
require_remote="${BACKUP_REQUIRE_REMOTE:-true}"

for command in pg_dump sha256sum age find date; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

for variable in DB_HOST DB_USERNAME DB_PASSWORD DB_NAME; do
  [ -n "${!variable:-}" ] || {
    echo "required database variable missing: $variable" >&2
    exit 78
  }
done

[ -n "$recipient" ] || {
  echo "BACKUP_AGE_RECIPIENT is required; plaintext backups are forbidden" >&2
  exit 78
}

case "$retention_days" in
  ''|*[!0-9]*) echo "BACKUP_RETENTION_DAYS must be an integer" >&2; exit 78 ;;
esac

if [ "$require_remote" = "true" ]; then
  [ -n "$remote_uri" ] || { echo "BACKUP_S3_URI is required" >&2; exit 78; }
  command -v aws >/dev/null 2>&1 || { echo "required command missing: aws" >&2; exit 69; }
fi

umask 077
mkdir -p "$backup_root"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="gallery-mazhari-${timestamp}.dump"
tmp_dump="${backup_root}/.${base}.tmp"
encrypted="${backup_root}/${base}.age"
checksum="${encrypted}.sha256"
trap 'rm -f "$tmp_dump"' EXIT

PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="${DB_PORT:-5432}" \
  --username="$DB_USERNAME" \
  --dbname="$DB_NAME" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$tmp_dump"

age --recipient "$recipient" --output "$encrypted" "$tmp_dump"
rm -f "$tmp_dump"
(
  cd "$backup_root"
  sha256sum "$(basename "$encrypted")" > "$(basename "$checksum")"
)

if [ -n "$remote_uri" ]; then
  command -v aws >/dev/null 2>&1 || { echo "required command missing: aws" >&2; exit 69; }
  aws_args=()
  [ -z "$endpoint" ] || aws_args+=(--endpoint-url "$endpoint")
  aws "${aws_args[@]}" s3 cp "$encrypted" "${remote_uri%/}/$(basename "$encrypted")" --sse AES256
  aws "${aws_args[@]}" s3 cp "$checksum" "${remote_uri%/}/$(basename "$checksum")" --sse AES256
fi

find "$backup_root" -type f \( -name '*.dump.age' -o -name '*.dump.age.sha256' \) -mtime "+$retention_days" -delete

echo "postgres backup completed: $(basename "$encrypted")"
