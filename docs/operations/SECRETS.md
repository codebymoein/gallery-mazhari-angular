# Secret Management and Rotation

Status: **Normative operational documentation** for RM-16.

## Principles

- Secrets never belong in Git, Angular/browser bundles, screenshots, fixtures, logs or documentation examples.
- Production secrets are injected by the deployment platform/secret store.
- Least privilege applies to database, SMTP, payment/provider and administrative credentials.
- Deleting a leaked value from the latest commit is not remediation; exposed credentials must be rotated.

## Secret inventory

At minimum treat these values as secrets when configured:

- `JWT_SECRET`
- `ADMIN_SETUP_KEY`
- `DB_PASSWORD`
- `SMTP_PASSWORD`
- payment/provider private credentials
- object-storage access credentials
- deployment/API tokens and private keys

## Rotation procedure

1. Identify the affected secret, systems and environments.
2. Create a replacement in the authoritative secret manager/provider; do not write it to Git or chat/log artifacts.
3. Update the target environment using the provider/deployment mechanism.
4. For secrets that support overlap, deploy the new credential before revoking the old one. For JWT/session secrets, follow the RM-04 session migration strategy rather than performing an unplanned big-bang cutover.
5. Verify health, authentication/provider connectivity and relevant smoke tests.
6. Revoke/disable the old credential at its issuer/source.
7. Record the rotation date, owner and reason in the private operational system—not the secret value itself.
8. If exposure occurred, inspect logs/audit trails and treat it as a security incident.

## Emergency exposure response

- Rotate first; repository history cleanup alone is insufficient.
- Do not paste the exposed value into issues or PRs.
- If the value was committed, keep incident evidence private and use an approved history-rewrite procedure only when necessary and coordinated.
- Re-run secret scanning after remediation.

## Ownership

- Repository owner / Tech Lead: secret policy and repository hygiene.
- Deployment operator: environment injection and provider-side rotation.
- Domain owner: validation that the rotated credential still supports the required workflow.

## Verification

- Required CI includes Gitleaks.
- Production runtime rejects documented placeholder secret values for the canonical backend environment.
- Operational reviews verify that no real `.env` file or production credential is committed.
