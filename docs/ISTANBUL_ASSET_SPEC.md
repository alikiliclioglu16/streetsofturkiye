# İstanbul Street — Asset Specification

**Version:** 1.0 · 28 July 2026
**For:** Meshy production, coordinated through ChatGPT
**Status of the scene today:** every object is a grey primitive. This document is what replaces them.

Every number here is measured, not estimated. The two delivered heroes were parsed byte by byte and the engine's behaviour with them recorded; the rules below come from what those files actually did.

---

## 1. What already exists

| | |
|---|---|
| Nasreddin Hodja | delivered, 197,482 triangles, 7 clips |
| Keloğlan | delivered, 222,150 triangles, 12 clips |
| Everything else in the scene | grey boxes and cylinders |

The street is 75.5 m long. The play area is 40 m wide and 102 m deep. Five stops sit along it. A child walks from one to the next, and at each one a card presents the place and offers a collectible.

---

## 2. Universal rules

These are not preferences. Each one comes from something that went wrong.

### 2.1 Material must be opaque

**`alphaMode` must be `OPAQUE`. Never `BLEND`.**

Nasreddin Hodja arrived with `alphaMode: BLEND` on a texture whose most transparent pixel was still 82% opaque — the transparency did nothing visible. But three.js renders a transparent double-sided material in two passes, back faces then front faces, so that one flag doubled the cost of a 197,482-triangle character. It was two thirds of the entire frame budget, for nothing.

If an object genuinely needs transparency — glass, a lamp shade — say so explicitly in the delivery note so it can be handled deliberately. Otherwise: opaque.

### 2.2 Scale, orientation, pivot

| | |
|---|---|
| Units | metres |
| Up axis | +Y |
| Forward | +Z |
| Pivot | centre of the footprint, at ground level (y = 0) |
| Scale on the root | 1.0 preferred |

A rig in centimetres under an armature scaled 0.01 is acceptable — both heroes came that way and the engine handles it — but the pivot must still sit on the ground. The engine measures the mounted model and scales it to the briefed height, so a wrong height is recoverable; a wrong pivot means the object floats or sinks.

### 2.3 One mesh, one material

One mesh and one material per object, with a single 2048 px texture atlas. Both heroes are built this way and each costs one draw call. Twelve separate meshes would cost twelve.

Exception: an object with an interactive sub-part (see 3.1) may have that part as a **separately named** second mesh.

### 2.4 Triangle budgets

| Class | Budget | Example |
|---|---|---|
| Hero character | 180,000–250,000 | Nasreddin Hodja, Keloğlan |
| Landmark building | 15,000–35,000 | Galata Tower |
| Mid-scale object | 3,000–10,000 | simit cart, market stall |
| Small prop | 500–3,000 | bench, lamp post, crate |
| Ground decoration | under 500 | cobble patch, planter |

The scene currently runs at 60 fps with 198,000 triangles on screen, almost all of it the guide. There is real headroom — roughly 250,000 triangles for everything that is not the guide — but it is not unlimited, and it is shared across the whole street.

### 2.5 Naming

The filename is the delivery record and is never changed after the fact. Use the asset id:

```
city_istanbul_galata_tower.glb
city_istanbul_grand_bazaar.glb
```

Meshy's own long filenames are acceptable if that is what arrives — both heroes kept theirs — but then the asset id must be recorded alongside in the delivery note.

### 2.6 What to send with each model

- SHA-256 of the file
- triangle count
- bounding box in metres
- `alphaMode` and whether the material is double-sided
- clip names, if animated
- any sub-mesh names intended as interactive

---

## 3. The five stops

Footprints below are what the engine already reserves. An object may be smaller. **An object that is larger will overlap its neighbour's trigger ring and must be reported rather than delivered oversized**, because the stop spacing is 18 m and the rings are already sized against it.

### 3.1 Stop 1 — Hagia Sophia & the Blue Mosque

| | |
|---|---|
| Asset id | `city_istanbul_iznik_tile_panel` |
| Category | History |
| Reserved footprint | 1.6 × 0.4 m |
| Height | up to 2.5 m |
| Budget | 3,000–8,000 triangles |
| Collectible | 💠 a blue İznik tile |

The canonical text is about the dome, the six minarets, and more than 20,000 blue İznik tiles inside. The object at this stop is **not the building** — it is a standing tile panel at child height, close enough to look at.

**Interactive sub-part:** the panel should carry a small number of distinct motifs — a tulip, a carnation, a star — as **separately named meshes** (`motif_tulip`, `motif_carnation`, `motif_star`). Naming them now costs nothing and leaves the door open for a find-the-motif interaction later. If they arrive as one welded mesh that door is closed without a re-export.

Background silhouettes of the dome and minarets belong to the environment kit (section 4), not to this object.

### 3.2 Stop 2 — Galata Tower

| | |
|---|---|
| Asset id | `city_istanbul_galata_tower` |
| Category | History |
| Reserved footprint | 4 × 4 m |
| Height | **14 m** (storybook scale, not the real 67 m) |
| Budget | 15,000–35,000 triangles |
| Collectible | 🪁 a pair of legend wings |

**14 m, not 32.** The real tower is 67 m; at 32 m the stop camera framed nothing
but masonry and the child never saw a tower at all. At 14 m it is still the
tallest thing on the street by a wide margin — eight times the guide, nearly
three times a street lamp — and it fits in one shot.

The tallest thing on the street and the landmark a child will steer by. The conical roof and the observation gallery are what make it recognisable at a distance; the stonework does not need geometry, it needs texture.

The collectible refers to Hezârfen Ahmed Çelebi, who is said to have flown from this tower with wings. A pair of wings somewhere on or near the tower would connect the object to the reward the child receives.

### 3.3 Stop 3 — The Grand Bazaar

| | |
|---|---|
| Asset id | `city_istanbul_grand_bazaar` *(currently a grey box)* |
| Category | Art & Craft |
| Reserved footprint | 8 × 8 m |
| Height | up to 6 m |
| Budget | 8,000–15,000 triangles |
| Collectible | 🪔 a mosaic lamp |

An arched gateway with a glimpse of the covered street beyond — not the whole 4,000-shop complex. The reward is a mosaic lamp, so hanging lamps should be visible and should read as the source of that reward.

If the lamps are to glow, use emissive texture, not transparency (rule 2.1).

### 3.4 Stop 4 — The Simit Cart

| | |
|---|---|
| Asset id | `city_istanbul_simit_cart` *(currently a grey box)* |
| Category | Yummy Food |
| Reserved footprint | 1.6 × 0.9 m |
| Height | 1.6 m |
| Budget | 3,000–6,000 triangles |
| Collectible | 🥨 a warm simit |

The canonical text specifies a **red** street cart, stacked simit, and seagulls. The red is in the source and should be honoured. This is the smallest and most approachable object on the street, and the one a child is most likely to walk right up to — it carries close-up detail better than anything else here.

Seagulls belong to the environment kit.

### 3.5 Stop 5 — Ferry on the Bosphorus

| | |
|---|---|
| Asset id | `city_istanbul_ferry` |
| Category | Nature & Fun |
| Reserved footprint | 20 × 6 m |
| Height | 6 m |
| Budget | 10,000–20,000 triangles |
| Collectible | 🐬 a dolphin sticker |

The largest object on the street, and the end of it. A classic Şehir Hatları ferry, side-on to the walk.

This stop needs water, which does not exist yet. Water is an environment problem, not a model problem — see 4.3.

---

## 4. The environment

The stops are only five objects. What makes the street a street is everything between them, and there is currently nothing.

### 4.1 Ground

The play area is 40 × 102 m. A tiled cobblestone material with a 4 m repeat, plus a small number of variant patches to break the tiling. Region ground tone is `#C9B27E`, from the source.

Budget: under 500 triangles total. This is a material problem, not a geometry problem.

### 4.2 Street furniture — the kit

The pieces that get scattered along the whole street. Each is used many times, so each one is worth real care.

| Piece | Footprint | Budget |
|---|---|---|
| Ottoman-style street lamp | 0.4 × 0.4 × 3.5 m | 1,000–2,000 |
| Wooden bench | 1.6 × 0.6 × 0.9 m | 800–1,500 |
| Planter with cypress | 0.8 × 0.8 × 2.5 m | 1,500–2,500 |
| Market stall, empty | 2.5 × 2 × 2.5 m | 3,000–5,000 |
| Crate and barrel set | 1 × 1 × 1 m | 500–1,000 |
| Stray cat, sitting | 0.4 × 0.3 × 0.3 m | 800–1,500 |

The cat is not decoration. İstanbul's street cats are one of the first things any child notices about the city, and a few of them scattered along the walk will do more for the sense of place than another building.

### 4.3 Backdrop and water

Beyond the play-area boundary, a silhouette skyline: domes, minarets, the Maiden's Tower, apartment blocks. Flat or near-flat geometry, never entered, never approached.

Budget: under 5,000 triangles for the whole backdrop.

Water for stop 5: a flat plane with an animated material, not geometry. The specification for it is a shader task on my side, not a Meshy deliverable — I need to know only how far the ferry sits from the quay so the plane can be placed.

### 4.4 Sky

Region sky colours are `#8FD2F2` to `#CDEFFA`, from the source. Clouds and gulls as flat sprites. No model needed.

---

## 5. Priority

If everything cannot be produced at once, this is the order that improves the experience fastest:

1. **Ground material** — the largest surface on screen, currently flat olive
2. **Simit cart** — the most approachable object, and the one with the clearest child appeal
3. **Street lamp and bench** — repeated many times, so they carry the street on their own
4. **Galata Tower** — the landmark that gives the street a shape
5. **Grand Bazaar gateway**
6. **Cats, planters, crates**
7. **Backdrop skyline**
8. **İznik tile panel with named motifs**
9. **Ferry**

The first three change the feel of the street more than the last three, because a child spends the whole walk looking at the ground and the things beside them, and only glances at the landmark.

---

## 6. What I do when a model arrives

1. Parse the GLB and record triangles, bounding box, materials, clips, SHA-256.
2. Check it against this document and report every deviation rather than silently correcting it.
3. Add one line to the asset registry. No other code changes.
4. The engine scales it to the briefed height and gives it the collider already reserved.

Point 2 matters. Two of the four claims in the Keloğlan delivery note did not survive measurement — one clip's stated root motion was not there, and the model's stated height was not its rendered height. Everything gets measured.

---

## 7. Open questions for you and ChatGPT

1. **Ferry framing.** Should the child walk onto the ferry, or look at it from the quay? Walking on means a deck, railings and a boarding ramp, and a much larger budget.
2. **Time of day.** Everything above assumes midday. An evening street with lit lamps is more atmospheric but needs emissive maps on every lamp.
3. **The other 80 provinces.** These specs are İstanbul-specific. Before scaling, decide which pieces are shared: the lamp, bench, planter, crate and cat could serve every city, and the regional kits differ only in material. That decision changes the production count from roughly 400 objects to roughly 60.

Question 3 is the one worth answering first.
