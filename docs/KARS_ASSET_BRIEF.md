# Meshy Brief — Kars

**Date:** 30 July 2026
**City:** Kars (eastern Anatolia) · **3 stops, 1 question** · Guide: Keloğlan

Kars is open and walkable now. Its ground is the highland steppe, poplars and
scrub line the street, horses walk it, and its sky is empty — no balloons, which
are Cappadocia's alone. Every one of its stop objects and every piece of its
horizon is a placeholder.

Three stops and one question, the same shape as Gaziantep. The street is 28 m.

---

## The whole list, in the order I would draw it

Eleven files. **Part A first** — a street with placeholder stops and a real
horizon reads as a place under construction; real stops and no horizon reads as a
diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| 1 | `city_kars_ani_church_row` | one roofless church shell | 9 × 11 × 9 m | 2048 |
| 2 | `city_kars_ani_cathedral` | the cathedral, standing apart | 16 × 17 × 22 m | 2048 |
| 3 | `city_kars_ani_walls` | walls and the Arslan Gate | 44 × 14 × 7 m | 2048 |
| 4 | `city_kars_ani_gorge` | the Arpaçay gorge | 60 × 12 × 40 m | 2048 |
| 5 | `city_kars_ani_carved_doorway` | **stop 1** — carving, rubbing half taken | 2.6 × 3.2 × 1.0 m | 2048 |
| 6 | `city_kars_eastern_express_platform` | **stop 2** — platform, nose of the engine | 6.0 × 3.4 × 2.6 m | 1024 |
| 7 | `city_kars_gravyer_stall` | **stop 3** — cheese wheels, one cut | 2.2 × 1.6 × 1.1 m | 1024 |
| 8 | `kit_kars_goose` | the animal, **rigged, with a walk** | 0.35 × 0.85 × 0.75 m | 1024 |
| 9 | `collectible_kars_stone_rubbing` | reward 1 | 0.22 × 0.30 × 0.02 m | 1024 |
| 10 | `collectible_kars_express_ticket` | reward 2 | 0.14 × 0.09 × 0.01 m | 1024 |
| 11 | `collectible_kars_gravyer_wedge` | reward 3 | 0.20 × 0.16 × 0.14 m | 1024 |

Normal and roughness always one step below the base colour. Sizes are what the
registry will record and what will draw the model, so they are the sizes to aim
at — but do not fight the exporter over them. Deliver at whatever scale comes
out, say what it is, and it is re-authored here in one command.

The music is done: *Kars Yaylası*.

**A note on where this is set.** The environment is Ani, the ruined city on the
gorge. The three stops are Kars the province: the ruins, the Eastern Express and
the gravyer cheese. Those are not all in the same place in life — Ani is forty-
five kilometres from the town, the train pulls into Kars station, and the cheese
is made in mountain dairies. That is how every city here works. İstanbul puts
Hagia Sophia, Galata, the Grand Bazaar, a simit cart and a ferry on one
seventy-two metre street.

---

# Part A — the horizon

Ani is not a skyline. It is roofless churches standing apart in grass with
nothing between them and a gorge at the edge of it, and **most of what a child
sees there is sky**. So the sides are not a continuous wall the way İstanbul's
facades and Antep's houses are: they are separate shells, staggered, each turned
its own way, with gaps between them.

## A1 · Ani church shell — `city_kars_ani_church_row`

The sides, and the asset that does the most work. Six of them stand along the
street, individually rotated.

> A single ruined Armenian church of the eleventh century, roofless and open to
> the sky: reddish-brown and honey volcanic tuff laid in courses, a tall narrow
> body with one wall fallen away so the interior is visible, blind arcading and
> slender engaged columns down the outside, narrow arched windows, and a broken
> drum where a conical dome once sat. Faded traces of fresco on an inner wall.
> Grass and fallen blocks around the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **9 m wide × 11 m tall × 9 m deep** |
| Triangles | 7,000–12,000 |
| Textures | base colour **2048**, others **1024** |

**One church, not a row.** The name says row for consistency with the other
cities' side pieces, and it is wrong in the way that matters least — but deliver
one building. Six copies turned to different angles are what makes a ruined city;
six copies of a row would rebuild a street that has not existed for eight hundred
years.

**The missing wall is the point.** A child should be able to see into it from the
street. A closed box reads as a building, and Ani has no buildings left.

## A2 · Ani cathedral — `city_kars_ani_cathedral`

Stands alone and off the axis, further out than the shells. The one building at
Ani that is larger than the rest.

> The cathedral of Ani seen from outside: a large rectangular church of honey and
> rust-coloured tuff with a tall pointed-arch doorway, rows of blind arcading
> with slender paired columns running around all four walls, narrow windows high
> up, and a broken drum open to the sky where the dome fell. Weathered stone,
> some courses darker than others. Low grass and scattered fallen blocks.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **16 m wide × 17 m tall × 22 m deep** |
| Triangles | 9,000–14,000 |
| Textures | base colour **2048**, others **1024** |

## A3 · Ani city walls and the Arslan Gate — `city_kars_ani_walls`

The back. What a child turns round to see, and the way in — where İstanbul has
Hagia Sophia, Nevşehir its valley rim and Gaziantep its castle.

> A long double line of city walls in reddish tuff with tall round bastion
> towers, crenellated tops, and a deep arched gateway through the middle with a
> stone relief of a lion set above it. Blocks missing along the top, grass
> growing on the ledges, a dirt track running out through the gate.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **44 m wide × 14 m tall × 7 m deep** |
| Triangles | 8,000–14,000 |
| Textures | base colour **2048**, others **1024** |

Aligned by its near edge, and solid. **Vary the tower heights and break the
parapet** — a level wall reads as a fence.

## A4 · The Arpaçay gorge — `city_kars_ani_gorge`

The front, and the direction the street runs out towards. Three plates.

> The edge of a deep river gorge cut into a bare plateau: sheer layered rock
> walls in grey and rust, a green river far below at the bottom, and short dry
> grass running right up to the lip. Basalt columns visible in the upper courses.
> Nothing growing on the cliff faces.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **60 m wide × 12 m tall × 40 m deep** |
| Triangles | 6,000–11,000 |
| Textures | base colour **2048**, others **1024** |

Aligned by its **near edge**, which is the rule the Nevşehir valley taught: a
plate centred on the boundary puts the child inside it. Solid — a gorge is the
one landscape a child must not be able to walk into.

---

# Part B — the three stops

Child-scale, all of them. **One to five metres.** This has gone wrong twice
already: Hagia Sophia was built as a stop and had to be moved to the horizon, and
the fairy chimneys had to shrink from six metres to four and a half.

## B1 · Ani carved doorway — `city_kars_ani_carved_doorway`

**Stop 1.** The ghost city, at the size of a thing you can stand in front of.

### Draw this first

A single surviving church doorway, standing free — the wall around it gone. The
arch is carved with an interlaced geometric band, and beside it a stone panel
carries a cross worked into knotwork. A sheet of paper is taped over part of the
carving with a wax crayon resting against it, half of a rubbing already taken.

**The rubbing is the stop.** The reward is *an Ani stone rubbing*, and a child
should be able to see how you get one before anybody explains it. Same rule as
the half-empty baklava tray and the unfinished pot: it says someone is working
here, not that this is a photograph of a ruin.

### Meshy prompt

> A free-standing carved stone doorway from a ruined Armenian church: a pointed
> arch of honey and rust volcanic tuff with an interlaced geometric band carved
> around it, a stone panel beside it bearing a cross worked into knotwork, and
> weathered blocks at the base. A sheet of paper is taped across part of the
> carving with a wax crayon resting against it, a rubbing half taken.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.6 m wide × 3.2 m tall × 1.0 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **2048**, others **1024** |
| Reward | **an Ani stone rubbing** (canonical) |

2048 on the colour map despite the size, for the same reason the mosaic panel
keeps it: the carving is the subject, and at 1024 an interlace becomes a smudge.

## B2 · Eastern Express platform — `city_kars_eastern_express_platform`

**Stop 2.** The Doğu Ekspresi, which runs from Ankara to Kars across the snow.

### Draw this first

A short station platform with the **front of the locomotive** pulled up to the
end of it — the nose, the buffers and the first metre or so of the engine, not
the whole train. A cast-iron lamp post, a wooden bench, and a departure board on
a post. Snow lying along the platform edge and on the engine's roof.

This is the ferry problem again, and the same answer: the ferry terminal stood in
for a twenty-metre boat (D-068). A locomotive is not child-scale and a child
cannot walk up to one; a platform with a locomotive's nose at the end of it is
both.

### Meshy prompt

> A short railway platform with the front of a dark blue and cream diesel
> locomotive pulled up to it: rounded nose, buffers, a headlight and the first
> section of the engine body. A cast-iron lamp post, a wooden bench, and a
> departure board on a post stand on the platform. Snow lies along the platform
> edge and on the roof of the engine.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **6.0 m wide × 3.4 m tall × 2.6 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **an Eastern Express ticket** (canonical) |

The widest stop object in the project, and the layout already reserves for it:
the trigger ring is derived from the footprint, so a 6 m frontage gets a 5.5 m
ring rather than the 4.5 m the others get.

**No text on the departure board.** Shapes only — the canonical content says what
this is, and a baked-in word would be the one thing on it that cannot be
translated.

## B3 · Gravyer stall — `city_kars_gravyer_stall`

**Stop 3.** Wheels of Kars gruyère, some heavier than the child looking at them.

### Draw this first

A dairy stall: a plain wooden counter with **two enormous wheels of pale golden
cheese** on it, one whole and one with a wedge cut out so the holes inside are
visible. A long two-handled cheese knife lies beside the cut one, and a wedge
stands separately on a small board. Behind, a shelf with two more wheels stacked
on their sides, and a folded cloth.

**One wedge clearly separate** — that is the piece the child takes.

The cut wheel matters the way the unfinished pot and the half-empty tray did: the
holes are what gravyer *is*, and a child cannot see them in an uncut wheel.

### Meshy prompt

> A cheese stall from an eastern Anatolian market: a plain wooden counter holding
> two very large wheels of pale golden gruyère, one whole and one with a wedge
> cut out showing the round holes inside. A long two-handled cheese knife lies
> beside it and a single wedge stands on a small wooden board. A shelf behind
> holds two more wheels stacked on their sides beside a folded cloth.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.2 m wide × 1.6 m tall × 1.1 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a wedge of gravyer** (canonical) |

---

# Part C — the goose

## C1 · Kars goose — `kit_kars_goose`

Kars is known for its geese, and this is the third animal in the project. It is
the only file on this list that has to be **rigged and animated**.

> A large white domestic goose standing on short orange legs: heavy rounded
> body, long curved neck held upright, orange bill, small dark eye, wings folded
> against the body with the feather edges just visible.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **0.35 m wide × 0.85 m tall × 0.75 m long** |
| Triangles | 4,000–8,000 |
| Textures | base colour **1024**, others **512** |
| Rig | skinned, with a **walk** clip |

Three things about the animation, each of which cost this project time on the cat
and then again on the horse.

**One clip, named `Walk`.** The engine matches clips by name from a whitelist.

**No root motion in the clip.** The application moves the goose through the
world; the clip moves its legs. A walk cycle that also translates the root makes
the feet skate, and every animal here follows this rule.

**Deliver it standing on y = 0 at its real size if you can.** Both other animals
arrived with a 0.01 armature and rendered at centimetres until the engine
measured them.

A waddle would be worth more here than on either of the others — it is most of
what a goose *is* from behind. If the rig can carry a side-to-side roll on the
body through the walk, put it in.

---

# Part D — the three rewards

Small, held up close, and seen against the completion panel rather than in the
street. **1024 colour maps**; they are 20 cm objects.

## D1 · Ani stone rubbing — `collectible_kars_stone_rubbing`

> A sheet of cream paper with a wax rubbing taken from carved stone: the dark
> interlaced geometric pattern shows where the crayon has passed, the edges are
> uneven, and one corner curls.

**0.22 × 0.30 × 0.02 m.** Nearly flat, so leave `doubleSided` on — a curling
sheet of paper is exactly the thin thing that culling ruins.

## D2 · Eastern Express ticket — `collectible_kars_express_ticket`

> A small stiff card railway ticket in pale buff and faded red, with a punched
> hole through one end, printed rules and lines, and worn corners.

**0.14 × 0.09 × 0.01 m.** **No legible text.** Lines and blocks where writing
would be — a baked-in word is the one thing on this that cannot be translated.

## D3 · Wedge of gravyer — `collectible_kars_gravyer_wedge`

> A wedge cut from a wheel of pale golden gruyère, the rind darker on the curved
> outer face, with round holes of different sizes showing on both cut faces.

**0.20 × 0.16 × 0.14 m.** The holes are the whole point and they must read at
this size — fewer and larger beats many and small.

---

## Rules for every file

Each of these cost this project time.

**Textures by role, never all at maximum.** Base colour 2048 for the carving, the
churches, the walls and the gorge; 1024 for the platform and the stall. Normal
and roughness one step below. Deliveries have arrived at 70 MB and come down to
under 3 MB with no visible loss.

**`alphaMode` OPAQUE.** A transparent material costs two render passes.

**Leave `doubleSided` alone — do not switch it off.** Anything thin needs it, and
a roofless church is full of thin things: a wall one course thick, a broken
parapet, an arch with nothing behind it. Flags on two models and a carpet on a
loom were nearly lost to this.

**No black emissive map.** The last four deliveries each carried a 4096 px
emissive texture that was solid black, with `emissiveFactor` set to [1,1,1]
beside it. It adds nothing and costs a texture unit.

**Metres, origin at the base centre, standing on y = 0.** Two of the last four
arrived buried below the origin.

**Say what the model is, not just what the file is called.** A file named
`Beyoğlu` was registered as a row of facades and placed twice as scenery. It was
a ferry. A grove briefed as pistachio arrived as olives. A gate named for a
desert had a bazaar in it.

---

## If you want one more thing after these

**A hammering, a train whistle, a goose.** The audio channel for recorded sound
exists and is empty. None of it is needed for Kars to work, and all of it would
be worth more than another model.
