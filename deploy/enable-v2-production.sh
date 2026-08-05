#!/usr/bin/env bash
set -Eeuo pipefail

NGINX_SITE=/etc/nginx/sites-available/gallery-mazhari
APP_ENV=/opt/gallery-mazhari/source/backend/.env
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/opt/gallery-mazhari/config-backups/v2-${STAMP}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

install -d -m 700 "${BACKUP_DIR}"
cp -a "${NGINX_SITE}" "${BACKUP_DIR}/nginx-gallery-mazhari"
cp -a "${APP_ENV}" "${BACKUP_DIR}/backend.env"

# Allow the deployed v2 frontend to call the real API. Bare-IP access is not
# a trusted production browser origin.
sed -i \
  's|^FRONTEND_ORIGIN=.*$|FRONTEND_ORIGIN=https://v2.gallerymazhari.com,https://gallerymazhari.com,https://www.gallerymazhari.com|' \
  "${APP_ENV}"

# Add v2 to both the HTTP ACME host and the HTTPS Angular storefront host.
sed -i \
  '0,/server_name gallerymazhari\.com www\.gallerymazhari\.com api\.gallerymazhari\.com;/s//server_name gallerymazhari.com www.gallerymazhari.com v2.gallerymazhari.com api.gallerymazhari.com;/' \
  "${NGINX_SITE}"
sed -i \
  '0,/server_name gallerymazhari\.com www\.gallerymazhari\.com;/s//server_name gallerymazhari.com www.gallerymazhari.com v2.gallerymazhari.com;/' \
  "${NGINX_SITE}"

nginx -t
systemctl reload nginx

# Reissue the existing certificate with every production hostname included.
certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --cert-name gallerymazhari.com \
  --expand --non-interactive --agree-tos \
  -d gallerymazhari.com \
  -d www.gallerymazhari.com \
  -d v2.gallerymazhari.com \
  -d api.gallerymazhari.com

nginx -t
systemctl reload nginx
systemctl restart gallery-mazhari-api.service

echo "Production v2 configuration completed."
echo "Backup: ${BACKUP_DIR}"
