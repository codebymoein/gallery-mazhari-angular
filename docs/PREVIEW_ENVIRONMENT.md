# PR Preview Environment

`preview.gallerymazhari.com` is the fixed browser-preview host for active pull requests. It exists so product/visual changes can be reviewed on a real phone before merge without publishing them to `main` or production.

## Flow

1. A same-repository pull request targeting `main` is opened or updated.
2. `.github/workflows/pr-preview.yml` builds the production Angular browser bundle for the exact PR head SHA.
3. The workflow writes `PREVIEW.json`, packages the browser output, publishes a SHA-256 checksum, and creates an immutable prerelease tagged `preview-pr-<pr-number>-<40-char-sha>`.
4. `gallery-mazhari-preview-auto-deploy.timer` polls GitHub every ~60 seconds and runs `deploy/preview-auto-deploy.sh`.
5. The poller selects the newest complete preview prerelease, verifies its checksum and embedded manifest, then atomically replaces `/var/www/gallery-mazhari-preview/browser`.
6. Nginx serves that directory from `preview.gallerymazhari.com`. Browser `/api/` traffic is proxied to the existing V2 API so the preview environment cannot become a second business-data authority.

## Safety boundary

This preview is intentionally **browser-only**. It does not run PR backend code, migrations, or a separate database. That keeps preview deploys fast and prevents unreviewed PR code from mutating durable business state. Backend/API changes must still be validated by CI and V2/staging after merge or through a separately authorized isolated environment.

The preview host is not production, does not authorize merge, and must never be used as evidence that production deployment succeeded.

## One-time host bootstrap

After DNS for `preview.gallerymazhari.com` points to the V2 VPS, install the reviewed preview tooling from `main`:

```bash
sudo bash deploy/install-preview-auto-deploy.sh
```

Install `deploy/nginx-preview.conf.example` into the host's Nginx configuration using the site's normal TLS/certificate procedure, then validate and reload Nginx. The example intentionally contains no certificate paths because certificate ownership remains host-specific.

Useful checks:

```bash
systemctl status gallery-mazhari-preview-auto-deploy.timer --no-pager
systemctl status gallery-mazhari-preview-auto-deploy.service --no-pager
cat /srv/gallery-mazhari-preview/LAST_PREVIEW_PR
cat /srv/gallery-mazhari-preview/LAST_PREVIEW_REVISION
curl -fsS https://preview.gallerymazhari.com/PREVIEW.json
```

## Operational behavior

Preview artifacts are immutable per PR SHA. A new push creates a new tag and the poller adopts the newest complete preview release. Publishing is atomic: the previous browser directory remains available until the new artifact is verified and ready to replace it.

The preview page uses `Cache-Control: no-store` in the Nginx example so product reviewers do not need to fight stale HTML while iterating on UI changes. Hashed Angular assets remain naturally versioned by their filenames.
