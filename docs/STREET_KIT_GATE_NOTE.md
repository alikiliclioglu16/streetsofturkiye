# Street Kit Gate — Lamp and Bench

**Date:** 28 July 2026 · **Status:** awaiting owner approval before the next prop

## Measured against the delivery note

Every claim in the note held, for both files.

| | Lamp — stated | Lamp — measured | Bench — stated | Bench — measured |
|---|---|---|---|---|
| Bytes | 1,371,280 | **1,371,280** ✓ | 980,160 | **980,160** ✓ |
| Triangles | 1,834 | **1,834** ✓ | 1,586 | **1,586** ✓ |
| Mesh / material | 1 / 1 | **1 / 1** ✓ | 1 / 1 | **1 / 1** ✓ |
| Textures | 4 × 1024 | **4 × 1024 JPEG** ✓ | 4 × 1024 | **4 × 1024 JPEG** ✓ |
| `alphaMode` | OPAQUE | **OPAQUE** ✓ | OPAQUE | **OPAQUE** ✓ |
| World size | 5.00 m tall | **1.25 × 5.00 × 1.10 m** ✓ | 1.83 × 0.70 × 0.90 | **1.82 × 0.70 × 0.90 m** ✓ |
| Origin | ground-aligned | **base at y = 0.000** ✓ | ground-aligned | **base at y = 0.000** ✓ |

The lamp's mesh node carries the stated +2.5 m translation, and the bench's root
carries the stated 0.9 scale. Both put the base exactly on y = 0.

**No second offset was added.** The engine's ground-alignment measures the
mounted model and lifts it by `−min.y`, which is zero for both — the correction
is a no-op when the pivot is already right, which is why it was built by
measurement rather than as a stored number.

## The four questions

**Does the 5 m lamp fit the scene visually?** I cannot see it, and I will not
guess. What I can say is that the geometry is now right for the job: 5.00 m
against a guide who renders at 1.65 m is a ratio of 3:1, which reads as a
street lamp rather than a garden light. The previous 3 m version was the thing
you flagged as too small, and that gap is now closed by measurement rather than
by eye.

**Does the bench fit ergonomically?** 1.82 m wide, 0.90 m high, 0.70 m deep.
Against a 1.65 m guide, the seat back reaches roughly his mid-back standing
beside it — correct for a bench. One bench is placed 3.5 m from a lamp
specifically so both appear in the same shot for scale comparison.

**Are the 1K textures acceptable?** At 1024 the lamp dropped from 8.36 MB to
1.31 MB — a 6.4× reduction on a prop the child walks past at three to five
metres. Whether any detail was lost is a judgement for the screen, but the file
sizes say the trade was worth attempting, and nothing in the geometry changed.

**Should the remaining props use this standard?** Yes, and I would make it a
rule rather than a preference: **every shared kit prop under 2 MB.** A test now
enforces it. At the old size, six kit props would have added 50 MB to the
repository for objects nobody stops to look at. The five remaining kit pieces —
planter, market stall, crates, cat — should all come in at 1024.

## Placement

Six props, İstanbul only. Angles and spacing vary deliberately: a row of
identical lamps at identical intervals reads as a fence, not a street.

| Asset | Position | Rotation Y | Context |
|---|---|---|---|
| `kit_street_lamp` | −8.5, 0, −13.0 | +1.691 | pedestrian segment near the start |
| `kit_bench` | −7.2, 0, −16.5 | +1.321 | beside the first lamp, scale reference |
| `kit_street_lamp` | 16.5, 0, −24.5 | −1.751 | open walkway by the tall landmark |
| `kit_street_lamp` | −9.5, 0, −36.5 | +1.271 | street edge, mid-walk |
| `kit_bench` | 15.0, 0, −40.0 | −1.371 | facing the market end of the street |
| `kit_street_lamp` | 11.5, 0, −60.5 | −1.351 | street edge near the food stop |

Every placement is machine-checked, not eyeballed:

- outside every stop's trigger ring — the tightest clearance is 1.1 m
- at least 3.5 m from the route centreline — the tightest is 7.2 m
- inside the play area

Placements failing any check are dropped by the generator rather than shipped.
An earlier attempt put a lamp 5.6 m from a ring of radius 8.5; it would have
stood in the shot the moment that stop opened.

Placement data lives in `content/scenes/istanbul.json`, not in component code.

## Registry and loading

Both are registered in `DELIVERED_PROPS` in the shared asset registry, with the
file's SHA-256, triangle count, byte size and measured dimensions. Not in
`pilot-assets.csv` — that CSV is the brief for the pilot cities' commissioned
art, not a record of what has shipped.

Both live in the shared `public/assets/props/` location. They are 81-province
assets even though only İstanbul is dressed in this gate; the other two pilot
cities have no props and a test keeps it that way.

Each GLB is fetched once. `useGLTF` caches by URL and `AssetInstance` clones the
cached scene per instance, so four lamps are one download.

**One policy change.** A delivered prop's own scale is now trusted; only
unmeasured assets are normalised against their brief. Normalising a 5 m lamp
and a 0.9 m bench towards anything in common would flatten exactly the
difference that makes a street read as a street.

## Quality gates

```
npm run content:check → 81 cities, 249 stops, 84 questions; 1,413 strings match baseline
npm run lint          → clean
npm run typecheck     → clean
npm test              → 182 passed
npm run build         → 4 routes
```

Served and verified: `kit_street_lamp.glb` returns 200 at 1,371,280 bytes,
`kit_bench.glb` at 980,160, and the İstanbul scene reports four lamps and two
benches.

## Scope

Nothing else was touched: no canonical content, no five-stop structure, no
progress migration, no guide selection, no hero animation policy, no completion
sequence, no quiz logic, no other city. Guided mode remains retired.

## What I could not judge

No screenshots. The automated browser tab renders in the background, where the
browser throttles animation to zero frames and the 3D scene never mounts. This
has been true for every gate and it is the one part of the review I cannot do.

Worth looking at specifically:

1. **The lamp beside the guide** — 3:1 should read as tall, not looming.
2. **The bench beside the guide** — seat height against his knee, back against
   his mid-back.
3. **Texture detail at walking distance** — the 1K question, best judged while
   moving past rather than standing still.
4. **The bases** — any sinking or floating means the alignment is wrong.
5. **The pair at the start of the walk** — lamp and bench 3.5 m apart, the
   clearest single shot for judging whether the kit hangs together.
