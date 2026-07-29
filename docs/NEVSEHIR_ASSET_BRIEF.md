# Meshy Brief — Nevşehir

**Date:** 29 July 2026
**City:** Nevşehir (Cappadocia) · Guide: Keloğlan · 5 stops, 2 questions

Two sets of assets. **Part A** is the horizon, which is what makes the street
feel like Cappadocia rather than a paved rectangle. **Part B** is the three stop
objects that are still placeholders.

Part A matters more. A street with placeholder stops and a real horizon reads as
a place under construction; a street with real stops and no horizon reads as a
diorama on a table.

---

## How İstanbul's horizon works, and why

Four directions, four different jobs:

| Direction | İstanbul | Job |
|---|---|---|
| Left and right | rows of Beyoğlu facades, ten of them, end to end | walls — a street you cannot see out of |
| Front | sea, a ferry, the Maiden's Tower | distance — somewhere the street is going |
| Behind | Hagia Sophia closing a square | a back — the child can turn round and see something |

Cappadocia's answer is different in every one of those, which is the point.

---

# Part A — the horizon

## A1 · Fairy chimney ridge — `city_nevsehir_chimney_ridge`

The walls. This is the asset that does the most work, so it is first.

> A continuous ridge of Cappadocian fairy chimneys seen from the side: eight to
> ten tall tapering rock cones of different heights standing shoulder to
> shoulder, each with a darker harder cap of basalt on top, carved dwelling
> openings and small square windows cut into the lower halves, a few connected
> by rough stone walls at their bases. Pale cream and honey volcanic tuff,
> weathered and streaked.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette readable from a
> distance, no text, no logos.

| | |
|---|---|
| Target size | **34 m wide × 16 m tall × 8 m deep** |
| Proportion | roughly **2.1 : 1 : 0.5** |
| Triangles | 8,000–14,000 |
| Textures | base colour **2048**, others **1024** |
| Notes | **Vary the heights.** A ridge of equal cones reads as a fence. The tallest should be about twice the shortest. |

Five of these go down each side, end to end, exactly as the Beyoğlu rows do.

## A2 · Valley backdrop — `city_nevsehir_valley`

The back. Behind the child, closing the square where İstanbul has its mosque.

> A wide Cappadocian valley seen from its rim: layered rock terraces stepping
> down and away, scattered fairy chimneys on the valley floor, cave openings in
> the far walls, a few dark green poplars in the bottom. Soft pink, cream and
> pale ochre rock in horizontal bands. Seen from slightly above.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **60 m wide × 14 m tall × 20 m deep** |
| Triangles | 6,000–12,000 |
| Textures | base colour **2048**, others **1024** |
| Notes | Front face only matters. It is never approached and never walked behind. |

## A3 · Hot air balloon — `kit_hot_air_balloon`

The front, and the thing a child will remember. One model, placed several times
at different heights and distances.

> A single hot air balloon in flight: a rounded envelope in bright horizontal
> bands of red, orange and cream, a woven wicker basket beneath it on taut
> cables, a burner frame above the basket. Seen from below and to one side.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos, no sponsor lettering.

| | |
|---|---|
| Target size | **7 m wide × 11 m tall × 7 m deep** |
| Triangles | 3,000–6,000 |
| Textures | base colour **1024**, others **512** |
| Notes | Registered as `kit_` because balloons are not only Nevşehir's. Under 2 MB. |

**Two or three variants of the envelope pattern would be worth having.** Six
identical balloons in one sky read as one balloon copied; six with three
patterns read as a morning in Cappadocia. If only one is produced, the engine
will vary their size and height instead.

I will make them drift slowly and rise and fall a little, using the same wind
module that leans the flag.

---

# Part B — the three remaining stops

These three currently render as grey placeholder boxes.

## B1 · Fairy chimney cluster — `city_nevsehir_fairy_chimney_cluster` (stop 1)

The object a child walks up to, so it is **child-scale, not landscape-scale** —
this is the mistake Hagia Sophia made before it became scenery.

> A small cluster of three Cappadocian fairy chimneys, the tallest about three
> times a child's height, with dark basalt caps and a carved doorway with a
> wooden door at the base of the largest. A stone step and a clay pot beside it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

Footprint **4 × 5.5 × 4 m** · 6,000–10,000 triangles · colour 2048, others 1024

## B2 · Underground city stone door — `city_nevsehir_underground_stone_door` (stop 3)

> The circular millstone door of an underground city: a great disc of pale
> carved stone standing on edge in a narrow rock passage, rolled partly aside to
> reveal the dark opening behind it. Rough-hewn tunnel walls, a small oil lamp
> niche cut into the rock.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

Footprint **3.5 × 3 × 2.5 m** · 5,000–9,000 triangles · colour 2048, others 1024

## B3 · Pottery wheel — `city_nevsehir_pottery_wheel` (stop 4)

> An Avanos potter's kick wheel: a low wooden wheel on a stone base with a
> half-finished red clay jug on top, a bowl of water and a cloth beside it, and
> three finished painted jugs on a shelf behind. Warm terracotta and worn wood.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

Footprint **1.8 × 1.4 × 1.8 m** · 4,000–8,000 triangles · colour 1024, others 512

---

## Rules that apply to every file

These are not preferences. Each one is here because it cost this project time.

**Textures by role, never all at maximum.** Base colour 2048 (1024 for small
objects), normal and roughness 1024 (512 for small). Six deliveries in a row
arrived with four 4096 px maps; one was 70 MB and had to be recompressed to
2.94 MB.

**`alphaMode` must be OPAQUE.** A transparent material costs two render passes.

**Leave `doubleSided` alone — do not turn it off.** Anything with thin geometry
needs it. Flags on the Maiden's Tower and the ferry were torn in half by exactly
this, and so was the flag prop itself.

**Origin at the base centre, standing on y = 0.**

**Metres. Real ones.** Several files have arrived authored at 0.01 scale.

**Tell me what it is, not just what it is called.** A file named `Beyoğlu` was
registered as a row of facades and placed twice as scenery. It was a ferry. Its
measurements — wide and shallow — agreed with the name, so nothing looked wrong
until it was on screen. A one-line note saying what the model depicts prevents
that.

---

## What I do on delivery

Measure bytes, triangles, meshes, materials, `alphaMode`, sidedness, the world
bounding box and where the base sits. Every number goes into the registry with
the file's SHA-256, and a test asserts the registry matches the file on disk.

If something arrives far over budget I simplify it in-project rather than sending
it back — the simit cart went from 969,492 triangles to 20,182 that way. What I
cannot do is see it, so a screenshot after each deploy is worth more than any
measurement I can take.

---

## Placement, once delivered

- **Chimney ridges:** five each side, |x| ≈ 30, spaced along the walk.
- **Valley:** behind the spawn square, |z| ≈ +30, outside the play area.
- **Balloons:** six to eight ahead of the walk, 40–120 m out, 25–60 m up, drifting.
- **Three stop objects:** they replace their placeholders with no further work —
  the scene builder already reserves each footprint and derives each stop's
  camera distance from the object's height.
