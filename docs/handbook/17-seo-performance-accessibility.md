# 17 — SEO, Performance & Accessibility

These are release qualities, not optional polish.

## SEO
Public indexable routes require intentional title/meta/canonical behavior and stable crawlable URLs. Product structured data must reflect authoritative product availability/pricing rather than stale client fixtures. Keep `robots.txt`/sitemap strategy aligned with actual public routes. Do not expose internal tags/admin/staging pages to search indexing.

RM-12 PR-020 establishes server-rendered document delivery for public routes. Public route metadata MUST be visible in the initial raw HTML response, not only after browser JavaScript runs. Unmatched URLs MUST produce a real HTTP `404` plus `noindex` crawler policy. Private/account/admin routes remain non-indexable and may stay client-rendered. Hydration resumes the browser application after SSR without changing data authority. Dynamic entity metadata, JSON-LD lifecycle, sitemap indexes and redirect registry belong to PR-021.

## Performance
- Measure before large optimization/refactor claims.
- Lazy-load route/features/media where appropriate; do not lazy-load the primary LCP asset blindly.
- Provide image dimensions/responsive derivatives to reduce layout shift and bandwidth.
- Avoid unbounded API responses, duplicate requests, N+1 backend queries, and shipping admin-only dependencies/data to public flows unnecessarily.
- New dependencies and large assets require bundle/runtime impact review.
- SSR is not by itself a performance pass; RM-13 owns Core Web Vitals budgets and browser-performance optimization.

## Accessibility
Target WCAG 2.2 AA for customer/admin workflows where feasible. Semantic elements, labels, keyboard operation, visible focus, error association, contrast, reduced-motion respect, meaningful alt text and RTL reading order are mandatory review concerns. Interactive `div`/`span` substitutes require equivalent semantics only when native controls cannot be used.

## Verification
Use existing Playwright accessibility/routing/SEO coverage and add regression tests for changed critical behavior. RM-12 SSR changes additionally require a production SSR build plus raw-HTML and HTTP-status evidence against the built Node server. Performance claims should include before/after measurement when material.
