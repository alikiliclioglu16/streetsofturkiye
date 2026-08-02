# Meshy Brief — İzmir

**Date:** 2 August 2026
**City:** İzmir (Aegean) · **5 stops, 2 questions** · Guide: Keloğlan

İzmir is open and walkable. Its five stops are graybox and its horizon is empty.
Every model below is a placeholder.

Five stops, so the street is **129 m** rather than the usual 85 — stops sit at
`z = −17`, `−35`, `−53`, `−71`, `−89`, and the play area runs from `z = +26`
behind the spawn to `z = −103` ahead of it. Only İstanbul and Nevşehir are this
long, and it changes two things: the flanks need half as many pieces again, and
the weight budget is tight before anything is drawn.

---

## What is different this time

**İzmir is the first Aegean city.** For the last four provinces the first
problem was that the region table handed them a neighbour's clothes; here there
is no neighbour. Nothing has to be argued out of the way.

The collisions that remain are with cities further off, and there are three:

| | Already in the project | İzmir's answer |
|---|---|---|
| Ancient ruins | **Kars** — Ani, bare red-brown churches on a windswept plateau | **Ephesus** — white marble, columns and a theatre cut into a green hillside |
| Water behind you | **Trabzon** — open sea to the horizon | **a gulf**, with the far shore visible and the city on it |
| | **Balıkesir** — a still lake closed by an island town | |
| Birds | gulls over three cities, doves on plinths in Mardin | **pigeons on the ground**, in a square, where a child can walk into them |

Ani and Ephesus is the one to watch. Both are ruins and both are stops, and the
difference has to be in the stone and the setting: Ani is dark volcanic tufa,
roofless, alone on grass. Ephesus is **bright white marble on a paved street**,
with columns still standing and a hillside of green behind it. If the delivery
comes back grey and lonely it is Ani again.

---

## What the camera can actually see

Derived from `FOLLOW_HEIGHT` 2.3, `FOLLOW_DISTANCE` 5.2 and `CAMERA_FOV` 50, not
invented (D-183). The top of the frame is **thirteen degrees above horizontal**
and the visible ceiling at horizontal distance *D* is `2.3 + D · tan 13°`.

| Direction | Seen from | Distance | Ceiling |
|---|---|---|---|
| Ephesus at `z = −136` | spawn | 141 m | **34.9 m** |
| | stop 5 | 52 m | 14.3 m |
| The gulf's far shore at `z = +150` | spawn, turned round | 155 m | 38.1 m |
| The Kordon edge at `z = +30` | spawn, turned round | 35 m | **10.4 m** |
| Flanks at `x = ±32` | mid-street | 32 m | **9.7 m** |

Two things follow, and both are in the sizes below:

- **The clock tower cannot be a stop at full height.** The real one is 25 m; at
  the ceiling over a stop that is impossible, so the tower goes on the horizon
  and the stop is its base — the same split Hagia Sophia, Sümela, Kaz Dağları
  and the Çifte Minareli Medrese all needed (D-066).
- **The Kordon railing must stay low.** It is the only thing between a child and
  the gulf, and anything above about a metre and a half deletes the water — the
  lesson Mardin's parapet cost a whole afternoon to learn.

---

## The whole list

**Part A first.** A street with placeholder stops and a real horizon reads as a
place under construction; real stops and no horizon reads as a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| A1 | `city_izmir_konak_facades` | west flank, six of them | 30 × 13 × 16 m | 1024 |
| A2 | `city_izmir_kordon_edge` | east flank, palms and railing | 26 × 9 × 8 m | 1024 |
| A3 | `city_izmir_ephesus` | ahead, the ruins and the theatre hill | 90 × 30 × 40 m | 2048 |
| A4 | `city_izmir_gulf_shore` | the far side of the bay | 200 × 12 × 40 m | 1024 |
| A5 | `city_izmir_clock_tower` | the symbol, on the horizon | 7 × 22 × 7 m | 2048 |
| A6 | `kit_izmir_pigeon` | **three poses**, static | 0.32 m tall | 1024 |
| A7 | ~~windsurfer~~ | **already drawn** — the one set aside from Balıkesir | — | — |
| B1 | `city_izmir_celsus_facade` | stop 1 | 4.4 × 5.0 × 1.4 m | 2048 |
| B2 | `city_izmir_theatre_seats` | stop 2 | 4.0 × 2.4 × 3.2 m | 2048 |
| B3 | `city_izmir_clock_tower_base` | stop 3 | 3.2 × 4.2 × 3.2 m | 2048 |
| B4 | `city_izmir_nazar_tree` | stop 4 | 3.4 × 3.8 × 3.2 m | 2048 |
| B5 | `city_izmir_boyoz_cart` | stop 5 | 2.6 × 2.4 × 1.8 m | 2048 |

**Eleven files**, and one already exists.

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command. Every file is measured before anything is
decided about it, and nothing is taken from the file name (D-078).

---

## The weight budget — read this one before drawing

Five stops is the problem. Mardin lands at 18 MB a visit with three, Balıkesir at
19 and Erzurum at 19.7; the 20 MB line is twenty seconds on 4G before anything
moves (D-166). İzmir has two more stops than any of them and stops are the
expensive assets, because they are the ones that need 2048.

| | Target transfer |
|---|---|
| `city_izmir_konak_facades` | 1.0 MB |
| `city_izmir_kordon_edge` | 0.8 MB |
| `city_izmir_ephesus` | 2.2 MB |
| `city_izmir_gulf_shore` | 0.9 MB |
| `city_izmir_clock_tower` | 1.0 MB |
| `kit_izmir_pigeon` × 3 | 0.9 MB |
| windsurfer (already drawn) | 1.3 MB |
| five stops, ~1.7 MB each | 8.5 MB |
| theme | ~1.3 MB |
| guide (cached after the first city) | 0.95 MB |
| **per visit** | **~18.9 MB** |

That is at the line with everything held down, so **two of the five stops should
come back at 1024 rather than 2048** and the choice is about what a child looks
at closely. The boyoz cart and the theatre seats are broad shapes with little
fine detail; the Celsus facade, the clock tower base and the nazar beads are all
carving, moulding or small glass and need the resolution — the Zeugma mosaic
proved that fine work at 1024 becomes a smear (D-057).

---

# Part A — the horizon

## A1 · Konak facades — `city_izmir_konak_facades`

The west flank, six of them down a 129 m street. İzmir's centre is
Levantine — nineteenth-century, plastered and shuttered, not Ottoman timber and
not the stone of the east.

> A row of three- and four-storey nineteenth-century town buildings in pale
> cream and dusty ochre plaster, with tall shuttered windows, small iron
> balconies with curled railings, and a shaded arcade of round arches at street
> level. Awnings over the shopfronts, a few potted plants on the balconies.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **30 m wide × 13 m tall × 16 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 (seen at 30–40 m, never closer) |

## A2 · Kordon edge — `city_izmir_kordon_edge`

The east flank, and the one that must **not** close the view. The Kordon is a
promenade along the water; on that side there is a line of palms, a low railing,
and then the gulf.

> A seafront promenade edge: a row of tall date palms with clean trunks and
> spreading crowns, a low white-painted iron railing along the water's edge,
> pale paving with a decorative band, a wooden bench and a lamp post. Grass and
> low shrubs between the palms.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **26 m wide × 9 m tall × 8 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 1024 |

**The height is the palms, not a wall.** The railing itself belongs at about
1.1 m and the crowns at 8–9. A child has to be able to see the gulf between the
trunks — that is what a promenade is.

## A3 · Ephesus — `city_izmir_ephesus`

Ahead, near edge aligned at `z = −136`, **not centred on it** (D-101). One wide
piece; three copies of Sümela's crag read as three copies of one file.

**This is where the city is either Ephesus or Ani.** White marble, standing
columns, and green on the hill behind — not weathered grey ruins on bare ground.

> An ancient Greek and Roman city in white and honey marble on a green hillside:
> a long paved street lined with standing columns, broken walls and column
> stumps among cypresses and olive trees, and a huge semicircular theatre cut
> into the hill behind, its curved stone rows clearly stepped. Dry grass and
> wildflowers between the stones, a few tall pines.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **90 m wide × 30 m tall × 40 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 2048 — the only thing at the end of a very long street |

## A4 · Gulf shore — `city_izmir_gulf_shore`

The far side of the bay, behind the spawn. **This is what stops İzmir being
Trabzon**: Trabzon's sea runs to the horizon and answers its direction with
emptiness, and this one is closed by land you can see the buildings on.

> The far shore of a wide bay seen across the water: a long low line of pale
> city buildings along the waterfront, dry brown-green hills rising gently
> behind them, a few tall blocks and a minaret breaking the line. Hazy with
> distance, everything pale and slightly blue.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **200 m wide × 12 m tall × 40 m deep** |
| Triangles | 4,000–8,000 |
| Base colour | 1024 |

The water itself is a plane drawn in code and needs no model.

## A5 · Clock tower — `city_izmir_clock_tower`

The symbol, and it stands on the horizon rather than in the street for the
reason in the camera table: 25 m of tower cannot be a stop.

> An ornate white marble clock tower in Ottoman-Moorish style: a tall slender
> shaft on a wide stepped base with four small horseshoe-arched fountains around
> it, bands of carved stone up the shaft, a clock face near the top under a
> small domed cap with a finial.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **7 m wide × 22 m tall × 7 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 2048 |

## A6 · Pigeons — `kit_izmir_pigeon`

Canonical makes the birds part of stop three: hold out seeds and one might land
on your arm. So these are **on the ground in the square**, not in the sky.

**Three poses, delivered as three files.** This is the one place the project has
been caught twice: three geese at one height in different poses could not be
scaled together (D-129), and a single pelican repeated five times on Manyas read
as five copies of one bird. A flock is several animals each doing something
slightly different, and one pose repeated is a wallpaper.

Unrigged is fine — they are dressing and they stand still.

> A city pigeon: grey body with an iridescent green-purple neck, darker wing
> bars, orange feet and a small red-orange eye. **Three separate files** — one
> standing upright, one head down pecking at the ground, one with wings half
> raised about to take off.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **0.32 m tall** for the standing one; the others measured to match |
| Triangles | 3,000–6,000 each |
| Base colour | 1024 |

## A7 · Windsurfer — already drawn

The one delivered for Balıkesir and set aside when that city's water turned out
to be a lake with no room for it. The Gulf of İzmir is exactly where it belongs.
1.13 × 1.8 × 3.45 m, 1.30 MB, in budget and at human size already.

**They stay human size.** At forty metres a person is about two and a half
degrees tall; if that reads as too small the answer is more of them, not bigger
ones.

---

# Part B — the stops

All five are **child-scale, one to five metres**. Ephesus is 30 m at the end of
the street and the clock tower is 22 m behind it; stops one, two and three are
the walk-up halves of those same things.

Stops present and hand over a collectible. They do not ask questions — the
questions live only in the quiz gate (D-023).

## B1 · Stop 1 — `city_izmir_celsus_facade`

Canonical: *the two-storey Celsus Library, which once held 12,000 scrolls.*
Reward: 📜 an ancient scroll.

The real facade is 16 m. This is the **central bay of it** at a size a child can
stand in — two columns, the doorway between them, and one statue niche above.

> A section of a Roman marble library facade: two fluted columns on moulded
> bases carrying a carved entablature, a tall arched doorway between them, and a
> statue niche above with a draped figure in it. Warm white marble, crisp carved
> detail, a worn marble step at the bottom.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **4.4 m wide × 5.0 m tall × 1.4 m deep** |
| Triangles | 7,000–11,000 |
| Base colour | 2048 |

## B2 · Stop 2 — `city_izmir_theatre_seats`

Canonical: *24,000 people on its curved rows... a whisper on the stage can be
heard at the very top.* Reward: 🎭 a theatre mask.

The theatre is in the hillside behind Ephesus. The stop is the part a child can
sit on: three or four curved rows of marble seating with the stage edge in front.

> Three curved tiers of worn marble theatre seating with the steps between them,
> the front row wider and moulded, and a section of the low stone stage wall in
> front. Grass growing in the joints, one fallen carved block, a bronze theatre
> mask resting on a seat.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **4.0 m wide × 2.4 m tall × 3.2 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 1024 is acceptable here — broad shapes, no fine carving |

## B3 · Stop 3 — `city_izmir_clock_tower_base`

Canonical: *this elegant white marble tower from 1901 is the symbol of İzmir.
The square is full of friendly pigeons.* Reward: 🕊️ a pigeon feather.

The tower is on the horizon. This is its **base**: the stepped platform and one
of the four little fountains, where the pigeons are.

> The lower stage of an ornate white marble clock tower: a wide stepped
> octagonal platform, a small horseshoe-arched fountain niche in the shaft with
> a carved basin and a brass tap, and bands of fine relief carving. Scattered
> grain on the paving and two or three pigeons on the steps.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **3.2 m wide × 4.2 m tall × 3.2 m deep** |
| Triangles | 7,000–11,000 |
| Base colour | 2048 |

## B4 · Stop 4 — `city_izmir_nazar_tree`

Canonical: *glass masters melt glass over a fire and shape the blue evil eye
beads. They even hang on trees!* Reward: 🧿 an evil eye bead.

The tree hung with beads is the image everyone knows, and it should be the
object. The furnace behind it says where they come from.

> A small bare tree with hundreds of blue and white glass evil-eye beads hanging
> from every branch on short threads, catching the light. Beside it a low stone
> glass-blower's furnace with an orange glow in its mouth, a long blowing iron
> resting across it, and a wooden tray of finished beads.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **3.4 m wide × 3.8 m tall × 3.2 m deep** |
| Triangles | 7,000–11,000 |
| Base colour | 2048 — the beads are small, round and the whole point |

## B5 · Stop 5 — `city_izmir_boyoz_cart`

Canonical: *boyoz — a flaky, swirly pastry — best eaten by the sea on the
Kordon.* Reward: 🥐 a warm boyoz.

Fifth and last, and it stands on the seafront, so it can be a cart rather than a
shop.

> A street pastry seller's glass-sided cart on wheels: trays of flaky spiral
> pastries stacked inside, a few hard-boiled eggs in a bowl on top, a paper
> napkin dispenser, and a small striped awning. Painted timber and brass, worn
> at the corners.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.6 m wide × 2.4 m tall × 1.8 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 1024 is acceptable here |

---

# Part C — sound

`izmir_theme.webm`. **Zeybek again would be a mistake** — Balıkesir already has
it and the two provinces are neighbours. İzmir's own sound is lighter: a
mandolin or an oud over a walking bass, the Levantine café music of the Kordon,
warm and unhurried. It should sound like a city by the sea in the evening.

No ambience bed. The synthesised one was cut after two attempts and filtered
noise reads as water however it is shaped (D-103) — and this city has real water
in it, which would make the clash worse.

---

# Notes for whoever integrates this

- **Measure every file before deciding anything.** Bytes, triangles, meshes,
  materials, `alphaMode`, `doubleSided`, world box, base offset, clip names, and
  the SHA-256 into the registry.
- **The gulf is the fourth water plane.** İstanbul, Trabzon and Balıkesir have
  the others. It should be still like the last two — a plane that size rising
  and falling as one slab reads as a lid lifting.
- **Never force `doubleSided` off.** Palm fronds, railings, columns and a sail
  are all thin, and culling their back faces draws half of them (D-089).
- **The recorded height draws the model** (D-124), measured off the file so the
  width and depth keep its own aspect.
- **Sweep the circle** before judging any direction empty (D-149 / D-174), and
  watch the quadrant labels — `atan2(x, z)` puts +x at 90°, and getting that
  backwards made a sweep read left for right once already.
- **The guide.** Canonical gives İzmir to Keloğlan, which would make it seven
  cities to Nasreddin Hodja's four. Kars is already overridden the other way
  (D-132), so the mechanism exists if this should be his instead.
- **Ask for a screenshot after every deploy.** Uzungöl was built twice before a
  screenshot settled that a lake was the wrong idea entirely, and a wolf spent a
  deploy hanging in the sky because it was placed before the mountain under it
  was moved.
