import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageDir = join(repo, "beevast-home-v4");
const htmlPath = join(pageDir, "index.html");
const html = readFileSync(htmlPath, "utf8");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function localPath(raw) {
  const clean = raw.split(/[?#]/, 1)[0];
  if (!clean || /^(?:https?:|data:|tel:|mailto:|javascript:)/.test(clean)) return null;
  return join(pageDir, clean);
}

check(!html.includes("fonts.font.im"), "third-party font stylesheet/preconnect remains");
for (const marker of [
  "BeeWork AI · 产品能力一览",
  'id="capabilities"',
  'href="#capabilities"',
  "cap-switcher",
  "cap-tab",
  "cap-panel",
  "cap-shot",
  "selectCap",
]) {
  check(!html.includes(marker), `removed capability marker remains: ${marker}`);
}

const imagePairs = [
  { webp: "assets/hero-poster.webp", jpeg: "assets/hero-poster.jpg" },
  { webp: "assets/logo-lockup.webp", jpeg: "assets/logo-lockup.jpg" },
];
for (const { webp, jpeg } of imagePairs) {
  const webpPath = join(pageDir, webp);
  const jpegPath = join(pageDir, jpeg);
  check(existsSync(jpegPath), `missing JPEG fallback: ${jpeg}`);
  check(html.includes(jpeg), `JPEG fallback not referenced: ${jpeg}`);
  if (existsSync(webpPath)) {
    check(statSync(webpPath).size < statSync(jpegPath).size, `WebP is not smaller: ${webp}`);
    check(html.includes(webp), `generated WebP not referenced: ${webp}`);
  } else {
    check(!html.includes(webp), `HTML references missing WebP: ${webp}`);
  }
}

function hasPicturePair(webp, jpeg) {
  return [...html.matchAll(/<picture\b[^>]*>([\s\S]*?)<\/picture>/g)].some((match) => {
    const contents = match[1];
    return new RegExp(`<source\\b[^>]*srcset="${webp.replace(".", "\\.")}(?:\\?[^\"]*)?"[^>]*type="image/webp"`).test(contents)
      && new RegExp(`<img\\b[^>]*src="${jpeg.replace(".", "\\.")}(?:\\?[^\"]*)?"`).test(contents);
  });
}

for (const { webp, jpeg } of imagePairs) {
  check(hasPicturePair(webp, jpeg), `WebP/JPEG are not a valid <picture> pair: ${webp}`);
}
check(
  /<link\b[^>]*rel="preload"[^>]*as="image"[^>]*href="assets\/hero-poster\.webp(?:\?[^\"]*)?"[^>]*type="image\/webp"[^>]*fetchpriority="high"/.test(html),
  "hero preload does not match the preferred WebP source",
);

for (const required of [
  "content-visibility:auto",
  "contain-intrinsic-size:auto",
  "100dvh",
  "env(safe-area-inset-bottom)",
  ".nav-toggle,.nav-links a,button,.faq-item summary{min-height:44px}",
  ".nav-toggle,.case-dot,.case-arw,.modal-x,.sc-more-link{min-width:44px}",
  ".modal-form input,.modal-form textarea{font-size:16px}",
  "env(safe-area-inset-top)",
  "const caseMotion=!reduceMotion&&window.innerWidth>640",
  "behavior:caseMotion?'smooth':'auto'",
  "@media(prefers-reduced-motion:reduce)",
  "transition:none",
  "'IntersectionObserver' in window",
]) {
  check(html.includes(required), `missing performance/H5 rule: ${required}`);
}

const assetRefs = [...html.matchAll(/\b(?:src|srcset)="([^"]*)"/g)].map((m) => m[1]);
for (const ref of assetRefs) {
  const path = localPath(ref);
  if (path) check(existsSync(path), `missing local asset: ${ref}`);
}

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const match of html.matchAll(/\bhref="#([^"]*)"/g)) {
  if (match[1]) check(ids.has(match[1]), `broken internal anchor: #${match[1]}`);
}

for (const match of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
  try {
    JSON.parse(match[1]);
  } catch (error) {
    failures.push(`invalid JSON-LD: ${error.message}`);
  }
}

for (const match of html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
  try {
    new Function(match[1]);
  } catch (error) {
    failures.push(`invalid inline JavaScript: ${error.message}`);
  }
}

for (const tag of ["html", "head", "body", "nav", "section", "div", "details", "summary", "footer", "form", "script", "style", "picture"]) {
  const opens = (html.match(new RegExp(`<${tag}(?:\\s|>)`, "g")) || []).length;
  const closes = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
  check(opens === closes, `unbalanced <${tag}> tags: ${opens} open / ${closes} close`);
}

check(html.includes("浙ICP备2026038133号"), "ICP record is missing");

const htmlGzipBytes = gzipSync(Buffer.from(html)).length;
check(htmlGzipBytes <= 24_000, `HTML gzip ${htmlGzipBytes} B exceeds 24,000 B`);

function selectedBytes(webp, jpeg) {
  const webpPath = join(pageDir, webp);
  return statSync(existsSync(webpPath) ? webpPath : join(pageDir, jpeg)).size;
}

const heroBytes = selectedBytes("assets/hero-poster.webp", "assets/hero-poster.jpg");
const logoBytes = selectedBytes("assets/logo-lockup.webp", "assets/logo-lockup.jpg");
const criticalBytes = htmlGzipBytes + heroBytes + logoBytes;
const baselineBytes = 119_886;
const reductionPercent = ((baselineBytes - criticalBytes) / baselineBytes) * 100;
check(criticalBytes <= 95_000, `critical resources ${criticalBytes} B exceed 95,000 B`);
check(reductionPercent >= 20, `critical resource reduction ${reductionPercent.toFixed(1)}% is below 20%`);

const metrics = {
  htmlGzipBytes,
  heroBytes,
  logoBytes,
  criticalBytes,
  baselineBytes,
  reductionPercent: Number(reductionPercent.toFixed(1)),
  thirdPartyFontRequests: html.includes("fonts.font.im") ? 15 : 0,
};

if (failures.length) {
  console.error("FAIL home-v4 verification");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(JSON.stringify(metrics));
  process.exit(1);
}

console.log("PASS home-v4 verification");
console.log(JSON.stringify(metrics));
