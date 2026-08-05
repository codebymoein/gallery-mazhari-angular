#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gallery-mazhari/source}"
ADMIN_EMAIL="${1:?admin email is required}"
ADMIN_PASSWORD="${2:?admin password is required}"
ADMIN_NAME="${3:-Site Administrator}"

cd "$APP_ROOT/backend"
set -a
source ./.env
set +a

admin_count="$(PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_NAME" -Atc \
  "select count(*) from users where role = 'admin';")"
echo "ADMIN_COUNT_BEFORE=$admin_count"

if [[ "$admin_count" == "0" ]]; then
  payload="$(node -e 'process.stdout.write(JSON.stringify({setupKey:process.env.ADMIN_SETUP_KEY,fullName:process.argv[1],email:process.argv[2],password:process.argv[3]}))' "$ADMIN_NAME" "$ADMIN_EMAIL" "$ADMIN_PASSWORD")"
  bootstrap_code="$(curl -sS -o /tmp/gallery-bootstrap-result -w '%{http_code}' \
    -H 'Content-Type: application/json' --data "$payload" \
    http://127.0.0.1:3000/api/auth/bootstrap-admin)"
  echo "BOOTSTRAP_HTTP=$bootstrap_code"
  rm -f /tmp/gallery-bootstrap-result
fi

login_payload="$(node -e 'process.stdout.write(JSON.stringify({email:process.argv[1],password:process.argv[2]}))' "$ADMIN_EMAIL" "$ADMIN_PASSWORD")"
login_code="$(curl -sS -o /tmp/gallery-login-result -c /tmp/gallery-admin-cookie -w '%{http_code}' \
  -H 'Content-Type: application/json' --data "$login_payload" \
  http://127.0.0.1:3000/api/auth/login)"
profile_code="$(curl -sS -o /dev/null -w '%{http_code}' -b /tmp/gallery-admin-cookie \
  http://127.0.0.1:3000/api/auth/profile)"
rm -f /tmp/gallery-login-result /tmp/gallery-admin-cookie

echo "LOGIN_HTTP=$login_code"
echo "PROFILE_HTTP=$profile_code"
echo "ADMIN_COUNT_AFTER=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_NAME" -Atc "select count(*) from users where role = 'admin';")"
