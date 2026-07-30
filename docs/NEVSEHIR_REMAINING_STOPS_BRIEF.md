# Meshy Brief — Nevşehir's Last Three Stops

**Date:** 30 July 2026
**City:** Nevşehir (Cappadocia) · 5 stops · Guide: Keloğlan

Two of the five are done: the fairy chimney cluster at stop 1 and the tethered
hot air balloon at stop 2. These are the other three.

**Read this first, because it decides everything else.** A stop object is
something a child walks up to and stands beside. It is not scenery. Every one of
these must be **child-scale** — between one and five metres — and it must read
from three metres away rather than from thirty.

This has already gone wrong twice on this project. Hagia Sophia was built as a
stop object and had to be moved to the horizon; the fairy chimneys arrived at
landscape scale and had to be shrunk from six metres to four and a half, which
was also why Nevşehir's street would not compress. The size in each table below
is the size the scene has already reserved.

---

## 1 · Underground city stone door — `city_nevsehir_underground_stone_door`

**Stop 3.** The canonical stop is about Derinkuyu: the eight-storey city carved
under the ground, and the great millstone doors that could be rolled shut from
the inside.

### Draw this first (for ChatGPT)

A narrow rock-cut tunnel mouth seen straight on, lit from outside. Filling most
of the opening is a **huge circular stone disc standing on its edge**, like a
millstone, rolled about a third of the way aside so a dark gap shows behind it.
The disc is pale carved tuff with a shallow hole through its centre. The tunnel
walls are rough-hewn, warm cream stone with chisel marks. A small square niche
is cut into the left wall with a **clay oil lamp** in it — the reward here is *an
explorer's lantern*, so that lamp should read as something a child could lift. One worn stone step at the
threshold.

Keep it **frontal and readable** — a child should understand "a door made of
stone that rolls" from a single look.

### Meshy prompt

> A rock-cut underground city entrance from Cappadocia: a narrow tunnel mouth in
> pale cream tuff, with a huge circular stone millstone door standing on its edge
> and rolled partly aside to reveal a dark opening behind it. The disc has a small
> round hole at its centre. Rough chisel-marked walls, a small carved niche with a
> clay oil lamp, one worn stone step at the threshold.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, clean silhouette readable from a distance,
> no text, no logos.

| | |
|---|---|
| **World size** | **3.5 m wide × 3.0 m tall × 2.5 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **2048**, others **1024** |
| Reward the child earns here | **an explorer's lantern** (canonical) |

The disc should be the tallest thing in the model and clearly a circle. If it
reads as a wall with a hole, the stop has failed.

---

## 2 · Pottery wheel — `city_nevsehir_pottery_wheel`

**Stop 4.** Avanos, on the Kızılırmak, whose red clay has been thrown into pots
for thousands of years.

### Draw this first

A potter's **kick wheel** seen from slightly above and to one side: a low wooden
frame, a heavy stone flywheel near the floor that a foot would push, and a
smaller wheel head on top with a **half-finished red clay jug** on it, still wet
and open at the neck. A shallow bowl of water and a folded cloth on the frame. A
low shelf behind holding **three finished jugs**, painted with simple Anatolian
patterns in cream and dark red.

The reward here is *a tiny clay pot*, so at least one small finished pot should be
clearly separate and pickable-looking — that is the thing the child takes.

The half-finished pot matters. A finished pot says "shop"; an unfinished one says
"someone is making this", which is the thing the stop is about.

### Meshy prompt

> A traditional Avanos potter's kick wheel: a low wooden frame with a heavy stone
> flywheel near the floor and a smaller wheel head on top, holding a
> half-finished red clay jug still open at the neck. A shallow bowl of water and
> a folded cloth on the frame, and a low shelf behind with three finished
> terracotta jugs painted with simple Anatolian patterns in cream and dark red.
> Warm worn wood, wet red clay.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **1.8 m wide × 1.4 m tall × 1.8 m deep** |
| Triangles | 4,000–8,000 |
| Textures | base colour **1024**, others **512** |
| Reward | **a tiny clay pot** (canonical) |

Smallest of the three, and the one a child will get closest to. Detail belongs on
the jug and the wheel head, not on the frame.

---

## 3 · Carpet loom — `city_nevsehir_carpet_loom`

**Stop 5.** Currently `graybox_loom`. Anatolian weaving: the knots, the patterns,
and that a carpet is made one row at a time by hand.

### Draw this first

An upright wooden **kilim loom** seen from the front: two stout side posts and
two cross-beams, with the warp threads running vertically between them. The
bottom third is **finished carpet** — a bold Anatolian medallion pattern in deep
red, cream and dark blue — and above it the bare pale warp threads continue to
the top beam. A **wooden comb-beater** hangs on one post and a **ball of wool** sits on the
floor beside it — the reward here is *a ball of rainbow wool*, so make that ball
multi-coloured and clearly its own object. A low three-legged stool in front.

The half-finished carpet is the whole point, exactly as with the pot. A child
should be able to see where the work stopped.

### Meshy prompt

> An upright Anatolian kilim loom: two stout wooden side posts with cross-beams
> and vertical warp threads between them. The lower third is finished carpet with
> a bold Anatolian medallion pattern in deep red, cream and dark blue; above it
> the bare pale warp threads run up to the top beam. A wooden comb-beater hanging
> on one post, a ball of red wool on the floor, a low three-legged stool in front.
> Warm worn wood.
>
> Stylised low-poly game asset, soft rounded edges, warm hand-painted texture,
> bright children's storybook palette, no text, no logos.

| | |
|---|---|
| **World size** | **2.2 m wide × 2.4 m tall × 1.2 m deep** |
| Triangles | 5,000–9,000 |
| Textures | base colour **2048**, others **1024** |
| Reward | **a ball of rainbow wool** (canonical) |

**This one needs `doubleSided` left on.** The warp threads and the hanging carpet
are thin flat geometry, and single-sided planes lose half of themselves — the
flags on the Maiden's Tower and the ferry were torn in half by exactly that
mistake.

---

## Rules for all three

Each of these is here because it cost time on this project.

**Textures by role, never all at maximum.** Six deliveries in a row arrived with
four 4096 px maps; one was 70 MB and came down to 2.94 MB with no visible loss.

**`alphaMode` OPAQUE.** A transparent material costs two render passes.

**Leave `doubleSided` alone.** Do not switch it off. Thin geometry needs it.

**Metres, and the origin at the base centre standing on y = 0.** Several files
have arrived authored at 0.01 scale.

**One mesh, one material** where the model allows it.

**Say what the model is, not just what the file is called.** A file named
`Beyoğlu` was registered as a row of building facades and placed twice as
scenery. It was a ferry, and its measurements agreed with the wrong name, so
nothing looked wrong until it was on screen.

---

## What happens when they arrive

Nothing beyond registering them. The scene builder already reserves each
footprint, derives each stop's camera distance from the object's height, and
checks that no trigger ring overlaps its neighbour. Drop the file in and the
placeholder is replaced.

I measure bytes, triangles, meshes, materials, `alphaMode`, sidedness, the world
bounding box and the base offset, and record all of it with the file's SHA-256.
Anything far over budget I simplify in-project rather than send back.

What I cannot do is see it. A screenshot after each deploy is worth more than
every measurement I take.

---

## After these three

Nevşehir is complete: five stops, five real objects, Keloğlan guiding, a valley
rim, chimneys down both sides, ten balloons crossing the sky, and its own theme.

The remaining piece is **horses** — the one thing Cappadocia is named for, and
the only Nevşehir asset I have no way to produce. A single standing horse, 1.8 m
long, with a one-second in-place walk cycle if the tooling allows it. I can build
the herd behaviour — grazing, wandering, following one another — the moment there
is a model to move.
