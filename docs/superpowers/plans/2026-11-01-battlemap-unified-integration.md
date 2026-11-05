# Battlemap Unified Integration Implementation Plan

> Execution: same authorized session, existing isolated worktree; no duplicate writer or nested implementation agents.

**Goal:** Upgrade the original map with shared hierarchical tasks and dual tree/list views.
**Architecture:** A UnifiedTaskModel adapts the existing simulation task ledger, preserving all execution and evidence gates. UI remains vanilla JS, sharing task identity and native dialog navigation.
**Tech Stack:** HTML/CSS/JavaScript, Node tests, existing Chrome browser checks.
**Spec:** docs/superpowers/specs/2026-11-01-battlemap-unified-integration-design.md

## Constraints and review focus
Mock only; no real scheduling or service changes. Existing guarded actions remain; no automatic parent completion. Check ancestor filtering, recursive scope, parent slot/clock safety, escaping, narrow-screen focus and same-state navigation.

### 1. Shared task hierarchy model
- [ ] Add model cases in tests/workflow-unified-model.test.cjs for parent non-execution, ancestry/descendants, type/lifecycle/signals, recursive scope and parent completion independence.
- [ ] Implement UnifiedTaskModel in the map with existing sim.tasks as sole ledger; metadata and plan fields plus non-executing parent records.
- [ ] Run the focused Node tests and existing model regression.

### 2. Two integrated tree entrypoints
- [ ] Add map area battle/tree switch and tree/list task-center toolbar, ancestor-preserving filtering and persistent selection/collapse.
- [ ] Extend details with separate lifecycle/stage/signals and decomposition/plan/children/versions, retaining execution evidence and human gates.
- [ ] Run desktop/mobile/short-landscape interaction and bounding checks; record actual results and limitations.

### 3. Review and delivery
- [ ] Commit fixed source and leave branch PR unmerged. Independent quality review must bind new head.
- [ ] Only after applicable gates, back up current index and replace it atomically; verify public hash and interactions. No self-merge.
