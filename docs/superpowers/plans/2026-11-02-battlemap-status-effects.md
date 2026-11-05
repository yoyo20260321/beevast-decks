# Status effects implementation plan

Spec: docs/superpowers/specs/2026-11-02-battlemap-status-effects-design.md
Approved: admin5 request to add signal lights, flowing links and warning pulses to the existing ten-task map.

1. Add pure task/role/route effect classification in an inline effect-model script; test meaningful state priority, cancellation, freshness and source-scope boundaries in tests/workflow-effects-model.test.cjs.
2. Add CSS lamps, stable SVG overlay paths and state-driven alarm pulse. Retain text/aria labels, original route geometry, focus and pointer targets. Pause/stale/reduced motion halt animation. Preserve role node elements across rerenders to avoid restarting pulse.
3. Add focused three-viewport tests/workflow-effects.browser.cjs for actual animation state, timing/progress, scope, alert clearing, inactive routes and model immutability. Reuse affected ten-task browser regression.
4. Freeze head, independent review and bounded tests. Push original draft PR7; only after applicable quality, backup and atomically update existing Mock index and record hashes. Keep independent public403 distinct from local quality and author200.
