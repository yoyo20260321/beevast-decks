# BeeVast 官网性能与 H5 优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变官网内容结构与桌面视觉方向的前提下，减少首屏网络请求和资源体积，补齐 H5 适配，并将已确认删除的产品能力模块随优化版发布到阿里云。

**Architecture:** 保留 `beevast-home-v4/index.html` 单文件静态架构，仅增加两张 WebP 派生资源和一个无依赖验证脚本。页面使用系统字体、`picture` 回退、渐进增强 CSS 与能力检测；发布继续走现有 GitHub Pages → 阿里云正典链路。

**Tech Stack:** HTML5、CSS、原生 JavaScript、Node.js 标准库、`cwebp`、Nginx 静态托管。

---

### Task 1: 建立可重复的静态验收脚本

**Files:**
- Create: `scripts/verify-home-v4.mjs`
- Test: `beevast-home-v4/index.html`

- [ ] **Step 1: 写入失败优先的验收断言**

脚本读取 HTML，校验：第三方字体链接为 0；产品能力模块及关联选择器为 0；WebP 与 JPEG 回退均存在；H5 安全区、`100dvh`、移动输入字号、`content-visibility`、IntersectionObserver 回退存在；所有本地图片路径可读；JSON-LD 可解析；备案号存在。用 `gzipSync` 和 `statSync` 计算首屏关键资源总量。

- [ ] **Step 2: 运行脚本并确认先失败**

Run: `node scripts/verify-home-v4.mjs`

Expected: FAIL，指出外部字体、WebP 或 H5 适配断言尚未满足。

- [ ] **Step 3: 提交验证脚本**

Run: `git add scripts/verify-home-v4.mjs && git commit -m "test(home-v4): add performance and H5 checks"`

Expected: 创建一个仅含验证脚本的提交。

### Task 2: 优化首屏字体与图片

**Files:**
- Create: `beevast-home-v4/assets/hero-poster.webp`
- Create: `beevast-home-v4/assets/logo-lockup.webp`
- Modify: `beevast-home-v4/index.html`
- Test: `scripts/verify-home-v4.mjs`

- [ ] **Step 1: 生成 WebP 派生资源**

Run:

```bash
cwebp -quiet -q 82 -m 6 beevast-home-v4/assets/hero-poster.jpg -o beevast-home-v4/assets/hero-poster.webp
cwebp -quiet -q 86 -m 6 -resize 96 98 beevast-home-v4/assets/logo-lockup.jpg -o beevast-home-v4/assets/logo-lockup.webp
```

Expected: 两个文件均生成，且分别小于原 JPEG。

- [ ] **Step 2: 修改首屏资源引用**

删除 `fonts.font.im` 预连接、样式和 `noscript`；将字体栈切到系统字体。更新 hero 预加载为 WebP；用 `<picture>` 为导航 Logo 和 hero 图片提供 WebP + JPEG 回退，保留宽高、alt 与首屏优先级。

- [ ] **Step 3: 运行验收脚本**

Run: `node scripts/verify-home-v4.mjs`

Expected: 字体与图片断言通过；首屏关键静态资源不高于 95 KB，较 119,886 B 基线下降至少 20%。

- [ ] **Step 4: 提交资源优化**

Run: `git add beevast-home-v4/index.html beevast-home-v4/assets/*.webp && git commit -m "perf(home-v4): reduce critical resource load"`

### Task 3: 补齐渐进增强与 H5 适配

**Files:**
- Modify: `beevast-home-v4/index.html`
- Test: `scripts/verify-home-v4.mjs`

- [ ] **Step 1: 增加首屏外渲染优化**

为 hero 之后的主要 section 添加 `content-visibility:auto` 和 `contain-intrinsic-size`；不改变 DOM 顺序与导航锚点。

- [ ] **Step 2: 增加移动端规则**

在 640 px 以下：CTA 变为整行 44 px 以上触控区；表单控件字号至少 16 px；弹窗以 `100dvh` 约束；底部 CTA 和 body padding 使用 `env(safe-area-inset-bottom)`；关闭固定装饰层、重模糊和非必要动画。在 420 px 以下，能力小卡改为单列并收紧标题/间距。

- [ ] **Step 3: 增加 JavaScript 能力回退**

当 `IntersectionObserver` 不存在时直接为 `.reveal` 添加 `.in`；仅在支持时创建 observer。保留现有交互逻辑。

- [ ] **Step 4: 执行语法和静态检查**

Run:

```bash
node scripts/verify-home-v4.mjs
git diff --check
```

Expected: 全部 PASS，无空白字符错误，无失效锚点和缺失图片。

- [ ] **Step 5: 提交 H5 优化**

Run: `git add beevast-home-v4/index.html && git commit -m "perf(home-v4): improve mobile rendering and compatibility"`

### Task 4: 评审、合并并发布预览

**Files:**
- Review: 本分支全部提交
- Deploy: `beevast-home-v4/`

- [ ] **Step 1: 独立代码评审**

检查规格符合性、无横向溢出风险、无无效选择器、WebP 回退正确、删除模块没有恢复。

- [ ] **Step 2: 合并到 `main`**

将评审通过的分支快进合并到主工作树，不覆盖主工作树其他改动。

- [ ] **Step 3: 发布 GitHub Pages 预览**

Run: `bash /Users/skynet/.beevast/shared/skills/devops/update-website/scripts/deploy.sh dev`

Expected: Pages workflow 成功；预览 HTTP 200、备案号存在、产品能力模块不存在、验证脚本通过。

- [ ] **Step 4: 记录前后对比**

记录第三方字体请求数 15 → 0、首屏关键资源字节数及降幅、HTML gzip 体积、预览 URL 与验证结果。

### Task 5: 生产留痕、发布与验证

**Files:**
- Append: `~/.beevast/data/ops-ledger/ledger/2026-09.jsonl`
- Deploy: 阿里云 `/var/www/beevast/`

- [ ] **Step 1: 复述生产影响并确认授权**

用户已要求“完成后发布到阿里云”；发布前再次复述：同步当前 v4 文件、不使用 `--delete`、不改域名/证书/Nginx 配置、平滑 reload、可通过提交回退。

- [ ] **Step 2: 追加授权台账**

记录操作者、目标、源码提交、变更范围、预期输出与回退点，不写凭证。

- [ ] **Step 3: 执行正典生产发布**

Run: `bash /Users/skynet/.beevast/shared/skills/devops/update-website/scripts/deploy.sh prod`

Expected: rsync 成功，`nginx -t` 成功，reload 返回 OK，HTTPS 200，备案号存在。

- [ ] **Step 4: 验证正式站**

验证 `beevast.com` 与 `www.beevast.com` HTTP 200；无第三方字体引用；WebP 与 JPEG 回退可访问；产品能力模块不存在；FAQ、客户案例、表单与备案号仍存在。

- [ ] **Step 5: 追加完成台账并交付**

写入最终验证结果和回退提交，向用户报告性能数据、H5 改动和正式 URL。
