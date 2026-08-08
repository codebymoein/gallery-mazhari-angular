# Accessibility Acceptance Protocol

This protocol is the manual evidence companion to the automated RM-14 Axe, keyboard, and reflow suite. It does not replace automated checks and it must be run against the same reviewed release candidate that is being certified.

## Scope

Validate the public storefront and the admin authentication surface at minimum. Critical journeys are product discovery, opening and closing overlays, consultation/contact entry points, cart/checkout navigation, and admin sign-in. When authenticated test data is available, repeat the protocol for the primary admin navigation and business-critical forms.

## Required environments

- VoiceOver on a currently supported iPhone/Safari combination.
- VoiceOver on macOS Safari for desktop keyboard/screen-reader interaction.
- NVDA on Windows with current Chrome or Firefox.
- Browser zoom at 200% and 400% on desktop.
- A 320 CSS-pixel viewport for narrow reflow validation.
- `prefers-reduced-motion: reduce` enabled once per platform.

Record browser/OS/screen-reader versions, tested Git SHA, date, tester, and any exception ID in the release evidence.

## Keyboard and focus acceptance

1. Starting from the browser chrome, use only keyboard controls to reach the first meaningful page action.
2. Verify the skip link is discoverable by focus and moves focus to main content.
3. Traverse header navigation, catalog controls, forms, cart/checkout controls, and admin login without pointer input.
4. Open the Dream Canvas and any other modal/overlay encountered in the journey. Focus must move into the overlay, remain trapped while it is modal, Escape must close it when applicable, and focus must return to the control that opened it.
5. Focus indicators must remain visible against their current background and must not be clipped.
6. No hidden, inert, off-screen, or visually removed control may receive keyboard focus.

## Screen-reader acceptance

For each required screen reader, verify:

- one useful page title and one logical primary heading are announced;
- landmarks and navigation names distinguish major regions;
- buttons and links have meaningful accessible names that describe the action;
- form controls announce their label, required/invalid state, and associated error text;
- asynchronous success, error, loading, and status changes are announced without forcing unexpected focus changes;
- modal title and description are announced on entry and background controls are not exposed as an active interaction path while the modal is open;
- product images that convey product identity have meaningful alt text while decorative images remain silent;
- disabled and selected states are announced for relevant controls.

## Zoom and narrow reflow acceptance

At 200% and 400% browser zoom, and separately at 320 CSS pixels wide:

- reading and operation must not require two-dimensional scrolling for normal page content;
- text must not be clipped, overlap interactive controls, or become unreadable;
- dialogs, menus, forms, validation messages, and sticky/fixed controls must remain reachable;
- controls must not obscure essential content or each other;
- horizontal scrolling is acceptable only for a component whose meaning requires two-dimensional layout and whose container exposes that scrolling intentionally.

## Reduced motion and contrast acceptance

Enable reduced motion and repeat overlay open/close plus one catalog journey. Required information or state must not depend on animation. Verify normal text and interactive-state contrast with automated Axe results plus visual inspection of focus, disabled, error, selected, and status states.

## Evidence and disposition

A release candidate fails RM-14 acceptance when a critical journey cannot be completed by keyboard or screen reader, modal focus escapes or is not restored, an asynchronous blocking error is not announced, required content breaks at 200%/400% zoom or 320px reflow, or Axe reports a critical/serious violation.

Every failure must be linked to a remediation finding or follow-up issue with severity, reproduction steps, affected route/control, owner, and disposition. Exceptions require explicit owner approval and must not be silently removed from the evidence.
