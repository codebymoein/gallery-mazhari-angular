---
name: security-audit
description: Perform an evidence-based, read-only security review. Inspect relevant areas, distinguish confirmed findings from possible risks, assign severity, and provide evidence and remediation. Do not modify code.
---

# security-audit

Review the repository for security issues with evidence.

## When to use
- Requested security review.
- Before/after changes that touch auth, payments, uploads, or authorization.
- Periodic auditing.

## When NOT to use
- You will be modifying code (this skill is read-only; implement after separately).

## Inputs
- Scope (whole repo or specific areas).
- Updated or relevant docs.

## Inspect as relevant
Secrets and environment handling; authentication; session handling; authorization and object-level access; input validation; output encoding; SQL/command injection; XSS; CSRF; SSRF; path traversal; unsafe file upload; insecure deserialization; dependency risks; CORS; headers; cookies; logging of sensitive data; rate limiting; brute-force protection; error disclosure; cryptography misuse; webhook verification; API exposure; privilege escalation; backup/deployment configuration.

## Rules
- Do not exploit production systems.
- Do not expose secrets in output; redact anything accidentally discovered.
- Distinguish **confirmed** findings from **possible** risks.
- Assign severity based on impact and likelihood.
- Include evidence (file:line) and remediation.
- Do not modify code unless explicitly asked.

## Safety constraints
- Read-only.
- Never print tokens/keys/credentials; redact.

## Expected output
A findings table with columns:
- ID
- Severity
- Status (confirmed / potential)
- Affected location
- Evidence
- Impact
- Remediation
- Verification method

## Completion criteria
- Areas relevant to scope inspected.
- Findings prioritized and evidence-backed.
- No secrets exposed in output.
