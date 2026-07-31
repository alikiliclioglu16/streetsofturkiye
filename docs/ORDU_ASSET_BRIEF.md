# Meshy Brief — Ordu

**Date:** 31 July 2026
**City:** Ordu (Black Sea) · **3 stops, 1 question** · Guide: Keloğlan

Ordu is open and walkable. It has cobbled streets, cats, plane trees, and the
Black Sea in front of it. Every model below is a placeholder.

The street is 28 m, the same shape as Gaziantep, Kars and Van.

**What makes Ordu different, and why nothing is reused.** This is the wettest
city in the project. Van's shore is a bare plateau meeting water; Ordu's is a
forest doing it — hazelnut groves come down to the back gardens, the houses are
timber with deep eaves against the rain, and the sea is a **beach**, not a quay.
The region's own palette is already green: the ground tints towards moss and the
sky towards pale grey-green.

---

## The whole list, in the order I would draw it

Ten files. **Part A first** — a street with placeholder stops and a real horizon
reads as a place under construction; real stops and no horizon reads as a
diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| 1 | `city_ordu_timber_houses` | Black Sea timber houses | 24 × 11 × 13 m | 2048 |
| 2 | `kit_ordu_hazelnut_grove` | hazelnut grove, shared kit | 8.5 × 4.4 × 8.5 m | 1024 |
| 3 | `city_ordu_boztepe_hill` | Boztepe, behind the town | 78 × 26 × 60 m | 2048 |
| 4 | `city_ordu_hazelnut_stall` | **stop 1** — hazelnuts drying | 2.4 × 2.0 × 1.3 m | 1024 |
| 5 | `city_ordu_cable_station` | **stop 2** — the cable car | 4.2 × 4.4 × 3.6 m | 2048 |
| 6 | `city_ordu_beach_deck` | **stop 3** — the Blue Flag beach | 4.6 × 1.4 × 3.2 m | 1024 |
| 7 | `city_ordu_cable_car` | *optional* — a cabin that moves | 2.6 × 2.4 × 2.2 m | 1024 |
| 8 | `collectible_ordu_hazelnut_jar` | reward 1 | 0.12 × 0.16 × 0.12 m | 1024 |
| 9 | `collectible_ordu_cable_ticket` | reward 2 | 0.13 × 0.09 × 0.01 m | 1024 |
| 10 | `collectible_ordu_sunset_photo` | reward 3 | 0.15 × 0.11 × 0.01 m | 1024 |

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever scale comes out, say what it is, and
it is re-authored here in one command.

**Still needed from you:** a theme. Anything from the region; it converts to
Opus and lands at about 1.5 MB.

---

# Part A — the horizon

## A1 · Timber houses — `city_ordu_timber_houses`

The sides, four a side. Black Sea houses are built for rain: deep overhanging
eaves, a timber upper floor over a stone base, and a balcony.

> A row of three or four traditional Black Sea houses joined together: stone
> ground floor, timber upper floor painted in muted greens and browns, deep
> overhanging eaves, wooden balconies with turned railings, red tiled roofs,
> shuttered windows. Moss on the stonework, a stack of firewood at one end.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **24 m wide × 11 m tall × 13 m deep** |
| Triangles | 7,000–12,000 |
| Textures | base colour **2048**, others **1024** |

**The eaves are the point.** They are what makes a Black Sea house look like a
Black Sea house rather than an Anatolian one, and they need to overhang far
enough to read at fifteen metres.

## A2 · Hazelnut grove — `kit_ordu_hazelnut_grove`

Fills the ground behind and beside the houses. On this coast the orchard comes
down to the back gardens.

> A cluster of six or seven hazelnut bushes: multi-stemmed, low and rounded,
> broad bright green leaves, clusters of nuts in green husks visible among the
> foliage. Long grass at the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **8.5 m wide × 4.4 m tall × 8.5 m deep** |
| Triangles | 4,000–7,000 |
| Textures | base colour **1024**, others **512** |

A `kit_` asset: shared across provinces, so it **stays under 2 MB**. Its cost is
paid everywhere it is planted.

**Bushes, not trees.** A hazelnut is a multi-stemmed shrub. Drawn as a standard
round-crowned tree it becomes generic planting and the city loses the one thing
it is world champion at.

## A3 · Boztepe — `city_ordu_boztepe_hill`

Behind the town, and the reason stop two exists. Aligned by its near edge.

> A steep green hill rising directly behind a coastal town: dense forest on the
> lower slopes, tea and hazelnut terraces cut across the middle, a grassy
> viewing area at the top with a few pine trees. Mist lying in the folds.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **78 m wide × 26 m tall × 60 m deep** |
| Triangles | 8,000–13,000 |
| Textures | base colour **2048**, others **1024** |

**Green all the way up.** Kars's mountain is bare rock and Van's is snow and
scree; this one is forest to the summit, which is what the Black Sea looks like
and what will keep the three from reading as the same hill in three colours.

---

# Part B — the three stops

Child-scale, all of them. **One to five metres.** Hagia Sophia was built as a
stop and had to be moved to the horizon; the fairy chimneys had to shrink from
six metres to four and a half.

## B1 · Hazelnut stall — `city_ordu_hazelnut_stall`

**Stop 1.** *More hazelnuts grow around Ordu than anywhere on the planet.*

### Draw this first

A wooden drying rack with **hazelnuts spread out on it in their husks**, open
sacks of shelled nuts leaning against the legs, and a scoop standing in one of
them. On a small side table a jar of chocolate spread with a spoon in it and a
slice of bread.

**The jar is how a child connects the two things.** The canonical text says the
chocolate spread on your toast probably started here; the reward is a
hazelnut-chocolate jar. Nuts alone are a farm; nuts *and* the jar is the fact.

### Meshy prompt

> A wooden drying rack piled with hazelnuts in their green husks, with open
> burlap sacks of shelled nuts leaning against its legs and a metal scoop
> standing in one. A small side table holds a glass jar of chocolate hazelnut
> spread with a spoon in it and a slice of bread beside it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.4 m wide × 2.0 m tall × 1.3 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a hazelnut-chocolate jar** (canonical) |

## B2 · Cable car station — `city_ordu_cable_station`

**Stop 2.** *Ordu's red cable cars glide from the seaside up to Boztepe hill.*

### Draw this first

The bottom station: a small open steel-and-timber structure with **one red cabin
sitting at the platform, doors open**, the cable running up and out of the top
of the frame, a turnstile and a bench.

The cabin must be **red**. The canonical text says so, and it is the one detail a
child will match against the picture in their head.

This is the ferry problem again and the same answer: a cable car line is not
child-scale, so the boarding point stands in for it — the terminal for the ferry
(D-068), the platform for the Eastern Express (D-135), the jetty for the lake
(D-152).

### Meshy prompt

> The bottom station of a cable car: a compact open structure of steel frame and
> timber decking with a bright red cable car cabin parked at the platform, its
> doors slid open. A thick cable runs up and away from the top of the frame. A
> turnstile, a wooden bench, and a hanging lamp.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **4.2 m wide × 4.4 m tall × 3.6 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **2048**, others **1024** |
| Reward | **a cable car ticket** (canonical) |

The tallest stop object in the project after Ani's doorway, and the layout
already reserves for it: its trigger ring comes out at 5.8 m where the others
get 4.6.

## B3 · Beach deck — `city_ordu_beach_deck`

**Stop 3.** *Surprise — the Black Sea has sandy beaches,* and Ordu's fly the
Blue Flag.

### Draw this first

A short timber deck on sand where the promenade meets the beach, with **a blue
flag on a pole**, two striped deckchairs, an upturned rowing boat, and a scatter
of pebbles and shells at the sand's edge.

**The flag is the fact.** Blue Flag is what the stop is about, and it has to be a
plain blue flag on a pole that a child can point at — not a logo, not lettering.

### Meshy prompt

> A short weathered timber deck on pale sand at the edge of a promenade, with a
> plain blue flag flying from a white pole, two striped canvas deckchairs, a
> small upturned wooden rowing boat, and scattered pebbles and shells where the
> sand begins.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **4.6 m wide × 1.4 m tall × 3.2 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **an orange sunset photo** (canonical) |

**Wide and low.** It is a deck, not a hut, and the sea has to be visible over it
from the street.

---

# Part C — optional, and worth it

## C1 · Cable car cabin — `city_ordu_cable_car`

A second red cabin, on its own, to run up and down the hill behind the town
while the child walks.

Every city has one thing that moves and is not an animal: İstanbul's tram and
ferry, Kars's train, Van's canoes, Cappadocia's balloons. Ordu's is obvious and
it is already in the canonical text — *glide from the seaside up to Boztepe*.

> A single bright red cable car cabin with rounded corners, large windows, a
> white roof and a steel arm and pulley on top.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **2.6 m wide × 2.4 m tall × 2.2 m deep** |
| Triangles | 4,000–7,000 |
| Textures | base colour **1024**, others **512** |

The motion is already written — it is the tram's, which goes out, pauses and
comes back, and that is exactly what a cable car does. Wiring it up once the
cabin exists is an afternoon.

---

# Part D — the three rewards

Small, held up close, seen against the completion panel rather than in the
street. **1024 colour maps**; they are 15 cm objects.

## D1 · Hazelnut jar — `collectible_ordu_hazelnut_jar`

> A short glass jar of chocolate hazelnut spread with a gold lid, the dark spread
> visible through the glass and a few whole hazelnuts resting beside the base.

**0.12 × 0.16 × 0.12 m.** No label text — the colour and the nuts say it.

## D2 · Cable car ticket — `collectible_ordu_cable_ticket`

> A small stiff card ticket in red and cream, punched through one corner, with
> printed lines and a rounded edge.

**0.13 × 0.09 × 0.01 m.** **No legible text.** Nearly flat, so leave
`doubleSided` on.

## D3 · Sunset photo — `collectible_ordu_sunset_photo`

> A small printed photograph with a white border, showing an orange sunset over
> a calm sea with a dark headland at one side, held slightly curled.

**0.15 × 0.11 × 0.01 m.** The curl is what makes it read as a photograph rather
than a card. Leave `doubleSided` on.

---

## Rules for every file

Each of these cost this project time.

**Textures by role, never all at maximum.** Base colour as tabled above, normal
and roughness one step below. Deliveries have arrived at 70 MB and come down to
under 3 MB with no visible loss.

**`alphaMode` OPAQUE.** A transparent material costs two render passes. Both
heroes arrived BLEND and had to be forced.

**Leave `doubleSided` alone — do not switch it off.** Anything thin needs it: a
flag, a photograph, a ticket, a leaf, a deckchair canvas. Two flags and a carpet
were nearly lost to this.

**No black emissive map.** Every Meshy delivery so far has carried a 4096 px
emissive texture that was solid black with `emissiveFactor` at [1,1,1]. It adds
nothing and costs a texture unit.

**Metres, origin at the base centre, standing on y = 0.** Most deliveries so far
have arrived buried below the origin.

**Say what the model is, not just what the file is called.** A file named
`Beyoğlu` was registered as a row of facades and placed twice as scenery. It was
a ferry. A grove briefed as pistachio arrived as olives. A gate named for a
desert had a bazaar in it.
