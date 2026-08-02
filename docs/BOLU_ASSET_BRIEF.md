# Meshy Brief — Bolu

**Date:** 1 August 2026
**City:** Bolu (Black Sea) · **3 stops, 1 question** · Guide: Keloğlan

Bolu is open and walkable. It stands on a forest floor of fallen leaves, its sky
and ground are tinted for late October, deer are briefed to walk it, and a
chairlift already runs up the mountain behind the town. Every model below is a
placeholder.

The street is 28 m, the same shape as the last four cities.

---

## Bolu is in the same region as Ordu and must not look like it

This is the first time two provinces have shared a region table, and it is the
one thing that could make the country feel repetitive. Ordu is a coast in high
summer: hazelnut, timber houses, a sea. Bolu is deep inland forest in autumn.

Nothing is shared. **Not the ground** — Bolu has its own leaf-litter floor
rather than Ordu's cobbles. **Not the palette** — amber earth under a thin cold
blue, against Ordu's strong green. **Not the planting**, not the animal, not the
horizon. The only thing both have is a chairlift, and they carry different
people to different places.

If a model here could plausibly be dropped into Ordu, it is wrong.

---

## The whole list, in the order I would draw it

Four files left — three rewards and a chairlift chair. **Part A first** — a street with placeholder stops and a real
horizon reads as a place under construction; real stops and no horizon reads as
a diorama.

| # | Asset id | What it is | Size (w × h × d) | Base colour |
|---|---|---|---|---|
| 1 | ~~`city_bolu_forest_row`~~ | **delivered** — 41.9 × 13 × 20.4, three a side | — | — |
| 2 | ~~`kit_bolu_fir`~~ | **delivered** — 4.7 × 9 × 4.7 | — | — |
| 3 | ~~`city_bolu_kartalkaya_peak`~~ | **delivered** — 72.3 × 30 × 68.5 | — | — |
| 4 | ~~`city_bolu_lake_forest`~~ | **retired** — the far shore is three more forest stands | — | — |
| 5 | ~~`city_bolu_yedigoller_jetty`~~ | **delivered** — a lake with its own shore, 8.5 × 2.6 × 9 | — | — |
| 6 | ~~`city_bolu_mengen_kitchen`~~ | **delivered** — 2.6 × 2.4 × 2.0 | — | — |
| 7 | ~~`city_bolu_ski_lift_station`~~ | **delivered** — 7.1 × 4.2 × 7.1 | — | — |
| 8 | ~~`kit_bolu_deer`~~ | **delivered, rigged and walking** — 0.6 × 1.4 × 1.7 | — | — |
| 9 | `collectible_bolu_autumn_leaf` | reward 1 | 0.14 × 0.12 × 0.01 m | 1024 |
| 10 | `collectible_bolu_chef_hat` | reward 2 | 0.14 × 0.20 × 0.14 m | 1024 |
| 11 | `collectible_bolu_snowboard_sticker` | reward 3 | 0.11 × 0.14 × 0.01 m | 1024 |

Normal and roughness always one step below the base colour. **Do not fight the
exporter over sizes** — deliver at whatever comes out, say what it is, and it is
re-authored here in one command.

**Theme delivered:** *Yedigöller Yolu*.

**Still wanted:** a single chairlift chair, so the line above the town carries
something. It runs already and draws nothing — Ordu's red gondola would be wrong
on a ski hill. Two-person chair with a raised safety bar, roughly 1.6 × 1.8 ×
1.2 m, 1024 colour map.

---

# Part A — the horizon

## A1 · Forest stand — `city_bolu_forest_row`

The sides, four a side. Bolu is forest first and a town second.

> A dense stand of forest: tall dark green firs behind, and in front of them
> beech and maple that have turned red, orange and gold. Straight pale trunks,
> deep leaf litter at the base, a few fallen branches and a mossy boulder.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette against sky, no text, no
> logos.

| | |
|---|---|
| Target size | **26 m wide × 14 m tall × 12 m deep** |
| Triangles | 7,000–12,000 |
| Textures | base colour **2048**, others **1024** |

**Two colours of tree in one model.** Dark evergreen behind and turned
broadleaf in front — that contrast is the whole of what an Anatolian forest
looks like in October, and a stand of one colour is a hedge.

## A2 · Fir — `kit_bolu_fir`

Single trees filling the ground between the stands.

> One tall narrow fir with a straight trunk and drooping dark green branches,
> a scatter of cones and needles at the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **5 m wide × 9 m tall × 5 m deep** |
| Triangles | 3,000–6,000 |
| Textures | base colour **1024**, others **512** |

A `kit_` asset: shared across provinces, so it **stays under 2 MB**.

**Tall and narrow.** Nine metres against five wide. The project's existing trees
are all round-crowned; a fir that is not conspicuously conical will read as one
of them and Bolu will look like everywhere else.

## A3 · Kartalkaya — `city_bolu_kartalkaya_peak`

Behind the town, and the reason stop three exists. Aligned by its near edge.

> A broad mountain under deep snow: rocky grey summit ridges, white snowfields
> on the upper slopes, dark firs weighed down with snow lower down, and pale
> ski trails cut through the trees.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **86 m wide × 30 m tall × 62 m deep** |
| Triangles | 8,000–13,000 |
| Textures | base colour **2048**, others **1024** |

**Snow on it, autumn in front of it.** That is not a mistake: Kartalkaya holds
snow while the valleys below are still turning, and a child seeing both at once
is being told something true about the place. Ordu's Boztepe is green to the
summit and Kars's Sarıkamış is bare rock — three mountains that would otherwise
be one mountain in three colours.

## A4 · Far shore of Yedigöller — `city_bolu_lake_forest`

Across the water the street runs out to.

> The far shore of a still forest lake: forest coming right down to the
> waterline in bands of red, orange, gold and dark green, with pale trunks
> reflected, and a low rocky bank where the trees meet the water.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **70 m wide × 12 m tall × 60 m deep** |
| Triangles | 7,000–12,000 |
| Textures | base colour **2048**, others **1024** |

---

# Part B — the three stops

Child-scale, all of them. **One to five metres.** Hagia Sophia was built as a
stop and had to be moved to the horizon; the fairy chimneys had to shrink from
six metres to four and a half.

## B1 · Yedigöller jetty — `city_bolu_yedigoller_jetty`

**Stop 1.** *Seven forest lakes linked like a necklace, and in autumn the lakes
become giant mirrors.*

### Draw this first

A short wooden jetty on a lake shore with **a small rowing boat tied at the
end**, oars shipped. On the boards: a coil of rope, a lantern, and **a scatter
of red and gold leaves** that have fallen on to the wood and the water beside
it.

**The leaves are the stop.** The canonical text is about autumn colour and the
reward is a golden leaf; a bare jetty is a jetty anywhere. This is the fourth
time the project has answered "a lake is not child-scale" with a boarding point
— the terminal for the ferry, the platform for the Eastern Express, the jetty
for Akdamar — and each one earns its place by carrying the thing the text is
actually about.

### Meshy prompt

> A short weathered wooden jetty on a still forest lake, with a small wooden
> rowing boat moored at the end and its oars shipped. A coil of rope and a metal
> lantern rest on the boards, and red and gold fallen leaves lie scattered
> across the planks and on the water beside them.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **3.2 m wide × 1.9 m tall × 5.4 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a golden autumn leaf** (canonical) |

## B2 · Mengen kitchen — `city_bolu_mengen_kitchen`

**Stop 2.** *Little Mengen is famous for one thing: chefs.*

### Draw this first

A cook's station: a wooden counter with **a tall white chef's hat sitting on
it**, a big copper stockpot with steam, a board of chopped vegetables, and a
rack of ladles and knives above. A folded apron over the counter's edge.

**The hat is how a child reads this in one look.** The reward is a chef's hat
and the question is *What is Mengen famous for?* — a child who has walked past
this stop should be able to answer without being told twice.

**No text on anything.** Not on the apron, not on a sign. The canonical content
says what this is and a baked-in word is the one thing that cannot be
translated.

### Meshy prompt

> A cook's work station: a sturdy wooden counter holding a tall white pleated
> chef's hat, a large copper stockpot with steam rising, a wooden board of
> chopped vegetables, and a hanging rack of ladles and knives above. A folded
> white apron hangs over the counter edge.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **3.0 m wide × 2.4 m tall × 1.8 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a tiny chef's hat** (canonical) |

## B3 · Ski lift station — `city_bolu_ski_lift_station`

**Stop 3.** *Eagle Rock gets piles of fluffy snow — perfect for young skiers
taking their very first ride.*

### Draw this first

The bottom station of a chairlift: a timber and steel frame with **one chair
hanging at the platform, empty and swinging**, the cable running up and out of
the top. Snow on the roof and banked at the sides. Beside it a rack with skis
and a snowboard leaning, and a pair of small boots.

The chairlift that climbs Kartalkaya is **already running in the city** — ten
chairs on a loop, one leaving every five seconds. This is the station they leave
from, so a child standing at stop three watches the thing they have just read
about depart from the building in front of them.

### Meshy prompt

> The bottom station of a ski chairlift: a timber and steel frame with a
> corrugated roof under thick snow, one empty two-person chair hanging at the
> boarding platform with a safety bar raised, and a thick cable running up and
> away. A wooden rack beside it holds skis and a snowboard, with a pair of small
> boots on the ground. Snow banked around the base.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **4.6 m wide × 4.2 m tall × 4.0 m deep** |
| Triangles | 6,000–10,000 |
| Textures | base colour **2048**, others **1024** |
| Reward | **a snowboard sticker** (canonical) |

**Snow on this one and leaves everywhere else.** A child walks from an autumn
lake to a winter mountain in twenty-eight metres, which is what Bolu is: the
whole province in one street.

---

# Part C — the animal

## C1 · Deer — `kit_bolu_deer`

The fifth animal in the project, and the third that has to be **rigged and
animated**. Its routes are already generated and it draws nothing until the
model exists.

> A roe deer standing alert: slender legs, reddish-brown summer coat with a pale
> rump, large ears turned forward, small forked antlers, dark eyes and nose.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| Target size | **0.6 m wide × 1.4 m tall × 1.7 m long** |
| Triangles | 5,000–9,000 |
| Textures | base colour **1024**, others **512** |
| Rig | skinned, with a **`Walking`** clip |

**The clip must be called `Walking`,** with the -ing. The animal component looks
for that name and otherwise falls back to whatever clip comes first in the file,
so a wrong name works today and breaks silently the moment a second clip is
added.

**No root translation in the clip.** The application moves the deer through the
world; the clip moves its legs. A walk cycle that also translates the root makes
the feet skate.

The two street dogs arrived rigged, walking and correct on the first delivery,
so this is a solved shape — ask for the same treatment.

---

# Part D — the three rewards

Small, held up close, seen against the completion panel rather than in the
street. **1024 colour maps**; they are 15 cm objects.

## D1 · Autumn leaf — `collectible_bolu_autumn_leaf`

> A single maple leaf in deep gold and orange with darker red at the edges,
> veins clearly visible, curled slightly at one side.

**0.14 × 0.12 × 0.01 m.** Nearly flat, so leave `doubleSided` on — a leaf
culled on one side is half a leaf.

## D2 · Chef's hat — `collectible_bolu_chef_hat`

> A tall white pleated chef's toque with a banded base, standing upright and
> slightly slumped at the crown.

**0.14 × 0.20 × 0.14 m.** The pleats are what make it a chef's hat rather than a
white cylinder; keep them broad enough to read at 20 cm.

## D3 · Snowboard sticker — `collectible_bolu_snowboard_sticker`

> A die-cut vinyl sticker shaped like a snowboard with a bright geometric
> pattern in blue, white and orange, a white border, and one corner peeling.

**0.11 × 0.14 × 0.01 m.** **No legible text.** The peeling corner is what makes
it a sticker rather than a painted plank. Leave `doubleSided` on.

---

## Rules for every file

Each of these cost this project time.

**Textures by role, never all at maximum.** Base colour as tabled above, normal
and roughness one step below. Deliveries have arrived at 70 MB and come down to
under 3 MB with no visible loss.

**`alphaMode` OPAQUE.** A transparent material costs two render passes. Both
heroes arrived BLEND and had to be forced.

**Leave `doubleSided` alone — do not switch it off.** Anything thin needs it: a
leaf, a sticker, a chair-lift cable, an apron. Two flags and a carpet were
nearly lost to this.

**No black emissive map.** Every Meshy delivery so far has carried a 4096 px
emissive texture that was solid black with `emissiveFactor` at [1,1,1]. It adds
nothing and costs a texture unit.

**Metres, origin at the base centre, standing on y = 0.** Most deliveries so far
have arrived buried below the origin, and one arrived a centimetre cubed.

**Say what the model is, not just what the file is called.** A file named
`Beyoğlu` was registered as a row of facades and placed twice as scenery. It was
a ferry. A grove briefed as pistachio arrived as olives. A gate named for a
desert had a bazaar in it.
