#!/usr/bin/env bash
set -euo pipefail

source_uri="${MEDIA_BACKUP_SOURCE_URI:-}"
target_uri="${MEDIA_BACKUP_TARGET_URI:-}"
endpoint="${MEDIA_BACKUP_S3_ENDPOINT:-${MEDIA_S3_ENDPOINT:-}}"

command -v aws >/dev/null 2>&1 || {
  echo "required command missing: aws" >&2
  exit 69
}

[ -n "$source_uri" ] || { echo "MEDIA_BACKUP_SOURCE_URI is required" >&2; exit 78; }
[ -n "$target_uri" ] || { echo "MEDIA_BACKUP_TARGET_URI is required" >&2; exit 78; }
[ "$source_uri" != "$target_uri" ] || {
  echo "media backup source and target must differ" >&2
  exit 78
}

aws_args=()
[ -z "$endpoint" ] || aws_args+=(--endpoint-url "$endpoint")

# Copy-only preserves objects deleted from the source so backup history is not
# silently destroyed by a routine job. Lifecycle/versioning on the backup bucket
# defines retention outside this script.
aws "${aws_args[@]}" s3 sync "$source_uri" "$target_uri" \
  --sse AES256 \
  --only-show-errors

echo "media backup sync completed"
