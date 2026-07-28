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

## D-029 — A nod is cosmetic; a celebration owns the screen (28 Jul 2026)

The guide glided in a held pose for five seconds after every stop. The cause was
not the animation system: the success nod was written to outrank locomotion, and
a child collects and walks off immediately, so `Agree_Gesture` blocked the walk
clip until its own cap expired. Five seconds was exactly the cap plus its fade —
the number is what identified it.

One-shot beats are now either locked or not. A celebration is locked: input is
already frozen and the performance is the whole screen. A success nod is not:
walking cancels it.

The city completion no longer fires a nod at all. It has its own choreography,
and two systems driving the same clip cancelled each other — which is why no
celebration ever played.

## D-030 — Stops do not applaud (28 Jul 2026)

The per-stop success nod is removed entirely. A stop presents its place and
hands over the collectible; that is the whole beat. The nod was never asked for,
it delayed the walk, and it was the cause of the guide gliding in a held pose.

## D-031 — The celebration runs on time, not on reports (28 Jul 2026)

The completion sequence advanced when the camera reported it had arrived and
when the mixer reported a clip had ended. Both reports can simply not arrive —
a placeholder guide has no mixer at all — and three attempts to fix the
resulting stall failed because each one added another report to trust.

It now runs on a clock: 0.9 s to frame, 2.6 s per beat. The clips still play,
but nothing waits for them. Worst case for a child is under seven seconds to
the summary panel, whatever the 3D layer does.

## D-032 — The street kit is shared across all 81 provinces (28 Jul 2026)

Lamps, benches, planters, crates, stalls and cats are one model each for the
whole country; regional character comes from material and from what is placed on
them. Only the five stop objects are İstanbul-specific.

A kit per province would be roughly 400 models. Sharing them is roughly 60. A
child does not notice that Trabzon's bench is Konya's bench; they notice whether
the street has benches.

## D-033 — Saved progress is reconciled, never trusted (28 Jul 2026)

`CityProgress` carries a schema version, and every city entry runs the save
through `reconcileProgress`. Hotspot and reward ids the city no longer
recognises are dropped, and the completion flags are recomputed rather than
read.

This had already failed in the field: a save from the three-stop İstanbul made
the five-stop city report itself finished on arrival, and the only escape was
resetting progress. Content outlives no save; a save must never outrank content.

## D-034 — Delivered props are registered apart from the Meshy brief (28 Jul 2026)

`asset-manifests/pilot-assets.csv` is the brief for the three pilot cities'
commissioned art. It is not a record of what has shipped, and reusable kit props
do not belong in it. Delivered props live in `DELIVERED_PROPS` in the asset
registry, carrying the file's SHA-256, triangle count, byte size and measured
dimensions.

Street dressing is scene data: `props` in a scene file is a list of asset id,
position and rotation. Dressing a street is editing data, not code.

## D-035 — Models are ground-aligned by measurement (28 Jul 2026)

`AssetInstance` measures a mounted model's bounding box and lifts it so its
lowest point rests on y = 0, when the registry entry asks for it. The first
delivered lamp had its base 1.5 m below its origin.

Measured rather than stored, because Meshy centres an origin about as often as
it grounds it, and because the correction costs nothing when the pivot is
already correct. Commissioned city art is authored grounded and is not moved.

## D-036 — Shared kit props stay under 2 MB (28 Jul 2026)

The first street lamp was 8.36 MB for 1,834 triangles: the geometry was 2% of
the file and four 2048 textures were the rest. Re-exported at 1024 it is
1.31 MB, a 6.4× reduction on a prop a child walks past at three to five metres.

Every shared kit prop is now held under 2 MB, and a test enforces it. Six props
at the original size would have added 50 MB to the repository for objects nobody
stops to look at.

## D-037 — A delivered prop's own scale is trusted (28 Jul 2026)

Height normalisation exists for models whose scale cannot be relied on. A prop
that has been measured and recorded is not one of those, so `AssetInstance` no
longer normalises delivered props against a briefed height.

Normalising a 5 m lamp and a 0.9 m bench towards anything in common would
flatten exactly the difference that makes a street read as a street.

## D-038 — The graybox facing indicator is gone (28 Jul 2026)

A dark cone sat at the guide's feet, pointing the way he faced. It existed
because a featureless placeholder cylinder had no readable front. A character
with a face, a turban and a robe does not need an arrow on the pavement, and it
looked like debris in front of him.

## D-039 — Props cast contact shadows (28 Jul 2026)

Street props rendered without shadows and read as hovering, even though every
base was measured onto y = 0. A contact shadow is what tells the eye that an
object is standing on the ground; grounding it in the transform is not enough if
nothing it casts reaches the floor.

Two kit props add roughly 3,400 triangles to the shadow pass, against the
guide's 197,000. The cost is not the consideration here.

## D-040 — The ground is generated, not commissioned (28 Jul 2026)

The street surface is the largest thing on screen and was a flat colour, which
left every prop looking like it hovered over a void however carefully its base
was measured onto y = 0.

It is a material problem, not a model problem, so it is generated by
`scripts/build-ground-texture.mjs` rather than sent to Meshy: a Voronoi cobble
pattern wrapped on a torus, with a normal map derived from the height by a
wrapped Sobel. Albedo, normal and roughness together are 368 KB — smaller than
one kit prop, for the surface the child looks at most.

The maps are greyscale and the region's own ground colour tints them at render
time. One texture set therefore serves all 81 provinces, and Cappadocia still
reads as Cappadocia.

## D-041 — Everything solid has a footprint (28 Jul 2026)

Street props were added after the collision system and nobody gave them
colliders, so the guide walked through lamp posts and benches. A prop's
footprint now comes from its registry dimensions, and rotating it takes the
axis-aligned bounds of the rotated rectangle rather than assuming a square.

A prop can opt out with `solid: false`. The street cat does: a child walking
through a cat is what cats allow, and a collider on a moving animal would be an
obstacle that wanders.

## D-042 — Skinned models are cloned with SkeletonUtils everywhere (28 Jul 2026)

`AssetInstance` cloned with `Object3D.clone`, which keeps a reference to the
original bones and leaves the copy's own skeleton driving nothing. That is what
rendered Nasreddin Hodja 1.7 cm tall, and it was fixed only in the hero
component at the time.

The street cat is skinned too — 27 joints, the same centimetre-space rig — so
the same bug was waiting. Every model clone now goes through
`SkeletonUtils.clone`, which is harmless on unskinned props.

## D-043 — The application moves the cat; the clip moves its legs (28 Jul 2026)

The delivered walk cycle is in place, and the engine translates the cat along a
short authored route. Applying the clip's root motion as world movement on top
of that would make the paws skate.

The clip runs only while the cat is walking. There is no idle in the delivered
file, so a pause holds a stable frame of the walk rather than pretending the
walk is an idle.

## D-044 — The cat is scaled to its brief, not to its file (28 Jul 2026)

The delivered cat renders about 1.7 cm tall: its armature is scaled to 0.01 and
its joints are in their own small units, so unlike the guides the two do not
cancel. It was in the scene from the first integration and simply too small to
see.

`StreetCat` measures the mounted model and scales it to the briefed height. This
narrows D-037 rather than contradicting it: a delivered prop's own scale is
trusted when the file is authored at world scale, and this one is not. Measured
correction beats a stored number either way — it becomes a no-op if the asset is
re-exported correctly.

## D-045 — Five cats, five skeletons (28 Jul 2026)

Five cats walk İstanbul, scattered along the length of the street and on both
pavements. One GLB is fetched once and cloned per cat, so five cats cost one
0.97 MB download.

Each clone carries its own skeleton and its own mixer. Sharing either would make
five cats move as one animal, and sharing a skeleton is the bug that rendered
the guide at bind pose. Their walk cycles are phase-offset so they do not step
in unison like a parade.

Cost: five cats add about 96,000 triangles, roughly half the guide. Worth
knowing before a sixth is added.

## D-046 — The camera comes in (28 Jul 2026)

Every object in the street was the size it claimed and the whole scene still
read as a model seen from across a room. The cause was framing, not scale: at
7.5 m back, 3.4 m up and a 55° field of view, a 1.65 m guide filled about a
fifth of the frame. Third-person framing usually puts the character between a
quarter and two fifths of frame height.

Now 5.2 m back, 2.3 m up, 50° — about a third. Stop camera anchors moved in to
match, so arriving at a stop does not suddenly feel further away than the walk
to it.

## D-047 — Cobbles are 44 cm, not 28 (28 Jul 2026)

Fine repeating detail makes a surface look large and everything standing on it
look small. Realistic 28 cm cobbles worked against the sense of scale the
camera change was trying to restore, so the generator lays 9 stones per 4 m
tile instead of 14.

Larger than a real cobble, and correct for a game a six-year-old is looking at.

## D-048 — Over-budget models are simplified in-project (28 Jul 2026)

The simit cart arrived at 969,492 triangles and 31.33 MB against a brief of
3,000-6,000. Dropped in as delivered it would have taken the frame from 50 fps
to roughly 12: one cart costing five times the guide.

`scripts/simplify-model.mjs` reduces geometry through meshoptimizer and textures
through sharp. The cart came out at 20,182 triangles and 1.45 MB — a 48× and 21×
reduction — with its world size, opaque material and grounded pivot intact.

The delivered file is never overwritten. The simplified copy goes to
`public/assets` and the original stays where it was delivered, so the decision
is reversible and the reduction is reproducible.

Sending it back would also have been reasonable. Simplifying it here was faster
and it costs nothing to redo if the source is ever re-authored properly.

## D-049 — Paving relief is shallow (28 Jul 2026)

The first cobblestone pass used a normal strength of 6.0 and mortar that fell to
30% brightness. On screen the street read as cracked earth: every joint became a
black canyon. Strength is now 1.6 and mortar sits at 62%.

A cobbled street has shallow relief. The texture is meant to say "paving", not
to be looked at.

## D-050 — Landmarks are at storybook scale (28 Jul 2026)

Galata Tower is 4 × 4 × 14 m in the manifest, not 9 × 9 × 32. The real tower is
67 m; a 32 m model filled the stop camera with masonry and the child never saw a
tower at all.

At 14 m it is still the tallest thing on the street by a wide margin — eight
times the guide and nearly three times a street lamp — and all of it fits in one
shot. This is children's-book proportion, not a mistake about İstanbul, and the
source prototype drew its landmarks the same way.

## D-051 — The stop camera is derived from the object (28 Jul 2026)

A fixed camera distance cannot frame both a 2.2 m simit cart and a 14 m tower.
At the old fixed 5.65 m only 5.3 m of height was visible, so even at storybook
scale the tower would have overflowed.

Each stop's camera distance now comes from its object's height, framing it to
about 85% of frame height: 5.8 m for the tile panel and the cart, 6.9 m for the
bazaar, 8.3 m for the ferry, 19.9 m for the tower. A test checks that every stop
object in every city fits inside its own shot.

The guide is small in a landmark shot. That is what looking up at a landmark is,
and it lasts only while the stop is open.

## D-052 — Blocked animations leave the file (28 Jul 2026)

The soldier shipped with twenty clips: attacks, an archery shot, a spartan
kick, a chest-pound taunt, a sword shout. Fourteen were on the delivery's own
blocked list.

They are stripped from the delivered GLB, not merely avoided in code. A rule
that lives only in a component is a rule someone breaks later without reading
the component, and this is a street a six-year-old walks down.

Two clips the manifest approved were also declined: `Axe_Breathe_and_Look_Around`
and `Combat_Idle_Turn_Left`. Both are idles rather than attacks, but a soldier
holding an axe buys nothing here. The engine plays `Idle_9` and
`Look_Around_Dumbfounded`.

Pruning clips also shrank the three files from 11.48 MB to 6.96 MB — the
animation data was most of the weight.

## D-053 — Trees are generated (28 Jul 2026)

A tree is a trunk and a few masses. At this art level that is geometry, not a
texture, so the street's greenery is generated in the renderer: three
silhouettes — cypress, plane, shrub — with varied scale and angle, about 250
triangles each.

Nineteen trees cost 4,750 triangles, less than a quarter of one street cat. A
street planted with one repeated shape reads as wallpaper, which is why there
are three.

## D-054 — NPCs stand beside their stop, never on the walk (28 Jul 2026)

A soldier at the tower gate, a traveller at the bazaar entrance, a craftsman
beside the simit cart, as the owner placed them. Each stands to one side: a
person on the pavement in front of a stop becomes an obstacle a child tries to
walk through, and the stop cameras now sit as close as 5.8 m.

The generator checks the distance to the route and drops any placement closer
than 2.5 m. The first attempt put the craftsman 0.4 m off the centre line.

They hold their post rather than wander. `Walking` is on their whitelist because
the model ships with it, but playing a walk cycle on the spot is exactly the
skating the cat integration avoided.

## D-054 — Simplification locks UV seams (28 Jul 2026)

The first optimised Galata Tower came back at 34,313 triangles with 448 px
textures and rendered as a white, holed shape with no tower in it. Two causes:
the simplifier had welded across UV and material seams, tearing the texture,
and 448 px was far too little for a 14 m landmark.

The shared simplifier now runs with `lockBorder: true` and a tighter error
tolerance, and the tower is kept at 70,462 triangles with 1024 textures —
2.67 MB from a 469,784-triangle, 23 MB source.

The lesson is about choosing the ratio, not about the ratio. A cart is still a
cart at 20,000 triangles. A tower needs its gallery, its conical roof and its
finial, and loses all three long before the triangle count looks alarming.

## D-055 — The 2 MB rule is about repetition (28 Jul 2026)

The under-2 MB rule applies to `kit_` props, which ship to all 81 provinces and
whose cost is therefore paid 81 times. A `city_` landmark appears once and is
budgeted separately, under 4 MB.

Galata at 2.67 MB would have failed a blanket rule, and enforcing it would have
meant a worse-looking landmark for no real saving.

## D-056 — The tower carries its detail in texture, not geometry (28 Jul 2026)

Three versions were measured before one was kept.

| | Triangles | Size | Textures | Outcome |
|---|---|---|---|---|
| First optimisation | 34,313 | 1.65 MB | 448 px | White, holed, no silhouette |
| Rebuilt from source | 70,462 | 2.67 MB | 1024 px | Silhouette intact |
| Third delivery | 7,003 | 23.09 MB | 4096 px | Kept, after recompression |

The third was chosen by the project owner. Its geometry is very low for a tower
— a tenth of the version rebuilt from source — so its detail lives in the colour
map rather than in the mesh. The file was 23.09 MB because those maps were
4096 px PNG, larger than the original Meshy source.

Textures are now sized by role rather than uniformly: 2048 for the colour map,
which is what a 7,000-triangle tower has left to read by, and 1024 for normal,
roughness and metallic, which describe surface response and not shape. 23.09 MB
to 2.68 MB.

Worth knowing if the gallery railing or the finial read poorly: the 70,462
version is reproducible from the Meshy source with one command, and the
difference will be in the silhouette rather than the surface.

## D-057 — Textures are sized by role (28 Jul 2026)

Four deliveries in a row arrived with the geometry inside budget and the
textures far outside it: the simit cart at 31 MB, the tower at 23 MB, the bazaar
gateway at 52 MB, the cypress planter at 8.4 MB. In every case four maps at the
same large size.

Only the colour map carries what a child sees. Normal, roughness and metallic
describe how a surface responds to light, not what shape it is, and half the
resolution is invisible on an object seen from five metres. Compression is now
per slot rather than uniform:

| | Colour | Others | Result |
|---|---|---|---|
| Bazaar gateway | 2048 | 1024 | 52.08 → 1.90 MB |
| Galata Tower | 2048 | 1024 | 23.09 → 2.68 MB |
| Cypress planter | 1024 | 512 | 8.40 → 0.65 MB |

The planter takes the smaller pair because it is a `kit_` prop and its cost is
paid in all 81 provinces.

## D-058 — The registry is checked against the files (28 Jul 2026)

Two props were registered twice, and the older copy carried a checksum from a
superseded compression. Nothing failed: the app read whichever entry came first
and a stale checksum looked exactly like a verified one.

Three tests now bind the registry to disk — every delivered file exists, its
byte count matches, its SHA-256 matches, and no id is registered twice. A
checksum that is not checked is worse than no checksum, because it reads as
evidence.

## D-059 — İstanbul gets a sea (28 Jul 2026)

The last stop is a ferry and there was no water: a ferry moored on grass reads
as a mistake before a child can name why.

The sea is a plane starting exactly at the play boundary, so a child walks to
the quay edge and stops there. It needs no collider — the boundary already
holds them — and it is the one city that gets one. Nevşehir is in Cappadocia
and a test keeps it dry.

The Maiden's Tower stands offshore on that plane, 36 m past the quay, where it
belongs.

## D-060 — Scenery is not solid (28 Jul 2026)

The Beyoğlu facades and the Maiden's Tower are backdrop: seen, never reached,
never collided with. A child who walks to the edge should be stopped by the
boundary, not by a building they were never meant to arrive at.

Backdrop pieces also cast no shadow. They stand beyond the shadow camera's
useful range, so the cost would buy nothing.

## D-061 — Hagia Sophia is 8 m because it is broad, not because it is small
(28 Jul 2026)

The proportions invited 12 m, which would have made it 21 m deep. Its trigger
ring then reached into the tower's — the two stops are 18.8 m apart — and
swallowed the lamps, benches and cat routes at the top of the street.

At 8 m it is 13.4 by 14.3, still the widest thing a child meets, and the street
around it survives. Landmark scale is bounded by the stop layout, not only by
what the model would like to be.

## D-062 — The scene builder reads delivered sizes (28 Jul 2026)

A stop's collider came from the manifest or the graybox table while its model
came from the delivered file, so Hagia Sophia rendered at one size and was solid
at another. The builder now prefers the delivered footprint.

The numbers live in `scripts/lib/manifest.mjs` as well as the registry, because
the build runs before TypeScript exists. A test asserts the two never drift: a
stop whose collider and model disagree is a stop the player walks into.

## D-063 — The street starts 26 m from the spawn (28 Jul 2026)

The first stop was 8 m from where the child appears, which put the face of a
14 m-deep Hagia Sophia less than a metre away: the guide arrived already
touching a building, with nowhere to stand and look.

The street now begins at 26 m. Three tests hold it there — the spawn is inside
nothing, has more than five metres of clearance, and can be walked out of in
every direction. The last of those caught a real regression while it was being
written: a bulk shift of the dressing had moved the spawn itself from the origin
to within a metre of the mosque.

## D-064 — The grey boxes are gone (28 Jul 2026)

Twenty-four procedural grey boxes stood in for scenery from the graybox era.
There is real dressing now — lamps, benches, planters, stalls, crates,
fountains, a tram, a dock — so the filler is deleted rather than left as
something to explain. A test asserts every placed prop resolves to a delivered
model, so filler cannot creep back as a placeholder.

## D-065 — İstanbul keeps a few props of its own (28 Jul 2026)

The kit is shared across all 81 provinces, but a red Beyoğlu tram and a stone
dock belong to İstanbul and to no other city. They are registered as `city_`
props rather than `kit_`, which also puts them under the landmark size budget
rather than the shared one.

## D-066 — The stop is the tile panel; the mosque is behind it (28 Jul 2026)

Hagia Sophia was the object at stop 1 and it did not work. As a stop object it
had to fit a trigger ring between two neighbours 18.8 m apart, which held it to
8 m — too small to be a mosque, and still large enough to loom over a child who
had only just arrived.

The canonical stop is about the dome and the twenty thousand İznik tiles inside
it, and the reward is a blue İznik tile. So the object a child walks up to is a
1.5 by 2.2 m tile panel at their own height, and the mosque stands behind the
top of the street as scenery — outside the play area, freed from a trigger ring,
12 m tall because nothing now constrains it.

This is what the asset specification asked for in the first place: *the object
at this stop is not the building*. It took building it the other way round to
see why.

## D-067 — Backdrop is where landmarks get to be large (28 Jul 2026)

A landmark's size is bounded by whether a child has to stand next to it. As a
stop object, Galata is 14 m and Hagia Sophia was 8. As scenery, the mosque is
12 m and 20 m wide, and the Beyoğlu rows are 27 m across.

Scale follows role, not importance.

