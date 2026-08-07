# 08 — Design System

[`../../DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md) and `src/styles/tokens.css`, typography/global/RTL patterns are the current design references.

## Rules
- Reuse tokens for color, spacing, typography, radius, elevation and motion before adding literals.
- Preserve RTL/Persian layout and content behavior; logical CSS properties are preferred where they improve RTL safety.
- Shared interaction patterns must have consistent hover/focus/disabled/loading/error states.
- Responsive changes must be checked on narrow mobile and desktop; do not solve one viewport by breaking another.
- Admin and storefront may have distinct visual density, but must share accessibility and token discipline.
- Images require stable dimensions/aspect handling and appropriate responsive/lazy-loading behavior.

## Change gate
New tokens/patterns require a named use case and update to the design reference. One-off visual overrides that duplicate an existing token/pattern should be rejected. Visual redesigns must not remove workflow actions, status visibility, validation, or audit information.

## Verification
For material UI changes, PR evidence SHOULD include screenshots at representative mobile/desktop widths plus keyboard/focus verification. Accessibility checks follow [chapter 17](17-seo-performance-accessibility.md).
