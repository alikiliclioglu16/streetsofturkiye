# Meshy Brief — Mardin

**Date:** 2 August 2026
**City:** Mardin (Southeastern Anatolia) · **3 stops, 1 question** · Guide: Keloğlan

Mardin is open and walkable. Its stops are graybox and its horizon is empty —
there is currently nothing in any of the four directions. Every model below is a
placeholder.

The street is 28 m, the same shape as the last six cities. Stops sit at
`z = −17`, `−31`, `−45`. The play area runs from `z = +26` behind the spawn to
`z = −59` ahead of it.

---

## The problem to solve first

Mardin is the second Southeastern Anatolia city and the region table hands it
Gaziantep's clothes — not approximately, exactly. Same kit, same red sand
surface, and the identical sky and ground colour down to the hex. Both are stone
cities in the same region and **both have a metalworking stop**: Gaziantep's
coppersmith and Mardin's silversmith. Two provinces have never been this close to
being one place drawn twice.

**The thing that saves it is the plain.**

Every city in this project so far closes at least three of its directions with
something tall — a mountain, a cliff, a hill, a town across water. Mardin has
none of that on one side. It sits on the lip of an escarpment looking out over
Mesopotamia, and what is out there is *flat, to the horizon, forever*. Canonical
says it in the first line: the houses look over the endless plain.

So **the street runs along the cliff edge**: the town climbing on one flank, and
nothing at all on the other. That is a shape no other city in the project has,
and it is the whole design.

| | Gaziantep | Mardin |
|---|---|---|
| Street | a bazaar lane between facades | a terrace along an escarpment |
| North flank | stone houses | **honey stone terraces climbing** |
| South flank | stone houses | **a parapet, a drop, and the plain** |
| Ahead | the castle on its mound | **Deyrulzafaran on its saffron slope** |
| Behind | the bazaar gate | **the citadel rock above the town** |
| Craft | copper, hammered, red | **silver, twisted, cold and fine** |
| Moving | street dogs | **doves over the rooftops** |
| Palette | warm apricot | **bleached gold, hazing to nothing** |

If a model here could plausibly be dropped into Gaziantep, it is wrong.

---

## What the camera can actually see

Derived from `FOLLOW_HEIGHT` 2.3, `FOLLOW_DISTANCE` 5.2 and `CAMERA_FOV` 50, not
invented (D-183). The camera tilts down twelve degrees with a fifty degree field,
so the top of the frame is **thirteen degrees above horizontal** and the visible
ceiling at horizontal distance *D* is `2.3 + D · tan 13°`.

| Direction | Seen from | Distance | Ceiling |
|---|---|---|---|
| Deyrulzafaran at `z = −88` | spawn | 93 m | **23.8 m** |
| | stop 3 | 48 m | 13.4 m |
| Citadel rock at `z = +55` | spawn, turned round | 60 m | **16.2 m** |
| Terrace houses at `x = −32` | mid-street | 32 m | **9.7 m** |
| The plain, 90 m out | anywhere | 90 m | 23.1 m |

Two things fall out of that:

- **The citadel is meant to be cropped.** At 24 m it loses its top eight metres
  from the square, which is what standing under a citadel looks like.
- **The terrace houses have to be tall.** Anything under about ten metres on a
  flank is sky, and this flank is the one that has to hold the whole city up.

---

## The whole list, in the order I would draw it

**Part A first.** A street with placeholder stops and a real horizon reads as a
place under construction; real stops and no horizon reads as a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| A1 | `city_mardin_terrace_houses` | the north flank, five of them | 30 × 14 × 18 m | 1024 |
| A2 | `city_mardin_parapet` | the south edge, eight of them | 12 × 1.1 × 1.2 m | 1024 |
| A3 | `city_mardin_plain` | Mesopotamia, beyond the drop | 220 × 4 × 90 m | 1024 |
| A4 | `city_mardin_citadel_rock` | behind, above the town | 70 × 24 × 26 m | 1024 |
| A5 | `city_mardin_deyrulzafaran` | ahead, at the head of the street | 46 × 18 × 24 m | 2048 |
| A6 | `kit_mardin_dove` | the moving life — **rigged** | 0.9 m wingspan | 1024 |
| B1 | `city_mardin_stone_doorway` | stop 1 | 3.0 × 3.6 × 1.6 m | 2048 |
| B2 | `city_mardin_telkari_bench` | stop 2 | 2.4 × 2.2 × 1.6 m | 2048 |
| B3 | `city_mardin_minaret_courtyard` | stop 3 | 2.8 × 4.6 × 2.4 m | 2048 |

**Nine files.**

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command. Every file is measured before anything is
decided about it, and nothing is taken from the file name (D-078).

---

## The weight budget, before anything is drawn

Balıkesir lands at 18.96 MB a visit and Ordu is at the 20 MB line, which on 4G is
twenty seconds before anything moves (D-166). Mardin should come in lighter than
either, and it can: it has no water plane, no boats, and one very cheap flank.

| | Target transfer |
|---|---|
| `city_mardin_terrace_houses` | 1.0 MB |
| `city_mardin_parapet` | 0.6 MB |
| `city_mardin_plain` | 0.9 MB |
| `city_mardin_citadel_rock` | 1.0 MB |
| `city_mardin_deyrulzafaran` | 2.2 MB |
| `kit_mardin_dove` | 0.8 MB |
| three stops, ~1.9 MB each | 5.7 MB |
| theme | ~1.3 MB |
| guide (cached after the first city) | 0.95 MB |
| **per visit** | **~14.5 MB** |

These are transfer bytes *after* `optimize-textures.mjs`, not what Meshy hands
over. A delivery of this kind arrives at 20–35 MB and comes down by a factor of
twenty with no visible loss, so do not try to hit these in the generator.

---

# Part A — the horizon

## A1 · Terrace houses — `city_mardin_terrace_houses`

The north flank, five of them down the street. This one piece has to carry the
line canonical opens with: houses climbing the hillside like steps.

**It is not a row.** A row of facades is Gaziantep and Beyoğlu. This is houses
*stacked* — one roof is the next one's terrace, and the whole thing goes up and
away from the street rather than standing beside it.

> Honey-coloured limestone houses built in stepped terraces up a hillside, each
> roof serving as the courtyard of the house above. Deeply carved stone window
> surrounds and doorways, rows of pointed arches along the fronts, low domes and
> stone stairways between the levels, a few small iron balconies. Warm golden
> stone, deep shadow in the arches.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **30 m wide × 14 m tall × 18 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 (seen at 30–40 m, never closer) |

## A2 · Parapet — `city_mardin_parapet`

The south edge of the street, eight of them end to end. Low, cheap, and doing
one job: telling a child there is a drop there.

**Do not fill this side.** The empty half of the frame is the point of the city,
and a wall tall enough to hide the plain would delete it.

> A low limestone parapet wall about waist height for an adult, with a simple
> moulded coping along the top and a plain iron railing set into it in places.
> Weathered honey stone, a little dry grass at its foot.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **12 m wide × 1.1 m tall × 1.2 m deep** |
| Triangles | 2,000–5,000 |
| Base colour | 1024 |

## A3 · The Mesopotamian plain — `city_mardin_plain`

Beyond the parapet, and **this is the most important model in the city.**

It is also the one most likely to come back wrong, because the instinct will be
to put something in it. There is nothing in it. It is flat, it goes on, and the
far edge of it should be almost the same value as the sky so that a child cannot
tell where one becomes the other.

> An endless flat plain seen from high above, stretching to a hazy horizon: pale
> gold and dusty green fields in irregular patches, thin darker lines of tracks
> and field boundaries, two or three tiny distant villages, no hills of any
> kind. The far distance fades to a pale bleached haze that is almost the colour
> of the sky.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **220 m wide × 4 m tall × 90 m deep** |
| Triangles | 4,000–8,000 |
| Base colour | 1024 |

**Sits below the street**, not level with it — the city is on an escarpment and
a child looks *down* on this. It will be dropped a few metres in the scene and
the parapet is what hides the join.

## A4 · Citadel rock — `city_mardin_citadel_rock`

Behind the spawn, near edge at `z = +55`, above the town. Twenty-four metres
against a ceiling of 16.2 m, so the top of it leaves the frame. That is
deliberate.

> A high limestone crag rising above a town, with the broken walls and towers of
> an old fortress along its summit. Sheer pale rock faces with horizontal
> bedding lines, scree and scrub at its foot, a few stone houses crowding the
> base of the cliff.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **70 m wide × 24 m tall × 26 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 |

Pale grey-gold limestone, **not** the red-brown of Gaziantep's castle mound.
Seven provinces now have something tall and no two are the same colour; this is
the eighth and it is bleached stone.

## A5 · Deyrulzafaran — `city_mardin_deyrulzafaran`

Ahead, at the head of the street. Stop three is about three faiths sharing one
sky, and this is the half of that a child cannot walk up to.

Saffron is in its name and should be in the model: the stone here is warmer and
more orange than the town's.

> An ancient monastery on a dry hillside: long low buildings of warm
> saffron-yellow stone around a courtyard, rows of round arches along the
> facade, a square bell tower with an arched opening at the top, a small dome.
> Bare stony slopes and a few dark cypresses around it, low ochre hills behind.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **46 m wide × 18 m tall × 24 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 2048 — the only thing at the end of the street |

## A6 · Dove — `kit_mardin_dove`

The moving life. Mardin has no water to work and no cable car; what moves over a
stone city is birds, and canonical hands over a peace dove as the third reward.

The gull already in the project cannot do this job — it is a dark seabird and
this is a small white one, which is the whole reading.

**Rigged, with a flap cycle.** One clip, two to three seconds, looping. Wings
only: the application flies it, and a clip that moves its own root makes it
skate.

> A white dove with wings spread in flight, pale grey wing edges, a small pink
> beak and pink feet tucked back.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **0.9 m wingspan** (height does not matter — see below) |
| Triangles | 5,000–9,000 |
| Base colour | 1024 |
| Animation | one looping flap, 2–3 s, **no root motion** |

**Deliver it with its wings out and level.** Height is a useless scale key for a
shape held flat — the gull had to be scaled off its wingspan for exactly that
reason, and three geese at one height in different poses is the same trap
(D-129).

---

# Part B — the stops

All three are **child-scale, one to five metres** — something to walk up to, not
scenery. Deyrulzafaran is 18 m at the head of the street and stop three is 4.6 m
in the middle of it; those are two different objects. Hagia Sophia was built as a
stop and had to be moved to the horizon (D-066), and Sümela went the same way.

Stops present and hand over a collectible. They do not ask questions — the
question lives only in the quiz gate (D-023).

## B1 · Stop 1 — `city_mardin_stone_doorway`

Canonical: *honey-colored stone houses climb the hillside like steps... at night
the city glows like a golden crown.* Reward: 🌇 a golden city photo.

The climbing houses are the whole north flank. The stop is the piece of that a
child can stand nose to nose with, and in Mardin that is always the doorway —
the carving is what the city is famous for close up.

> A grand carved limestone doorway: a tall pointed arch with bands of deep
> geometric and floral relief carving around it, a heavy studded wooden door
> standing half open, a worn stone step, and a small carved rosette above the
> arch. Honey-coloured stone with strong shadow in the carving.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **3.0 m wide × 3.6 m tall × 1.6 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 2048 |

## B2 · Stop 2 — `city_mardin_telkari_bench`

Canonical: *silver wire thinner than spaghetti twisted into telkâri — jewelry
that looks like frozen lace.* Reward: 🦋 a silver filigree butterfly.

**This is the one that must not look like Gaziantep's coppersmith.** That bench
is red metal, hammered, big pieces, heavy tools. This one is cold, small and
fine — the difference between a hammer and tweezers.

> A silversmith's low workbench under a small awning: a dark velvet cloth
> covered with tiny finished filigree pieces — butterflies, flowers and stars
> made of twisted silver wire — beside spools of fine silver thread, small
> pliers and tweezers, a jeweller's magnifier on a stand and a tiny burner. Cool
> bright silver against dark cloth and warm wood.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.4 m wide × 2.2 m tall × 1.6 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 2048 — the filigree is the subject and it is fine detail |

The Zeugma mosaic taught this one: fine work at 1024 becomes a smear (D-057).

## B3 · Stop 3 — `city_mardin_minaret_courtyard`

Canonical: *mosques, churches and the Saffron Monastery have stood side by side
for centuries — different bells and calls to prayer sharing the same golden
sky.* Reward: 🕊️ a peace dove.

The point is **side by side**, so both have to be in the one object and neither
can be bigger than the other.

> A small stone courtyard corner where two towers stand together: a slender
> round minaret with a carved balcony, and beside it a square stone bell tower
> with an arched opening and a bell hanging in it. A low stone wall joins them,
> with a small arched gate between and a stone water basin beside it. Honey
> limestone, a white dove sitting on the wall.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.8 m wide × 4.6 m tall × 2.4 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 2048 |

Four point six metres is the tallest stop in the project and it is right at the
limit of what a child can walk up to. It is worth it: two towers of equal height
is the fact, and squashing either one tells a different story.

---

# Part C — sound

`mardin_theme.webm`. Nothing in the project has used the **kanun** or the **oud**
as a lead, and Mardin is where they belong — a slow, open, spacious line rather
than a dance. It should sound like a hot afternoon on a stone terrace, which is
the opposite of Gaziantep's busy bazaar and stops two provinces from the same
region sounding alike.

No ambience bed. The synthesised one was cut after two attempts and filtered
noise reads as water however it is shaped (D-103) — which would be especially
wrong in a city whose subject is dry air.

---

# Notes for whoever integrates this

- **Measure every file before deciding anything.** Bytes, triangles, meshes,
  materials, `alphaMode`, `doubleSided`, world box, base offset, clip names, and
  the SHA-256 into the registry.
- **The south flank will fail the elevation sweep and that is correct.** Every
  direction is held above 8° except the one a city opens onto on purpose; Kars's
  street runs out to its plateau the same way. Mardin's exemption is the whole
  south side, and whoever writes its test should say so in the test rather than
  quietly widening the tolerance.
- **The plain sits below the street.** It is the one horizon piece in the project
  that is grounded *under* y = 0, and the parapet hides the join.
- **The dove is skinned**, so it clones with `SkeletonUtils` and never with
  `Object3D.clone` (D-042), and it scales off its wingspan rather than its
  recorded height. `birdAssetId` is per-city already, so nothing needs changing
  in code to fly it.
- **Never force `doubleSided` off.** Arches, railings and a wing are all thin,
  and culling their back faces draws half of them (D-089).
- **The recorded height draws the model** (D-124), measured off the file so the
  width and depth keep its own aspect, or the collider will not match what is
  drawn.
- **Ask for a screenshot after every deploy.** Uzungöl was built twice before a
  screenshot settled that a lake was the wrong idea entirely.
