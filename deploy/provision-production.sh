#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-moein}"
APP_ROOT="${APP_ROOT:-/opt/gallery-mazhari/source}"
SITE_DOMAIN="${SITE_DOMAIN:-gallerymazhari.com}"
API_DOMAIN="${API_DOMAIN:-api.gallerymazhari.com}"
TLS_EMAIL="${TLS_EMAIL:-moein.molla.7392@gmail.com}"
DB_NAME="gallery_mazhari"
DB_USER="gallery_app"
ENV_FILE="$APP_ROOT/backend/.env"

if [[ $EUID -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  DB_PASSWORD="$(openssl rand -base64 48 | tr -d '\n' | tr '/+' '_-')"
  JWT_SECRET="$(openssl rand -hex 64)"
  ADMIN_SETUP_KEY="$(openssl rand -hex 48)"

  runuser -u postgres -- psql -v ON_ERROR_STOP=1 \
    --set=db_user="$DB_USER" --set=db_password="$DB_PASSWORD" --set=db_name="$DB_NAME" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'db_user', :'db_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name') \gexec
SQL

  install -o "$APP_USER" -g "$APP_USER" -m 600 /dev/null "$ENV_FILE"
  cat >"$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3000
FRONTEND_ORIGIN=https://$SITE_DOMAIN,https://www.$SITE_DOMAIN
BACKEND_PUBLIC_URL=https://$API_DOMAIN
TRUST_PROXY=true
DB_TYPE=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
ADMIN_SETUP_KEY=$ADMIN_SETUP_KEY
ADMIN_RECOVERY_EMAIL=moein.molla.7392@gmail.com
EOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

install -d -o "$APP_USER" -g "$APP_USER" "$APP_ROOT/backend/uploads"

# The VPS CPU is older than the x86-64-v2 baseline used by Sharp's prebuilt
# binaries. Compile against Ubuntu's libvips so image processing stays usable.
apt-get install -y --no-install-recommends \
  build-essential certbot libvips-dev nginx pkg-config python3
runuser -u "$APP_USER" -- env \
  CPLUS_INCLUDE_PATH=/usr/include/glib-2.0:/usr/lib/x86_64-linux-gnu/glib-2.0/include \
  CXXFLAGS=-std=c++17 \
  npm_config_build_from_source=true \
  npm --prefix "$APP_ROOT/backend" rebuild sharp --foreground-scripts

cat >/etc/systemd/system/gallery-mazhari-api.service <<EOF
[Unit]
Description=Gallery Mazhari API
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_ROOT/backend
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node $APP_ROOT/backend/dist/src/main.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=$APP_ROOT/backend/uploads

[Install]
WantedBy=multi-user.target
EOF

install -d -o root -g root -m 755 /var/www/gallery-mazhari/browser
FRONTEND_DIST="$APP_ROOT/dist/gallery-mazhari-angular"
if [[ -d "$FRONTEND_DIST/browser" ]]; then
  FRONTEND_DIST="$FRONTEND_DIST/browser"
fi
if [[ ! -f "$FRONTEND_DIST/index.html" ]]; then
  echo "Angular build output not found: $FRONTEND_DIST/index.html" >&2
  exit 1
fi
# Keep previously fingerprinted JS/CSS chunks so clients that still have an
# older index in memory do not hit 404/white-screen during a rolling deploy.
rsync -a "$FRONTEND_DIST/" /var/www/gallery-mazhari/browser/
chown -R root:root /var/www/gallery-mazhari

install -d -o root -g root -m 755 /var/www/certbot/.well-known/acme-challenge
systemctl enable --now nginx

CERT_DIR="/etc/letsencrypt/live/$SITE_DOMAIN"
if [[ ! -s "$CERT_DIR/fullchain.pem" || ! -s "$CERT_DIR/privkey.pem" ]]; then
  # A temporary HTTP-only host is required for the first ACME challenge.
  cat >/etc/nginx/sites-available/gallery-mazhari <<EOF
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

server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  return 308 https://$SITE_DOMAIN\$request_uri;
}
EOF
  ln -sfn /etc/nginx/sites-available/gallery-mazhari /etc/nginx/sites-enabled/gallery-mazhari
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx

  certbot certonly --webroot \
    --webroot-path /var/www/certbot \
    --domains "$SITE_DOMAIN,www.$SITE_DOMAIN,$API_DOMAIN" \
    --email "$TLS_EMAIL" \
    --agree-tos \
    --non-interactive
else
  # Safe no-op when the certificate is not yet close to expiry.
  certbot renew --quiet || true
fi

install -d -o root -g root -m 755 /etc/nginx/snippets
cat >/etc/nginx/snippets/gallery-security-headers.conf <<EOF
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://$API_DOMAIN https://*.tile.openstreetmap.org; font-src 'self' data:; connect-src 'self' https://$API_DOMAIN; upgrade-insecure-requests" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(self), microphone=(), geolocation=(self), payment=()" always;
EOF

cat >/etc/nginx/sites-available/gallery-mazhari <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $SITE_DOMAIN www.$SITE_DOMAIN;

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type text/plain;
  }

  location / { return 308 https://\$host\$request_uri; }
}

server {
  listen 80;
  listen [::]:80;
  server_name $API_DOMAIN;

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type text/plain;
  }

  location / { return 308 https://\$host\$request_uri; }
}

# Direct-IP and unknown HTTP requests must never serve the application.
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
  root /var/www/gallery-mazhari/browser;

  ssl_certificate $CERT_DIR/fullchain.pem;
  ssl_certificate_key $CERT_DIR/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_session_cache shared:gallery_tls:10m;
  ssl_session_timeout 1d;
  ssl_session_tickets off;
  include /etc/nginx/snippets/gallery-security-headers.conf;

  location / { try_files \$uri \$uri/ /index.html; }

  location = /index.html {
    include /etc/nginx/snippets/gallery-security-headers.conf;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    try_files \$uri =404;
  }

  location /assets/ {
    include /etc/nginx/snippets/gallery-security-headers.conf;
    expires 7d;
    add_header Cache-Control "public, max-age=604800" always;
    try_files \$uri =404;
  }

  location ~* "\\.[0-9a-f]{16,}\\.(js|css)\$" {
    include /etc/nginx/snippets/gallery-security-headers.conf;
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

ln -sfn /etc/nginx/sites-available/gallery-mazhari /etc/nginx/sites-enabled/gallery-mazhari
rm -f /etc/nginx/sites-enabled/default

install -d -o root -g root -m 755 /etc/letsencrypt/renewal-hooks/deploy
cat >/etc/letsencrypt/renewal-hooks/deploy/reload-gallery-nginx <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
nginx -t
systemctl reload nginx
EOF
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-gallery-nginx

systemctl daemon-reload
systemctl enable gallery-mazhari-api.service
systemctl restart gallery-mazhari-api.service
nginx -t
systemctl reload nginx

install -d -o postgres -g postgres -m 700 /var/backups/gallery-mazhari
cat >/usr/local/sbin/backup-gallery-mazhari <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR=/var/backups/gallery-mazhari
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
runuser -u postgres -- pg_dump --format=custom --file="$BACKUP_DIR/gallery_mazhari-$STAMP.dump" gallery_mazhari
tar -C /opt/gallery-mazhari/source/backend -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" uploads
chown postgres:postgres "$BACKUP_DIR"/*
find "$BACKUP_DIR" -type f -mtime +14 -delete
EOF
chmod 750 /usr/local/sbin/backup-gallery-mazhari
cat >/etc/cron.d/gallery-mazhari-backup <<'EOF'
17 1 * * * root /usr/local/sbin/backup-gallery-mazhari >/dev/null 2>&1
EOF
/usr/local/sbin/backup-gallery-mazhari

if command -v ufw >/dev/null; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable
fi
