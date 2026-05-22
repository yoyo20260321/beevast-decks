# beevast-decks

群蜂智能内部 deck 公开镜像 — 走 GitHub Pages 静态托管，方便手机/同事直接打开预览。

## 已有 deck

| 路径 | 说明 | 生成日期 |
|---|---|---|
| [`/cost-analysis-2026-05-22/`](https://yoyo20260321.github.io/beevast-decks/cost-analysis-2026-05-22/) | Master Brain 4 天用量分析（按天 × 按 bot） | 2026-05-22 |

| [`/v3-architecture-talk/`](https://yoyo20260321.github.io/beevast-decks/v3-architecture-talk/) | (在这一行写说明) | 2026-05-22 |

| [`/last30d-ai-agent/`](https://yoyo20260321.github.io/beevast-decks/last30d-ai-agent/) | (在这一行写说明) | 2026-05-22 |

## 怎么加新 deck

1. 把 `index.html`（含相对 `assets/*` 也行）扔到 `<slug>/` 目录
2. `git push origin main`
3. GitHub Pages 自动部署，~30s 后 `https://yoyo20260321.github.io/beevast-decks/<slug>/` 可访问

## 工具栈

- 由 [html-ppt skill](https://github.com/lewislulu/html-ppt-skill) 生成
- 数据源：master-brain `turn-summary.db`（聚合所有 dev bot）
