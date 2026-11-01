# Operation focus Implementation Plan

**Goal:** 同屏发现作业问题并下探某需求/任务与单Agent执行。
**Architecture:** 保持Simulation准入真值；OperationModel维护身份/执行/问题/范围查询，单dialog扩展下探。
**Tech Stack:** 原生JS/CSS/SVG、Node test、Chrome CDP。
**Spec:** docs/superpowers/specs/2026-11-01-operation-focus-design.md

## Global Constraints
仅Mock；未知占槽；阶段版本保护；不把需求归属当依赖；默认一屏；全局资源明确独立口径。
## Review Focus
生命周期重复观察不增执行；同角色不同Agent与同Agent多会话；问题首次观测时刻；聚焦后的数量/灯/流水一致；缺证据不画依赖或虚构进度。

- [ ] 模型：执行账本/问题与范围查询；稳定身份、重试、未知与解除反例。
- [ ] UI：待处理与需求任务选择、聚焦地图、Agent/执行下探；主操作区一屏及全局资源标签。
- [ ] 增加可重复Mock并发/阻塞场景；模型和9视口回归、两视口用户路径。
- [ ] 固定HEAD独立质量与产品复核；修复后复核；push draft，原公网原子替换并核验。
