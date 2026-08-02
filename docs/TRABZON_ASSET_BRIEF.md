# Meshy Brief — Trabzon

**Date:** 2 August 2026
**City:** Trabzon (Black Sea) · **3 stops, 1 question** · Guide: Nasreddin Hodja

Trabzon is open and walkable. Its stops are graybox, its palette is set, and its
horizon is empty — there is currently nothing in any of the four directions.
Every model below is a placeholder.

The street is 28 m, the same shape as the last four cities. Stops sit at
`z = −17`, `−31`, `−45`. The play area runs from `z = +26` behind the spawn to
`z = −59` ahead of it.

---

## The street runs inland, away from the sea

This is the decision everything else hangs off, and it is the opposite of Ordu's.

A child spawns on the harbour with **the Black Sea behind them** and walks
**up the valley**, and the thing waiting at the far end is the **Sümela cliff**.
The sea is what you turn round to; the cliff is the distance in front. Ordu
walks the other way, toward its coast, with its hill on the flank.

---

## Trabzon is the third city out of one region table

Ordu and Bolu already share the Black Sea row, and the brief for Bolu said the
one thing that could make the country feel repetitive is two provinces drawn
alike. Trabzon is the third, so the bar is higher, not lower.

| | Ordu | Bolu | Trabzon |
|---|---|---|---|
| Where | coast, high summer | deep inland, October | coast, under cloud |
| Ground | cobbles | forest floor | cobbles, wet and dark |
| Sides | hazelnut groves, timber houses | forest stands, firs | **tea terraces cut into a slope** |
| Ahead | the sea | the far shore of Yedigöller | **a sheer cliff wall** |
| Behind | Boztepe, green to the summit | Kartalkaya, snow on it | **the harbour and the sea** |
| Moving | cable car, paragliders | chairlift | **hamsi boats working the shore** |
| Palette | strong green, bright sky | amber under thin cold blue | **deep cool green under haze** |

Four provinces now have a mountain and no two are the same colour: Boztepe is
green to the summit, Kartalkaya has snow on it, Sarıkamış is bare rock, Erek is
scree. **Sümela is the fifth and it is the only vertical one.** That silhouette
is what identifies Trabzon from the spawn point, before a child reads a word.

If a model here could plausibly be dropped into Ordu, it is wrong.

---

## What the camera can actually see

Derived from `FOLLOW_HEIGHT` 2.3, `FOLLOW_DISTANCE` 5.2 and `CAMERA_FOV` 50, not
invented (D-183). The camera tilts down twelve degrees with a fifty degree
field, so the top of the frame is **thirteen degrees above horizontal** and the
visible ceiling at horizontal distance *D* is `2.3 + D · tan 13°`.

For the cliff at `z = −90`:

| Seen from | Distance | Ceiling |
|---|---|---|
| Spawn | 95 m | **24.3 m** |
| Stop 1 | 78 m | 20.4 m |
| Stop 3 | 50 m | **13.9 m** |

So a 24 m wall reads whole from the harbour and has its top cropped as the child
walks up to it, which is what makes it feel tall. **But the monastery on its
face must stay under 13 m**, or it vanishes at exactly the moment the child is
closest to it. It is briefed to sit at 8 m with a 4 m body — topping out at 12 m,
inside the ceiling for the whole walk.

Turning round at the spawn, the ceiling over the harbour at `z = +30` is
**10.4 m**. Nothing on the quay goes above ten metres.

---

## The whole list, in the order I would draw it

**Part A first.** A street with placeholder stops and a real horizon reads as a
place under construction; real stops and no horizon reads as a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| 1 | `city_trabzon_tea_slope` | the sides, three a side | 26 × 13 × 12 m | 1024 |
| 2 | `city_trabzon_sumela_cliff` | the wall ahead | 70 × 24 × 18 m | 1024 |
| 3 | `city_trabzon_sumela_monastery` | mounted on the wall at y = 8 | 9 × 4 × 4 m | 2048 |
| 4 | `city_trabzon_harbour` | behind, carries its own water | 60 × 7 × 26 m | 1024 |
| 5 | `kit_trabzon_fishing_boat` | the moving thing | 7 × 3.4 × 2.6 m | 1024 |
| 6 | `city_trabzon_sumela_fresco_door` | stop 1 | 3.2 × 4.2 × 1.6 m | 2048 |
| 7 | `city_trabzon_kemence_stand` | stop 2 | 2.4 × 2.6 × 2.0 m | 2048 |
| 8 | `city_trabzon_hamsi_stall` | stop 3 | 2.6 × 2.4 × 2.2 m | 2048 |

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command. Every file is measured before anything is
decided about it, and nothing is taken from the file name (D-078).

---

## The weight budget, before anything is drawn

Per-visit downloads already run 11–20 MB and the newer cities are the heavy ones.
A city built the way the last three were lands near 20 MB, and on 4G that is
twenty seconds before anything moves (D-166). So this is a budget to design to,
not a number to trim down to afterwards.

| | Target transfer |
|---|---|
| `city_trabzon_tea_slope` | 2.0 MB |
| `city_trabzon_sumela_cliff` | 3.0 MB |
| `city_trabzon_sumela_monastery` | 1.2 MB |
| `city_trabzon_harbour` | 2.2 MB |
| `kit_trabzon_fishing_boat` | 0.8 MB |
| three stops, ~1.6 MB each | 4.8 MB |
| theme | ~0.6 MB |
| guide (cached after the first city) | 0.95 MB |
| **per visit** | **~15.6 MB** |

These are transfer bytes *after* `optimize-textures.mjs`, not what Meshy hands
over. A Meshy delivery of this kind arrives at 20–40 MB and comes down by a
factor of thirty with no visible loss, so do not try to hit these in the
generator.

---

# Part A — the horizon

## A1 · Tea slope — `city_trabzon_tea_slope`

The sides, three a side at `x = ±31`. Tea is the one thing that could not be
mistaken for Ordu's hazelnut or Bolu's forest, and it grows on slopes steep
enough to close the sky, which is what the sides are for.

> A steep green hillside with tea terraces cut into it in narrow stepped rows,
> each row a low hedge of bright glossy tea bushes following the contour. Bare
> earth risers between the steps, a thin footpath zigzagging up, one or two
> small stone retaining walls, wisps of low cloud caught against the upper
> slope.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **26 m wide × 13 m tall × 12 m deep** |
| Triangles | 7,000–12,000 |
| Base colour | 1024 (seen at 30–45 m, never closer) |

## A2 · Sümela cliff — `city_trabzon_sumela_cliff`

The wall ahead. Near edge aligned at `z = −90`, **not centred on it** — a plate
centred on the boundary swallowed the spawn in Nevşehir (D-101).

Vertical is the whole point. Every other horizon in the project is a rounded
mass; this one is a face.

> A sheer vertical cliff face of pale grey limestone, hundreds of metres of flat
> rock rising straight up, seamed with dark vertical cracks and narrow ledges.
> Dark green pine forest crowding the base and a few stubborn pines rooted in
> the ledges. Torn low cloud drifting across the middle of the face. Damp rock,
> cool grey-green cast.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **70 m wide × 24 m tall × 18 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 |

**A shallow ledge at 8 m** is wanted about a third of the way in from the left,
wide enough to seat the monastery. If it does not survive the export it is
faked at integration by mounting the monastery in a raised group — `AssetInstance`
grounds a model relative to its group's own origin, which is exactly the case
D-185 was fixed for.

## A3 · Sümela monastery — `city_trabzon_sumela_monastery`

The building on the face. A separate file, so it can be scaled and placed
against the ceiling number rather than baked into a 24 m rock at whatever size
the generator felt like.

> A small Byzantine monastery clinging to a cliff ledge: pale stone walls
> several storeys tall, stacked wooden balconies with red-tiled roofs jutting
> out over the drop, small arched windows in rows, one domed chapel built back
> into the rock. Weathered stone, warm terracotta roofs against grey rock.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **9 m wide × 4 m tall × 4 m deep** |
| Mounted at | y = 8 m on the cliff face, top at 12 m |
| Triangles | 6,000–10,000 |
| Base colour | 2048 — it is the thing a child looks at from every point on the street |

## A4 · Harbour — `city_trabzon_harbour`

Behind the spawn, near edge at `z = +30`. This is the thing a child turns round
to, and it is also the only sea in the city.

Water is carried **inside the model**, the way every city's water is except
İstanbul's, and the shoreline is one constant everything else is measured off
(D-154 / D-163). Nothing on it goes above ten metres.

> A small Black Sea fishing harbour: a curved stone breakwater enclosing calm
> dark blue-green water, a low concrete quay with iron bollards and stacked
> crates, coils of rope and piles of blue fishing net. Two or three small
> wooden fishing boats moored against the quay. Open sea beyond the breakwater
> under a hazy horizon.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **60 m wide × 7 m tall × 26 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 |

## A5 · Hamsi boat — `kit_trabzon_fishing_boat`

The moving thing. It works the shore behind the harbour and turns at each end —
which is the tram's motion, not the ferry's and not the train's. The train
crosses and leaves; this one comes back (D-136).

Three of them, offset along the shore so they are never in step.

> A small wooden Black Sea fishing boat, high curved prow, painted bright blue
> and white with a red stripe along the hull, a low open wheelhouse, and a net
> winch at the stern with folded blue netting piled beside it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **7 m long × 3.4 m tall × 2.6 m wide** |
| Triangles | 3,000–5,000 |
| Base colour | 1024 |

**No animation clip is wanted.** The application moves things through the world;
clips only move limbs, and a root-animated boat applied on top of a route makes
it skate.

---

# Part B — the stops

All three are **child-scale, one to five metres** — something to walk up to, not
scenery. Hagia Sophia was built as a stop and had to be moved to the horizon
(D-066), and that is precisely why the big Sümela is in Part A and the stop
below is a doorway.

Stops present and hand over a collectible. They do not ask questions — the
question lives only in the quiz gate (D-023).

## B1 · Stop 1 — `city_trabzon_sumela_fresco_door`

Canonical: *Sümela clings to a sheer cliff face 300 meters above the forest.*
Reward: 🧗 a cliff-monastery photo.

The child cannot climb 300 m, and the cliff is already on the horizon. So the
stop is the thing you would actually stand in front of if you got there.

> A rock-cut chapel doorway in a cliff wall: a low arched stone entrance with
> worn steps, the rock around and above it painted with bright Byzantine
> frescoes — deep blue, gold and red figures and haloes, faded and chipped in
> places. A small iron lamp bracket beside the arch.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **3.2 m wide × 4.2 m tall × 1.6 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

## B2 · Stop 2 — `city_trabzon_kemence_stand`

Canonical: *When the little kemençe fiddle starts to sing, everyone joins hands
for the horon.* Reward: 💃 a horon dance ribbon.

The dance itself is not modelled — the guides' dance and gestures were both
retired (D-113 / D-168) and this is not the place to bring them back.

> A small wooden village bandstand: a low round timber platform with a carved
> railing, a three-stringed kemençe fiddle and its bow resting on a stool, a
> hand drum leaning against the rail, and bright red and white ribbons strung
> between the posts.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.4 m wide × 2.6 m tall × 2.0 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

## B3 · Stop 3 — `city_trabzon_hamsi_stall`

Canonical: *Trabzon loves hamsi a hundred ways — and kuymak stretches longer
than your arm.* Reward: 🐟 a lucky hamsi.

Canonical names the sign — **HAMSİ & KUYMAK** — but nothing in the game renders
text on a model. The sign is a painted fish and a bowl, and the words are the
fact card's job.

> A small seaside food stall under a striped blue and white awning: a tray of
> tiny silver anchovies packed in a fan pattern on crushed ice, a copper pan of
> melted yellow cheese and cornmeal with a wooden spoon lifting a long stretchy
> string of it, stacked bowls, a painted wooden sign with a fish and a bowl on
> it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.6 m wide × 2.4 m tall × 2.2 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

---

# Part C — sound

`trabzon_theme.webm`, and stop 2 says what it should be: **kemençe-led**. The
three-stringed fiddle carries the melody over a fast horon rhythm, and it should
be recognisably the same instrument the child meets halfway up the street.

No ambience bed. The synthesised one was cut after two attempts and filtered
noise reads as water however it is shaped (D-103) — which would be especially
wrong here, where there is a real sea twenty metres behind the child and no
recording of it.

---

# Notes for whoever integrates this

- **Measure every file before deciding anything.** Bytes, triangles, meshes,
  materials, `alphaMode`, `doubleSided`, world box, base offset, clip names, and
  the SHA-256 into the registry.
- **Meshy bakes a black emissive map into every export** and sets
  `emissiveFactor` to [1,1,1] beside it. Measure it — the guard in
  `optimize-textures.mjs` tests the single brightest pixel and scattered bake
  noise defeats it.
- **Never force `doubleSided` off.** The tea terraces and the fishing nets are
  both thin, and culling their back faces draws half of them (D-089).
- **The recorded height draws the model** (D-124). Record the size the object is
  meant to be, measured off the file so the width and depth keep the file's own
  aspect, or the collider will not match what is drawn.
- **Nothing stands where the child walks**, measured against the route polyline
  rather than against x = 0 (D-070).
- **Sweep the circle** before judging any direction empty (D-149 / D-174).
- **Ask for a screenshot after every deploy.** Three assets have been integrated
  wrongly for want of one.
