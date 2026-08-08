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

PR-022 establishes the responsive-media loading contract for the home experience: only the actual home LCP image receives eager/high priority and route-aware preload, while below-fold discovery/category media is deferred and explicit dimensions are preserved.

PR-023 establishes measurable browser/CWV evidence. A dedicated CI workflow MUST run the storefront reliability journey in Chromium, Firefox and WebKit plus a constrained mobile Chromium profile. Lighthouse CI MUST enforce explicit mobile performance/CWV proxy budgets and retain its report artifact. Browser RUM MUST collect only allowlisted performance metrics (`CLS`, `INP`, `LCP`, `TTFB`), pathname without query/fragment, and navigation type. It MUST NOT collect user identifiers, query strings, authorization data, form payloads, user agent strings or other customer PII. The public telemetry endpoint is validation-bounded, rate-limited through the application throttler and logs structured aggregate metric records without writing durable business state.

## Accessibility
Target WCAG 2.2 AA for customer/admin workflows where feasible. Semantic elements, labels, keyboard operation, visible focus, error association, contrast, reduced-motion respect, meaningful alt text and RTL reading order are mandatory review concerns. Interactive `div`/`span` substitutes require equivalent semantics only when native controls cannot be used.

## Verification
Use existing Playwright accessibility/routing/SEO coverage and add regression tests for changed critical behavior. RM-12 SSR changes additionally require a production SSR build plus raw-HTML and HTTP-status evidence against the built Node server. Performance claims should include before/after measurement when material. RM-13 PR-023 evidence additionally requires the dedicated browser-matrix and Lighthouse/CWV workflow to pass on the exact PR head used for completion evidence.
