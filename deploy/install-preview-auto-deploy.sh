#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "usage: sudo bash deploy/install-preview-auto-deploy.sh" >&2
  exit 77
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
preview_root="${PREVIEW_BROWSER_ROOT:-/var/www/gallery-mazhari-preview/browser}"
cache_root="${PREVIEW_DEPLOY_CACHE_ROOT:-/var/cache/gallery-mazhari/preview}"
state_root="${PREVIEW_STATE_ROOT:-/srv/gallery-mazhari-preview}"

for path in \
  "$script_dir/preview-auto-deploy.sh" \
  "$script_dir/gallery-mazhari-preview-auto-deploy.service.example" \
  "$script_dir/gallery-mazhari-preview-auto-deploy.timer.example"; do
  [ -f "$path" ] || { echo "required preview bootstrap file missing: $path" >&2; exit 66; }
done

for command in install systemctl; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "required command missing: $command" >&2
    exit 69
  }
done

install -d -m 0755 "$state_root" "$(dirname "$preview_root")"
install -d -m 0750 "$cache_root"
install -m 0750 -o root -g root \
  "$script_dir/preview-auto-deploy.sh" \
  /usr/local/sbin/gallery-mazhari-preview-auto-deploy
install -m 0644 \
  "$script_dir/gallery-mazhari-preview-auto-deploy.service.example" \
  /etc/systemd/system/gallery-mazhari-preview-auto-deploy.service
install -m 0644 \
  "$script_dir/gallery-mazhari-preview-auto-deploy.timer.example" \
  /etc/systemd/system/gallery-mazhari-preview-auto-deploy.timer

systemctl daemon-reload
systemctl enable --now gallery-mazhari-preview-auto-deploy.timer

# Trigger once immediately; the timer remains the durable mechanism afterward.
systemctl start gallery-mazhari-preview-auto-deploy.service

echo "Preview auto-deploy bootstrap completed"
echo "timer: gallery-mazhari-preview-auto-deploy.timer"
echo "status: systemctl status gallery-mazhari-preview-auto-deploy.service --no-pager"
