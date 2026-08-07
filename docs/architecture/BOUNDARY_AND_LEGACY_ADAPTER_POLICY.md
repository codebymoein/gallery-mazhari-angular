# Boundary and Legacy Adapter Policy

## Mandatory boundaries

1. Angular must not write production business data directly to a database or legacy platform.
2. NestJS is the production write gateway and authorization boundary.
3. PostgreSQL is the canonical production datastore for Gallery Mazhari business state.
4. Browser storage is limited to disposable cache and UI preferences; recovery must be possible from authoritative APIs.
5. Business rules belong in server services/domain code, not duplicated as authoritative Angular logic.
6. Controllers remain transport-focused; persistence access does not leak into Angular.
7. Schema evolution is migration-only.

## Legacy adapters

Legacy WordPress/WooCommerce or other historical integrations must be isolated behind explicit adapters. An adapter must document direction, mapped fields, authority, retry/idempotency behavior, failure handling, and decommission criteria. It must not silently become a second source of truth.

## Migration rule

When legacy behavior is replaced, use strangler-style migration: introduce server contract, dual-read/controlled compatibility only when explicitly approved, migrate authoritative data, verify parity, then retire the adapter in a separately reviewed change. Never delete an intentional Gallery Mazhari workflow as a shortcut.

## Review checklist

- Does the change introduce a second authoritative store?
- Does Angular decide a business rule that NestJS does not enforce?
- Can browser state override PostgreSQL state?
- Is a legacy integration bypassing NestJS?
- Is a schema change represented by a migration?

Any yes answer blocks merge unless an approved ADR explicitly defines the exception.