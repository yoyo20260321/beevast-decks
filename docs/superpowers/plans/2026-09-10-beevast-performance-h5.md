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

脚本读取 HTML，校验：第三方字体链接为 0；产品能力模块及关联选择器为 0；JPEG 回退均存在；若某张 WebP 文件存在，则它必须小于原 JPEG 且被 `<picture>` 引用，若不存在则 HTML 不得引用它；H5 安全区、`100dvh`、移动输入字号、所有移动导航/按钮/CTA 的 44 px 触控区、`content-visibility`、`prefers-reduced-motion`、IntersectionObserver 回退存在；所有本地图片路径可读；所有 `href="#..."` 均指向存在的 ID；JSON-LD 可解析；备案号存在。用 `gzipSync` 和 `statSync` 计算 HTML gzip 体积及首屏关键资源总量，并断言 HTML gzip 不高于 24,000 B。提取普通内联脚本，以 `new Function()` 做 JavaScript 语法检查；用 `HTMLParser` 等价的标签栈检查确保 HTML 无明显未闭合结构。

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
command -v cwebp
cwebp -quiet -q 82 -m 6 beevast-home-v4/assets/hero-poster.jpg -o beevast-home-v4/assets/hero-poster.webp
cwebp -quiet -q 86 -m 6 -resize 96 98 beevast-home-v4/assets/logo-lockup.jpg -o beevast-home-v4/assets/logo-lockup.webp
```

Expected: `cwebp` 存在；两个文件均生成，且分别小于原 JPEG。若 `cwebp` 不存在，停止并安装受信任的 WebP 工具后重跑；若任一 WebP 不小于原 JPEG，降低质量参数复测一次，仍不达标则该图片保留 JPEG 且从 95 KB 总量预算中重新核算，不引用更大的 WebP。

- [ ] **Step 2: 修改首屏资源引用**

删除 `fonts.font.im` 预连接、样式和 `noscript`；将字体栈切到系统字体。仅对生成后确实小于原 JPEG 的图片更新预加载并用 `<picture>` 提供 WebP + JPEG 回退；未达标的图片继续只引用 JPEG。保留宽高、alt 与首屏优先级。

- [ ] **Step 3: 运行验收脚本**

Run: `node scripts/verify-home-v4.mjs`

Expected: 字体与图片断言通过；首屏关键静态资源不高于 95,000 B（十进制），较 119,886 B 基线下降至少 20%。

- [ ] **Step 4: 提交资源优化**

Run: `git add beevast-home-v4/index.html beevast-home-v4/assets/*.webp && git commit -m "perf(home-v4): reduce critical resource load"`

### Task 3: 补齐渐进增强与 H5 适配

**Files:**
- Modify: `beevast-home-v4/index.html`
- Test: `scripts/verify-home-v4.mjs`

- [ ] **Step 1: 增加首屏外渲染优化**

为 hero 之后的主要 section 添加 `content-visibility:auto` 和 `contain-intrinsic-size`；不改变 DOM 顺序与导航锚点。

- [ ] **Step 2: 增加移动端规则**

在 640 px 以下：CTA 变为整行 44 px 以上触控区；`.nav-toggle`、`.nav-links a`、所有 `button` 和 FAQ `summary` 的可点击高度不低于 44 px；表单控件字号至少 16 px；弹窗以 `100dvh` 约束；底部 CTA 和 body padding 使用 `env(safe-area-inset-bottom)`；关闭固定装饰层、重模糊和非必要动画。在 420 px 以下，将场景区 `.sc-grid.sc-cap-row` 改为单列并收紧标题/间距；不得恢复已删除的 `section#capabilities`。

同时补全 `@media(prefers-reduced-motion:reduce)`：关闭 hero、装饰层、reveal、modal、按钮和卡片的动画/过渡，并让内容直接显示；静态验收脚本必须断言该规则存在。

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

- [ ] **Step 2: 完成真实视口验收或 owner 实机回退验收**

首选使用可用的浏览器检查通道，在 360 / 390 / 430 / 768 / 1440 px 分别验证：无横向滚动；导航可开关；首屏 CTA 可点击；表单可输入、可滚动、关闭正常；FAQ 可展开；移动端底部 CTA 不被安全区遮挡。若浏览器检查通道仍不可用，明确记录限制，发布 GitHub Pages 预览后请 owner 用手机和桌面按同一清单实机确认；未收到确认不得进入生产。

- [ ] **Step 3: 合并到 `main`**

将评审通过的分支快进合并到主工作树，不覆盖主工作树其他改动。

- [ ] **Step 4: 发布 GitHub Pages 预览**

Run: `bash /Users/skynet/.beevast/shared/skills/devops/update-website/scripts/deploy.sh dev`

Expected: Pages workflow 成功；预览 HTTP 200、备案号存在、产品能力模块不存在、验证脚本通过。

- [ ] **Step 5: 记录前后对比并等待 owner 确认**

记录第三方字体请求数 15 → 0、首屏关键资源字节数及降幅、HTML gzip 体积、预览 URL 与验证结果。向 owner 提供预览链接和 360 / 390 / 430 / 768 / 1440 px 检查清单；只有 owner 明确回复预览可上线，才进入 Task 5。

### Task 5: 生产留痕、发布与验证

**Files:**
- Append: `~/.beevast/data/ops-ledger/ledger/2026-09.jsonl`
- Deploy: 阿里云 `/var/www/beevast/`

- [ ] **Step 1: 复述生产影响并核对预览授权**

核对 Task 4 已取得 owner 对最终预览的明确上线确认；发布前再次复述：同步当前 v4 文件、不使用 `--delete`、不改域名/证书/Nginx 配置、平滑 reload、可通过提交回退。缺少最终预览确认则停止。

- [ ] **Step 2: 追加授权台账**

记录操作者、目标、源码提交、变更范围、预期输出与回退点，不写凭证。

- [ ] **Step 3: 执行正典生产发布**

Run: `bash /Users/skynet/.beevast/shared/skills/devops/update-website/scripts/deploy.sh prod`

Expected: rsync 成功，`nginx -t` 成功，reload 返回 OK，HTTPS 200，备案号存在。

失败分支：rsync 失败则不执行后续步骤并保留线上旧版；`nginx -t` 失败则不得 reload，记录错误并停止；reload 失败则立即查询服务状态与错误日志，不进行第二次发布；任一情况都向 owner 报告，不带病进入验证。

- [ ] **Step 4: 验证正式站**

验证 `beevast.com` 与 `www.beevast.com` HTTP 200；无第三方字体引用；WebP 与 JPEG 回退可访问；产品能力模块不存在；FAQ、客户案例、表单与备案号仍存在。

失败分支：若任一域名非 200、关键内容缺失、静态资源不可访问或页面仍含已删除模块，立即停止交付，使用发布前记录的稳定提交恢复 `beevast-home-v4` 并重新执行正典生产发布；恢复后再次验证两域名与备案号，再记录回滚结果。

- [ ] **Step 5: 追加完成台账并交付**

写入最终验证结果和回退提交，向用户报告性能数据、H5 改动和正式 URL。
