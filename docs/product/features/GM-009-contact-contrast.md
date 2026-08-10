# GM-009 — Contact Branch Guidance Contrast

## Identity

- Feature ID: `GM-009`
- Title: Restore WCAG AA contrast for contact branch guidance text
- Request owner: Gallery Mazhari owner
- Change class: `L1 presentation`
- Priority: `P1`
- Related epic: `EPIC-01`
- Dependencies / related items: existing RM-14 accessibility gate; prerequisite for GM-008 delivery

## Problem / outcome

The branch-guidance copy on `/contact` uses a hard-coded `#6d6258` foreground on the warm `#efd8c6` panel. Axe measures `4.32:1`, below the WCAG AA `4.5:1` minimum for this text size. The copy should use the existing semantic muted-text token so it remains readable and follows the centralized design system.

## Acceptance criteria

1. Contact branch-guidance text meets WCAG AA color contrast in desktop and mobile accessibility runs.
2. The hard-coded foreground is replaced by an existing semantic token; content and layout do not change.
3. No API, workflow, data, auth or schema behavior changes.

## Scope

### In scope

- The branch-guidance paragraph foreground in `contact.component.css`.
- Existing axe coverage, backlog and this specification.

### Explicit non-scope

- Contact page redesign, content changes or unrelated accessibility debt.
- Backend, data, media, auth, schema or production launch work.

## Impact analysis

| Surface | Impact | Notes |
| --- | --- | --- |
| Angular UI/routes/state | Yes | One presentation token reference |
| SSR/hydration | No | CSS-only |
| API/DTO contracts | No | Untouched |
| NestJS business logic | No | Untouched |
| Auth/permissions/audit | No | Untouched |
| PostgreSQL/schema/migration | No | Untouched |
| Existing data compatibility | No | Untouched |
| Protected business workflows | No | Untouched |
| Media/storage | No | Untouched |
| SEO | No | Content unchanged |
| Accessibility | Yes | WCAG AA contrast restored |
| Performance | No | No new asset or dependency |
| Deployment/config/monitoring | No | Standard CSS artifact |
| Documentation | Yes | Backlog and feature record |

## Verification and recovery

- Browser/E2E: existing `e2e/accessibility.spec.ts` on `/contact` for desktop and mobile.
- Build: production Angular build.
- Recovery: revert the single focused commit; no data recovery is required.

## Delivery

- Planned branch: `fix/gm-009-contact-contrast`
- Planned PR: focused prerequisite into `main`
- Definition of Done: `docs/engineering/DEFINITION_OF_DONE.md`
