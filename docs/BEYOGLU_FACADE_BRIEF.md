# Meshy Brief — Beyoğlu Facade Row

**Date:** 29 July 2026
**Asset id:** `city_istanbul_beyoglu_row`
**Purpose:** backdrop only. Scenery beyond the play area — never reached, never
collided with, no shadow.

---

## What it is

A row of joined 19th-century İstanbul apartment fronts, the kind that line
İstiklal Caddesi. Not separate buildings with gaps: one continuous terrace, four
to six narrow houses shoulder to shoulder, each a slightly different height and
colour so the roofline steps.

This is the thing that makes the street feel like it continues past the
pavement. It is seen from twenty to forty metres away, from the front and
slightly below, and never approached.

---

## Meshy prompt

Paste as-is:

> A continuous row of five joined 19th-century Istanbul apartment buildings seen
> from the street, in the style of İstiklal Caddesi in Beyoğlu. Four to five
> storeys each, narrow fronts, tall shuttered windows in regular columns, small
> iron balconies with curved railings on the upper floors, decorative stone
> cornices under a stepped roofline. Each house a slightly different pastel
> colour — faded ochre, dusty rose, pale cream, soft grey-blue — and a slightly
> different height. Ground floor shopfronts with awnings. Flat facade, no
> interior, no side or rear walls needed.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette readable from a
> distance, no text, no logos, no signage lettering.

---

## Technical requirements

| | |
|---|---|
| Target size | **32 m wide × 14 m tall × 4 m deep** |
| Proportion | roughly **2.3 : 1 : 0.3** — much wider than tall, and shallow |
| Triangles | 6,000–12,000 |
| Meshes / materials | 1 / 1 |
| Textures | **base colour 2048, everything else 1024** |
| Format | GLB, `alphaMode` **OPAQUE**, single-sided |
| Origin | base centre, standing on y = 0 |

**The depth ratio is the thing to get right.** It is a wall, not a block. If it
comes back as deep as it is wide, it is a city block and will not sit against
the edge of a street.

**Two rules that have cost this project time before:**

- **`alphaMode` must be OPAQUE.** A transparent material doubles the render cost
  for nothing.
- **Do not export every map at 4096.** The last six deliveries arrived with four
  4096 px maps and had to be recompressed — one was 70 MB. Base colour 2048,
  normal and roughness 1024. This one change has been shrinking files twenty-fold.

---

## What I check on delivery

Byte count, triangle count, mesh and material count, `alphaMode`, whether the
material is double-sided, the world bounding box in metres, and where the base
sits relative to y = 0. Every number goes in the registry with the file's
SHA-256, and a test asserts the registry matches the file on disk.

Deviations get reported rather than silently corrected — though if the geometry
or textures come in far over budget I will simplify in-project rather than send
it back, as with the simit cart (969,492 triangles → 20,182) and Galata Tower.

---

## Why there is a note about this at all

The previous file named `Beyoğlu` was registered as this asset and placed twice
as backdrop. It measured 2.24 : 1 : 0.50 — wide and shallow, which is what a
street front measures like — so the name and the numbers agreed and it went in
without being looked at.

It was a ferry. It is now `city_istanbul_ferry_boat`, moored off the quay at
20 m, where it belongs.

Measurement narrows an asset down; it does not identify it. Anything whose
identity rests on the filename gets asked about from now on.

---

## Placement once delivered

Two instances, one along each side of the walk, set back beyond the play
boundary (|x| > 22) so a child sees a street that continues and never reaches
it. Backdrop, so: no collider, no cast shadow.

A third along the far end would close the view down the street towards the quay,
if the row reads well.
