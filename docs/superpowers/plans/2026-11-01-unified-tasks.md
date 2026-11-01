# 统一任务树 Implementation Plan
Goal: 公网可访问的10任务交互Demo及设计说明。
Architecture: 独立无依赖HTML，共享任务数组驱动树、列表、详情，沿用growclaw静态服务。
Spec: ../specs/2026-11-01-unified-tasks-design.md
Constraints: 仅内存Mock、十个任务含父节点、不改既有运行和平台权限。
- [x] 创建独立Demo：固定样例、正交状态、祖先筛选、选择/展开和详情。
- [x] 增加有理由的模拟处理、取消终态/父关单保护、重置；链接原地图。
- [x] 模型与浏览器核验，独立复核，发布同域新路径并HTTP读回。
