# Human + AI Battlemap implementation

Goal: reviewable standalone V2 target simulation. Spec: ../specs/2026-10-31-human-ai-battlemap-design.md.

1. Add demos/workflow-team-v2.html: inline deterministic simulation model, standalone SVG/CSS map, accessible scenario controls, evidence/queue/feed and history charts. Original workflow-demo.html stays byte-identical. No dependencies or platform calls.
2. Add tests/workflow-team-v2.test.cjs using Node VM to run the actual model: dual caps/role constraints, unknown retention, head-bound independent quality, human gates, drain/resume, deterministic reset and disconnected freeze. Check text contrast numerically.
3. Run existing simulation regression and new model checks. Use isolated Chrome headless/CDP for desktop/mobile layout, controls, console and screenshot. Save actual results; do not call these independent QA or live validation.
4. Commit the isolated branch. Public publication remains a separate review decision; no direct main write.
