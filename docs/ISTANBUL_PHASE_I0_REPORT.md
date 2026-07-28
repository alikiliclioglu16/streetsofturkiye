# İstanbul Phase I0 — Report

**Date:** 28 July 2026
**Against:** `01_CLAUDE_PROMPT_ISTANBUL_I0.txt`

The prompt was written against a repository state that had already moved on. Of
its fourteen requirements, eleven were in place before it arrived, one is no
longer valid, and two were real gaps. This report says which is which rather
than claiming credit for work that already existed.

---

## 1. Requirement by requirement

| # | Requirement | State |
|---|---|---|
| 1 | Five technical hotspots | already done |
| 2 | Placeholders for stops 4 and 5 | already done — both exist, marked `graybox` |
| 3 | `contentRef`, no duplicated canonical text | already done — verified: zero canonical strings in scene JSON |
| 4 | `gameplayCopy` kept separate and non-canonical | **done now** — removed entirely; see 3 below |
| 5 | Completion needs 5 stops and the 2 canonical questions | already done |
| 6 | HUD 0/5 | already done |
| 7 | Versioned localStorage migration | **done now** — see 2 below |
| 8 | Nasreddin Hodja default, Keloğlan selectable | already done — canonical default, `?guide=keloglan` for QA |
| 9 | Never load both hero GLBs | already done, tested |
| 10 | Nasreddin: Agree → Wave → panel, no dance UI | already done |
| 11 | Keloğlan: non-repeating dance policy | already done |
| 12 | No final Meshy art | already done |
| 13 | `sceneStatus` and `assetStatus` | already done |
| 14 | Preserve `/map`, `/city/istanbul`, accessibility, **guided mode**, fallback | routes and accessibility preserved; **guided mode was removed** by owner decision D-016 and is not coming back |

## 2. Requirement 7 — the real gap

This one had already caused a visible failure. Opening `/city/istanbul` showed a
completion panel for a city the player had not finished, and the only way out
was Settings → Reset progress.

The cause: `CityProgress` had no version. İstanbul went from three
hand-authored stops to five canonical ones with new hotspot ids, and a save
written under the old shape still carried `cityCompleted: true`. The engine
believed it.

**What was added**

`CITY_PROGRESS_VERSION = 2`, and a pure `reconcileProgress(city, stored)` that
runs on every city entry:

- hotspot ids the current city does not recognise are dropped
- reward ids the current city does not award are dropped
- `quizCompleted` is false unless every stop is genuinely done
- `cityCompleted` is recomputed, never read from the save

A player who finished three of five keeps those three. Nothing is thrown away
that the city still recognises, and no completion flag is trusted.

Five tests cover it, including the exact legacy save that caused the failure.

## 3. Requirement 4 — the answer that resolved it

The prompt asks for `gameplayCopy` to be kept separate and clearly
non-canonical. It was — but it had become dead data. Stops no longer ask
questions (D-023: the source presents, it does not examine), so the instruction
text, the target id, the hint counter and the decoy stop references were all
invented mechanics that nothing read.

They are removed from the scene schema, the scene generator, the composed
runtime and the two panels that rendered them. A scene hotspot now carries
`presentation: { style: 'fact-card' }` and nothing else about how the stop is
answered, because it is not answered.

Deleted: `InteractionPanel.tsx`, `RewardPanel.tsx`.

## 4. The five hotspots

| Hotspot id | contentRef | Asset | Status |
|---|---|---|---|
| `istanbul-hotspot-01` | `istanbul-stop-01` | `city_istanbul_iznik_tile_panel` | commissioned |
| `istanbul-hotspot-02` | `istanbul-stop-02` | `city_istanbul_galata_tower` | commissioned |
| `istanbul-hotspot-03` | `istanbul-stop-03` | `graybox_bazaar` | graybox |
| `istanbul-hotspot-04` | `istanbul-stop-04` | `graybox_simit` | graybox |
| `istanbul-hotspot-05` | `istanbul-stop-05` | `city_istanbul_ferry` | commissioned |

All five `sceneStatus: ready`. `pendingStopIds` is empty: every canonical stop
has a technical hotspot.

## 5. Quality gates

```
npm run content:check → 81 cities, 249 stops, 84 questions; 1,413 strings match baseline
npm run lint          → clean
npm run typecheck     → clean
npm test              → 163 passed
npm run build         → 4 routes
```

## 6. What I could not verify

No screenshots and no preview link from here. The automated browser tab renders
in the background, where the browser throttles animation to zero frames, so the
3D layer never mounts for me. Everything above is verified at the data,
schema and DOM level; the moving picture is verified by the project owner.

## 7. A note on the prompt itself

Executing it as written would have meant redoing eleven finished items and
restoring guided mode against a standing decision. The useful parts were the
two it found. Before the next phase prompt, the current `docs/DECISION_LOG.md`
is worth reading — it is the fastest way to see what has already been settled.
