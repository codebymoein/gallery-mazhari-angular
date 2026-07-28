---
inclusion: auto
---

# Gallery Mazhari — Active Design System Rules

This project follows a strict luxury design system. When building or modifying ANY component, enforce the following without exception.

## Colors (tokens only — never hard-code hex)
- Background: `var(--color-bg-cream)` = `#F9F8F6` (champagne cream)
- Dark surfaces: `var(--color-dark-charcoal)` = `#1A1A1A` (matte black)
- Gold accent: `var(--mds-color-primary)` = `#b79545`
- Gold light: `var(--color-gold-light)` = `#D4AF37`
- Text: `var(--mds-color-text)` = `#535353`

## Typography
- Persian: `var(--font-persian)` = Vazirmatn
- English: `var(--font-english)` = Inter
- Headings: tight letter-spacing (`-0.025em`), `text-wrap: balance`, min weight `500`
- English labels/eyebrows: wide letter-spacing (`0.18em`)

## Every Component Must
1. Use **CSS tokens only** — no raw hex values in component `.css` files
2. Use **BEM naming**: `.luxury-[block]__[element]--[modifier]`
3. Be **mobile-first** responsive
4. Have `dir="rtl"` on the root element
5. Use `changeDetection: ChangeDetectionStrategy.OnPush`
6. Be **standalone** (`standalone: true`)
7. Include `@media (prefers-reduced-motion: reduce)` for all animations
8. Apply dark mode via `[data-theme="dark"]` selector

## Effects to Apply
- Hover lift: `transform: translateY(-2px)` on all interactive elements
- Image zoom: `transform: scale(1.035)` on media hover (1.2s smooth)
- Transitions: always use `var(--transition-smooth)` = `0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Gold glow: `box-shadow: 0 0 24px rgba(212, 175, 55, 0.25)` on primary CTA

## Full spec: `DESIGN_SYSTEM.md` in project root
