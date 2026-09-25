# BeeVast Homepage Three-Scenario Carousel Implementation Plan

**Goal:** Replace the homepage's single typical-scenario card with an accessible, manual three-scenario carousel while preserving the 24,000-byte gzip budget and the independent customer-case carousel.

**Architecture:** Keep all three scenarios as semantic static HTML, with only the first slide visible when JavaScript is unavailable. Use vanilla JavaScript solely to switch the existing slides and synchronize visual and accessibility state. Route arrow, dot, keyboard, and touch changes through one index update function. Extend the verifier with structural, asset, accessibility, isolation, and no-entry assertions.

**Files:**

- Modify: `beevast-home-v4/index.html`
- Modify: `scripts/verify-home-v4.mjs`
- Test: `scripts/verify-home-v4.mjs`

## Task 1: Lock the baseline

- [x] Run `node scripts/verify-home-v4.mjs`.
- [x] Record baseline `htmlGzipBytes=23996` and keep the `<=24000` gate unchanged.

## Task 2: Add failing static contracts

- [x] Assert the isolated scenario carousel IDs and controller markers.
- [x] Assert three approved titles and `../demos/scenario-{1,2,3}-*.png` references.
- [x] Assert `aria-current` synchronization code and absence of scenario Demo/detail links.
- [x] Run the verifier and confirm the new contracts fail before implementation.

## Task 3: Implement the carousel

- [x] Replace the single scenario card with a static first slide, controls, accessible labels, and stable image geometry.
- [x] Add the two remaining semantic slides locally without third-party requests.
- [x] Implement one wrapped `go(index)` path for arrows, dots, keyboard activation, and touch swipe.
- [x] Keep the first slide visible without JavaScript; with JavaScript, hide non-current slides from layout, focus, and accessibility APIs.
- [x] Add desktop/mobile layout and reduced-motion behavior without automatic playback.

## Task 4: Preserve the performance budget

- [x] Remove obsolete single-scenario rules and compact redundant inline CSS/JS/markup in place.
- [x] Run `node scripts/verify-home-v4.mjs` after each slice; do not raise the 24,000-byte threshold.

## Task 5: Verify and hand off

- [x] Run `node scripts/verify-home-v4.mjs` and `git diff --check`.
- [x] Serve locally and check 1440×900, 860×900, 640×900, and 420×860 for overflow and readability.
- [x] Verify arrows, dots, Enter/Space, swipe, wraparound, ARIA state, no-JS first slide, and independent case-carousel behavior.
- [x] Commit implementation on `codex/homepage-three-scenarios-carousel`; do not deploy production.
