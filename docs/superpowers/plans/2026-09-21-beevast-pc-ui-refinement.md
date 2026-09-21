# BeeVast PC UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the BeeVast homepage PC UI into a restrained, high-quality enterprise presentation while preserving content architecture, existing interactions, and mobile behavior.

**Architecture:** Keep the current single-file static architecture. Replace or extend the existing CSS tokens and component rules in `beevast-home-v4/index.html`, then reshape only the markup inside the existing typical-scenario section. Preserve navigation, form, carousel JavaScript, content order, and all external assets.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Node.js verification script, Playwright CLI with system Chrome, GitHub Pages dev preview.

---

### Task 1: Lock the baseline and browser acceptance matrix

**Files:**
- Do not modify: `scripts/verify-home-v4.mjs`
- Create temporarily, do not commit: `/tmp/beevast-ui-tests/ui.spec.js`
- Test: `beevast-home-v4/index.html`

- [ ] **Step 1: Confirm the existing static baseline**

Run: `node scripts/verify-home-v4.mjs`

Expected: PASS with HTML gzip `23,894B` or lower. Record the exact value as the starting budget; every later slice must rerun this command and remain ≤ 24,000B.

- [ ] **Step 2: Write a temporary Playwright browser contract**

Create `/tmp/beevast-pc-ui.spec.js` with assertions for:

- 1440px hero headline width ≤ 760px, body copy `max-width` ≤ 68ch, title-to-body gap 32–40px, and no horizontal overflow.
- At most three high-saturation gold focal elements in the hero, checked against the explicit primary CTA, badge accent, and key brand mark selectors.
- Scenario markers `.scenario-flow` and exactly three `.scenario-step` elements with the approved labels.
- Four Pilot labels: `首次响应时间`, `一次解决率`, `新人独立接待周期`, `异常闭环时长`.
- At 860px, scenario and real-case columns stack without element rectangle overlap; at 640px and 420px, the nav toggle is visible, CTA rectangles remain inside the viewport, and primary body text computes to at least 14px.
- Navigation links, case arrows/dots, and form controls receive focus; Enter/Space activates buttons; the modal opens/closes; the case rail moves after arrow click and synthetic touch/pointer drag.
- With reduced motion, all `.reveal` elements compute to visible.
- Every `src`, `srcset`, stylesheet and script URL is same-origin, `data:`, or already present in the baseline; no new external request is observed.

Create an isolated temporary runner:

```bash
mkdir -p /tmp/beevast-ui-tests
npm install --prefix /tmp/beevast-ui-tests --no-save @playwright/test@1.55.0
```

Save the following complete script as `/tmp/beevast-ui-tests/ui.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');
const baseURL = 'http://127.0.0.1:4173/';

test.use({ browserName: 'chromium', channel: 'chrome', reducedMotion: 'reduce' });

test('desktop visual contract', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  const html = page.locator('html');
  expect(await html.evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  expect((await page.locator('.hero h1').boundingBox()).width).toBeLessThanOrEqual(760);
  const bodyMeasure = await page.locator('.section-desc').first().evaluate(el => { const s = getComputedStyle(el); return { width: el.getBoundingClientRect().width, fontSize: parseFloat(s.fontSize) }; });
  expect(bodyMeasure.width).toBeLessThanOrEqual(bodyMeasure.fontSize * 68);
  const headedSections = page.locator('.section-head:has(.section-desc)');
  for (let i = 0; i < await headedSections.count(); i++) {
    const gap = await headedSections.nth(i).evaluate(el => { const a = el.querySelector('.section-title').getBoundingClientRect(); const b = el.querySelector('.section-desc').getBoundingClientRect(); return Math.round(b.top - a.bottom); });
    expect(gap).toBeGreaterThanOrEqual(32);
    expect(gap).toBeLessThanOrEqual(40);
  }
  expect(await page.locator('.hero .ha-primary, .hero .accent, .hero .hero-badge').count()).toBeLessThanOrEqual(3);
  await expect(page.locator('.scenario-flow')).toHaveCount(1);
  await expect(page.locator('.scenario-step')).toHaveCount(3);
  for (const label of ['客户询问 · 识别运单', '聚合节点 · 判断异常 · 回复', '建单分派 · 催办闭环 · 人工审批', '首次响应时间', '一次解决率', '新人独立接待周期', '异常闭环时长']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  expect(requests.every(url => { const u = new URL(url); return ['127.0.0.1', 'localhost'].includes(u.hostname) || url.startsWith('data:'); })).toBeTruthy();
  expect(await page.locator('.reveal').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1'))).toBeTruthy();
});

for (const viewport of [{ width: 860, height: 900 }, { width: 640, height: 900 }, { width: 420, height: 860 }]) {
  test(`responsive ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    const boxes = await page.locator('.scenario-step').evaluateAll(els => els.map(el => el.getBoundingClientRect()).map(r => ({ top:r.top, bottom:r.bottom, left:r.left, right:r.right })));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].top >= boxes[i - 1].bottom || boxes[i].left >= boxes[i - 1].right).toBeTruthy();
    if (viewport.width <= 640) {
      await expect(page.locator('.nav-toggle')).toBeVisible();
      const cta = await page.locator('.hero-actions').boundingBox();
      expect(cta.x >= 0 && cta.x + cta.width <= viewport.width).toBeTruthy();
      expect(parseFloat(await page.locator('.sol-desc').first().evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    }
    await page.screenshot({ path: `/tmp/beevast-ui-tests/viewport-${viewport.width}.png`, fullPage: true });
  });
}

test('keyboard and core interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.locator('.nav-cta').focus();
  await expect(page.locator('.nav-cta')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.modal-mask')).toHaveClass(/open/);
  await page.locator('.modal-form input').first().focus();
  await expect(page.locator('.modal-form input').first()).toBeFocused();
  await page.locator('.modal-x').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.modal-mask')).not.toHaveClass(/open/);
  for (const selector of ['.case-arw', '.case-dot']) {
    await page.locator(selector).first().focus();
    await expect(page.locator(selector).first()).toBeFocused();
  }
  const rail = page.locator('#caseRail');
  const before = await rail.evaluate(el => el.scrollLeft);
  await page.locator('.case-arw[data-case="1"]').click();
  await page.waitForTimeout(500);
  expect(await rail.evaluate(el => el.scrollLeft)).not.toBe(before);
  const beforeDrag = await rail.evaluate(el => el.scrollLeft);
  await rail.dispatchEvent('pointerdown', { pointerId: 1, clientX: 900, clientY: 500 });
  await rail.dispatchEvent('pointermove', { pointerId: 1, clientX: 500, clientY: 500 });
  await rail.dispatchEvent('pointerup', { pointerId: 1, clientX: 500, clientY: 500 });
  expect(await rail.evaluate(el => el.scrollLeft)).not.toBe(beforeDrag);
});

test('capture after full page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/Users/skynet/git/beevast-decks/output/beevast-home-pc-after-2026-09-21.png', fullPage: true });
});
```

Exact full-suite invocation:

```bash
cd /tmp/beevast-ui-tests
npx playwright test ui.spec.js --reporter=line --workers=1
```

Checkpoint invocations use named grep targets:

```bash
npx playwright test ui.spec.js --reporter=line --workers=1 --grep 'desktop visual contract'
npx playwright test ui.spec.js --reporter=line --workers=1 --grep 'responsive 860'
npx playwright test ui.spec.js --reporter=line --workers=1 --grep 'keyboard and core interactions'
```

- [ ] **Step 3: Start a retained local server and run the browser contract before implementation**

Run in a retained exec session: `python3 -m http.server 4173 --directory beevast-home-v4`

Run the temporary Playwright test against `http://127.0.0.1:4173/`.

Expected: existing regression checks pass; new `.scenario-flow`/`.scenario-step` and related layout assertions fail before implementation.

- [ ] **Step 4: Confirm and record the before screenshot artifact**

Run: `sips -g pixelWidth -g pixelHeight output/beevast-home-pc-before-2026-09-21.png`

Expected: width `1440`; record width and height in the final delivery note.

- [ ] **Step 5: Preserve the allowed file scope**

Do not commit `/tmp/beevast-pc-ui.spec.js`, screenshot files, or any verifier change. Only `beevast-home-v4/index.html` may change during implementation.

### Task 2: Refine global visual tokens and desktop rhythm

**Files:**
- Modify: `beevast-home-v4/index.html` (root tokens, typography, section spacing, buttons, shared cards)
- Test: `scripts/verify-home-v4.mjs`

- [ ] **Step 1: Refine shared tokens**

Reduce shadow intensity and border glow, normalize card radius to 14px, keep warm white and navy surfaces, and reserve brand gold for primary actions, tags, steps, and key numbers.

Use replacement, not additive overrides: edit existing token declarations and component rules in place. Consolidate the duplicate `.case-study` shadow/margin declarations and repeated responsive declarations before adding any new workflow styles.

- [ ] **Step 2: Refine typography and section spacing**

Set desktop section padding to the approved 88–104px range, constrain the hero headline to 760px, normalize heading weights, and improve body line height without changing visible copy.

- [ ] **Step 3: Refine shared cards and buttons**

Use one low-contrast shadow layer, 1px borders, restrained hover movement up to 2px, and a clear primary/secondary CTA hierarchy.

- [ ] **Step 4: Run static verification**

Run: `node scripts/verify-home-v4.mjs && git diff --check`

Expected: PASS; HTML gzip ≤ 24,000B. If the slice increases gzip size, reduce or replace old CSS before committing—do not relax the verifier.

- [ ] **Step 5: Run the 1440px browser assertions for this slice**

Expected: hero width, 68ch body measure, 32–40px title/body gap, ≤3 gold hero focal points, and horizontal-overflow checks pass.

- [ ] **Step 6: Commit the shared-system refinement**

Run:

```bash
git add beevast-home-v4/index.html
git commit -m "style(home-v4): refine desktop visual system"
```

### Task 3: Refine hero and supporting sections

**Files:**
- Modify: `beevast-home-v4/index.html` (navigation, hero, solution, scenario capability, advantage, process, FAQ, footer CSS only)
- Test: `scripts/verify-home-v4.mjs`

- [ ] **Step 1: Strengthen hero hierarchy**

Tighten headline measure and headline-to-CTA spacing, reduce secondary CTA prominence, and flatten the product-preview glow while retaining existing media and DOM order. The current hero has no explanation paragraph: do not invent one. Treat the existing `.hero-trust` band below the CTAs as the supporting evidence layer in the approved title → CTA → evidence path.

- [ ] **Step 2: Normalize supporting-section density**

Align card padding, icon containers, headings, and grid gaps across solution, capability, advantage, process, FAQ, and footer sections.

- [ ] **Step 3: Run static verification**

Run: `node scripts/verify-home-v4.mjs && git diff --check`

Expected: PASS with HTML gzip ≤ 24,000B and no new external request/dependency.

- [ ] **Step 4: Run the 1440px browser acceptance checkpoint**

Expected: headline, copy measure, section-gap, gold-focus, focusability and modal checks pass before commit.

- [ ] **Step 5: Commit hero and section refinement**

Run:

```bash
git add beevast-home-v4/index.html
git commit -m "style(home-v4): improve hero and section rhythm"
```

### Task 4: Give the typical scenario a distinct workflow presentation

**Files:**
- Modify: `beevast-home-v4/index.html` (existing `#cases` section markup and styles)
- Test: `scripts/verify-home-v4.mjs`

- [ ] **Step 1: Reshape the intelligent after-sales card**

Inside the existing section, replace the generic three-column case appearance with a dedicated workflow component containing three numbered stages:

1. `客户询问 · 识别运单`
2. `聚合节点 · 判断异常 · 回复`
3. `建单分派 · 催办闭环 · 人工审批`

Keep the approved four Pilot indicators and human-approval boundary.

Exact labels: `首次响应时间`, `一次解决率`, `新人独立接待周期`, `异常闭环时长`.

- [ ] **Step 2: Refine the real-case rail**

Keep three evidence-backed cases in the carousel, align their headings and metric panels, and visually subordinate carousel controls.

- [ ] **Step 3: Complete responsive rules**

At 860px and below, stack the workflow stages and preserve readable arrows/order. At 640px and 420px, keep CTAs and labels inside the viewport.

Replace the former typical-scenario generic card markup instead of retaining both structures. Reuse existing colors and spacing tokens. Keep the workflow CSS compact enough that the combined HTML gzip remains ≤ 24,000B; remove obsolete scenario-only declarations before adding equivalents.

- [ ] **Step 4: Run the full static verifier**

Run: `node scripts/verify-home-v4.mjs && git diff --check`

Expected: `PASS home-v4 verification`; HTML gzip ≤ 24,000B, critical resources ≤ 95,000B, reduction ≥ 20%, external font requests 0.

- [ ] **Step 5: Run workflow and 860px browser assertions**

Expected: exactly three workflow stages, all four Pilot labels, real-case stacking, and zero rectangle overlap pass.

- [ ] **Step 6: Commit the scenario refinement**

Run:

```bash
git add beevast-home-v4/index.html
git commit -m "style(home-v4): distinguish scenario workflow from case proof"
```

### Task 5: Complete responsive, interaction, and visual comparison QA

**Files:**
- Modify if required: `beevast-home-v4/index.html`
- Test: live local/static page and `scripts/verify-home-v4.mjs`

- [ ] **Step 1: Reuse the retained local static server**

Run: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4173/`

Expected: HTTP `200`. Restart the retained server only if it has exited.

- [ ] **Step 2: Capture viewport evidence**

Run `/tmp/beevast-ui-tests/ui.spec.js` with system Chrome at 1440×900, 860×900, 640×900, and 420×860. The script saves viewport evidence under `/tmp/beevast-ui-tests`; do not commit it. Require no horizontal overflow, no 860px arrow/text overlap, visible 640/420 nav toggles, in-viewport CTAs, and body text ≥14px.

- [ ] **Step 3: Exercise core interactions**

Require the temporary browser contract to pass navigation/form focus, Enter/Space activation, case arrows/dots, synthetic touch/pointer drag, modal open/close, reduced-motion visibility, and external-request scanning. Fix only concrete regressions found.

- [ ] **Step 4: Run final local verification**

Run: `node scripts/verify-home-v4.mjs && git diff --check`

Expected: PASS with a clean diff check.

- [ ] **Step 5: Commit any validation fixes**

Run:

```bash
git add beevast-home-v4/index.html
git commit -m "fix(home-v4): close PC refinement QA gaps"
```

Skip the commit when no fixes are required.

### Task 6: Capture after screenshot and publish dev preview

**Files:**
- Create locally, do not commit: `output/beevast-home-pc-after-2026-09-21.png`
- Modify through PR merge: GitHub `main` branch only

- [ ] **Step 1: Capture the final PC long screenshot**

Use Playwright CLI with system Chrome, a 1440×900 viewport, `fullPage`, and reduced-motion enabled. Save to the fixed output path.

Run:

```bash
cd /tmp/beevast-ui-tests
npx playwright test ui.spec.js --reporter=line --workers=1 --grep 'capture after full page'
```

Expected: PASS and `output/beevast-home-pc-after-2026-09-21.png` exists. The global Playwright configuration uses system Chrome and `reducedMotion: 'reduce'`.

- [ ] **Step 2: Validate screenshot dimensions**

Run: `sips -g pixelWidth -g pixelHeight output/beevast-home-pc-after-2026-09-21.png`

Expected: width `1440`; record width and height in the final delivery note; the page is fully visible with no hidden reveal sections.

- [ ] **Step 3: Compare before and after screenshots**

Review the two full-page images side by side and explicitly confirm: stronger hero hierarchy; consistent section rhythm; visibly distinct scenario workflow vs evidence-case rail; restrained card shadows/radii; no blank or hidden reveal sections; coherent footer closure.

- [ ] **Step 4: Push the branch and open a PR**

Run `git branch --show-current` and require a branch other than `main`. Run `git diff main...HEAD --name-only` and require only the approved design/plan documents plus `beevast-home-v4/index.html`; separately confirm the implementation diff changes only `index.html`. Push the branch, open a PR against `main`, and merge only after the PR diff and checks are approved.

- [ ] **Step 5: Verify GitHub Pages deployment**

Open `https://yoyo20260321.github.io/beevast-decks/beevast-home-v4/` and require HTTP 200 plus the scenario-flow markers.

- [ ] **Step 6: Apply the approved rollback if dev verification fails**

Use a merge commit strategy for the PR. If GitHub Pages lacks the markers, returns non-200, or shows a blocking layout regression:

```bash
git switch main
git pull --ff-only
git switch -c codex/rollback-pc-ui-refinement
git revert -m 1 <merge_commit_sha>
git push -u origin codex/rollback-pc-ui-refinement
gh pr create --repo yoyo20260321/beevast-decks --base main --head codex/rollback-pc-ui-refinement --title '回滚官网 PC UI 精修' --body '开发预览验证失败，回滚对应 merge commit。'
```

Merge the rollback PR, then require the Pages URL to return HTTP 200 and the prior stable content.

- [ ] **Step 7: Preserve the production guard and stop local services**

Do not run `deploy.sh prod`, do not connect to the production ECS, and report that `beevast.com` remains unchanged.

Stop the retained local server with Ctrl-C and remove `/tmp/beevast-ui-tests` plus temporary viewport evidence.
