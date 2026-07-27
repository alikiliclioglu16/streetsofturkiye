# Phase 01 — Engine Graybox

## Goal

Prove the complete product loop with İstanbul and placeholder 3D geometry.

## Required features

1. New Next.js/TypeScript application.
2. Map route and city route.
3. Runtime validated city data.
4. Asset registry with GLB path, quality variants and placeholder fallback.
5. Environment, route and hotspot generation from data.
6. Exploration controls for desktop and touch.
7. Guided route mode.
8. Safe camera and movement boundaries.
9. One complete `inspect-and-find` interaction.
10. Fact card and collectible reward.
11. Quiz gate.
12. Province completion and return to map.
13. Local progress repository.
14. Loading, invalid-data and missing-asset states.
15. Reduced-motion and audio settings shell.
16. Development performance overlay.
17. Automated tests for validation, progress and interaction flow.

## İstanbul graybox

Use boxes, planes and primitive geometry through logical asset IDs. Do not build the scene directly inside the page component. The city definition controls:

- spawn point;
- route points;
- hotspot transforms;
- camera anchors;
- interaction target;
- reward;
- quiz.

## Acceptance

Use the Phase 01 section of `docs/QA_ACCEPTANCE.md`.
