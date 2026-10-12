# Meshy Brief — Antalya

**Date:** 12 October 2026
**City:** Antalya (Mediterranean) · **3 stops, 1 question** · Guide: Keloğlan

Antalya is open and walkable as of today. **It has no art of its own at all** —
not a stop, not a horizon piece, not a theme. Every other city in the project was
opened with a commissioned horizon already standing, or at least briefed; this
one walks on the shared kit and three coloured boxes.

Three stops, so the street is the short kind: stops at `z = −17`, `−35`, `−53`,
with the play area running from `z = +26` behind the spawn to `z = −67` ahead.
Gaziantep, Mardin and Erzurum are the same shape.

---

## The one number that should decide the order of work

A sweep of the forward view from the last stop, counting every piece and every
procedural tree that is in the scene today:

| Direction | Highest thing in it |
|---|---|
| −20° to +20° (dead ahead) | **nothing** |
| ±30° to ±60° | 0–11° — a cypress at best |
| +70°, +80° (over the sea) | 15°, 8° |

For comparison, the same sweep over İzmir never reads below 9.7° and is usually
above 20°. **Forty degrees of Antalya's forward view is bare ground meeting bare
sky.** That is not a style note: it is the fault the owner has rejected in Bolu
twice and in Nevşehir once (D-192, D-204, D-213), and it is the reason Part A
below is ordered the way it is rather than by importance to the city.

---

## What is different this time

**Antalya is the first Mediterranean city**, so for the second time after İzmir
no region table had to be argued with — the Mediterranean row has been sitting in
`KIT_BY_REGION`, `REGION_ANIMAL`, `REGION_SURFACE` and `REGION_PLANTING` since
the regions were written and is used here for the first time.

The collisions are with cities further off, and there are four:

| | Already in the project | Antalya's answer |
|---|---|---|
| A Roman theatre | **İzmir** — Ephesus, a theatre cut into a green hillside, seen as a ruin from above | **Aspendos** — not a ruin. The stage building is *standing*, two storeys of it, and the seats are swept clean because concerts still happen there |
| Sea beside the street | **İzmir** — the Kordon, water at your feet | **a cliff**, with the water forty metres down |
| | **Trabzon**, **Balıkesir** — water behind the spawn | |
| An orchard | **Gaziantep** pistachio, **Balıkesir** olive, **Ordu** hazelnut | **citrus** — dark glossy leaves and visible fruit, the only one of the four with colour in it |
| Mountains behind | **Erzurum** Palandöken (snow), **Bolu** Kartalkaya (snow), **Kars** Sarıkamış | **Beydağları in summer** — bare grey limestone, no snow, pine only on the lower slopes |

Aspendos and Ephesus is the one to watch. If the Aspendos delivery comes back
roofless, broken-columned and grey, it is Ephesus again — and Ephesus is three
provinces away on the same coast. **The whole point of Aspendos is that it is
intact.**

---

## What the camera can actually see

Derived from `FOLLOW_HEIGHT` 2.3, `FOLLOW_DISTANCE` 5.2 and `CAMERA_FOV` 50, not
invented (D-183). The top of the frame is **thirteen degrees above horizontal**,
so the visible ceiling at horizontal distance *D* is `2.3 + D · tan 13°`.

| Direction | Seen from | Distance | Ceiling |
|---|---|---|---|
| Flanks at `x = ±26` | mid-street | 26 m | **8.3 m** |
| The cliff edge at `x = 35` | mid-street | 35 m | **10.4 m** |
| Beydağları at `z = +60` | the spawn | 60 m | 16.2 m |
| | the third stop | 113 m | 28.4 m |
| Ahead at `z = −90` | the spawn | 90 m | 23.1 m |
| | the third stop | 37 m | **10.8 m** |
| The sea's near edge at `x = 126` | mid-street | 126 m | 31.4 m |

### This kills the obvious design for stop 2

`graybox_selale` is 6 × 10 × 3 m — a sensible shape for a waterfall and the one
the layout has reserved. But a child standing on stop 2's trigger ring is **5.5 m
away**, where the ceiling is **3.6 m**. A ten-metre waterfall at that range
overshoots the frame by six and a half metres: what a child sees is a wall of
white with no top and no bottom.

This is the split four other objects in the project already needed — Hagia
Sophia, Sümela, Kaz Dağları and the Çifte Minareli Medrese (D-066). **Düden is
two assets, not one:**

- the falls themselves go on the **horizon**, out on the cliff flank where there
  is 10.4 m of ceiling and the drop can be seen as a drop;
- the **stop** is the viewing platform at the lip — railing, wet rock, spray —
  and it is 2.6 m tall, which fits.

That also puts it where Düden actually is. Lower Düden does not fall into a pool;
it falls off the travertine shelf straight into the Mediterranean, which is the
single most memorable fact in this city's content and is lost entirely if the
stop is a pond in the middle of a street.

---

## The whole list

**Part A first**, and for once that is not the usual argument about a street
under construction. It is the forty degrees above: this city currently has no
horizon in any direction, and until A1–A4 exist no screenshot of it is worth
taking.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| A1 | `city_antalya_falez_edge` | **east flank — the cliff lip and the drop** | 30 × 9 × 10 m | 1024 |
| A2 | `city_antalya_kaleici_row` | west flank, old-town houses | 26 × 10 × 14 m | 1024 |
| A3 | `city_antalya_beydaglari` | behind the spawn, the Taurus range | 90 × 26 × 40 m | 1024 |
| A4 | `city_antalya_duden_falls` | the falls, on the cliff flank | 16 × 12 × 10 m | 2048 |
| A5 | `city_antalya_yivli_minare` | the city's symbol, on the horizon | 5 × 20 × 5 m | 2048 |
| A6 | `kit_citrus_tree` | street tree, **shared name** | 4.6 × 5.0 × 4.6 m | 1024 |
| B1 | `city_antalya_aspendos` | stop 1 — the theatre, intact | 13 × 4.6 × 13 m | 2048 |
| B2 | `city_antalya_duden_platform` | stop 2 — the viewing lip | 5.0 × 2.6 × 3.0 m | 2048 |
| B3 | `city_antalya_orange_grove` | stop 3 — trees, crates, fruit | 5.0 × 5.0 × 5.0 m | 2048 |

**Nine files.**

`kit_citrus_tree`, not `kit_antalya_citrus`. Citrus is grown all down this coast
— Mersin, Adana, Hatay — and a shared asset with a province in its name is a
promise the file cannot keep. The project has paid for that rule three times,
most recently a deer that had to be renamed across five files while two cities
were broken (D-194, D-210, D-211). The street trees before it are named for their
provinces because they were drawn before the rule was learned; this one is not.

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command. Every file is measured before anything is
decided about it, and nothing is taken from the file name (D-078).

---

## The weight budget

Three stops, which is the cheap shape. Mardin lands at 18 MB a visit, Balıkesir
at 19, Erzurum at 19.7, and the 20 MB line is twenty seconds on 4G before
anything moves (D-166).

| | Target transfer |
|---|---|
| `city_antalya_falez_edge` | 1.0 MB |
| `city_antalya_kaleici_row` | 1.0 MB |
| `city_antalya_beydaglari` | 1.3 MB |
| `city_antalya_duden_falls` | 1.4 MB |
| `city_antalya_yivli_minare` | 0.8 MB |
| `kit_citrus_tree` | 1.2 MB |
| three stops, ~1.7 MB each | 5.1 MB |
| street kit, cats, gulls (already drawn) | 2.6 MB |
| theme, if one is ever chosen | ~1.3 MB |
| guide (cached after the first city) | 0.95 MB |
| **per visit** | **~16.7 MB** |

Comfortable, and deliberately so: this city has a cliff and a sea in it, and the
first screenshot will almost certainly ask for something that is not on this
list.

---

# Part A — the horizon

## A1 · The cliff edge — `city_antalya_falez_edge`

**Draw this one first.** Antalya's old town stands on a travertine shelf about
forty metres above the water, and the scene already places its sea 8 m below the
street and 126 m out. Right now there is nothing between the two: a child walking
to the right-hand boundary sees paving, then sea, with no edge in between. It is
the only thing in this city that is actively wrong rather than merely missing.

Nine metres against a 10.4 m ceiling at 35 m, so it fills its direction without
roofing it.

> A length of limestone sea-cliff seen from the land side: a flat stony shelf at
> the top with tufts of dry grass and low scrub, breaking at a ragged lip into a
> pale cream and grey rock face that drops away. Streaks of rust and ochre down
> the stone, a few small windblown pines clinging near the edge.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

Six of these run down the east flank at `x = 35`, so the piece must **tile along
its 30 m length** — the left and right ends butt against copies of themselves and
cannot have a finished corner.

## A2 · Kaleiçi houses — `city_antalya_kaleici_row`

The west flank. Antalya's old town is Ottoman timber-frame over stone, which is
nearer Ordu's and Trabzon's houses than to any of the stone cities — the
difference is the climate it is built for: wide eaves, shutters closed against
the sun, bougainvillea, and a courtyard wall at street level with an orange tree
showing over it.

Ten metres against an 8.3 m ceiling at 26 m. That is deliberate overshoot: a
flank should be cropped by the frame rather than sitting inside it, which is what
closes a direction (D-149).

> A row of two- and three-storey Ottoman old-town houses: whitewashed stone
> ground floors, projecting timber-framed upper floors with dark red tiled roofs
> and wide eaves, wooden shutters and small balconies. A continuous garden wall
> at street level with an arched wooden door, bougainvillea spilling over it in
> magenta, and the top of an orange tree showing above.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

Tiles along its 26 m length, same as A1.

## A3 · The Beydağları — `city_antalya_beydaglari`

Behind the spawn, where there is 16.2 m of ceiling from the square and 28.4 m
from the far end of the street. Twenty-six metres tall, so it is cropped from the
square and whole from the third stop — a child who turns round at the end of the
walk gets the view.

**Summer, and this is the whole brief.** Three mountains already exist in this
project and all three are under snow. The Taurus above Antalya in summer is bare
grey-white limestone, almost treeless on the upper slopes, with dark pine only in
the folds at the bottom. It should not be possible to mistake this for
Palandöken.

> A long range of bare limestone mountains in summer: pale grey and warm fawn
> rock with no snow, sharp ridgelines, deep shadowed gullies, and dark green
> pine only on the lowest slopes where they meet a hazy plain.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

## A4 · Düden Falls — `city_antalya_duden_falls`

The falls themselves, out on the cliff flank beyond A1. This is the piece that
carries the stop's subject; the stop itself (B2) is only the place you stand.

Twelve metres, seen across the drop. Its job is to show water **leaving the land
and not arriving anywhere** — the fall into the sea is the fact, and a plunge
pool at the bottom contradicts it.

> A wide waterfall pouring over a limestone cliff edge: a broad curtain of white
> water breaking into spray and mist partway down, wet dark rock and green moss
> and ferns at the lip, with the fall continuing past the bottom of the model
> rather than landing in a pool.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

## A5 · Yivli Minare — `city_antalya_yivli_minare`

The city's symbol, and the only thing in this brief that says *Antalya* rather
than *the Mediterranean coast*. A brick minaret with eight deep flutes, on the
skyline behind the Kaleiçi roofs.

Twenty metres is far above the flank ceiling on purpose: it is the one vertical
in a city that is otherwise all horizontals, and it should be visible over the
houses from most of the street.

> A tall slender Seljuk brick minaret with eight deep vertical flutes running up
> its shaft, dark red-brown brick with bands of turquoise glazed tile, a small
> balcony with a stone railing near the top, and a short conical cap.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

## A6 · Citrus tree — `kit_citrus_tree`

The street tree. Antalya currently plants the procedural cypress-and-plane mix,
which is honest low-poly and reads as such once there is delivered stone behind
it — the same point at which the five cities before it were given real trees.

Five metres, which is where every orchard tree in this project has landed:
hazelnut 4.5, pistachio 5.0, olive 5.5.

> A mature orange tree: dark glossy green foliage in a rounded crown, a short
> grey-brown trunk, and a scatter of ripe oranges visible among the leaves, some
> fallen at the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

---

# Part B — the stops

Each one is measured at the stop camera, which stands on the trigger ring. The
ceilings are tight: **4.8 m** at stop 1, **3.6 m** at stop 2, **3.5 m** at stop 3.
Nothing in this part may be tall.

## B1 · Aspendos — `city_antalya_aspendos`

Stop 1, and the largest stop object in the city: 13 m across against a 4.8 m
ceiling, so it is wide and low — a child sees the sweep of it rather than the
height.

The canonical line is that a whisper on stage reaches the top row. That is an
*acoustic* fact and cannot be drawn, so what has to be drawn is the thing that
makes it true: a tight semicircular bowl of seats facing a tall flat stage wall
that closes the circle. **The stage building must be standing and roofed.** Every
other Roman ruin in this project is broken; this one is the best-preserved
theatre of the ancient world and that is why it is the stop.

> A Roman theatre seen from the side: a semicircular bowl of pale honey-coloured
> stone seating in tiers, facing a tall flat two-storey stage wall with rows of
> small arched niches and columns, intact and roofed. Warm weathered limestone,
> clean swept steps, a few cypresses behind.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

Intact, swept, in use — not a ruin.

## B2 · The Düden viewing platform — `city_antalya_duden_platform`

Stop 2. Low — 2.6 m against a 3.6 m ceiling — because the waterfall it looks at
is A4, out on the cliff.

> A small stone viewing terrace at the top of a waterfall: worn wet flagstones, a
> low iron railing with a simple curled pattern, dark glistening rock and bright
> green moss and ferns at the edge, a fine haze of spray drifting over it.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

The reward for this stop is *a rainbow in the spray*. The collection screen shows
rewards as emoji and text (D-143), so nothing has to be modelled for it — but a
faint arc in the mist, if it comes for free, is the one place in this project
where the art and the reward would say the same thing.

## B3 · Orange grove — `city_antalya_orange_grove`

Stop 3. Five metres against a 3.5 m ceiling, so slightly cropped, which is right
for a tree a child walks up to.

Not a single tree — that is A6, and a stop that is one copy of a street tree
reads as a mistake. This is a corner of a working orchard: two or three trees
close together, fruit crates, a ladder, fallen oranges.

> A corner of an orange orchard: two or three laden orange trees close together
> with dark glossy leaves and bright ripe fruit, a wooden picking ladder leaning
> against one, stacked wooden crates of oranges at the base, and windfall fruit
> in the dry grass.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

---

## What is already drawn

Nothing of Antalya's. What the city borrows from the shared kit, all of it
already paid for by other provinces:

- `kit_planter_cypress` — the stand-in flanks and the line behind the square
- `kit_gull` — five circles over the cliff, placed by the 13° rule
- `kit_street_cat_static` / `kit_street_cat_walking` — the Mediterranean row
  gives this coast cats, and Antalya is the fourth city to use them
- the street kit: lamp, bench, market stall, crates, wall fountain, flag

## What this city still has no answer for

- **A theme.** Twelve cities have one and no two share it (D-119). Antalya is
  silent, which is allowed for an open city — Kars and Gaziantep both walked
  silent for weeks — but it is the last thing that makes a city feel finished.
- **The cliff on the ground, not just in the backdrop.** A1 is a scenery piece
  and scenery is never solid. The play boundary at `x = 15` already stops a child
  twenty metres short of the edge, so nothing can be walked off — but if the
  cliff is ever meant to be approachable, that is a collider question and a
  different conversation.
