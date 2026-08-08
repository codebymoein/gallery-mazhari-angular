#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "usage: sudo bash deploy/install-v2-auto-deploy.sh" >&2
  exit 77
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_user="${GALLERY_APP_USER:-gallerymazhari}"
app_group="${GALLERY_APP_GROUP:-gallerymazhari}"
app_root="${APP_ROOT:-/srv/gallery-mazhari}"
env_dir="/etc/gallery-mazhari"
env_file="${env_dir}/backend.env"
cache_root="/var/cache/gallery-mazhari/v2"

for path in \
  "$script_dir/v2-auto-deploy.sh" \
  "$script_dir/gallery-mazhari-backend.service.example" \
  "$script_dir/gallery-mazhari-ssr.service.example" \
  "$script_dir/gallery-mazhari-v2-auto-deploy.service.example" \
  "$script_dir/gallery-mazhari-v2-auto-deploy.timer.example"; do
  [ -f "$path" ] || { echo "required bootstrap file missing: $path" >&2; exit 66; }
done

for command in install systemctl getent useradd awk sed; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

if ! getent group "$app_group" >/dev/null; then
  groupadd --system "$app_group"
fi
if ! getent passwd "$app_user" >/dev/null; then
  useradd --system \
    --gid "$app_group" \
    --home-dir "$app_root" \
    --no-create-home \
    --shell /usr/sbin/nologin \
    "$app_user"
fi

install -d -m 0755 -o "$app_user" -g "$app_group" "$app_root" "${app_root}/releases"
install -d -m 0750 -o root -g "$app_group" "$env_dir" "$cache_root"

if [ ! -f "$env_file" ]; then
  legacy_env=""
  if systemctl cat gallery-mazhari-api.service >/dev/null 2>&1; then
    legacy_env="$(
      systemctl cat gallery-mazhari-api.service \
        | awk -F= '/^[[:space:]]*EnvironmentFile=/{print $2; exit}' \
        | sed -e 's/^[[:space:]]*-[[:space:]]*//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//'
    )"
  fi

  if [ -z "$legacy_env" ] || [ ! -f "$legacy_env" ]; then
    for candidate in \
      /opt/gallery-mazhari/source/backend/.env \
      /opt/gallery-mazhari/backend/.env; do
      if [ -f "$candidate" ]; then
        legacy_env="$candidate"
        break
      fi
    done
  fi

  if [ -z "$legacy_env" ] || [ ! -f "$legacy_env" ]; then
    echo "cannot bootstrap ${env_file}: no existing backend environment file was found" >&2
    echo "create ${env_file} from the canonical environment contract, then rerun this installer" >&2
    exit 78
  fi

  install -m 0640 -o root -g "$app_group" "$legacy_env" "$env_file"
  echo "migrated backend environment from existing host configuration"
else
  chown root:"$app_group" "$env_file"
  chmod 0640 "$env_file"
fi

install -m 0750 -o root -g root \
  "$script_dir/v2-auto-deploy.sh" \
  /usr/local/sbin/gallery-mazhari-v2-auto-deploy
install -m 0644 \
  "$script_dir/gallery-mazhari-backend.service.example" \
  /etc/systemd/system/gallery-mazhari-backend.service
install -m 0644 \
  "$script_dir/gallery-mazhari-ssr.service.example" \
  /etc/systemd/system/gallery-mazhari-ssr.service
install -m 0644 \
  "$script_dir/gallery-mazhari-v2-auto-deploy.service.example" \
  /etc/systemd/system/gallery-mazhari-v2-auto-deploy.service
install -m 0644 \
  "$script_dir/gallery-mazhari-v2-auto-deploy.timer.example" \
  /etc/systemd/system/gallery-mazhari-v2-auto-deploy.timer

systemctl daemon-reload
systemctl enable gallery-mazhari-backend.service gallery-mazhari-ssr.service >/dev/null
systemctl enable --now gallery-mazhari-v2-auto-deploy.timer

# Trigger once immediately; the timer remains the durable mechanism afterward.
systemctl start gallery-mazhari-v2-auto-deploy.service

echo "V2 auto-deploy bootstrap completed"
echo "timer: gallery-mazhari-v2-auto-deploy.timer"
echo "status: systemctl status gallery-mazhari-v2-auto-deploy.service --no-pager"
