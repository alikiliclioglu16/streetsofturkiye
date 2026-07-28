# Prop Integration — `kit_street_lamp`

**Date:** 28 July 2026 · **Status:** review gate, awaiting approval before the next prop

## Measured against the delivery note

| | Note said | Measured |
|---|---|---|
| Triangles | ~1,834 | **1,834** ✓ |
| Height | ~3.0 m | **3.000 m** ✓ |
| Meshes / materials | 1 / 1 | **1 / 1** ✓ |
| Pivot | centred vertically | **base at y = −1.5 m** ✓ |
| `alphaMode` | — | **OPAQUE** ✓ |

Every claim held. This is the first delivery where that is true, and the opaque
material means the rule that cost two thirds of a frame budget on Nasreddin
Hodja was followed.

`doubleSided: true`. Harmless on an opaque material — it only stops back-face
culling — but a lamp is a closed shape, so single-sided would rasterise slightly
fewer fragments. Not worth a re-export on its own.

## Where it was placed

Four lamps, İstanbul only. The other two cities have none.

| Position | Note |
|---|---|
| −9, −14 | pedestrian edge near the start of the walk |
| 16, −26 | open walkway beside the tall landmark |
| −9, −35 | street edge, mid-walk |
| 11, −62 | street edge near the food stop, opposite side |

Each placement is checked against every stop's trigger ring by the generator
rather than by eye. The first attempt put a lamp 5.6 m from a ring of radius
8.5 — it would have stood in the shot the moment that stop opened. Placements
that fail the check are dropped, not shipped.

## How the pivot was handled

Not by editing the file. `AssetInstance` measures the mounted model's bounding
box and lifts it so its lowest point rests on y = 0, gated by a `groundAlign`
flag on the registry entry.

Runtime measurement rather than a stored offset, because Meshy centres a model's
origin about as often as it grounds it, and because the correction is a no-op
when the pivot is already right. Commissioned city art is authored grounded and
is not moved.

## Registry

Delivered props are registered in `DELIVERED_PROPS` in the asset registry, not
in `pilot-assets.csv`. That CSV is the brief for the three pilot cities'
commissioned art; it is not a record of what has shipped, and mixing the two
would blur a distinction that has already caused one round of confusion. The
registration carries the file's SHA-256, triangle count, byte size and measured
dimensions.

Street dressing is scene data: `content/scenes/istanbul.json` now has a `props`
array of asset id, position and rotation. Dressing a street is editing data.

## One concern worth raising

**8.36 MB for a 1,834-triangle lamp.** The geometry is about 2% of the file;
four 2048 × 2048 textures are the rest.

For a prop repeated four times in one street and destined for all 81 provinces,
that is the wrong ratio. At 1024 the file should drop to roughly 2 MB, and on a
3 m lamp usually seen from five metres away I would expect no visible
difference. Six kit props at this size would add about 50 MB to the repository
for objects a child walks past.

Worth testing on the next prop before the batch goes ahead: 1024 textures, and
fewer maps if Meshy can merge them.

## Quality gates

```
npm run content:check → 81 cities, 249 stops, 84 questions; 1,413 strings match baseline
npm run lint          → clean
npm run typecheck     → clean
npm test              → 175 passed
npm run build         → 4 routes
```

Served and verified: `/assets/props/kit_street_lamp.glb` returns 200 at
8,768,808 bytes, and the İstanbul scene reports four props.

New tests cover the lamp: the measurements match the file, it resolves through
the same registry as everything else, it is ground-aligned while commissioned
art is not, all four placements sit outside every trigger ring and inside the
play area, and the other two cities stay undressed.

## What I could not judge

Whether it looks right. No screenshots: the automated browser tab renders in the
background, where the browser throttles animation to zero frames and the 3D
scene never mounts. Visual fit is for the project owner.

Three things worth looking at specifically:

1. **Scale against the guide.** The lamp is 3.0 m; Nasreddin Hodja renders at
   1.65 m. The lamp should read as clearly taller than him without looming.
2. **Colour.** Dark ironwork against an olive ground and a pale sky — does it
   sit in the scene or punch out of it?
3. **The base.** If any part of the post is sunk into the ground or floating
   above it, the ground-alignment is wrong and I need to know.

## Scope

Nothing else was touched. No canonical content, no quiz structure, no hero
behaviour, no other prop, no Phase 02. This is a fit test for one object.
