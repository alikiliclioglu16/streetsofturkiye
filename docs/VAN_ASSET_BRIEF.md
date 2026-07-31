# Meshy Brief — Van

**Date:** 31 July 2026
**City:** Van (eastern Anatolia) · **3 stops, 1 question** · Guide: Nasreddin Hodja

Van is open and walkable now. It has its theme (*Van Halayı*), it stands on the
eastern steppe — **not** Kars's bedrock, which was written for Ani — and its
street is dressed from the shared kit. Every model listed here is a placeholder.

The street is 28 m, the same shape as Gaziantep and Kars.

**What makes Van different from Kars, and why none of this is reused.** Both are
eastern provinces and that is where it stops. Ani's ruins are churches standing
apart in grass; Van's citadel is galleries cut into a cliff. Kars's mountain
closes a plateau; Van's stands over water. Kars has geese; **Van has the Van
cat, and that is the answer to the city's own quiz question** — a child who has
just been told what makes it special should be able to find one walking about.

---

## The whole list, in the order I would draw it

Eleven files. **Part A first** — a street with placeholder stops and a real
horizon reads as a place under construction; real stops and no horizon reads as
a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| 1 | `city_van_citadel_ridge` | rock spine with cut chambers | 26 × 15 × 14 m | 2048 |
| 2 | `kit_van_orchard` | fruit trees, low and spreading | 7 × 4.6 × 7 m | 1024 |
| 3 | `city_van_akdamar_island` | the island church, out on the lake | 22 × 11 × 18 m | 2048 |
| 4 | `city_van_erek_mountain` | Erek, behind the town | 96 × 30 × 90 m | 2048 |
| 5 | `city_van_cat_basket` | **stop 1** — a Van cat in a basket | 1.1 × 0.9 × 0.9 m | 2048 |
| 6 | `city_van_akdamar_jetty` | **stop 2** — the boarding point | 2.4 × 1.8 × 6.5 m | 1024 |
| 7 | `city_van_breakfast_table` | **stop 3** — the Van breakfast | 2.6 × 1.5 × 1.7 m | 1024 |
| 8 | `kit_van_cat` | the animal, **rigged, `Walking` clip** | 0.22 × 0.55 × 0.35 m | 1024 |
| 9 | `collectible_van_cat_plush` | reward 1 | 0.16 × 0.20 × 0.12 m | 1024 |
| 10 | `collectible_van_boat_ticket` | reward 2 | 0.13 × 0.09 × 0.01 m | 1024 |
| 11 | `collectible_van_breakfast_plate` | reward 3 | 0.22 × 0.05 × 0.22 m | 1024 |

Normal and roughness always one step below the base colour. These are the sizes
the registry will record and the sizes that will draw the model — but **do not
fight the exporter over them.** Deliver at whatever scale comes out, say what it
is, and it is re-authored here in one command.

---

# Part A — the horizon

## A1 · Citadel ridge — `city_van_citadel_ridge`

The sides, three a side. Van's castle is not a castle on a hill: it is a long
limestone spine with rooms, stairs and inscriptions cut *into* the rock — Tushpa,
the Urartian capital.

> A long spine of pale limestone rising from flat ground, with square chambers
> and doorways cut directly into the rock face, steps carved up one flank, and
> the remains of mudbrick walling along the top. Weathered, cream and grey, with
> dry grass at the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **26 m wide × 15 m tall × 14 m deep** |
| Triangles | 7,000–12,000 |
| Textures | base colour **2048**, others **1024** |

**Cut into, not built on.** The doorways should read as holes in a cliff rather
than as a building standing on one. That difference is the whole reason Van's
sides do not look like Ani's.

## A2 · Orchard — `kit_van_orchard`

Fills the gaps between the spurs. Van's plain is orchard country.

> A cluster of five or six low fruit trees with broad rounded crowns and short
> pale trunks, standing on dry grass, a few fallen fruit at the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **7 m wide × 4.6 m tall × 7 m deep** |
| Triangles | 3,000–6,000 |
| Textures | base colour **1024**, others **512** |

A `kit_` asset, so it is shared across provinces and **stays under 2 MB** — its
cost is paid everywhere it is used.

## A3 · Akdamar — `city_van_akdamar_island`

Out on the water, small with distance. Something to look at, not to reach — the
Maiden's Tower plays the same part in İstanbul.

> A small rocky island with a domed stone church on it: pinkish-red tuff, a
> conical roof over a tall drum, carved figures in bands around the walls, and a
> few almond trees. Low cliffs at the waterline.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **22 m wide × 11 m tall × 18 m deep** |
| Triangles | 6,000–11,000 |
| Textures | base colour **2048**, others **1024** |

## A4 · Erek — `city_van_erek_mountain`

Behind the town. Aligned by its near edge, and never by its centre: 90 m of
mountain centred on the boundary would put the square inside it.

> A broad mountain rising behind a plain: bare rock ridges in grey and rust with
> snow lying in the gullies near the top, scrub on the lower slopes, and a long
> shoulder running down to flat ground.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **96 m wide × 30 m tall × 90 m deep** |
| Triangles | 8,000–13,000 |
| Textures | base colour **2048**, others **1024** |

---

# Part B — the three stops

Child-scale, all of them. **One to five metres.** This has gone wrong twice
already: Hagia Sophia was built as a stop and had to be moved to the horizon, and
the fairy chimneys had to shrink from six metres to four and a half.

## B1 · Van cat in a basket — `city_van_cat_basket`

**Stop 1.** The smallest stop object in the project.

### Draw this first

A shallow woven basket with a folded blanket in it and **a white long-haired cat
sitting up in it, looking straight out.** One eye blue, one amber. Beside the
basket a small water bowl and a scattering of loose white fur on the ground.

**The eyes are the stop.** The city's one question is *What makes the Van cat
special?* and the answer is standing in front of the child. They must read at
child height from two metres — which is why this one gets a 2048 colour map
despite being 90 cm tall.

### Meshy prompt

> A shallow round woven basket with a folded blanket inside and a white
> long-haired cat sitting upright in it looking forward, one eye bright blue and
> the other amber. A small ceramic water bowl stands beside the basket.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **1.1 m wide × 0.9 m tall × 0.9 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **2048**, others **1024** |
| Reward | **a Van cat plush** (canonical) |

## B2 · Akdamar jetty — `city_van_akdamar_jetty`

**Stop 2.** The lake, at the size of a thing you can walk up to.

### Draw this first

A short wooden jetty running out from the shore with **the bow of a small
passenger boat tied at the end of it** — the bow and a metre of gunwale, not the
whole boat. A mooring post with rope coiled round it, a life ring on a stand, and
a painted board with a bell beside it.

This is the ferry problem for the third time and it has the same answer: the
terminal stood in for the ferry (D-068), the platform for the Eastern Express
(D-135). A lake is not child-scale. A jetty with a boat's nose at the end of it
is both, and it points at the island.

### Meshy prompt

> A short wooden jetty on a lake shore with the bow of a small blue and white
> passenger boat moored at the end. A mooring post with coiled rope, a life ring
> on a stand, and a small painted signboard with a bell. Weathered planks, a few
> pebbles at the shore end.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.4 m wide × 1.8 m tall × 6.5 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **an Akdamar boat ticket** (canonical) |

**Deep rather than wide**, and the layout already reserves for it — the trigger
ring is derived from the footprint, so this stop gets a 7.25 m ring where the
others get 4.5.

**No text on the signboard.** Shapes only: a baked-in word is the one thing on
it that cannot be translated.

## B3 · Van breakfast — `city_van_breakfast_table`

**Stop 3.** *Van kahvaltısı*, which is a whole table and not a plate.

### Draw this first

A low round copper tray table **covered edge to edge in small dishes**: herbed
cheese, honeycomb in a bowl, clotted cream, olives, tomatoes, a stack of flat
bread, and two tulip glasses of tea. A cushion on the floor at one side and a
teapot on a stand.

**Crowded is the point.** A Van breakfast is famous for the number of dishes; a
table with four things on it is a snack. Fill it until there is no copper
showing.

### Meshy prompt

> A low round copper tray table crowded edge to edge with small breakfast
> dishes: white herbed cheese, a bowl of honeycomb, clotted cream, black and
> green olives, sliced tomatoes and cucumber, a stack of flat bread, and two
> tulip-shaped tea glasses. A double teapot stands to one side and a flat
> cushion lies on the floor beside it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.6 m wide × 1.5 m tall × 1.7 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a breakfast plate** (canonical) |

---

# Part C — the animal

## C1 · Van cat — `kit_van_cat`

The fourth animal in the project, and the second that has to be **rigged and
animated**.

> A white long-haired cat standing on all fours, tail up and slightly plumed,
> one eye bright blue and the other amber, faint ginger markings on the crown of
> the head and the tail.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **0.22 m wide × 0.55 m tall × 0.35 m long** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Rig | skinned, with a **`Walking`** clip |

**The clip must be called `Walking`,** with the -ing. The animal component looks
for that name and otherwise falls back to whatever clip comes first in the file —
so a wrong name works today and breaks silently the moment a second clip is
added.

**No root translation in the clip.** The application moves the cat through the
world; the clip moves its legs. A walk cycle that also translates the root makes
the feet skate, and every animal here follows this rule.

The two street dogs arrived rigged, walking and correct on the first delivery, so
this is a solved shape — ask for the same treatment.

---

# Part D — the three rewards

Small, held up close, seen against the completion panel rather than in the
street. **1024 colour maps**; they are 20 cm objects.

## D1 · Van cat plush — `collectible_van_cat_plush`

> A small soft toy in the shape of a sitting white cat, visibly stitched, with
> one blue button eye and one amber, and a stitched pink nose.

**0.16 × 0.20 × 0.12 m.** The odd eyes have to survive at 20 cm — larger and
simpler beats detailed and small.

## D2 · Akdamar boat ticket — `collectible_van_boat_ticket`

> A small stiff card boat ticket in pale blue and cream, punched through one
> corner, with printed rules and lines and softened edges.

**0.13 × 0.09 × 0.01 m.** **No legible text.** Nearly flat, so leave
`doubleSided` on.

## D3 · Breakfast plate — `collectible_van_breakfast_plate`

> A round white plate holding a wedge of white herbed cheese, a spoonful of
> honeycomb, three olives and a slice of tomato, arranged in quarters.

**0.22 × 0.05 × 0.22 m.** Four things, clearly separate. A plate of mush at this
size reads as a plate of nothing.

---

## Rules for every file

Each of these cost this project time.

**Textures by role, never all at maximum.** Base colour as tabled above, normal
and roughness one step below. Deliveries have arrived at 70 MB and come down to
under 3 MB with no visible loss.

**`alphaMode` OPAQUE.** A transparent material costs two render passes.

**Leave `doubleSided` alone — do not switch it off.** Anything thin needs it: a
ticket, an orchard leaf, a jetty plank, a signboard. Flags on two models and a
carpet on a loom were nearly lost to this.

**No black emissive map.** Every Meshy delivery so far has carried a 4096 px
emissive texture that was solid black, with `emissiveFactor` set to [1,1,1]
beside it. It adds nothing and costs a texture unit.

**Metres, origin at the base centre, standing on y = 0.** Nine of the last twelve
deliveries arrived buried below the origin.

**Say what the model is, not just what the file is called.** A file named
`Beyoğlu` was registered as a row of facades and placed twice as scenery. It was
a ferry. A grove briefed as pistachio arrived as olives. A gate named for a
desert had a bazaar in it.
