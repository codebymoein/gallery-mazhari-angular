# Gallery Mazhari — Design System
> Version 1.1 | Angular 21 | Last updated: August 2026
> **Every component built in this project MUST reference and comply with this document.**

> Runtime authority: `src/styles/tokens.css` and `docs/design/DESIGN_TOKEN_CONTRACT.md`. The semantic GM-007 families cover colors/surfaces, typography, spacing/gutters, radii/borders, shadows/glass, motion/easing, controls and z-index. Feature CSS must consume those roles rather than create page-local token systems.

---

## 1. Brand Identity

| Attribute | Value |
|-----------|-------|
| Brand name (FA) | گالری مظهری |
| Brand name (EN) | GALLERY MAZHARI |
| Tagline | EST. 1337 · TEHRAN |
| Tone | Luxury, timeless, refined, Persian heritage |
| Audience | Brides, wedding planners, upscale retail |

---

## 2. Color Palette

All colors are defined as CSS custom properties in `src/styles/tokens.css`.  
**Never hard-code hex values in component CSS — always use tokens.**

> Build pipeline loads: `tokens.css` → `typography.css` → `rtl.css` → `patterns.css` → `global.css` (via `angular.json`).

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-matte-black` | `#2b211d` | Warm espresso section backgrounds |
| `--color-dark-charcoal` | `#3a2a24` | Warm heading/chrome dark |
| `--color-champagne-gold` | `#b78b62` | Restrained champagne accent |
| `--color-gold-primary` | `#8f4050` | Primary burgundy action/brand accent |
| `--color-gold-light` | alias → champagne | Hover states, highlights |
| `--color-gold-hover` | `#9F7E38` | Active/pressed gold |
| `--color-gold-subtle` | `#EEE5D1` | Gold tints on light bg |
| `--color-bg-cream` | `#f5eadc` | Warm ivory page background |
| `--color-surface` | `#fff6ec` | Warm raised surface |
| `--color-text-main` | `#3a2a24` | Primary warm text |
| `--color-text-muted` | `#6d554c` | Secondary warm text |
| `--color-border` | `#d9c0b1` | Warm dividers and input borders |

**Single source of truth:** `src/styles/tokens.css`  
**Shared patterns:** `src/styles/patterns.css` (`.ds-*` utilities)  
**Never hard-code hex values in component CSS — always use tokens.**

Changing `--color-champagne-gold` or `--color-matte-black` updates lookbook, VIP CTA, footer, buttons, and borders globally.

### MDS System Tokens (WordPress parity)

| Token | Value |
|-------|-------|
| `--mds-color-primary` | `#b79545` |
| `--mds-color-primary-hover` | `#9f7e38` |
| `--mds-color-primary-light` | `#eee5d1` |
| `--mds-color-secondary` | `#1c1c1c` |
| `--mds-color-background` | `#f8f6f2` |
| `--mds-color-heading` | `#171717` |
| `--mds-color-text` | `#535353` |
| `--mds-color-text-muted` | `#7a7a7a` |

### Dark Mode Overrides

```css
[data-theme="dark"] {
  --color-bg-cream:   #0e0d0b;
  --color-surface:    #1a1916;
  --color-text-main:  #e8e4dc;
  --color-border:     rgba(212, 175, 55, 0.18);
  --mds-color-background: #0e0d0b;
  --mds-color-heading:    #f0ece3;
  --mds-color-text:       #c8c3b8;
}
```

### Forbidden
- ❌ Raw `red`, `blue`, `green`, `orange` — use tinted equivalents
- ❌ `#000000` pure black — use `#1A1A1A`
- ❌ `#ffffff` pure white as background — use `#F9F8F6`
- ❌ Saturated / neon tones anywhere

---

## 3. Typography

### Font Stack

| Role | Font | Fallback | Token |
|------|------|----------|-------|
| Persian body & UI | IRANSansX | YekanBakh, Tahoma | `--font-persian` |
| Display / headings | YekanBakh | IRANSansX, Tahoma | `--font-display` |
| English UI | Inter | Arial | `--font-english` |
| English serif accent | Georgia | Times New Roman | `--font-serif-en` |

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--mds-font-size-xs` | `.75rem` | Labels, badges |
| `--mds-font-size-sm` | `.875rem` | Captions, footnotes |
| `--mds-font-size-base` | `1rem` | Body |
| `--mds-font-size-md` | `1.125rem` | Sub-headings |
| `--mds-font-size-lg` | `1.375rem` | Section leads |
| `--mds-font-size-xl` | `1.75rem` | h4 |
| `--mds-font-size-2xl` | `2.25rem` | h3 |
| `--mds-font-size-3xl` | `3rem` | h2 |
| `--mds-font-size-hero` | `clamp(2.75rem, 7vw, 6.25rem)` | Hero h1 |

### Rules
- YekanBakh is the approved display preference, but no licensed local binary currently exists. Do not download or commit an unlicensed font; the runtime-safe stack must fall back predictably until an approved asset is supplied.
- Headings: `letter-spacing: -0.025em` to `-0.035em` (tight, luxury feel)
- English eyebrows / labels: `letter-spacing: 0.15em` to `0.22em` (wide, editorial)
- Line height body: `1.9` — generous for Persian readability
- Line height headings: `1.15` to `1.35`
- `text-wrap: balance` on all headings
- **Never** `font-weight: 400` on headings — minimum `500`

---

## 4. Spacing & Layout

### Spacing Scale

```
--mds-space-1:  .25rem   (4px)
--mds-space-2:  .5rem    (8px)
--mds-space-3:  .75rem   (12px)
--mds-space-4:  1rem     (16px)
--mds-space-5:  1.5rem   (24px)
--mds-space-6:  2rem     (32px)
--mds-space-7:  3rem     (48px)
--mds-space-8:  4rem     (64px)
--mds-space-9:  6rem     (96px)
--mds-space-10: 8rem     (128px)
```

### Container

```css
width: min(calc(100% - (var(--container-padding) * 2)), 82.5rem);
margin-inline: auto;
```

- Desktop padding: `1.5rem`
- Tablet padding: `1rem`
- Mobile padding: `0.75rem`

### Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| `mobile` | `< 480px` | Small phones |
| `tablet` | `480px – 768px` | Tablets portrait |
| `desktop-sm` | `768px – 1024px` | Laptops |
| `desktop` | `≥ 1024px` | Full desktop |

> Always write **mobile-first**: base styles for mobile, then `@media (min-width: ...)` for larger.

### Border Radius

```
--mds-radius-sm:    .5rem    (cards, buttons)
--mds-radius-md:    1rem     (panels)
--mds-radius-lg:    1.5rem   (hero panels)
--mds-radius-xl:    2rem     (large cards)
--mds-radius-round: 999px    (pills, badges)
```

---

## 5. Shadows & Depth

```css
--shadow-luxury: 0 10px 30px rgba(0, 0, 0, 0.05);
--shadow-hover:  0 4px 12px rgba(0, 0, 0, 0.10);
--shadow-gold:   0 4px 12px rgba(212, 175, 55, 0.20);
--shadow-deep:   0 24px 50px rgba(20, 18, 14, 0.18);
--shadow-panel:  0 32px 80px rgba(20, 18, 14, 0.18);
```

- Use `backdrop-filter: blur(16px)` on sticky/floating elements
- Dark overlays on images: `rgba(10, 9, 8, 0.12)` to `rgba(10, 9, 8, 0.62)` gradient
- Glow effect on gold elements: `box-shadow: 0 0 24px rgba(212, 175, 55, 0.25)`

---

## 6. Transitions & Micro-interactions (Package 1)

```css
--transition-fast:   150ms ease
--transition-base:   250ms ease
--transition-slow:   400ms ease
--transition-smooth: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Rules
- **All interactive elements** must have a transition — no instant state changes
- Hover lifts: `transform: translateY(-2px)` to `-4px`
- Image zoom on hover: `transform: scale(1.035)` with `1.2s` transition
- Link underlines: animate `scaleX()` from `0` to `1`, origin `right` (RTL)
- Buttons: `opacity`, `transform`, `background` — never `width`/`height`
- **Always** include `@media (prefers-reduced-motion: reduce)` override:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: .01ms !important; }
  }
  ```

### Matte Gold Effect
```css
.gold-matte {
  background: linear-gradient(
    135deg,
    #B8973E 0%, #D4AF37 40%, #B8973E 60%, #9F7E38 100%
  );
  background-size: 200% 200%;
  animation: gold-shimmer 4s ease infinite;
}
@keyframes gold-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}
```

---

## 7. Aesthetic Effects

### Package 1 — Royal Micro-interactions
- Silky button press: scale `0.97` on `:active`
- Underline slide from right (RTL): `transform-origin: right; scaleX(0→1)`
- Icon button hover: subtle background fill + border tint
- Cart badge: entrance animation `scale(0) → scale(1)` with spring easing
- Input focus ring: `box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15)`

### Package 2 — Ambient Glow & Loading Screen
- **Ambient glow**: radial gradient halo behind hero images
  ```css
  background: radial-gradient(
    circle at 50% 50%,
    rgba(183, 149, 69, 0.18),
    transparent 65%
  );
  ```
- **Loading screen**: full-screen overlay with brand logo fade-in
  - Background: `#1A1A1A`
  - Logo: gold text with `opacity: 0 → 1` + `translateY(12px → 0)`
  - Bar: thin gold progress line at bottom
  - Exit: `opacity: 1 → 0` + `pointer-events: none`

### Package 3 — Parallax & Theater Mode
- **Parallax scroll**: `transform: translateY(calc(var(--scroll-y) * 0.35))`
  - Apply to hero media elements via `IntersectionObserver` + `scroll` event
  - Depth multiplier: `0.2` (subtle) to `0.5` (dramatic) — never more
- **Theater Mode (Cinematic Focus)**:
  - Clicking a gallery image dims the rest: `opacity: 0.15`
  - Focused image: `transform: scale(1.06)`, `z-index: 10`
  - Dark backdrop: `rgba(0,0,0,0.85)` with blur
  - ESC key closes. Trap focus inside modal.

---

## 8. Component Architecture

### Angular Rules
- ✅ **Standalone Components** only — no NgModules
- ✅ **Lazy loading** for all feature routes
- ✅ **OnPush** change detection for performance
- ✅ **Signals** preferred over `@Input()` where Angular 17+ supports it
- ✅ **NgRx** for global state (cart, products, user)
- ❌ Never import `BrowserModule` in feature components

### BEM Naming Convention

```
Block:    .luxury-card
Element:  .luxury-card__title
Modifier: .luxury-card--featured
```

```
Block:    .mds-hero
Element:  .mds-hero__media
Modifier: .mds-hero--split
```

- Prefix all blocks with `luxury-` or `mds-` (matching WordPress theme)
- No generic class names like `.title`, `.button`, `.card`
- State classes: `.is-open`, `.is-active`, `.is-loading`

### File Structure per Component

```
src/app/features/[name]/
  ├── [name].component.ts       ← logic, OnPush, standalone
  ├── [name].component.html     ← semantic HTML, ARIA, dir="rtl"
  ├── [name].component.css      ← BEM, tokens only, no hard-coded hex
  └── [name].component.spec.ts  ← unit tests (optional in dev)
```

### HTML Rules
- **Always** `dir="rtl"` on root component elements
- **Always** `lang="en" dir="ltr"` on English text (`<bdi>`, `<span>`)
- Use semantic elements: `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<address>`, `<time>`
- `aria-label` on all icon buttons
- `alt=""` on decorative images, meaningful alt on content images
- `<h1>` only once per page — in the main hero/section
- `itemprop` / Schema.org on brand, location, product data

---

## 9. Buttons

| Class | Background | Text | Border | Use |
|-------|-----------|------|--------|-----|
| `.mds-btn--primary` | `#b79545` | white | none | Main CTA |
| `.mds-btn--secondary` | transparent | dark | dark | Secondary action |
| `.mds-btn--ghost` | `rgba(255,255,255,.06)` | white | white `.82` | On dark backgrounds |
| `.mds-btn--gold-outline` | transparent | gold | gold | Tertiary on light |

```css
/* Base button */
.mds-btn {
  min-height: 52px;
  padding-inline: 1.75rem;
  border-radius: var(--mds-radius-round);
  font-weight: 600;
  transition: all var(--transition-smooth);
}
.mds-btn:hover    { transform: translateY(-2px); }
.mds-btn:active   { transform: scale(0.97); }
```

---

## 10. Image Guidelines

- Format: **WebP** preferred, fallback JPEG
- Always define `width` + `height` to prevent CLS
- Hero images: `fetchpriority="high"`, no `loading="lazy"`
- Below-fold images: `loading="lazy" decoding="async"`
- Object fit: `object-fit: cover` always — never distort
- Hover zoom: `transform: scale(1.035)` with `overflow: hidden` on parent

---

## 11. RTL / Persian-specific Rules

- Root `direction: rtl` on `<html>` and component roots
- Use **logical properties**: `margin-inline-start` not `margin-right`
- Arrows and chevrons: `←` for "go forward" in RTL context
- Number formatting: Persian digits `۱۲۳` in Farsi copy, Latin in `<bdi>` for phone/price
- `font-feature-settings: "kern" 1` for better Persian glyph spacing
- Line height minimum `1.8` for Persian text blocks

---

## 12. Accessibility

- Minimum contrast ratio: **4.5:1** body text, **3:1** large text
- All interactive elements minimum touch target: **44×44px**
- `prefers-reduced-motion` must suppress all animations
- `prefers-color-scheme: dark` must trigger dark mode tokens
- Focus visible ring: `2px solid var(--color-gold-light)` with `outline-offset: 3px`
- `aria-live="polite"` on cart count badge
- Skip link: `<a href="#main-content" class="skip-link">رفتن به محتوای اصلی</a>`

---

## 13. Component Pre-flight Checklist

Before submitting any new component, verify:

- [ ] Uses only CSS token variables — no hard-coded hex colors
- [ ] BEM class naming with `luxury-` or `mds-` prefix
- [ ] Mobile-first responsive CSS
- [ ] `dir="rtl"` on root element
- [ ] All icon buttons have `aria-label`
- [ ] Transitions use `--transition-smooth` or `--transition-base`
- [ ] `prefers-reduced-motion` block present
- [ ] Dark mode tokens applied
- [ ] Images have `width`, `height`, `loading`, `alt`
- [ ] Hover state includes `transform: translateY(-2px)` or equivalent
- [ ] Angular `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Standalone component with explicit `imports: []`

---

## 14. Design Anti-patterns (Forbidden)

| Anti-pattern | Correct approach |
|---|---|
| Hard-coded `#d4af37` in CSS | Use `var(--color-gold-light)` |
| `cursor: pointer` missing on clickable divs | Use `<button>` or `<a>` elements |
| Pure black `#000` backgrounds | Use `#1A1A1A` (`--color-dark-charcoal`) |
| White `#fff` page backgrounds | Use `#F9F8F6` (`--color-bg-cream`) |
| `font-family` in component CSS | Font stacks only in `styles.css` via tokens |
| `!important` overrides | Increase specificity properly |
| Pixel-fixed font sizes | Use `rem` or `clamp()` |
| Missing focus styles | Always include `:focus-visible` |
| Emoji as icons | Use inline SVG icons |
| `margin-right` / `margin-left` | Use `margin-inline-start` / `margin-inline-end` |

---

## 15. CSS File Loading Order

```
src/styles.css          ← tokens, reset, global typography, utilities
                           (loaded globally via angular.json)

Component .css files    ← scoped BEM styles referencing tokens only
```

> Do NOT add `@import` for fonts inside component CSS files.
> Font imports belong in `styles.css` only.

---

*This document is the single source of truth for all visual decisions.  
When in doubt: matte black, champagne cream, solid gold.*
