# Gallery Mazhari Design Token & Font Contract

Status: **Normative for RM-08 / PR-016**

## Authority
`src/styles/tokens.css` is the runtime source of truth for design tokens. Documentation MUST describe those runtime values; documentation does not override the stylesheet. Component and feature CSS MUST consume tokens rather than introduce competing palette, spacing, typography, radius, elevation, or motion constants.

`DESIGN_SYSTEM.md` remains a broader design reference and historical usage guide. When a literal value shown there conflicts with `src/styles/tokens.css`, the runtime token file wins until the documentation is reconciled. PR-017 owns broad consumer migration/decomposition; PR-016 does not perform an arbitrary visual redesign.

## Approved core palette

| Role | Token | Value |
| --- | --- | --- |
| Matte neutral | `--color-matte-black` | `#656561` |
| Dark charcoal | `--color-dark-charcoal` | `#484846` |
| Champagne accent | `--color-champagne-gold` | `#9d7937` |
| Primary gold | `--color-gold-primary` | `#89682f` |
| Page background | `--color-bg-cream` | `#f4f3f0` |
| Surface | `--color-surface` | `#fbfaf8` |
| Primary text | `--color-text-main` | `#555552` |
| Muted text | `--color-text-muted` | `#666560` |

Supporting state, alpha, surface, gradient and MDS compatibility tokens remain defined in `src/styles/tokens.css`. New raw color literals in feature/component CSS require a named design-system use case and should normally be promoted to a semantic token instead.

## Font contract

- Persian/UI stack: `--font-persian: 'IRANSansX', 'YekanBakh', Tahoma, sans-serif`.
- Display stack: `--font-display`, currently the same Persian stack to preserve established RTL typography.
- English UI stack: `--font-english: 'Inter', Arial, sans-serif`.
- English serif accent: `--font-serif-en: 'Playfair Display', Georgia, 'Times New Roman', serif`.
- The repository currently does not bundle licensed font binaries under `src/assets`; therefore the stack MUST retain safe fallbacks and tests MUST verify the CSS contract rather than assume a particular host-installed font binary.
- Adding/self-hosting a font binary later requires license/provenance review, performance review and explicit design-system documentation; it is not implicit authorization to add font files.

## Typography and responsive rules

Typography consumes the font and weight tokens from `tokens.css`. Persian/RTL behavior remains mandatory. Mobile-first behavior, visible focus, reduced-motion handling and representative narrow/desktop visual evidence are part of design-system acceptance; accessibility remediation itself remains RM-14.

## Verification

PRs that change this contract MUST run the normal frontend quality gates and the dedicated `Design System Contract` workflow. `e2e/design-system.spec.ts` verifies the canonical runtime palette/font variables and captures Home/Catalog visual evidence in both desktop and mobile Playwright projects.

The visual evidence is a regression aid, not permission for arbitrary visual change. PR-017 may migrate hard-coded consumers and decompose global CSS only while preserving the approved appearance unless a separately authorized design decision says otherwise.
