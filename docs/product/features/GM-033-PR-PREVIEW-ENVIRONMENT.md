# GM-033 — PR Preview Environment

## Identity
- Feature ID: `GM-033`
- Title: Automatic PR browser preview environment
- Request owner: human owner
- Change class: `L2 delivery/platform behavior`
- Priority: `P1`
- Related epic: `EPIC-01`
- Base SHA: `d3b7bedecd91c91ebec8170fcaa2536317947f16`

## Problem / outcome

### Current problem
Product/UI changes can be built and reviewed in CI, but the owner cannot see them on a phone immediately after a branch update. The existing V2 rollout only follows reviewed merges to `main`, so visual acceptance is unnecessarily coupled to merge/release timing.

### Desired outcome
Every same-repository PR targeting `main` automatically publishes an immutable browser preview. A fixed `preview.gallerymazhari.com` host polls for the newest complete preview and atomically serves it within roughly one to two minutes, without merging or modifying production.

## Acceptance criteria
1. Opening/updating a same-repository PR to `main` builds the exact PR head and publishes a preview prerelease tagged `preview-pr-<number>-<sha>`.
2. The preview artifact contains only the Angular browser bundle plus `PREVIEW.json`, and is accompanied by a SHA-256 checksum.
3. The VPS preview poller verifies checksum and manifest before atomic publication.
4. Preview polling runs approximately once per minute and does not require inbound SSH or a long-lived GitHub token.
5. `preview.gallerymazhari.com` serves the latest preview with no-store HTML behavior and proxies `/api/` to the existing V2 API.
6. PR preview never executes PR backend code, migrations, or writes to a separate/production database as part of the preview deployment.
7. Production/V2 release semantics and `main` rollout remain unchanged.

## Scope

### In scope
- PR browser-build workflow and immutable preview prereleases.
- VPS browser-preview poller and one-time installer.
- systemd service/timer examples.
- Nginx host example for `preview.gallerymazhari.com`.
- Preview operational documentation and validation workflow.

### Explicit non-scope
- Automatic production deployment.
- Running unmerged PR backend code or database migrations.
- Creating DNS records or installing TLS on the VPS from GitHub.
- Per-PR hostnames or multiple simultaneous preview slots.
- Replacing V2 staging or production release certification.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI | yes | Production browser build is previewed before merge. |
| API/backend business logic | no runtime preview | Existing V2 API is reused by browser preview. |
| PostgreSQL/schema | no | No preview migrations or new database authority. |
| Security | yes | Same-repo PR only; no fork write token path; checksum/manifest verified. |
| Deployment/operations | yes | New isolated preview static root and systemd poller. |
| Production | no | Main/V2/production release paths remain unchanged. |
| Documentation | yes | Dedicated preview operations contract. |

## Architecture decision
The preview is deliberately browser-only. Running arbitrary unmerged backend code on the shared V2 host would increase data, migration and authorization risk and would make rapid visual review much more expensive. Relative `/api/` requests are proxied to the reviewed V2 backend, while the browser code itself comes from the PR SHA.

## Verification plan
- GitHub Actions production Angular build on the PR head.
- `bash -n` and ShellCheck for preview scripts.
- `systemd-analyze verify` for preview service/timer.
- Nginx example shape checks.
- Manual host bootstrap verification using `PREVIEW.json` and state files.

## Recovery
- Disable `gallery-mazhari-preview-auto-deploy.timer` to stop preview updates.
- The poller keeps the previous browser directory until a new artifact is fully verified.
- Removing the preview Nginx server block has no effect on V2/production.
- No database or persistent business-state recovery is required.

## Delivery
- Branch: `feat/gm-033-pr-preview-environment`
- Planned PR: focused GM-033 PR against `main`.
- Host bootstrap remains an explicit one-time operator action after merge and DNS setup.
