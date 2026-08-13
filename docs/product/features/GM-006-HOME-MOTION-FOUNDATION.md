# GM-006 — Home Motion Foundation

Status: **CI candidate**

## Identity
- Feature ID: `GM-006`
- Slice: Home motion foundation
- Epic: `EPIC-01`
- Change class: `L2`
- Priority: `P2`
- Base SHA: `b15c91a9da5137bea628055a4b17ed267353979e`

## Outcome
Introduce a restrained editorial motion language on the Home opening without changing navigation, content authority, SEO semantics, or business workflows.

## Acceptance criteria
1. Hero imagery settles with a short finite image drift using existing motion tokens.
2. Hero copy and the accessory chapter use restrained transform-based entry motion while remaining visible and usable throughout.
3. Heritage chapter elements receive the same visual language without scroll hijacking or continuous animation.
4. Touch/click interactions receive subtle active feedback without changing target size or navigation semantics.
5. `prefers-reduced-motion: reduce` disables all decorative motion added by this slice.
6. No IntersectionObserver, scroll listener, third-party animation package, API, backend, database, or persistent state is introduced.
7. Existing LCP image priority, RTL behavior, focus styles and public route semantics remain unchanged.

## Scope
- `src/app/features/home/home.motion.css`
- Home component stylesheet wiring.
- Focused Playwright regression coverage.

## Non-scope
- Scroll-driven reveal across every storefront route.
- Header/drawer motion already delivered in GM-032.
- Backend/API/database changes.
- New animation dependencies.
- Preview infrastructure or production release changes.

## Impact
- Business/source-of-truth: none.
- Angular: presentation-only motion behavior on Home.
- SSR/SEO: no semantic or metadata changes; content remains present in normal markup.
- Accessibility: reduced-motion path required and tested; focus behavior unchanged.
- Performance: CSS-only finite transforms; no timers/listeners/dependencies.
- Recovery: revert this focused PR; no migration or data recovery.

## Verification
- Frontend lint.
- Relevant Vitest suite.
- Production Angular build.
- `e2e/home-motion.spec.ts`.
- Existing Design System, browser/CWV, accessibility and SSR regression workflows on the exact PR head.
