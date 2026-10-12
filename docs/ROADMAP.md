# Delivery Roadmap

## Phase 00 — Audit and lock

Outputs:

- repository audit;
- assumptions and risks;
- final application location;
- architecture decision record;
- verified ability to parse pilot data.

## Phase 01 — Graybox engine

Outputs:

- maintainable Next.js application;
- data-driven city engine;
- map-to-city flow;
- exploration and guided controls;
- one complete interaction type;
- rewards, quiz and local persistence;
- placeholder İstanbul scene;
- quality/debug framework.

## Phase 02 — Three-city vertical slice

Outputs:

- final visual target for İstanbul, Nevşehir and Gaziantep;
- three interaction types;
- guide characters;
- audio system;
- collection screen;
- performance validation.

## Phase 03 — Regional kits

Create seven reusable kits:

- Marmara urban/coastal;
- Aegean stone/olive/antiquity;
- Mediterranean coastal/ancient;
- Central Anatolian plateau/Seljuk;
- Black Sea green/wood/mist;
- Eastern Anatolian mountain/volcanic;
- Southeastern Anatolian yellow-stone/bazaar.

## Phase 04 — Production waves

Produce cities in controlled batches of 7–10. Each wave follows:

1. editorial verification;
2. city storyboard;
3. asset brief;
4. Meshy generation;
5. optimization;
6. city JSON;
7. integration;
8. mobile QA;
9. cultural review;
10. release.

---

## The target: nineteen cities

Set by the owner on 12 October 2026. Thirteen are open; six are not started.

| | City | Region | Stops | Status |
|---|---|---|---|---|
| 1 | Kars | Eastern Anatolia | 3 | open |
| 2 | Erzurum | Eastern Anatolia | 3 | open |
| 3 | Van | Eastern Anatolia | 3 | open |
| 4 | Trabzon | Black Sea | 3 | open |
| 5 | Ordu | Black Sea | 3 | open |
| 6 | Bolu | Black Sea | 3 | open |
| 7 | Mardin | Southeastern Anatolia | 3 | open |
| 8 | Gaziantep | Southeastern Anatolia | 3 | open |
| 9 | **Diyarbakır** | Southeastern Anatolia | 3 | **not started** |
| 10 | İstanbul | Marmara | 5 | open |
| 11 | **Bursa** | Marmara | 3 | **not started** |
| 12 | Balıkesir | Marmara | 3 | open |
| 13 | İzmir | Aegean | 5 | open |
| 14 | **Muğla** | Aegean | 3 | **not started** |
| 15 | **Çanakkale** | Marmara | 3 | **not started** |
| 16 | Nevşehir | Central Anatolia | 5 | open |
| 17 | **Ankara** | Central Anatolia | 3 | **not started** |
| 18 | Antalya | Mediterranean | 3 | open (no art) |
| 19 | **Adana** | Mediterranean | 3 | **not started** |

**Nothing is dropped.** Every city open today is on the list, so the thirteen
already built are all kept and the work is purely additive.

### What the six have in common

All six are three-stop cities with one question — the cheap shape, the one
Gaziantep, Mardin, Erzurum and Antalya all use. None needs a new region: every
one falls into a region that already has a kit, a ground, a planting table and
an animal.

| Region | Already built | Joining it |
|---|---|---|
| Southeastern Anatolia | Mardin, Gaziantep | Diyarbakır |
| Marmara | İstanbul, Balıkesir | Bursa, Çanakkale |
| Aegean | İzmir | Muğla |
| Central Anatolia | Nevşehir | Ankara |
| Mediterranean | Antalya | Adana |

**Diyarbakır is the one to watch.** It would be the third yellow-stone city, and
three provinces in one region reading as one place with three names is the trap
Erzurum sprang in the east (D-189). Its stops are the walls, the bridge and
watermelon; the walls are black basalt, not the honey limestone of Mardin and
Gaziantep, and that is what has to carry the difference.

### What every one of them needs first

Their stop art types are mostly **not in `GRAYBOX_SHAPES`**, so they fall
through to the 2.4 m default cube — `kale`, `kopru`, `fruit`, `karagoz`,
`sahil`, `hayvan`, `truva`, `anitkabir`, `muze`, `flower`. That is the fault
D-217 caught in Antalya: a wrong footprint, not a wrong model, and the trigger
ring, collider and stop camera all derive from it. Each of the six needs its
three footprints reserved before anything is drawn for it.

## Expansion gate

Nationwide production does not begin until the vertical slice demonstrates:

- acceptable mobile performance;
- reliable asset workflow;
- recognizable city identity;
- child usability;
- repeatable data authoring;
- manageable production cost per city.
