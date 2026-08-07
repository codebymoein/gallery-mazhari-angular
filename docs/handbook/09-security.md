# 09 — Security

Also read [`../../SECURITY.md`](../../SECURITY.md). Security is enforced at server/data boundaries, not by hiding UI.

## Mandatory controls
- Authentication for private identity; authorization/roles/permissions for every privileged server action; least privilege by default.
- DTO/input validation and bounded pagination/query inputs. Never interpolate untrusted input into SQL, shell commands, paths, HTML, redirects, or external URLs without the correct safety mechanism.
- Secrets only through environment/secret management; never frontend bundles, logs, commits, screenshots, fixtures, or docs.
- Passwords use strong adaptive hashing; reset tokens are time-bounded/single-purpose and must not be logged.
- Apply rate limiting to login/reset/public write endpoints and other abuse-sensitive operations.
- Security headers/CORS must be explicit and environment-appropriate.

## Upload/media security
Allowlist MIME/extension, bound file and archive sizes, prevent path traversal and decompression bombs, generate server-controlled filenames/paths, quarantine suspicious/duplicate/unmatched content, and never execute uploaded content.

## Data/privacy
Collect only required customer/admin data; restrict admin exposure; redact secrets/tokens/passwords from logs. Production data must not be copied into tests/dev without approved sanitization.

## Security review trigger
Auth, payment, file upload, import, admin permissions, external callbacks, HTML rendering, and deployment/network changes require explicit security-impact notes and negative tests. Suspected credential exposure requires rotation, not only deletion from the latest commit.
