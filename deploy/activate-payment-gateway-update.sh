#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE=/opt/gallery-mazhari/source
WEBROOT=/var/www/gallery-mazhari/browser
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP=/opt/gallery-mazhari/config-backups/payment-gateway-${STAMP}

if [[ -f "${SOURCE}/dist/gallery-mazhari-angular/browser/index.html" ]]; then
  FRONTEND_BUILD="${SOURCE}/dist/gallery-mazhari-angular/browser"
elif [[ -f "${SOURCE}/dist/gallery-mazhari-angular/index.html" ]]; then
  FRONTEND_BUILD="${SOURCE}/dist/gallery-mazhari-angular"
else
  echo "Angular build output was not found." >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

install -d -m 700 "${BACKUP}"
cp -a "${WEBROOT}/index.html" "${BACKUP}/index.html"
cp -a "${SOURCE}/backend/dist/src/payments" "${BACKUP}/backend-payments-dist"

# Hashed assets can be copied in place; publish index.html last so clients
# never receive references to assets that have not arrived yet.
find "${FRONTEND_BUILD}" -mindepth 1 -maxdepth 1 \
  ! -name index.html -exec cp -a {} "${WEBROOT}/" \;
cp -a "${FRONTEND_BUILD}/index.html" "${WEBROOT}/index.html"

systemctl restart gallery-mazhari-api.service
systemctl is-active --quiet gallery-mazhari-api.service
nginx -t

echo "Payment gateway update activated."
echo "Backup: ${BACKUP}"
