# Meshy Production Pack — Batch 1

**Version:** 1.0 · 28 July 2026
**Companion to:** `docs/ISTANBUL_ASSET_SPEC.md`
**How to use:** each block below is ready to paste into Meshy. The constraints under it are what I check when the file arrives.

---

## Decision made: the street kit is shared

İstanbul-specific objects: **5.** Everything else on the street — lamps, benches, planters, crates, stalls, cats — is the same object in all 81 provinces, with regional colour handled by material, not by geometry.

Producing a lamp per province would mean roughly 400 models. Sharing them means roughly 60 for the whole country. The child does not notice that Trabzon's bench is Konya's bench; they notice that the street has benches.

So batch 1 is **11 objects**: 5 for İstanbul, 6 shared for everywhere.

---

## Universal settings for every prompt

Put these in Meshy's settings, not in the prompt text:

| Setting | Value |
|---|---|
| Topology | Quad or triangle, whichever gives the cleaner result |
| Target polycount | per object below |
| Texture | 2048 × 2048, PBR |
| Format | GLB |
| Symmetry | on for props, off for the ferry and the bazaar gate |

And two rules that have already cost us once:

- **The material must export as `OPAQUE`.** A transparent material doubles the object's render cost for nothing. If Meshy produces an alpha channel, say so on delivery.
- **Pivot at the base centre, model standing on y = 0.** A model whose pivot is at its middle sinks halfway into the ground.

Style line to append to every prompt, so the eleven objects look like one set:

> *stylised low-poly game asset, soft rounded edges, warm hand-painted texture, bright children's storybook palette, clean silhouette readable from a distance, no text, no logos*

---

## A. İstanbul, five stops

### A1 · İznik tile panel — `city_istanbul_iznik_tile_panel`

> A free-standing Ottoman İznik ceramic tile panel on a low wooden frame, about waist height for a child. Deep cobalt blue and turquoise floral patterns on white glazed tiles: tulips, carnations and eight-pointed stars. Slightly worn wooden posts holding the panel upright.

| | |
|---|---|
| Footprint | 1.6 × 0.4 m, height up to 2.5 m |
| Triangles | 3,000–8,000 |
| **Special** | The tulip, carnation and star motifs must be **separate named meshes**: `motif_tulip`, `motif_carnation`, `motif_star` |

That last row matters. Named motifs leave the door open to a find-the-motif interaction later; one welded mesh closes it without a re-export.

### A2 · Galata Tower — `city_istanbul_galata_tower`

> The Galata Tower of İstanbul: a tall cylindrical medieval stone tower with a conical dark red roof, a ring of arched windows near the top forming an observation gallery, and a narrow balcony railing around it. Warm sandy grey stonework with visible courses.

| | |
|---|---|
| Footprint | 9 × 9 m, height 32 m |
| Triangles | 15,000–35,000 |
| Note | Stonework in texture, not geometry. This is the landmark a child steers by, so the silhouette matters more than the surface. |

### A3 · Grand Bazaar gateway — `city_istanbul_grand_bazaar`

> An ornate Ottoman covered-bazaar gateway: a wide stone arch with painted floral decoration above it, heavy wooden doors open, and a glimpse of a vaulted passage beyond. Colourful mosaic glass lamps hanging in clusters under the arch.

| | |
|---|---|
| Footprint | 8 × 8 m, height up to 6 m |
| Triangles | 8,000–15,000 |
| Note | The reward here is a mosaic lamp, so the lamps must be visible and read as the source of it. If they glow, use an **emissive** map — not transparency. |

### A4 · Simit cart — `city_istanbul_simit_cart`

> A traditional İstanbul street vendor's simit cart: a bright red wooden cart on two large wheels with a glass display case, stacked with rings of sesame-covered simit bread. A small striped awning over the top and a brass tea urn on the side.

| | |
|---|---|
| Footprint | 1.6 × 0.9 m, height 1.6 m |
| Triangles | 3,000–6,000 |
| Note | The red is in the source text and is not a style choice. This is the smallest and most approachable object on the street — it carries close-up detail better than anything else here. |

### A5 · Bosphorus ferry — `city_istanbul_ferry`

> A classic İstanbul Şehir Hatları passenger ferry seen from the side: white hull with a broad red stripe, two open passenger decks with railings, a tall black and red funnel amidships, a small wheelhouse on top, and round portholes along the hull.

| | |
|---|---|
| Footprint | 20 × 6 m, height 6 m |
| Triangles | 10,000–20,000 |
| Note | Side-on to the walk. Whether the child boards it is still open — see the questions at the end. |

---

## B. The shared street kit — used in all 81 provinces

### B1 · Ottoman street lamp — `kit_street_lamp`

> An ornate cast-iron street lamp post in Ottoman style: a fluted column on a stepped base, curving decorative brackets near the top, and a six-sided glass lantern with a small domed cap. Dark green-black paintwork with worn brass highlights.

Footprint 0.4 × 0.4 m · height 3.5 m · **1,000–2,000 triangles**

### B2 · Wooden bench — `kit_bench`

> A simple wooden park bench with cast-iron side frames in a curved Ottoman pattern. Warm honey-brown wooden slats, dark green painted ironwork, gently worn.

Footprint 1.6 × 0.6 m · height 0.9 m · **800–1,500 triangles**

### B3 · Planter with cypress — `kit_planter_cypress`

> A large terracotta planter with a slim young cypress tree growing from it. Simple ribbed pot in warm orange-brown clay, deep green conical foliage with a clean silhouette.

Footprint 0.8 × 0.8 m · height 2.5 m · **1,500–2,500 triangles**

Foliage as solid geometry, not alpha-cut planes. Alpha costs a second render pass.

### B4 · Market stall — `kit_market_stall`

> An empty wooden market stall: four posts holding a striped canvas awning in red and cream over a plank counter, with a shelf underneath. Weathered light wood, simple and sturdy.

Footprint 2.5 × 2 m · height 2.5 m · **3,000–5,000 triangles**

Empty on purpose: the same stall becomes a spice stall in Gaziantep and a pottery stall in Nevşehir by what is placed on it.

### B5 · Crate and barrel set — `kit_crates`

> A small stack of wooden crates and one round barrel, as found beside a market stall. Rough pale timber with dark iron banding on the barrel.

Footprint 1 × 1 m · height 1 m · **500–1,000 triangles**

### B6 · Street cat — `kit_street_cat`

> A friendly İstanbul street cat sitting upright with its tail curled around its paws, looking ahead calmly. Soft grey and white tabby fur, round face, slightly oversized head in a gentle cartoon proportion.

Footprint 0.4 × 0.3 m · height 0.3 m · **800–1,500 triangles**

This is not filler. İstanbul's street cats are one of the first things any child notices about the city, and a few of them along the walk will do more for the sense of place than another building. If only one object in this batch gets extra care, make it this one.

---

## C. Delivery

For each model, send the GLB plus:

```
asset_id
SHA-256
triangle count
bounding box in metres
alphaMode, and whether the material is double-sided
any named sub-meshes
```

I parse every file and check it against these numbers. Deviations get reported, not silently corrected — two of the four claims in the Keloğlan delivery note did not survive measurement.

Integration is one line per model in the asset registry. No other code changes, and the engine gives each object the collider that is already reserved for it.

---

## D. Suggested order

The first three change how the street feels more than the last three, because a child spends the whole walk looking at the ground and the things beside them, and glances at the landmark once.

1. `kit_street_lamp`
2. `kit_bench`
3. `kit_street_cat`
4. `city_istanbul_simit_cart`
5. `kit_planter_cypress`
6. `city_istanbul_galata_tower`
7. `kit_crates`
8. `kit_market_stall`
9. `city_istanbul_grand_bazaar`
10. `city_istanbul_iznik_tile_panel`
11. `city_istanbul_ferry`

Send them as they finish; there is no need to wait for the batch.

---

## E. Still open

**The ground.** The largest surface on screen and currently flat olive. It is a tiling material rather than a model, so it does not belong in a Meshy batch — but it is the single biggest visual improvement available. A 2048 × 2048 seamless cobblestone texture with a 4 m repeat would do it.

**The ferry.** Does the child board it, or look at it from the quay? Boarding means a deck, railings and a ramp, and roughly triple the budget.

**Time of day.** Everything above assumes midday. An evening street with lit lamps is more atmospheric but needs emissive maps on every lamp and a different sky.
