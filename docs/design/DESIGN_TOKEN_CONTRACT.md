# Gallery Mazhari Design Token & Font Contract

Status: **Normative runtime design contract**

## Authority
`src/styles/tokens.css` is the runtime source of truth for design tokens. Documentation MUST describe those runtime values; documentation does not override the stylesheet. Component and feature CSS MUST consume tokens rather than introduce competing palette, spacing, typography, radius, elevation or motion constants.

`DESIGN_SYSTEM.md` remains a broader design reference and historical usage guide. When a literal value shown there conflicts with `src/styles/tokens.css`, the runtime token file wins until the documentation is reconciled.

GM-001 establishes the approved post-remediation storefront direction: **warm / editorial / romantic / fashion / heritage**. The reference direction may be inspired by external fashion sites selected by the owner, but Gallery Mazhari MUST use its own assets, content, tokens and implementation rather than copying a third-party design.

## Approved core palette

| Role | Token | Value |
| --- | --- | --- |
| Espresso dark | `--color-matte-black` | `#2b211d` |
| Warm heading dark | `--color-dark-charcoal` | `#3a2a24` |
| Champagne accent | `--color-champagne-gold` | `#b78b62` |
| Primary burgundy | `--color-gold-primary` | `#8f4050` |
| Warm ivory page background | `--color-bg-cream` | `#f5eadc` |
| Warm surface | `--color-surface` | `#fff6ec` |
| Primary text | `--color-text-main` | `#3a2a24` |
| Muted warm text | `--color-text-muted` | `#6d554c` |

Additional editorial semantic tokens include rose, burgundy, espresso, butter, peach and ivory roles. Supporting state, alpha, surface, gradient and MDS compatibility tokens remain defined in `src/styles/tokens.css`.

## Semantic foundation families

GM-007 makes the existing runtime authority explicit without introducing a parallel theme layer:

- colors and surfaces: `--surface-*`, `--text-*` and `--accent-*` alias the approved warm core palette;
- typography: `--font-*`, `--font-weight-*`, `--type-leading-*` and `--type-tracking-*`;
- spacing and responsive gutters: `--space-*` plus `--gutter-page-*`;
- radii and borders: `--radius-*`, `--border-width-*` and semantic `--border-*` composites;
- shadows and glass: `--shadow-*`, `--glass-surface*`, `--glass-border`, `--glass-blur` and `--glass-shadow`;
- motion and easing: `--duration-*`, `--ease-*`, existing `--transition-*` and motion-distance/scale tokens;
- controls and layers: `--control-*` and `--z-*`.

These families are additive semantic aliases over the canonical values. Feature CSS MUST consume them when the role applies and MUST NOT create a second token file or page-local theme authority.

### Palette rules

- Cool grey MUST NOT be reintroduced as the dominant storefront brand/background language without a separately approved visual decision.
- Clinical pure white SHOULD be limited to functional/on-dark use; public storefront surfaces SHOULD normally use warm semantic surface tokens.
- Burgundy is the primary action/brand accent; champagne is a restrained secondary accent rather than a universal decoration color.
- Feature/component CSS SHOULD use semantic tokens. New raw color literals require a named design-system use case and should normally be promoted to `tokens.css`.
- Admin surfaces may retain a denser functional composition, but accessibility and token authority remain shared.

## Font contract

- Persian/UI stack: `--font-persian: 'IRANSansX', 'YekanBakh', Tahoma, sans-serif`.
- Persian display stack: `--font-display: 'YekanBakh', 'IRANSansX', Tahoma, sans-serif` to allow a softer editorial hierarchy when the environment provides YekanBakh while retaining safe fallbacks.
- English UI stack: `--font-english: 'Inter', Arial, sans-serif`.
- English serif accent: `--font-serif-en: 'Playfair Display', Georgia, 'Times New Roman', serif`.
- The repository does not implicitly gain permission to add font binaries because a family appears in a stack. Self-hosting requires license/provenance and performance review.
- No licensed/provenance-approved Yekan binary is present in the repository as of GM-007. The approved Yekan family names remain in the fallback stacks, but the application MUST NOT claim a self-hosted Yekan delivery until an owner-approved licensed asset is supplied and reviewed.
- Editorial hierarchy SHOULD be created first through scale, line-height, weight, spacing and composition rather than unreviewed font downloads.

## Typography and responsive rules

Typography consumes the font and weight tokens from `tokens.css`. Persian/RTL behavior remains mandatory. The storefront is mobile-first: narrow touch layouts are the primary composition and wider layouts enhance rather than replace that experience.

Large display type SHOULD use restrained weights and generous spacing rather than multiple decorative effects. English editorial accents MUST use explicit language/direction semantics where they differ from the surrounding RTL Persian document.

## Motion contract

- `--transition-editorial` and `--transition-editorial-fast` are the shared timing curves for deliberate fashion/editorial movement.
- Motion MAY include restrained reveal, image scale/drift and chapter transitions when those movements explain hierarchy or improve discovery.
- Scroll hijacking, mandatory long intro sequences and gratuitous continuous motion are not part of the approved language.
- Every material motion surface MUST provide an effective `prefers-reduced-motion: reduce` path.
- New animation dependencies require the normal dependency/security/bundle review; GM-001 adds none.
- Core content MUST remain visible without waiting for IntersectionObserver, scroll events or JavaScript reveal state. Motion enhances already-visible content rather than becoming its visibility gate.

## WebKit reliability contract

- Mobile viewport shells use a `100vh` fallback followed by dynamic viewport enhancement where needed.
- Full-screen mobile controls account for safe-area insets when `viewport-fit=cover` is enabled.
- Translucent surfaces retain an opaque warm fallback; `-webkit-backdrop-filter` and standard `backdrop-filter` are progressive enhancements.
- Body scroll locking MUST preserve and restore the previous inline body state and scroll position.
- Public catalog completeness MUST NOT depend on `content-visibility` geometry. Delayed authoritative snapshot refreshes invalidate and recompute client projections without requiring a reload.

## Accessibility and performance

- Visible focus, semantic controls, contrast and RTL reading order are mandatory review concerns.
- Warm/pastel surfaces MUST still meet the applicable WCAG contrast requirement for text and controls.
- Home keeps one authoritative LCP image: the primary bridal hero is eager/high-priority; secondary discovery imagery remains deferred.
- Stable image dimensions/aspect handling remain required to avoid layout shift.

## Verification

PRs changing this contract MUST run normal frontend quality gates and the dedicated `Design System Contract` workflow. `e2e/design-system.spec.ts` verifies the canonical runtime palette/font variables and captures Home/Catalog evidence in desktop and mobile projects.

Material visual changes also require representative mobile/desktop review, keyboard/focus verification and reduced-motion review. SSR/SEO/performance/accessibility permanent regression gates remain release controls and MUST NOT be weakened to accept a redesign.
