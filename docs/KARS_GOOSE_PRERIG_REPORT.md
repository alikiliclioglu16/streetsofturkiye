# Kars Goose — Pre-Rig Report

**Date:** 30 July 2026
**File:** `kit_kars_goose_rig_source.glb` · **Status:** `RIG_SOURCE_ONLY`, not integrated

---

## 1. The delivery note is accurate

Every claim in `04_ASSET_MANIFEST.json` was checked against the file and every
one of them holds:

| | Claimed | Measured |
|---|---|---|
| SHA-256 | `69cf1339…c0b55d` | matches |
| Triangles | 10,395 | 10,395 |
| World size | 0.434 × 0.850 × 0.908 m | 0.43 × 0.85 × 0.91 m |
| Base | y = 0 | y = 0 |
| Skins | 0 | 0 |
| Animations | 0 | 0 |
| alphaMode | OPAQUE | OPAQUE |
| doubleSided | true | true |

This is the first delivery in this project whose note was right in every
particular. Three earlier ones were not, and the habit of measuring before
integrating came from those — it is worth saying plainly that this one did not
need correcting.

Textures are already sized by role: base colour and normal at 1024,
metallic-roughness at 512, and the emissive reduced to 2×2. Nothing to do.

---

## 2. Three things the rigger should know before starting

All three were measured from the mesh, not assumed.

### 2.1 The legs are separate below the belly, and merged above it

Vertices at shin height, across the width of the bird:

```
0.05–0.13 m   0,0,0,0,6,60,61,37,0,0,0,0,0,0,50,66,23,0,0,0,0,0
                        └── left ──┘              └── right ─┘
```

Two clean clusters with six empty columns between them. `Shin_L` / `Shin_R` and
everything below them can be weighted from the geometry.

```
0.13–0.22 m   0,8,25,49,59,51,68,66,22,14,19,11,8,71,117,95,77,67,49,25,2,0
                                    └── no gap ──┘
```

At thigh height the two legs run into one continuous surface with the belly.
That is what a goose looks like, and it is also exactly where `Thigh_L` and
`Thigh_R` attach. **Weight bleed between the two legs will happen here** and the
geometry gives no seam to stop it. This is the region to check first when a step
looks wrong.

### 2.2 The mesh is not mirror-symmetric

Only 12.9% of vertices have a partner across x = 0 at a 3 mm tolerance. Meshy
output is not built symmetrically.

The rig spec asks for the two legs to be **independently and symmetrically
weighted**. The second half of that cannot be got by mirroring — there is nothing
to mirror onto. Both sides have to be weighted separately, and "symmetric" here
means the two legs behave the same, not that the weights are reflections.

### 2.3 It is over the briefed triangle budget, and that is fine

10,395 against a brief of 4,000–8,000. Left alone: three geese cost 31,000
triangles, against three horses at 27,500 for the same job. Skinning will not
reduce it, so **do not let it grow** — a rigged re-export that comes back at
20,000 has added subdivision nobody asked for.

---

## 3. The clip must be called `Walking`

`StreetCat.tsx` — which walks the cat, the horse and now the goose — looks for a
clip named exactly `Walking`, and falls back to the first clip in the file if it
does not find one. The fallback means a wrongly named clip still plays, which is
worse than failing: it would work in Kars and quietly break the moment a second
clip is added.

**The `KARS_ASSET_BRIEF.md` said `Walk`. That was wrong, and is corrected.** The
rig spec in the delivered package says `Walking` and is right.

`Idle` is worth delivering and is not played today: the animal component has one
state. It costs almost nothing in file size and it is what a standing flock will
need when the geese stop walking.

**No root translation in the clip.** The application moves the bird through the
world and the clip moves its legs. This is why the cat's and the horse's walks
are in place, and it is the one rule here that shows immediately if it is broken.

---

## 4. Why it is not integrated yet

The scene generates three goose routes across the open grass. Without a walk
clip, three geese would slide along those routes with their feet still — the
skating that the in-place rule exists to prevent.

So Kars keeps its placeholder until the rig comes back. Two ways forward, and
the second needs no rig at all:

1. **Rig it, deliver `Walking`, and it drops straight in.** The registry entry,
   the routes and the flock behaviour are already written.
2. **Ship it standing.** Geese grazing on the plateau, placed rather than
   walking. This needs a small engine change — an animal with no routes — and it
   would put a real bird in Kars this week instead of a grey box. It is a
   decision about what the city should look like, so it is the owner's.
