# 08 — Design System

`src/styles/tokens.css` is the runtime source of truth for Gallery Mazhari design tokens. [`../design/DESIGN_TOKEN_CONTRACT.md`](../design/DESIGN_TOKEN_CONTRACT.md) is the canonical RM-08 palette/font policy and verification contract. [`../../DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md) remains a broader design reference and usage guide, but it MUST NOT override conflicting runtime token values.

## Rules
- Reuse tokens for color, spacing, typography, radius, elevation and motion before adding literals.
- Preserve RTL/Persian layout and content behavior; logical CSS properties are preferred where they improve RTL safety.
- Shared interaction patterns must have consistent hover/focus/disabled/loading/error states.
- Responsive changes must be checked on narrow mobile and desktop; do not solve one viewport by breaking another.
- Admin and storefront may have distinct visual density, but must share accessibility and token discipline.
- Images require stable dimensions/aspect handling and appropriate responsive/lazy-loading behavior.
- Component/feature CSS must not create a competing design-token authority. New literals require a named use case and should normally become semantic tokens.
- Font stacks and fallbacks are governed by the canonical token contract. Font binaries may not be added merely because a family appears in a stack; self-hosting requires license/provenance and performance review.
- `src/styles/global.css` owns reset, document defaults, accessibility foundation and documented utilities only.
- Cross-storefront presentation shared by multiple public surfaces belongs in `src/styles/storefront-shared.css`; feature-only styles belong with their Angular feature/component owner.
- Governed shared CSS MUST NOT use class-fragment selectors such as `[class*='...']` as an ownership shortcut.

## Change gate
New tokens/patterns require a named use case and update to the design reference. One-off visual overrides that duplicate an existing token/pattern should be rejected. Visual redesigns must not remove workflow actions, status visibility, validation, or audit information.

PR-016 established the canonical palette/font/token contract and executable visual evidence. PR-017 decomposes global CSS ownership, removes broad class-fragment selectors from governed shared layers and makes the Stylelint ownership check blocking in the dedicated Design System Contract workflow. The detailed ownership map is [`../design/STYLE_OWNERSHIP.md`](../design/STYLE_OWNERSHIP.md).

## Verification
For material UI changes, PR evidence SHOULD include screenshots at representative mobile/desktop widths plus keyboard/focus verification. The dedicated `Design System Contract` workflow runs a blocking Stylelint check for governed shared styles and `e2e/design-system.spec.ts` to verify canonical runtime palette/font variables and capture Home/Catalog evidence in desktop and mobile projects. Accessibility checks follow [chapter 17](17-seo-performance-accessibility.md); existing RM-14 debt is not silently converted into RM-08 scope.
