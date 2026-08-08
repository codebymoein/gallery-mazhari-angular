# Open Risk Register

This register is completed for the exact RM-17 release candidate. Empty or ambiguous rows are not approval. Risk acceptance cannot be supplied by an automated agent.

| ID | Severity | Area | Risk / evidence | Disposition | Owner | Reason / compensating control | Expiry / review date | Approval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _none recorded_ | — | — | Replace this row with each known release risk or explicitly record that the reviewed ledgers contain no unresolved release risks. | — | — | — | — | — |

## Allowed dispositions

- **Fix** — remediation is required before certification.
- **Accepted** — requires business and technical owner approval, reason, impact, review/expiry date and compensating control.
- **Deferred** — requires owner, target milestone/dependency and interim protection.
- **Closed / Not an issue** — requires evidence.

## Certification rules

- Every known finding/risk relevant to the candidate must have one allowed disposition.
- No unaccepted Critical risk may remain.
- High risks require explicit owner sign-off before launch.
- A CI pass does not convert an open risk into Accepted or Closed.
- The release remains NO-GO while this register contains an unresolved/unknown disposition.
