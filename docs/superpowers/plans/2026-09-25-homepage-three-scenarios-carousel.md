# BeeVast Homepage Three-Scenario Carousel Implementation Plan

**Goal:** Replace the homepage's single typical-scenario card with an accessible, manual three-scenario carousel while preserving the 24,000-byte gzip budget and the independent customer-case carousel.

**Architecture:** Keep the first scenario as semantic static HTML for no-JavaScript readability. Store the other two scenarios as compact local data rendered into the same isolated carousel by vanilla JavaScript. Route arrow, dot, keyboard, and touch changes through one index update function. Extend the existing verifier with structural, asset, accessibility, isolation, and no-entry assertions.

**Files:**

- Modify: `beevast-home-v4/index.html`
- Modify: `scripts/verify-home-v4.mjs`
- Test: `scripts/verify-home-v4.mjs`

## Task 1: Lock the baseline

- [x] Run `node scripts/verify-home-v4.mjs`.
- [x] Record baseline `htmlGzipBytes=23996` and keep the `<=24000` gate unchanged.

## Task 2: Add failing static contracts

- [ ] Assert the isolated scenario carousel IDs and controller markers.
- [ ] Assert three approved titles and `../demos/scenario-{1,2,3}-*.png` references.
- [ ] Assert `aria-current` synchronization code and absence of scenario Demo/detail links.
- [ ] Run the verifier and confirm the new contracts fail before implementation.

## Task 3: Implement the carousel

- [ ] Replace the single scenario card with a static first slide, controls, accessible labels, and stable image geometry.
- [ ] Add compact data for the two remaining scenarios and render them locally without third-party requests.
- [ ] Implement one wrapped `go(index)` path for arrows, dots, keyboard activation, and touch swipe.
- [ ] Keep the first slide visible without JavaScript; with JavaScript, hide non-current slides from layout, focus, and accessibility APIs.
- [ ] Add desktop/mobile layout and reduced-motion behavior without automatic playback.

## Task 4: Preserve the performance budget

- [ ] Remove obsolete single-scenario rules and compact redundant inline CSS/JS/markup in place.
- [ ] Run `node scripts/verify-home-v4.mjs` after each slice; do not raise the 24,000-byte threshold.

## Task 5: Verify and hand off

- [ ] Run `node scripts/verify-home-v4.mjs` and `git diff --check`.
- [ ] Serve locally and check 1440×900, 860×900, 640×900, and 420×860 for overflow and readability.
- [ ] Verify arrows, dots, Enter/Space, swipe, wraparound, ARIA state, no-JS first slide, and independent case-carousel behavior.
- [ ] Commit implementation on `codex/homepage-three-scenarios-carousel`; do not deploy production.
