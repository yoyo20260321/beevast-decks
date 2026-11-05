# Ten scenario integration implementation plan

**Goal:** Load the approved ten sample tasks into the main map with revised type names and guarded scenario actions.
**Spec:** docs/superpowers/specs/2026-11-02-battlemap-ten-scenarios-design.md
**Architecture:** Extend the existing shared mock model, preserve legacy fixtures, default UI to a deterministic paused ten-task snapshot; no external scheduling or dependencies.

1. Add focused model cases in tests/workflow-typical-model.test.cjs; implement UnifiedTaskModel.loadTypical and guarded cancellation/archive/reopen/dependency behavior in demos/workflow-team-v2.html. Preserve original Simulation fixtures.
2. Wire default/reset and explicit legacy/scenario selection. Add bound reason forms and type definitions. Update standalone demos/task-tree-demo.html labels/examples to the agreed classification. Test shared counters, current/history scopes, lifecycle/role evidence and no automatic parent close.
3. Implement tests/workflow-typical.browser.cjs using dedicated Chrome: 1280x720,360x640,720x450; validate load10/filter/tree, scope, field contract, unknown/cancel, report archive, reopen historical evidence, draft and disconnected controls. Reuse legacy regression with explicit scenario=legacy.
4. Commit fixed head, independent source/model/browser review with no business writes. Resolve blocking issues and rebind evidence. Push original draft PR7; no self merge.
5. Back up current preview and atomically replace index and standalone fixture only after independent quality. Read back hash and public path using existing authorized access; stop any403, keep independent verification limitations explicit.
