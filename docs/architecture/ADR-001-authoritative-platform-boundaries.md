# ADR-001 — Authoritative Platform Boundaries

Status: Accepted

## Decision

Gallery Mazhari uses PostgreSQL as the authoritative production datastore. NestJS is the authoritative business-logic, authorization, validation, and write boundary. Angular is a presentation client and must not become an authoritative source of business rules or durable business state.

## Consequences

- Production business writes flow through NestJS APIs/services and persist to PostgreSQL.
- Angular may keep ephemeral UI state and non-authoritative cache only.
- `localStorage`/`sessionStorage` must never be treated as the source of truth for inventory, product lifecycle, import state, permissions, publication state, stock, media processing state, or audit records.
- Legacy WordPress/WooCommerce integrations are adapters/integration surfaces only; they do not supersede PostgreSQL/NestJS authority.
- Schema changes require forward migrations. Runtime schema synchronization is forbidden outside disposable tests.
- Authorization decisions are enforced server-side even when Angular hides or disables UI actions.

## Preserved intentional workflows

Excel Inventory Import; Dry Run / Confirm Import; Product / Variation Workflow; Photo / Media Queue; Orphan / Quarantine; Publish / Staging Queue; Stock lifecycle / audit; Taxonomy; SEO enrichment; Merchandising.

These workflows may be hardened in later remediation items but must not be deleted, simplified, or redesigned merely to reduce complexity.

## Rollback

This ADR is a contract/documentation change. Revert this ADR only together with an approved replacement ADR that preserves Constitution requirements.