# Meshy Brief — Erzurum

**Date:** 2 August 2026
**City:** Erzurum (Eastern Anatolia) · **3 stops, 1 question** · Guide: Keloğlan

Erzurum is open and walkable. Its stops are graybox and its horizon is empty.
Every model below is a placeholder.

The street is 28 m, the same shape as the last seven cities. Stops sit at
`z = −17`, `−31`, `−45`. The play area runs from `z = +26` behind the spawn to
`z = −59` ahead of it.

---

## The problem to solve first

Erzurum is the **third** city out of the Eastern Anatolia table, and the table
has run out of ideas. It arrives wearing Kars's kit, Kars's geese, Van's steppe
surface, and the same sky and ground colour as both of them down to the hex.

Two provinces sharing a look is a risk. Three is a region that reads as one
place with three names.

**The answer is winter.** Canonical says snow falls on Palandöken from November
to May, and Erzurum is the coldest city of any size in the country. So this is
the first city in the project **drawn in winter** — snow underfoot, snow on the
roofs, a low hard light and a sky with the colour washed out of it. Nothing else
in eighty-one provinces will look like it, and it costs one ground texture.

| | Kars | Van | Erzurum |
|---|---|---|---|
| Season | late summer | late summer | **deep winter** |
| Ground | bare rock | steppe grass | **trodden snow** |
| Ahead | Sarıkamış, bare rock | Erek, scree | **Palandöken, white with pistes** |
| Behind | the Ani gorge | the lake and Akdamar | **twin turquoise minarets** |
| Sides | Ani's ruins | Van's townhouses | **black basalt houses under snow** |
| Moving | the Eastern Express | canoes | **skiers coming down** |
| Craft | gravyer cheese | breakfast | **jet-black Oltu stone** |

Nine provinces now have something tall and no two are the same. Palandöken is
the tenth and the first that is **white from top to bottom** — Kartalkaya has
snow *on* it and is a distant peak; this one fills the end of the street.

If a model here could plausibly be dropped into Kars or Van, it is wrong.

---

## What the camera can actually see

Derived from `FOLLOW_HEIGHT` 2.3, `FOLLOW_DISTANCE` 5.2 and `CAMERA_FOV` 50, not
invented (D-183). The top of the frame is **thirteen degrees above horizontal**
and the visible ceiling at horizontal distance *D* is `2.3 + D · tan 13°`.

| Direction | Seen from | Distance | Ceiling |
|---|---|---|---|
| Palandöken at `z = −92` | spawn | 97 m | **24.7 m** |
| | stop 3 | 52 m | 14.3 m |
| Medrese at `z = +58` | spawn, turned round | 63 m | **16.8 m** |
| Stone houses at `x = ±32` | mid-street | 32 m | 9.7 m |

One number decides a whole model:

**The minarets cannot be taller than about sixteen metres.** They are the city's
symbol and the thing a child turns round to, and a minaret with its finial out
of frame is a chimney. Palandöken can be cropped — a mountain losing its summit
reads as tall — but this cannot, so the medrese is briefed at 16 m and stood
back to 58 m to buy the ceiling for it.

---

## The whole list, in the order I would draw it

**Part A first.** A street with placeholder stops and a real horizon reads as a
place under construction; real stops and no horizon reads as a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| A1 | `city_erzurum_stone_houses` | both sides, four each | 28 × 13 × 16 m | 1024 |
| A2 | `city_erzurum_palandoken` | the mountain ahead | 78 × 32 × 40 m | 2048 |
| A3 | `city_erzurum_cifte_minareli` | behind, the city's symbol | 30 × 16 × 20 m | 2048 |
| A4 | `kit_erzurum_skier` | the moving thing | 0.9 × 1.7 × 1.9 m | 1024 |
| A5 | `kit_erzurum_snow_drift` | scatter along the street | 2.4 × 0.35 × 2.0 m | 1024 |
| B1 | `city_erzurum_lace_portal` | stop 1 | 3.2 × 4.0 × 1.2 m | 2048 |
| B2 | `city_erzurum_ski_gear` | stop 2 | 2.2 × 2.6 × 1.6 m | 2048 |
| B3 | `city_erzurum_oltu_workbench` | stop 3 | 2.6 × 2.2 × 1.8 m | 2048 |

**Eight files.** Plus one piece of code work that is not a delivery — see the end.

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command. Every file is measured before anything is
decided about it, and nothing is taken from the file name (D-078).

---

## The weight budget, before anything is drawn

Mardin lands at 16.98 MB a visit, Balıkesir at 18.96 and Ordu at the 20 MB line,
which on 4G is twenty seconds before anything moves (D-166).

| | Target transfer |
|---|---|
| `city_erzurum_stone_houses` | 1.0 MB |
| `city_erzurum_palandoken` | 2.3 MB |
| `city_erzurum_cifte_minareli` | 2.3 MB |
| `kit_erzurum_skier` | 0.8 MB |
| `kit_erzurum_snow_drift` | 0.5 MB |
| three stops, ~2.0 MB each | 6.0 MB |
| theme | ~1.3 MB |
| guide (cached after the first city) | 0.95 MB |
| **per visit** | **~15.2 MB** |

These are transfer bytes *after* `optimize-textures.mjs`, not what Meshy hands
over. A delivery of this kind arrives at 20–35 MB and comes down by a factor of
twenty with no visible loss, so do not try to hit these in the generator.

---

# Part A — the horizon

## A1 · Stone houses — `city_erzurum_stone_houses`

Both flanks, four a side. Erzurum builds in dark volcanic stone, and against
snow that is the strongest contrast in the project — everywhere else the
buildings are lighter than the ground.

**Do not make them pretty.** These are thick-walled houses built to survive
−30 °C: small windows, heavy stone, low roofs.

> A row of squat two-storey houses built from dark grey-black volcanic stone,
> with small deep-set windows, heavy timber shutters and thick walls. Flat or
> low-pitched roofs carrying a deep layer of settled snow, icicles along the
> eaves, stone chimneys with snow caps. Snow banked against the walls at street
> level, a shovelled path in front.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **28 m wide × 13 m tall × 16 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 1024 (seen at 30–40 m, never closer) |

## A2 · Palandöken — `city_erzurum_palandoken`

The mountain ahead, near edge aligned at `z = −92`, **not centred on it** — a
plate centred on the boundary swallowed Nevşehir's spawn (D-101).

**One wide piece, not three copies.** Three of Sümela's crag went in side by
side and read as exactly that.

Thirty-two metres against a 24.7 m ceiling from the square, so its summit is out
of frame from the start. That is on purpose: a mountain you cannot see the top
of is the only kind that feels like a mountain.

> A broad snow-covered ski mountain: wide white pistes sweeping down between
> stands of dark green pine, a rounded summit ridge, the thin line of a chairlift
> running up one flank with its pylons. Deep untracked snow on the upper slopes,
> groomed corduroy tracks lower down, rock showing through in one or two places.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **78 m wide × 32 m tall × 40 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 2048 — the only thing at the end of the street |

**The pistes have to be legible from a hundred metres**, because the skiers run
on them. Wide white ribbons against dark pine, not a uniformly white lump.

## A3 · Çifte Minareli Medrese — `city_erzurum_cifte_minareli`

Behind the spawn, near edge at `z = +58`. The thing a child turns round to, and
the one model in this city that **must not be cropped**.

Canonical gives it three details and all three should be findable: two fluted
minarets in turquoise brick, a gate carved like stone lace, and a double-headed
eagle hidden in the pattern. The eagle is the third reward.

> A 13th-century Seljuk madrasa in honey-brown stone: a tall central portal
> deeply carved with interlacing floral and geometric relief, flanked by two
> slender fluted minarets faced in turquoise glazed brick with bands of pattern
> up their length. A low domed roof behind, small arched windows, worn stone
> steps. A deep layer of snow on every ledge and dome, snow banked at the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **30 m wide × 16 m tall × 20 m deep** |
| Triangles | 8,000–12,000 |
| Base colour | 2048 |

**Sixteen metres is a ceiling, not a preference.** See the camera table: at 58 m
back the frame stops at 16.8 m. A taller delivery gets scaled down to fit, and
scaling it down makes everything else about it smaller too.

## A4 · Skier — `kit_erzurum_skier`

The moving thing. Bolu already has a chairlift and Ordu a cable car, so **this
is not another cable**: it is people coming down the mountain, which no city in
the project has.

Four of them will run the pistes and ride back up out of sight.

> A skier in mid-turn, leaning into the slope: bright red jacket, dark trousers,
> helmet and goggles, skis angled across the fall line, poles trailing back.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **0.9 m wide × 1.7 m tall × 1.9 m deep** |
| Triangles | 4,000–8,000 |
| Base colour | 1024 |

**Human size, and no animation clip.** A skier at a hundred metres is about one
degree tall, which is small — if that reads as too small the answer is more of
them, not bigger ones. A boat can be exaggerated because nothing tells a child
how big a boat is; a person cannot. The application moves it; a clip with root
motion applied on top makes it skate, which for once would be literally true and
still wrong.

## A5 · Snow drift — `kit_erzurum_snow_drift`

Scattered down both sides of the walking line, the way Bolu's leaf fall is.
Cheap, and it is what makes the street feel cold rather than merely pale.

> A low bank of shovelled snow with a crisp cut edge and a rounded top, dirty
> and grey at its foot, a few dead grass stems and a stone poking through.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.4 m wide × 0.35 m tall × 2.0 m deep** |
| Triangles | 1,500–4,000 |
| Base colour | 1024 |

---

# Part B — the stops

All three are **child-scale, one to five metres**. The medrese is 16 m behind
the spawn and stop one is a 4 m portal in the middle of the street; those are two
different objects. Hagia Sophia was built as a stop and had to be moved to the
horizon (D-066), and Sümela and Kaz Dağları went the same way.

Stops present and hand over a collectible. They do not ask questions — the
question lives only in the quiz gate (D-023).

## B1 · Stop 1 — `city_erzurum_lace_portal`

Canonical: *two tall fluted minarets rise over a gate carved like stone lace,
with a double-headed eagle hiding in the patterns.* Reward: 🦅 a double-headed
eagle.

The minarets are on the horizon. This is the gate, at the size a child can put
their face against — and **the eagle has to be in the carving**, because it is
what they are being sent to find.

> A tall Seljuk stone portal: a pointed arch inside a rectangular frame, every
> surface covered in deep interlacing relief carving — geometric knots, palmettes
> and vine scrolls. A double-headed eagle carved in relief in the panel above the
> arch, wings spread, clearly readable. Honey-brown stone, deep shadow in the
> carving, a cap of snow along the top of the frame.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **3.2 m wide × 4.0 m tall × 1.2 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 2048 |

## B2 · Stop 2 — `city_erzurum_ski_gear`

Canonical: *Palandöken has some of the longest, snowiest ski runs in Türkiye...
Olympic athletes train here.* Reward: ⛷️ a Palandöken snowball.

**Not a lift station.** Bolu already has one and a chairlift chair, and this is
the province that must not look like Bolu's ski hill. The stop is the gear, not
the machinery.

> A pair of bright skis and two poles stood upright in deep snow beside a
> red-and-white striped piste marker pole, with a wooden bench half buried in
> snow, a pair of goggles and gloves left on it, and a small stack of trail signs.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.2 m wide × 2.6 m tall × 1.6 m deep** |
| Triangles | 5,000–9,000 |
| Base colour | 2048 |

## B3 · Stop 3 — `city_erzurum_oltu_workbench`

Canonical: *jet-black Oltu stone is polished into shiny beads... rub it and it
can pull little paper bits like a magnet.* Reward: 📿 black Oltu beads.

**This is the third craft bench in the project** — Gaziantep hammers copper,
Mardin twists silver, and a third jeweller's counter would be one too many. So
this one is a *stone* workshop and not a jewellery shop: rough black lumps, a
grinding wheel, dust.

The paper trick is the thing a child will remember, and it should be visible:
torn paper scraps lifting toward a polished bead.

> A low stone-polisher's workbench: rough lumps of dull jet-black stone in a
> wooden tray, a foot-powered grinding wheel with a stone water bowl beside it,
> and finished pieces on a cloth — glossy black prayer beads and a ring, so
> polished they reflect. A scatter of tiny torn paper scraps on the bench beside
> one bead. Dark stone dust on the timber.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **2.6 m wide × 2.2 m tall × 1.8 m deep** |
| Triangles | 6,000–10,000 |
| Base colour | 2048 |

Black polished stone against a snow street is the strongest single contrast in
the city, which is a good reason to make this the last thing a child meets.

---

# Part C — sound

`erzurum_theme.webm`. The **bar** — the long-necked lute of the east, deep and
slow — with a bass drum under it. Erzurum's own music is heavy and stately, and
it should sound cold and wide where Trabzon is fast and Gaziantep is busy.

No ambience bed. The synthesised one was cut after two attempts and filtered
noise reads as water however it is shaped (D-103), which in a snow city would be
exactly wrong.

---

# Code work, not a delivery

**A snow ground surface.** Erzurum needs one and there are only five: cobbles,
red sand, steppe, rock and forest. Steppe is Van's and rock is Kars's, so
without a sixth this city walks on a neighbour's ground.

The textures are generated rather than commissioned —
`scripts/build-ground-texture.mjs` writes a greyscale tile that the city's own
ground colour tints at render time, which is why one 200 KB file serves all
eighty-one provinces. Snow is a soft low-contrast surface with shovel edges and
boot scuffs, and it is a smaller job than the cobbles were.

Two other things to settle when the models land:

- **Falling snow.** Cheap as instanced points and it would carry the whole
  season on its own. Not briefed as a model because nothing needs drawing.
- **The guide.** Canonical gives Erzurum to Keloğlan, which would make it seven
  cities to his four. Kars is already overridden the other way (D-132), so the
  mechanism exists if this should be Nasreddin Hodja's instead.

---

# Notes for whoever integrates this

- **Measure every file before deciding anything.** Bytes, triangles, meshes,
  materials, `alphaMode`, `doubleSided`, world box, base offset, clip names, and
  the SHA-256 into the registry.
- **The medrese is height-capped at 16 m** and everything else about its
  proportions follows from that. Check it against the ceiling before scaling.
- **Never force `doubleSided` off.** Fluting, railings, ski poles and pine
  branches are all thin, and culling their back faces draws half of them (D-089).
- **The recorded height draws the model** (D-124), measured off the file so the
  width and depth keep its own aspect, or the collider will not match what is
  drawn.
- **Sweep the circle** before judging any direction empty (D-149 / D-174), and
  watch the quadrant labels — `atan2(x, z)` puts +x at 90°, and getting that
  backwards made a sweep read left for right once already.
- **Ask for a screenshot after every deploy.** Uzungöl was built twice before a
  screenshot settled that a lake was the wrong idea entirely.
