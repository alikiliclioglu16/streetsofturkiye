# Meshy Brief — Balıkesir

**Date:** 2 August 2026
**City:** Balıkesir (Marmara) · **3 stops, 1 question** · Guide: Keloğlan

Balıkesir is open and walkable. Its stops are graybox and its horizon is empty —
there is currently nothing in any of the four directions. Every model below is a
placeholder.

The street is 28 m, the same shape as the last five cities. Stops sit at
`z = −17`, `−31`, `−45`. The play area runs from `z = +26` behind the spawn to
`z = −59` ahead of it.

---

## The problem to solve first

Balıkesir is the second Marmara city, and the region table hands it İstanbul's
clothes: İstanbul's cobbles, İstanbul's cats, İstanbul's plane-and-cypress
planting, İstanbul's exact sky and ground colour, and a kit called
`marmara-urban-coastal`. For a province of mountains, olive groves and a bird
marsh, "urban coastal" is the wrong label on every count.

**And the harder collision is with Trabzon, not İstanbul.** Trabzon was finished
yesterday with the sea behind the child and a rock ahead. Balıkesir also has
water and also has a mountain, and if it answers its directions the same way the
two provinces become one place drawn twice — which is the fault the four-
directions test exists to catch.

So the water here is **not a sea**. It is the channel between Ayvalık and Cunda,
maybe forty metres of it, with the island filling the far side. Trabzon's back is
an open horizon you look past; Balıkesir's back is closed by land you look *at*.
That difference is the whole design.

| | İstanbul | Trabzon | Balıkesir |
|---|---|---|---|
| Ahead | the strait | Sümela, vertical rock | **Kaz Dağları, green and forested** |
| Behind | the far bank | open sea to the horizon | **a channel, closed by Cunda** |
| Sides | Beyoğlu facades | tea terraces | **olive terraces / Manyas reeds** |
| On the water | ferry, crossing | hamsi boats, working | **windsurfers** |
| Moving life | cats | boats and gulls | **Manyas birds** |
| Palette | bright blue over warm sand | hazed grey-green | **silver-green under a dry sky** |

Six provinces now have a mountain and no two are the same: Boztepe is a bare
green headland, Kartalkaya has snow on it, Sarıkamış is bare rock, Erek is scree,
Sümela is a vertical crag. **Kaz Dağları is the first one that is forest to the
summit**, and that is what has to come back.

If a model here could plausibly be dropped into Trabzon, it is wrong.

---

## What the camera can actually see

Derived from `FOLLOW_HEIGHT` 2.3, `FOLLOW_DISTANCE` 5.2 and `CAMERA_FOV` 50, not
invented (D-183). The camera tilts down twelve degrees with a fifty degree field,
so the top of the frame is **thirteen degrees above horizontal** and the visible
ceiling at horizontal distance *D* is `2.3 + D · tan 13°`.

| Direction | Seen from | Distance | Ceiling |
|---|---|---|---|
| Kaz Dağları at `z = −95` | spawn | 100 m | **25.4 m** |
| | stop 3 | 55 m | 15.0 m |
| Cunda at `z = +70` | spawn, turned round | 75 m | **19.7 m** |
| The channel at `z = +32` | spawn, turned round | 37 m | 10.9 m |
| Manyas at `x = +31` | mid-street | 31 m | **9.5 m** |

Two things fall straight out of that and both are in the sizes below:

- **The mountain is 30 m and gets cropped as a child walks up to it.** That is
  what makes it feel tall. It only has to read whole from the spawn.
- **Anything on the flanks has to be about ten metres**, or it is sky. A reed
  bed is two metres tall, so Manyas cannot be reeds alone — it needs the wooded
  bank behind it, and that is what the plate has to carry.

---

## The whole list, in the order I would draw it

**Part A first.** A street with placeholder stops and a real horizon reads as a
place under construction; real stops and no horizon reads as a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| A1 | `city_balikesir_olive_terrace` | the west side, six of them | 26 × 12 × 16 m | 1024 |
| A2 | `city_balikesir_manyas_reeds` | the east side, five of them | 26 × 11 × 18 m | 1024 |
| A3 | `city_balikesir_kaz_daglari` | the mountain ahead | 90 × 30 × 30 m | 2048 |
| A4 | `city_balikesir_cunda_island` | across the channel, behind | 110 × 16 × 30 m | 1024 |
| A5 | `kit_balikesir_pelican` | the birds, flying — **rigged** | 1.8 m wingspan | 1024 |
| A6 | ~~`kit_balikesir_windsurfer`~~ | **delivered** — 1.13 × 1.8 × 3.45, 1.30 MB | — | — |
| A7 | ~~`kit_olive_grove`~~ | **already in the project** — 13.4 × 5 × 13.8 | — | — |
| B1 | `city_balikesir_mountain_spring` | stop 1 | 2.6 × 3.2 × 2.0 m | 2048 |
| B2 | `city_balikesir_olive_press` | stop 2 | 2.8 × 2.6 × 2.2 m | 2048 |
| B3 | `city_balikesir_hosmerim_counter` | stop 3 | 2.6 × 2.4 × 2.0 m | 2048 |

**Seven files to draw.** Two are already done.

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command. Every file is measured before anything is
decided about it, and nothing is taken from the file name (D-078).

---

## The weight budget, before anything is drawn

Trabzon lands at 16.21 MB a visit and Ordu is at the 20 MB line, which on 4G is
twenty seconds before anything moves (D-166). This is a budget to design to, not
a number to trim down to afterwards.

| | Target transfer |
|---|---|
| `city_balikesir_kaz_daglari` | 2.5 MB |
| `city_balikesir_cunda_island` | 0.9 MB |
| `city_balikesir_olive_terrace` | 0.9 MB |
| `city_balikesir_manyas_reeds` | 0.9 MB |
| `kit_balikesir_pelican` | 0.8 MB |
| `kit_balikesir_windsurfer` (delivered) | 1.3 MB |
| `kit_olive_grove` (exists) | 1.4 MB |
| three stops, ~1.9 MB each | 5.7 MB |
| theme | ~1.3 MB |
| guide (cached after the first city) | 0.95 MB |
| **per visit** | **~16.7 MB** |

These are transfer bytes *after* `optimize-textures.mjs`, not what Meshy hands
over. A delivery of this kind arrives at 20–30 MB and comes down by a factor of
twenty with no visible loss, so do not try to hit these in the generator.

---

# Part A — the horizon

## A1 · Olive terrace — `city_balikesir_olive_terrace`

The west side, six of them down the street. Ayvalık is millions of olive trees
on stony slopes, and silver is the colour nothing else in the project has.

> A stony hillside planted with old olive trees in rows, their leaves
> silver-grey-green and their trunks thick, gnarled and twisted. Dry-stone
> retaining walls between the terraces, pale limestone rubble and dry golden
> grass on the ground, a few low thorny shrubs.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **26 m wide × 12 m tall × 16 m deep** |
| Triangles | 7,000–12,000 |
| Base colour | 1024 (seen at 30–45 m, never closer) |

`kit_olive_grove` is already in the project and goes in front of these as single
stands — a hillside at distance and a clump of trees beside a child are different
objects, the same split Ordu's hazelnut has.

## A2 · Manyas reeds — `city_balikesir_manyas_reeds`

The east side, five of them. **This is the piece most likely to come back
wrong**, because the obvious thing to draw is reeds and reeds are two metres
tall. At two metres this side of the street is open sky.

So the subject is the *bank*, and the reeds are its foot.

> A wooded lake shore: a bank of dense green trees and willows about ten metres
> high, with a wide belt of tall golden reeds growing in shallow water in front
> of them. Still brown water between the reed stems, a fallen log, a few white
> herons and pelicans standing among the reeds. Muddy shore at the near edge.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **26 m wide × 11 m tall × 18 m deep** |
| Triangles | 7,000–12,000 |
| Base colour | 1024 |

**The trees carry the height, not the reeds.** If the delivery is a reed bed with
a low bank, it will be sent back.

## A3 · Kaz Dağları — `city_balikesir_kaz_daglari`

The mountain ahead, near edge aligned at `z = −95`, **not centred on it** — a
plate centred on the boundary swallowed Nevşehir's spawn (D-101).

**One wide piece, not three copies side by side.** Three of Sümela's crag went in
that way and read as exactly what they were; a range is one silhouette with
several summits in it, and that has to be in the model rather than assembled from
repeats.

> A long green mountain range, forested to the summits with dark pine and beech,
> two or three rounded peaks along its length with a deeper valley between them.
> Grey rock showing through in a few places near the tops, low cloud caught in
> the folds, dense forest running all the way down to the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **90 m wide × 30 m tall × 30 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 2048 — the only thing at the end of the street |

Mist will be drifted across it in code, the way it crosses Sümela. Nothing needs
to be drawn for that.

## A4 · Cunda Island — `city_balikesir_cunda_island`

Behind the child, near edge at `z = +70`, across about forty metres of channel.

**It has to close the direction.** Trabzon's sea runs to the horizon on purpose;
this one does not, and the island is what stops it. Wide enough that its ends are
out of frame, low enough to sit under the 19.7 m ceiling.

> A low Aegean island seen from across a narrow channel: pale stone houses with
> terracotta roofs and blue shutters climbing a gentle hill, a small windmill on
> the ridge, dark cypresses and olive trees between the houses, a stone
> waterfront with fishing boats moored along it, rocky shore at the waterline.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **110 m wide × 16 m tall × 30 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 |

The channel water is a plane drawn in code and needs no model.

## A5 · Pelican — `kit_balikesir_pelican`

Manyas is a bird sanctuary and the birds are what a child is meant to notice.
Trabzon's gull cannot do this job: it is a small dark seabird and these are big
white water birds, which is the whole point of the place.

**Rigged, with a flap cycle**, like the gull. One clip, two to three seconds,
looping. Wings and neck only — the application flies it, and a clip that moves
its own root makes it skate (the rule everything that moves here follows).

> A great white pelican with wings spread in flight: white body, black wingtips,
> a long orange-pink bill with a pouch beneath it, orange feet tucked back.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **1.8 m wingspan** (height does not matter — see below) |
| Triangles | 6,000–10,000 |
| Base colour | 1024 |
| Animation | one looping flap, 2–3 s, **no root motion** |

**Deliver it with its wings out and level.** Height is a useless scale key for a
shape held flat, and the gull had to be scaled off its wingspan for exactly that
reason — three geese at one height in different poses is the same trap (D-129).

## A6 · Windsurfer — delivered

1.13 × 1.8 × 3.45 m, 10,000 triangles, 1.30 MB, one 2048 map. In budget and at a
believable size already; only the base offset needs re-authoring.

Four of them will work the channel between the shore and the island. **They stay
at human size.** At forty metres a person is about two and a half degrees tall,
which is small — if that reads as too small the answer is more of them, not
bigger ones. A boat can be exaggerated because nothing tells a child how big a
boat is; a person cannot.

---

# Part B — the stops

All three are **child-scale, one to five metres** — something to walk up to, not
scenery. Kaz Dağları is stop one and is also 30 m tall on the horizon; those are
two different objects and the one here is the small one. Hagia Sophia was built
as a stop and had to be moved to the horizon (D-066), and Sümela went the same
way.

Stops present and hand over a collectible. They do not ask questions — the
question lives only in the quiz gate (D-023).

## B1 · Stop 1 — `city_balikesir_mountain_spring`

Canonical: *Kaz Dağları is a green mountain full of legends... its air is so
fresh and full of oxygen that people come just to breathe.* Reward: 🌲 a pine
cone.

A child cannot climb a mountain, and the mountain is already on the horizon. The
stop is the thing you would stand in front of if you got there — and it is
specifically about **water and air**, not rock.

> A mountain spring: cold clear water running from a carved stone spout into a
> mossy stone trough, set into a bank of ferns and pine needles. Tall straight
> pine trunks close behind it, fallen pine cones around the base, a tin cup on a
> chain hanging beside the spout.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.6 m wide × 3.2 m tall × 2.0 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

## B2 · Stop 2 — `city_balikesir_olive_press`

Canonical: *millions of silvery olive trees, some hundreds of years old... kids
dip warm bread in it.* Reward: 🫒 a bottle of olive oil.

The groves are the sides of the street. The stop is where the olives become oil,
because that is the part a child can stand at.

> A traditional stone olive press: a big round millstone standing on edge in a
> circular stone basin, with a wooden beam through its centre. Baskets of black
> and green olives beside it, glass bottles and a clay jar of golden-green oil,
> a wooden board with torn bread on it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.8 m wide × 2.6 m tall × 2.2 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

## B3 · Stop 3 — `city_balikesir_hosmerim_counter`

Canonical: *höşmerim, made from fresh cheese — soft, warm and sweet. Its creamy
dairy farms are famous.* Reward: 🧀 a höşmerim cup.

Canonical names the sign — **HÖŞMERİM** — but nothing in the game renders text on
a model. The sign is a painted bowl and a spoon, and the words are the fact
card's job.

> A village dairy counter under a small wooden canopy: a wide copper pan of pale
> golden höşmerim being stirred with a long wooden paddle, small glazed cups
> filled with it and dusted with chopped nuts, a milk churn and a round of white
> cheese on a marble slab, a painted wooden sign with a bowl and a spoon on it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.6 m wide × 2.4 m tall × 2.0 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

---

# Part C — sound

`balikesir_theme.webm`. Zeybek is the west's own rhythm — slow, wide and heavy on
the beat, which is the opposite of Trabzon's fast kemençe and stops two
neighbouring provinces sounding alike. Davul and zurna, or a clarinet over them.

No ambience bed. The synthesised one was cut after two attempts and filtered
noise reads as water however it is shaped (D-103).

---

# Notes for whoever integrates this

- **Measure every file before deciding anything.** Bytes, triangles, meshes,
  materials, `alphaMode`, `doubleSided`, world box, base offset, clip names, and
  the SHA-256 into the registry.
- **The pelican is skinned**, so it clones with `SkeletonUtils` and never with
  `Object3D.clone` (D-042), and it scales off its wingspan rather than its
  recorded height.
- **`birdModelUrl` is currently hard-wired to `kit_trabzon_bird`** in
  `buildScene.ts`. It has to become per-city before Manyas has birds. Code work,
  not a delivery.
- **The gull is misnamed.** `kit_trabzon_bird` is a `kit_` asset with a city in
  its name; if it is ever wanted anywhere else it should be renamed.
- **Never force `doubleSided` off.** Reeds, olive leaves and a sail are all thin,
  and culling their back faces draws half of them (D-089).
- **The recorded height draws the model** (D-124), measured off the file so the
  width and depth keep its own aspect, or the collider will not match what is
  drawn.
- **Sweep the circle** before judging any direction empty (D-149 / D-174).
- **Ask for a screenshot after every deploy.** Three assets have been integrated
  wrongly for want of one, and Uzungöl was built twice before a screenshot
  settled that a lake was the wrong idea entirely.
