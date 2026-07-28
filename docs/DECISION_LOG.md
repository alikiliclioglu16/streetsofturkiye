# Decision Log

## D-001 — New application, legacy preserved

The original HTML is a source and reference. Production development takes place in a new maintainable application.

## D-002 — Stylized realism

The project does not pursue photorealistic digital twins. It uses recognizable, materially convincing, child-friendly stylized realism.

## D-003 — Compact curated routes

Each city is a 3–5 minute curated environment, not a full open world.

## D-004 — Data-driven engine

A city is added through validated content and asset manifests, not custom engine code.

## D-005 — Three-city vertical slice first

İstanbul, Nevşehir and Gaziantep are the only cities developed to final pilot quality before expansion.

## D-006 — Region-based progression

The final progression system allows regional starts rather than forcing one uninterrupted 81-city sequence.

## D-007 — Meshy as source, not final pipeline

Meshy outputs require review, optimization, naming and validation before integration.

## D-008 — Placeholder-first engineering

Missing final models must not block engine development.

## D-009 — Interaction before information card

The user performs a meaningful action before receiving the concise fact and collectible.

## D-010 — Bilingual-ready architecture

Content is structured for Turkish and English even when a translation is initially missing.

## D-011 — Canonical content authority (27 Jul 2026)

Uploaded HTML content is the sole canonical source. The former
two-questions-per-city rule is retired.

`content/canonical/`, extracted deterministically from `legacy/index.html`
(SHA-256 `ed74da639543bd1847d3e970f114e006ec9be8a8d441197a1968afca5a07f995`),
holds all educational and cultural content and is read-only. Technical 3D data
moved to `content/scenes/` and references canonical records through
`contentRef`. Quiz cardinality follows the source exactly: 78 cities with one
question, 3 with two, 84 in total.

Consequence: `content/pilot/` and the hand-authored pilot strings are retired.
`REQUIRED_QUIZ_ITEMS` and `meetsQuizStandard()` are removed. A validator fails
the build if the source SHA changes, counts drift, a canonical string is edited,
a `contentRef` dangles, or a scene file duplicates canonical prose.

## D-012 — Hero characters (27 Jul 2026)

Keloğlan and Nasreddin Hodja are production hero characters. Their approved mesh
budget is approximately 180k–250k triangles each. The engine loads one hero by
default and adapts environment quality before reducing character quality.

The former 35k-triangle character budget is retired for these two assets only.
The Keloğlan merged-animation GLB (~222,150 triangles, ~16.7 MB) is approved for
production, subject to runtime QA. No low-poly hero variant may be produced
without separate project-owner approval.

Consequence: quality settings became `high` / `balanced` / `safe` profiles that
differ in environment cost alone. The degradation ladder — post-processing,
decoration density, shadow-map resolution, nonessential shadows, device pixel
ratio, distant assets — deliberately contains no character entry. Map and
collection routes use 2D portraits. `allowTwoHeroScene` defaults to false.

## D-013 — Nasreddin Hodja does not dance (27 Jul 2026)

The two hero guides celebrate differently, and that difference is character,
not decoration. Keloğlan draws from an approved dance pool with a replay
button. Nasreddin Hodja plays a measured `Agree_Gesture` then `Wave_One_Hand`
and returns to idle; he has no dance pool and no replay button.

Celebration behaviour is resolved from a per-hero policy in the hero registry,
never from a per-character branch in a component, so a third guide needs only a
policy entry.

Deviation on record: the delivered `Agree_Gesture` runs 13.0 s, which would hold
the completion panel back for 17 s. It is capped at 4 s through
`maxDurationSeconds` in the registry. Removing that entry restores the full
clip.

## D-014 — The product ships in English (27 Jul 2026)

The audience is American children being introduced to Türkiye. The canonical
content is English throughout, so the interface is English too. The previous
mix — Turkish buttons wrapped around English fact cards — was the worst of both
and is retired. The language toggle is removed.

The locale layer stays: canonical records keep their `tr` field, `t()` still
runs the fallback chain, and `LOCALES` still lists both. A Turkish edition
therefore remains a content project rather than a rewrite.

## D-015 — İstanbul is finished before any other city opens (27 Jul 2026)

Phase 02 is not started. `PLAYABLE_CITY_IDS` holds İstanbul alone. Nevşehir and
Gaziantep keep their canonical content and validated scenes, and the test suite
keeps checking both, but they stay closed until one province proves the whole
experience end to end.

## D-016 — Guided mode is removed (27 Jul 2026)

There is one way to move: the player walks. Guided mode was a second movement
system that had to be kept correct in parallel — it was the source of the
unreachable-last-stop bug and it stalled in the field — and it earned its
complexity nowhere, because arriving at a stop now opens the interaction on its
own.

`ControlMode`, the settings toggle and `engine/controls/guided.ts` are deleted.
The route markers stay: they are how a child sees where to go next, and a
validator rule still requires every stop to sit on that path.

## D-017 — Telemetry can be opened in production (27 Jul 2026)

`?debug=1` shows the performance overlay on a deployed build. The overlay was
development-only, which meant its numbers could never be read from the site
where they actually matter. It reveals nothing about the player and changes no
behaviour.

## D-018 — Quality adapts to measured frames (27 Jul 2026)

The first field reading was 19 fps on the `high` profile, which detection had
chosen from core count. Detection stays, but it is now a starting guess rather
than a verdict: sustained frames below 28 step the profile down.

The same reading showed the guide accounts for roughly three quarters of the
triangles on screen and the graybox environment for about 1,500. The ladder's
first two rungs therefore buy nothing here; device pixel ratio and the hero's
shadow are the real levers. Below the top profile the hero's real shadow is
replaced with a blob shadow, which costs two triangles and keeps him grounded.

The hero mesh is still never reduced.

## D-019 — Delivered materials are corrected in the registry (27 Jul 2026)

Nasreddin Hodja's GLB carries `alphaMode: BLEND` on a texture whose most
transparent pixel is 82% opaque. three.js renders a transparent double-sided
material in two passes, so the export artefact cost a full extra pass of a
197k-triangle mesh — half the character's entire frame cost, for nothing.

The registry now records a per-hero material correction with the measurement
that justifies it, and the engine applies it on load. The delivered file is not
modified: the correction lives in code where it can be read, tested and undone.

This does not touch the mesh. D-012 stands.

## D-020 — One quality configuration (27 Jul 2026)

Quality profiles are removed. With the hero's material corrected the scene holds
60 fps at full quality — 396,232 triangles, device pixel ratio 2, shadows on —
so three profiles only bought differences nobody could see, and three code paths
to keep correct. `QUALITY` is a single object and the settings panel no longer
offers a choice.

The adaptive stepping added earlier is removed with them. It existed to rescue a
19 fps reading that turned out to be the celebration close-up before the
material fix, and no longer reproduces.

Open risk, stated plainly: nothing has been measured on a phone. A single
full-quality configuration means a weak device has nothing to fall back to. If
mobile measurement shows a problem, the answer is to bring back a reduced device
pixel ratio — not to touch the hero mesh.

## D-021 — Correct answers must not look different (27 Jul 2026)

Interaction options were styled with the correct one filled and the rest
outlined, which told the child the answer before they read it. Every option now
renders identically. This is a rule, not a fix: no interaction may distinguish
the correct option by colour, weight, order or position.

## D-022 — No jumping (27 Jul 2026)

Jumping is removed. Neither delivered hero has a jump clip, so a hop played the
walk or run animation in mid-air, which looked wrong. Movement is walking and
running only. If a jump is wanted later it needs a `Jump` clip in the Meshy
export first, not a physics change.

## D-023 — Stops present, they do not examine (27 Jul 2026)

A stop shows the guide's line, the category badge, the title, the description
and a "Collect …" button. There is no question at a stop. Questions belong to
the Quiz Gate at the end of the street, where the source puts them.

An earlier build asked a find-the-object question at every stop, with options
synthesised from other stops' collectibles. That mechanic was invented: the
source's `arriveStop` presents and offers the item. It is retired, along with
the inspect-and-find markers in the scene.

## D-024 — Presentation content is extracted too (27 Jul 2026)

The first canonical extraction took stops, quiz questions and guide lines. It
left behind the map of Türkiye, the guides' greetings and the category badges,
which are equally authored. They were rebuilt by hand and came out wrong: a
scatter of dots with no country behind it, and a stop's line used as a city
welcome.

`scripts/build-presentation.mjs` now extracts them from the same file under the
same SHA into `content/canonical/presentation.json`. The map projection —
`x = (lon − 25.55) × 50`, `y = 30 + (42.25 − lat) × 65` — comes from the source
as well, because the dots have to land on the coastline.

## D-025 — Left and right turn the guide (27 Jul 2026)

Left and right rotate the guide instead of sidestepping, so the player can turn
around and see his face. Movement keys are read from `event.code` rather than
`event.key`: holding Shift turned `w` into `W`, so the key released never
matched the key pressed and the guide walked on forever.

Clip selection gained hysteresis. A single speed threshold made the animation
flip many times a second around the boundary, and with a cross-fade on each flip
every action could reach zero weight — the guide snapped to his bind pose and
slid along the ground.

## D-026 — Settings only shows what works (27 Jul 2026)

The audio toggles are removed. There is no audio in the build, so three switches
that changed nothing were on screen. They come back when sound does.

## D-027 — The camera orbits, the guide turns (28 Jul 2026)

Dragging the camera used to change the guide's heading, so the camera stayed
locked behind his shoulders and his face was never visible. Drag now orbits the
camera around him; the turn keys still turn him. The orbit eases back behind him
while he walks, so a child cannot get stuck facing sideways.

The celebration camera goes round to his front. A celebration is about the
character's face.

## D-028 — A watchdog, not another theory (28 Jul 2026)

The guide kept reaching his bind pose — arms out, sliding along the ground —
after finishing a stop. Two causes were fixed by reasoning and it kept coming
back, so the outcome is now checked directly: twice a second, if no action is
driving the skeleton, idle is started.

The one-shot clips also stopped clamping. A clamped action holds its weight
forever and blends into whatever plays next, which is one way to arrive at a
pose nobody authored.

