#!/usr/bin/env bash
set -euo pipefail

SITE_DOMAIN="${SITE_DOMAIN:-gallerymazhari.com}"
API_DOMAIN="${API_DOMAIN:-api.gallerymazhari.com}"
SITE_ROOT="${SITE_ROOT:-/var/www/gallery-mazhari/browser}"
CERT_DIR="${CERT_DIR:-/etc/letsencrypt/live/$SITE_DOMAIN}"
NGINX_SITE=/etc/nginx/sites-available/gallery-mazhari
NGINX_SNIPPET=/etc/nginx/snippets/gallery-security-headers.conf

if [[ $EUID -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

for required in \
  "$SITE_ROOT/index.html" \
  "$CERT_DIR/fullchain.pem" \
  "$CERT_DIR/privkey.pem"; do
  if [[ ! -s "$required" ]]; then
    echo "Required production file is missing: $required" >&2
    exit 1
  fi
done

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SITE_BACKUP="$NGINX_SITE.backup-$STAMP"
SNIPPET_BACKUP="$NGINX_SNIPPET.backup-$STAMP"

install -d -o root -g root -m 755 /etc/nginx/snippets /var/www/certbot/.well-known/acme-challenge
if [[ -f "$NGINX_SITE" ]]; then
  cp -a "$NGINX_SITE" "$SITE_BACKUP"
fi
if [[ -f "$NGINX_SNIPPET" ]]; then
  cp -a "$NGINX_SNIPPET" "$SNIPPET_BACKUP"
fi

rollback() {
  local exit_code=$?
  echo "Nginx validation failed; restoring $SITE_BACKUP" >&2
  if [[ -f "$SITE_BACKUP" ]]; then
    cp -a "$SITE_BACKUP" "$NGINX_SITE"
  fi
  if [[ -f "$SNIPPET_BACKUP" ]]; then
    cp -a "$SNIPPET_BACKUP" "$NGINX_SNIPPET"
  else
    rm -f "$NGINX_SNIPPET"
  fi
  if nginx -t; then
    systemctl reload nginx || true
  fi
  exit "$exit_code"
}
trap rollback ERR

cat >"$NGINX_SNIPPET" <<EOF
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://$API_DOMAIN https://*.tile.openstreetmap.org; font-src 'self' data:; connect-src 'self' https://$API_DOMAIN; upgrade-insecure-requests" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(self), microphone=(), geolocation=(self), payment=()" always;
EOF

cat >"$NGINX_SITE" <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $SITE_DOMAIN www.$SITE_DOMAIN $API_DOMAIN;

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type text/plain;
  }

  location / { return 308 https://\$host\$request_uri; }
}

# Bare-IP and unknown HTTP requests go to the trusted canonical hostname.
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  return 308 https://$SITE_DOMAIN\$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name $SITE_DOMAIN www.$SITE_DOMAIN;
  root $SITE_ROOT;

  ssl_certificate $CERT_DIR/fullchain.pem;
  ssl_certificate_key $CERT_DIR/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_session_cache shared:gallery_tls:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;
  include $NGINX_SNIPPET;

  location / { try_files \$uri \$uri/ /index.html; }

  location = /index.html {
    include $NGINX_SNIPPET;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    try_files \$uri =404;
  }

  location /assets/ {
    include $NGINX_SNIPPET;
    expires 7d;
    add_header Cache-Control "public, max-age=604800" always;
    try_files \$uri =404;
  }

  location ~* "\\.[0-9a-f]{16,}\\.(js|css)\$" {
    include $NGINX_SNIPPET;
    expires 1y;
    add_header Cache-Control "public, immutable" always;
    try_files \$uri =404;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name $API_DOMAIN;
  client_max_body_size 210m;

  ssl_certificate $CERT_DIR/fullchain.pem;
  ssl_certificate_key $CERT_DIR/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_session_cache shared:gallery_api_tls:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;

  location /uploads/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_connect_timeout 10s;
    proxy_read_timeout 60s;
  }
}
EOF

ln -sfn "$NGINX_SITE" /etc/nginx/sites-enabled/gallery-mazhari
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
trap - ERR

echo "Nginx HTTPS hardening applied. Backup: $SITE_BACKUP"
