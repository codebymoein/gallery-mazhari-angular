# Gallery Mazhari CSS Ownership Map

Status: **Normative for RM-08 / PR-017**

The goal is to keep shared CSS intentional and prevent feature patches from accumulating in `src/styles/global.css`.

| Surface | Owner | Allowed contents |
| --- | --- | --- |
| `src/styles/tokens.css` | Design-system tokens | Canonical color, spacing, typography, radius, elevation and motion tokens only. |
| `src/styles/typography.css` | Global typography | Shared type scale and text primitives that are not feature-specific. |
| `src/styles/rtl.css` | RTL contract | Cross-application RTL/logical-direction rules only. |
| `src/styles/patterns.css` | Shared design primitives | Explicit reusable patterns/components with stable class names. No class-fragment selectors. |
| `src/styles/global.css` | Application foundation | Reset, document/layout defaults, accessibility foundation and documented utilities only. No feature-specific selectors. |
| `src/styles/storefront-shared.css` | Storefront shared presentation | Explicit cross-storefront rules shared by catalog/collection/product/cart/order surfaces. |
| `src/styles/admin-theme.css` | Admin shared presentation | Cross-admin theme rules only; feature-specific admin rules stay with their feature owner. |
| `src/app/features/**` component styles | Feature owner | Styles used only by that feature/component. |
| `src/app/shared/**` component styles | Shared component owner | Styles for reusable Angular components with an explicit shared contract. |

## Selector rules

- Global styles MUST NOT use class-fragment selectors such as `[class*='__btn']`, `[class*='__button']` or `[class*='__cta']` to style unknown future components.
- Shared selectors MUST enumerate intentional consumers or use a stable shared primitive class.
- Feature-specific selectors MUST move to the feature/component owner unless two or more independently owned storefront surfaces deliberately share the same visual contract.
- `!important` is not a normal ownership mechanism. Existing exceptions may remain temporarily only when visual-baseline evidence shows they are still required; new exceptions require a comment explaining the cascade conflict and removal condition.
- New raw palette values belong in `tokens.css` unless they are truly one-off content/media values with a documented use case.

## Cascade order

The Angular global stylesheet order is a contract. Foundation files load first, then shared storefront/admin layers. A decomposition PR MUST preserve visual behavior with the PR-016 Design System Contract and representative Playwright screenshots before removing an older selector.

## Verification

PR-017 introduces a CSS governance gate that checks the governed global/shared files for forbidden class-fragment selectors and other agreed Stylelint rules. Normal frontend Quality Gates and the `Design System Contract` workflow remain required.
