# Product refinement Implementation Plan

> **For agentic workers:** Native implementation by the coordinator, independent reviewers after implementation. User already approved all five recommendations.

**Goal:** 使mock地图支持可解释决定、手机任务优先、历史归因与处理闭环。
**Architecture:** 原single HTML，CommandModel扩展draft/decision/inspection；Simulation采样记录历史；单dialog增加evidence/decision/trend视图。
**Tech Stack:** 原生JS/CSS/SVG、Node test、Chrome CDP。
**Spec:** docs/superpowers/specs/2026-11-01-product-refinement-design.md

## Global Constraints
仅本页mock；不改平台/真实任务；保留未知占用、不盲重派、单屏与旧版本拒绝。
## Review Focus
草稿缺AC不批准；过期表单不执行；历史快照不变；手机短屏触点不挤出一屏；筛选下处理任务仍可找结果。

### Task 1 模型与测试
- [ ] 扩展draft提交、理由校验、证据门、带任务的历史快照、演示到期筛选；测试空AC/旧版本/理由/快照。
- [ ] node --test tests/workflow-*.test.cjs通过，原行为不退化。
### Task 2 UI与体验
- [ ] 单弹窗新视图与证据/决策表单、折叠筛选和快捷视图、对象明确、历史选择、归档反馈。
- [ ] 新浏览器测试覆盖五项AC，原9视口geometry与表单安全回归。
### Task 3 复核与交付
- [ ] 固定HEAD独立产品与质量复核；修复再复测。
- [ ] 推送现有draft PR，原子更新静态产物，公网HTTP与哈希核对，保留回退备份。
