# Gallery Mazhari — Implementation Checklist
> Angular 18 | Roadmap & Feature Tracker
> Update this file as each task is completed. Mark with `[x]` when done.

---

## Legend
| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Completed |
| `[!]` | Blocked / needs decision |

---

## Phase 1 — Foundation & Core Infrastructure
> Must be complete before any feature work.

- [x] Angular 18 project scaffold (standalone components, lazy routing)
- [x] WordPress REST API service (`WordPressService` — 20+ methods)
- [x] Shared models & interfaces (Product, Cart, Category, User, Order, etc.)
- [x] NgRx Store — Product slice (state, actions, reducer, selectors, effects)
- [x] NgRx Store — Cart slice (state, actions, reducer, selectors, effects)
- [x] HTTP Interceptors (API headers, retry logic, global error handler)
- [x] Cart Service (add / remove / update / coupon / localStorage persist)
- [x] Environment configs (dev: localhost:8081 / prod: gallery-mazhari.ir)
- [x] API Health Service (diagnostics on app init)
- [x] Global Design System (`DESIGN_SYSTEM.md` + `.kiro/steering`)
- [x] Global CSS tokens (`src/styles.css` — all `--mds-*` variables)

---

## Phase 2 — Layout & Shell
> Visual foundation every page depends on.

- [x] Header component — 3-column layout (nav | brand | actions)
- [x] Header — Mega Menu: پوشاک عروس (clothing groups + VIP feature card)
- [x] Header — Mega Menu: دنیای اکسسوری (accessory groups + view-all link)
- [x] Header — Search panel (slide-down, full-width input)
- [x] Header — Actions bar (search icon, account icon, cart badge, VIP button)
- [x] Header — Mobile drawer (slide-in, search, full nav, VIP footer)
- [x] Footer component — CTA strip (رزرو مشاوره VIP)
- [x] Footer component — Main grid (brand + quick links + 2 branches)
- [x] Footer component — Branch cards (address, hours, maps links, phone)
- [x] Footer component — Support channels (phone cards)
- [x] Footer component — Legal bottom bar (copyright, privacy, scroll-top)
- [ ] Skip-to-content link (accessibility)
- [ ] Dark mode toggle (persisted in localStorage)
- [ ] App-level loading screen (cinematic intro — Package 2)

---

## Phase 3 — Home Page
> First impression. Must feel cinematic and luxury.

- [x] Split Hero — 2-panel (accessories left / bridal right)
- [x] Split Hero — hover zoom on media, gold eyebrow text, animated CTA buttons
- [ ] Featured Categories strip (horizontal scroll, icon cards)
- [ ] New Arrivals section (product grid, lazy-loaded from API)
- [ ] Curated Looks / استایل‌های منتخب section (3-col editorial grid)
- [ ] Appointment / VIP booking section (`#appointment` anchor)
- [ ] FAQ accordion section (`#faq` anchor)
- [ ] About / Brand story section (`#about` anchor)
- [ ] Home page ambient glow background (Package 2)
- [ ] Parallax scroll on hero media (Package 3)

---

## Phase 4 — Product Catalog & Detail

- [ ] Catalog page — product grid (3-col desktop / 2-col tablet / 1-col mobile)
- [ ] Catalog page — sidebar filters (category, price range, color, size)
- [ ] Catalog page — active filter chips + clear all
- [ ] Catalog page — sort dropdown (newest / price asc-desc / popular)
- [ ] Catalog page — infinite scroll OR pagination
- [ ] Catalog page — category banner (hero image per category)
- [ ] Product card component (image, title, price, add-to-cart, wishlist)
- [ ] Product card — hover reveals second image (outfit detail)
- [ ] Product detail page — image gallery (main + thumbnails)
- [ ] Product detail page — size & color selector
- [ ] Product detail page — add to cart + quantity
- [ ] Product detail page — related products carousel
- [ ] Product detail page — engraving / customization option

---

## Phase 5 — Cart & Checkout

- [ ] Cart page — item list (image, name, qty stepper, remove)
- [ ] Cart page — coupon code input + validation
- [ ] Cart page — order summary (subtotal, shipping, discount, total)
- [ ] Cart page — proceed to checkout CTA
- [ ] Checkout page — billing form (name, phone, address, city)
- [ ] Checkout page — shipping method selector
- [ ] Checkout page — payment gateway integration (Zarinpal / Shaparak)
- [ ] Order confirmation page
- [ ] Empty cart state (illustrated CTA to catalog)

---

## Phase 6 — User Account

- [ ] Login / Register page (WooCommerce auth via REST API)
- [ ] Account dashboard (orders, wishlist, profile)
- [ ] Order history list + order detail view
- [ ] Profile edit form (name, email, phone, address)
- [ ] Change password flow

---

## Feature 1 — 🤖 AI Virtual Fitting Room
> اتاق پرو هوش مصنوعی تعاملی

- [ ] UI shell — full-screen try-on modal
- [ ] Camera / photo upload interface (user uploads body photo)
- [ ] AI overlay service integration (3rd-party API or custom model)
- [ ] Product selector inside try-on room (browse while trying)
- [ ] Save / share try-on result
- [ ] Mobile-optimized camera flow
- [ ] Fallback: static size guide when AI unavailable

---

## Feature 2 — 💎 Lookbook & Matchmaker
> تالار استایل و ست‌ساز هوشمند

- [ ] Looks archive page (masonry editorial grid)
- [ ] Single look page (full-bleed image, product tags overlay)
- [ ] "Shop this look" — buy entire set from one page
- [ ] Smart Matchmaker — select one item, AI suggests completing pieces
- [ ] Filter looks by style / occasion / season
- [ ] Look bookmarking (save to Dream Board)
- [ ] Editorial photography grid — Theater Mode (Package 3)

---

## Feature 3 — 👑 VIP Loyalty & Referral System
> باشگاه معرفی و امتیازات VIP

- [ ] Loyalty points engine (earn on purchase, earn on referral)
- [ ] Points dashboard in user account
- [ ] Referral link generator (unique per user)
- [ ] Referral tracking & reward automation
- [ ] VIP tiers UI (Silver / Gold / Diamond with perks list)
- [ ] Points redemption at checkout (discount codes)
- [ ] Milestone notifications (toast / email)

---

## Feature 4 — 💬 Luxury Concierge Chatbot
> چت‌بات مشاور لوکس هوشمند

- [ ] Floating chat widget (bottom-left, luxury styled)
- [ ] Open / close animation (silk ease)
- [ ] Chat bubble component (user + bot messages)
- [ ] Bot persona: "مشاور مظهری" — warm, expert Persian tone
- [ ] Pre-defined flows: product help, appointment booking, order tracking
- [ ] Integration with ChatGPT / Dialogflow API
- [ ] Human handoff CTA (WhatsApp / phone)
- [ ] Persist chat history in sessionStorage

---

## Feature 5 — 🌸 Digital Dream Board / Wishlist
> دفترچه‌ی رویاییِ دیجیتال

- [ ] Wishlist page — Pinterest-style masonry grid
- [ ] Add / remove product from wishlist (heart icon on product card)
- [ ] Add looks to Dream Board
- [ ] Board organization (create named boards: "لباس اصلی", "اکسسوری", ...)
- [ ] Drag-and-drop reorder within board
- [ ] Share board via link (public / private toggle)
- [ ] Move item from board to cart
- [ ] Persistent (logged-in: server / guest: localStorage)

---

## Feature 6 — 🎬 Cinematic Gallery & Theater Mode
> گالری سینمایی و حالت نمایشگر تمرکزی

- [ ] `GalleryComponent` — masonry / grid layout
- [ ] Thumbnail grid with hover overlay (title + quick-view)
- [ ] Theater Mode trigger (click image to enter)
- [ ] Theater Mode — dark backdrop (`rgba(0,0,0,0.88)`) + blur
- [ ] Theater Mode — focused image scales up (`scale(1.06)`)
- [ ] Theater Mode — surrounding images dim (`opacity: 0.15`)
- [ ] Theater Mode — keyboard nav (← → arrows, ESC to close)
- [ ] Theater Mode — touch/swipe support (mobile)
- [ ] Theater Mode — focus trap for accessibility
- [ ] Smooth enter/exit transitions (`0.5s cubic-bezier`)
- [ ] Zoom & pan gesture support (pinch on mobile)

---

## Feature 7 — ✨ Parallax & Smooth Scroll Effects
> افکت‌های پارالکس و اسکرول ابریشمی

- [ ] `ParallaxDirective` — `@Directive` for any element
- [ ] Hero section parallax (depth `0.35`)
- [ ] Section background parallax (depth `0.2`)
- [ ] Product image parallax on catalog cards (depth `0.15`)
- [ ] Smooth scroll behavior (CSS `scroll-behavior: smooth` + JS polyfill)
- [ ] Scroll-triggered fade-in (`IntersectionObserver` + `fade-in` class)
- [ ] Scroll-triggered slide-in from bottom/side
- [ ] Scroll progress indicator (thin gold bar at top of page)
- [ ] `prefers-reduced-motion` disables ALL parallax & scroll animations
- [ ] Performance: use `will-change: transform` only on active parallax elements

---

## Cross-cutting Concerns

- [ ] SEO meta tags (Angular Meta service — title, description, OG tags)
- [ ] Structured data / Schema.org (Organization, Product, LocalBusiness)
- [ ] Sitemap generation
- [ ] PWA manifest + service worker (offline shell)
- [ ] Error boundary — global 404 page (luxury styled)
- [ ] Error boundary — 500 / API error page
- [ ] Toast notification system (cart actions, form feedback)
- [ ] Cookie consent banner (GDPR / Iranian law)
- [ ] Analytics integration (Google Analytics 4)
- [ ] Performance: lazy images, preload hero, code splitting

---

## Progress Summary

| Phase / Feature | Status | Notes |
|-----------------|--------|-------|
| Phase 1 — Infrastructure | ✅ Complete | All core services done |
| Phase 2 — Layout & Shell | 🟡 In Progress | Header/Footer done, loading screen pending |
| Phase 3 — Home Page | 🟡 In Progress | Split Hero done, sections pending |
| Phase 4 — Catalog & Detail | ⬜ Not started | — |
| Phase 5 — Cart & Checkout | ⬜ Not started | — |
| Phase 6 — User Account | ⬜ Not started | — |
| Feature 1 — AI Fitting Room | ⬜ Not started | Needs API research |
| Feature 2 — Lookbook | ⬜ Not started | — |
| Feature 3 — VIP Loyalty | ⬜ Not started | — |
| Feature 4 — Concierge Chatbot | ⬜ Not started | Needs AI API key |
| Feature 5 — Dream Board | ⬜ Not started | — |
| Feature 6 — Theater Mode | ⬜ Not started | — |
| Feature 7 — Parallax | ⬜ Not started | — |

---

*Last updated: July 2026*
*Reference: `DESIGN_SYSTEM.md` for all visual standards.*
