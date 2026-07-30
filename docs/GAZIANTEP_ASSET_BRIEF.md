# Meshy Brief — Gaziantep

**Date:** 30 July 2026
**City:** Gaziantep (south-east Anatolia) · **3 stops, 1 question** · Guide: Keloğlan

Gaziantep is open and walkable now. Its street is dressed from the shared kit,
its ground is the plateau's dust, cats walk it and balloons cross the sky. What
it does not have is any of its own art.

Two parts, as with Nevşehir. **Part A is the horizon**, which matters more,
because a street with placeholder stops and a real horizon reads as a place under
construction while a street with real stops and no horizon reads as a diorama.

**Note on the shape of this city.** Three stops and one question, where İstanbul
and Nevşehir have five and two. The street is 28 m rather than 72. Everything
scales itself; nothing needs adjusting for it.

---

# Part A — the horizon

Gaziantep answers the four directions differently again. İstanbul has facades and
sea; Nevşehir has chimneys and valley. Gaziantep is a walled stone city on a
plain: honey-coloured limestone, flat roofs, and a castle on its mound.

## A1 · Antep stone house row — `city_gaziantep_stone_houses`

The walls, and the asset that does the most work.

> A continuous row of four traditional Gaziantep stone houses: two and three
> storeys of honey-coloured cut limestone, flat roofs with low parapets, small
> deep-set windows with carved stone surrounds and wooden shutters, an arched
> doorway with a studded wooden door, and a first-floor projecting balcony on
> carved stone corbels. Worn pale stone in cream, honey and soft grey, each house
> a slightly different height.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette readable from a distance,
> no text, no logos.

| | |
|---|---|
| Target size | **28 m wide × 12 m tall × 6 m deep** |
| Proportion | roughly **2.3 : 1 : 0.5** |
| Triangles | 7,000–12,000 |
| Textures | base colour **2048**, others **1024** |

Four a side, end to end. **Vary the heights** — a flat roofline reads as a wall.

## A2 · Gaziantep Castle — `city_gaziantep_castle`

The back. What a child turns round to see, where İstanbul has Hagia Sophia and
Nevşehir has its valley.

> Gaziantep Castle seen from below: a round Roman-Byzantine fortress of pale
> limestone on a steep artificial mound, with twelve bastion towers around a
> circular curtain wall, crenellated battlements, and a stone ramp climbing to an
> arched gate. Dry grass and low scrub on the slopes of the mound.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **34 m wide × 18 m tall × 34 m deep** |
| Triangles | 8,000–14,000 |
| Textures | base colour **2048**, others **1024** |

Backdrop, so it can be large. The mound matters as much as the walls — the castle
sits *on* something, and that is most of its silhouette.

## A3 · Pistachio grove — `kit_pistachio_grove`

The front and the far edges. Gaziantep's plain is pistachio country, and a low
grove is what the eye should run out over.

> A cluster of five low pistachio trees: short gnarled trunks, wide spreading
> crowns of small dark green leaves, and clusters of pale green-pink nuts. Dry
> stony ground between them with tufts of pale grass.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **14 m wide × 5 m tall × 14 m deep** |
| Triangles | 4,000–8,000 |
| Textures | base colour **1024**, others **512** |

Registered as `kit_`, because pistachio groves are not only Gaziantep's — the
whole south-east has them, and this will be reused across the region.

---

# Part B — the three stops

Child-scale, all of them. **One to five metres**, readable from three metres
rather than thirty. This has gone wrong twice: Hagia Sophia had to be moved to
the horizon, and the fairy chimneys had to be shrunk from six metres to four and
a half.

## B1 · Zeugma mosaic panel — `city_gaziantep_zeugma_mosaic_panel`

**Stop 1.** The Gypsy Girl — the mosaic face from Zeugma, and the eyes that
follow you.

### Draw this first

A Roman floor mosaic panel, **mounted upright on a low museum stand** at child
height, lit from above. The mosaic shows a young woman's face in small stone
tesserae: dark tousled hair, a scarf over one shoulder, and large dark eyes
looking straight out. Around the portrait runs a border of geometric Roman
guilloche in cream, ochre and dark red. Some tesserae at the edges are missing,
so the panel reads as a fragment recovered from the ground rather than a picture.

**The eyes are the whole stop.** They should be the first thing legible from
three metres.

### Meshy prompt

> A Roman mosaic panel mounted upright on a low dark museum stand: the portrait
> of a young woman's face made of small stone tesserae, with tousled dark hair, a
> scarf over one shoulder and large dark eyes looking straight ahead. A
> geometric Roman guilloche border in cream, ochre and dark red frames it, and
> some tesserae are missing at the broken edges.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **1.6 m wide × 2.2 m tall × 0.6 m deep** |
| Triangles | 4,000–8,000 |
| Textures | base colour **2048**, others **1024** |
| Reward | **the Gypsy Girl's gaze** (canonical) |

Colour map at 2048 despite the small size — the tesserae are the detail, and a
mosaic at 1024 becomes a smear.

## B2 · Baklava counter — `city_gaziantep_baklava_counter`

**Stop 2.** Gaziantep baklava: forty layers of pastry, pistachio, and a tray cut
into diamonds.

### Draw this first

A shop counter seen from the customer's side: a **glass-fronted display case** on
a warm wooden base, and inside it two large round copper trays. One tray is whole
baklava cut into diamonds, deep golden, with a thick band of bright green
pistachio across the top. The second tray is half empty, with a **long-bladed
knife** resting in it and a few pieces lifted out onto a small plate. A brass
scale sits on one end of the counter.

The half-empty tray is the point, exactly as the unfinished pot was in Avanos: it
says someone is serving, not that this is a photograph of food.

### Meshy prompt

> A Gaziantep baklava shop counter: a glass-fronted display case on a warm wooden
> base holding two large round copper trays. One tray is whole golden baklava cut
> into diamonds with a thick layer of bright green ground pistachio on top; the
> other is half empty with a long-bladed knife resting in it and a few pieces on
> a small plate. A brass scale at one end of the counter.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.0 m wide × 1.3 m tall × 0.9 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a crunchy baklava square** (canonical) |

At least one diamond should be clearly separate on the small plate — that is the
piece the child takes.

**Leave `doubleSided` on** for the glass front.

## B3 · Coppersmith's workbench — `city_gaziantep_coppersmith_workbench`

**Stop 3.** The Bakırcılar Çarşısı, where the sound of hammering fills the street.

### Draw this first

A low workbench in a bazaar workshop: a heavy wooden bench with a **small anvil**
set into it, a **half-finished copper pot** on the anvil showing hammer dimples
across its curve, and a **ball-peen hammer** resting beside it. Behind, a wall
board hung with finished copper: a coffee pot, a tray, two small bowls, all warm
orange-red with darker patina in the hollows. A stool and a scattering of copper
offcuts on the floor.

Same rule again: the unfinished pot is what makes it a workshop.

### Meshy prompt

> A coppersmith's workbench from a Gaziantep bazaar: a heavy wooden bench with a
> small anvil set into it, a half-finished copper pot on the anvil showing hammer
> dimples across its curve, and a ball-peen hammer beside it. A wall board behind
> hung with finished copper — a long-handled coffee pot, a round tray, two small
> bowls — in warm orange-red with darker patina. A wooden stool and copper
> offcuts on the floor.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **1.9 m wide × 1.9 m tall × 1.0 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a tiny copper pot** (canonical) |

One small finished pot clearly separate on the bench — that is the reward.

---

## Rules for every file

Each of these cost this project time.

**Textures by role, never all at maximum.** Base colour 2048 for the mosaic and
the house rows, 1024 for the rest; normal and roughness one step below. Deliveries
have arrived at 70 MB and come down to under 3 MB with no visible loss.

**`alphaMode` OPAQUE.** A transparent material costs two render passes.

**Leave `doubleSided` alone — do not switch it off.** Anything thin needs it.
Flags on two models and a carpet on a loom were nearly lost to this.

**Metres, origin at the base centre, standing on y = 0.**

**Say what the model is, not just what the file is called.** A file named
`Beyoğlu` was registered as a row of facades and placed twice as scenery. It was
a ferry.

---

## If you want one more thing after these

**Music.** Gaziantep is silent — İstanbul and Nevşehir each have a theme and the
engine will not lend one city another's. Anything from the region works; the file
gets converted to Opus and lands at about 1.5 MB.

**A hammering sound** would suit stop 3 better than almost anything else in the
project, but the audio channel for it is empty until real recordings exist.
