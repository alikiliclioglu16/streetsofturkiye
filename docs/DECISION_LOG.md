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

## D-068 — A terminal stands in for the ferry (28 Jul 2026)

The last stop is about crossing the Bosphorus and the boat was never delivered.
A Kadıköy ferry terminal took its place: it is where a child would board one, it
belongs on the quay rather than on grass, and at 13.9 by 8.9 m its trigger ring
is smaller than the 20 m boat's was.

`city_istanbul_ferry` stays in the manifest as an unfulfilled brief. Deleting
the row would close the gap quietly; leaving it makes the substitution visible,
and a test asserts no stop uses it.

With this, every one of İstanbul's five stops points at a file that exists.

## D-069 — There is ground behind the child (28 Jul 2026)

The play area ended ten metres behind the spawn: a child who turned round saw
the world stop. It now runs 42 m back, and that space is a square rather than
spare ground — Hagia Sophia closes it and the tram waits at its edge, so the
child begins as if they had just stepped off it.

The mosque moved from backdrop to a solid prop on that square. Placing it
outside the play area had put it past the edge of the ground entirely, floating
over nothing. A building a child can walk through is worse than one they cannot
reach, so it is solid, and at 10 m it shares a square rather than dominating a
horizon.

## D-070 — Clearance is measured against the route, not against x = 0 (28 Jul 2026)

Props were kept 3.5 m from the centreline, which is a fair approximation while
the walk runs down the middle — and wrong everywhere else. It refused to let
the mosque close the square head-on, because the square is at x = 0 even though
the route never reaches it.

Clearance is now measured against the route polyline itself. The rule says what
it always meant: nothing stands where the child walks.

## D-071 — Texture budget follows viewing distance (28 Jul 2026)

Hagia Sophia was recompressed to a 1024 colour map when it was scenery behind
the street. Once it moved onto the square, a child walks up to it, and 1024
across a 17 m facade is about 60 pixels per metre. It looked poor, and rightly.

The second delivery is kept at 10,094 triangles with a 2048 colour map: 2.94 MB
against a 4 MB landmark budget.

The rule that comes out of it: texture resolution follows how close a child gets,
not how important the object is. The tower is glimpsed from 20 m and does fine
on 2048; the tile panel is studied from two metres and needs no more than 1024
because it is 1.5 m wide.

## D-072 — The hero mesh budget is revised (28 Jul 2026)

D-012 set the hero budget at 180,000-250,000 triangles and forbade a low-poly
variant without the owner's approval. That approval is given, and the budget is
now 70,000-120,000.

The original range came from a delivery brief, before anything had been measured
against a download. Nasreddin Hodja at 197,482 triangles was 18.95 MB — 38% of
everything a child downloads for a city, on a product aimed at tablets.

| | Before | After |
|---|---|---|
| Nasreddin Hodja | 197,482 tris, 18.95 MB | 88,866 tris, 4.86 MB |
| Keloğlan | 222,150 tris, 15.95 MB | 99,966 tris, 4.40 MB |
| One İstanbul visit | 49.30 MB | 35.21 MB |
| Hero share of a frame | 394,964 tris | 177,732 tris |

Both keep their 24-joint skeleton, their skin weights, their measured 1.700 m
height and every clip — seven for the Hodja, twelve for Keloğlan. Verified after
the fact rather than assumed.

Half the saving was texture: two 2048 RGBA PNGs at 5 MB each, on a material the
engine already forces opaque, so the alpha was carrying nothing.

**What has not changed:** the renderer still never reduces the hero. Quality
profiles, degradation ladders and adaptive stepping remain forbidden from
touching the mesh. This is a change to what is authored, not to what the engine
may trade away while a child is playing.

## D-073 — The route steps round each stop (28 Jul 2026)

A simulated playthrough found the route markers leading a child into Galata
Tower. Each stop contributed one waypoint, standing in front of the object; the
leg from there to the next stop ran straight through the object itself. It had
been harmless while nothing was solid, and became a wall the moment props and
stops got colliders.

Each stop now contributes two waypoints: where you stand to look at it, and a
point clear of its far side, offset towards the centre of the street where
there is always room.

The test that found it is worth more than the fix. It is the first one that asks
the whole question — arrive, walk the markers, meet five stops, collect five
things, pass the quiz, win the star — using the functions the running game uses
rather than checking a rule in isolation.

## D-074 — Sound, and none of it is a file (28 Jul 2026)

Three channels, because people mute for different reasons: a parent may want
the room quiet without taking the guide's voice from a child who cannot yet read
fluently, and a child replaying a city may want the guide quiet without losing
the seagulls. The settings switches are back, and this time they control
something (D-026 removed them for controlling nothing).

Every cue is synthesised. Collect, correct, retry and city-complete are a few
triangle oscillators on a pentatonic set — no semitone clashes, so two cues
overlapping never sounds like a mistake. The ambience is filtered brown noise
with a slow swell: not the sound of any particular thing, but enough open air
that a street stops feeling like a room.

Cost: **zero bytes.** Recorded seagulls, a ferry horn and the guide's voice land
on top of this later; the bed and the interface never need to be files.

The wrong-answer cue is deliberately not a buzzer. A child who gets a question
wrong in a learning game should hear something neutral and try again.

Audio unlocks on the intro button, which is the one gesture a browser needs. A
context opened earlier stays suspended for the whole session — silence with
nothing to explain it.

## D-075 — Trees are instanced and stop casting shadows (28 Jul 2026)

Twenty-one trees rendered as separate groups cost sixty-three draw calls, more
than half the frame's total, for under four thousand triangles. They are three
shapes repeated. Instanced, they cost three.

They also stop casting shadows, along with the cats. Twenty-one canopies and
five animals in the shadow pass bought a dappling nobody asked for on a street
that already has shadows from everything a child walks up to.

## D-076 — The cat is simplified (28 Jul 2026)

Five cats were 96,515 triangles — more than the guide, on a 40 cm animal
delivered at 19,303 against a 800-1,500 brief. Simplified to 7,199 with the
skeleton, the twenty-seven joints and the walk clip intact: five cats are now
35,995.

Flagged twice before acting. It stopped being a note and became a number when
the street filled up and the frame fell to 17 fps.

## D-077 — Instances are grouped by colour, not coloured per instance (29 Jul 2026)

The first instancing pass gave every tree its colour through `setColorAt` on a
material with `vertexColors`. Every tree rendered black: the instance colour
attribute is added after the shader compiles, so the shader had nothing to read.

Instances are now grouped by colour, one plain material each — one group for
trunks and one per foliage tone. Four draw calls instead of three, against
sixty-three before instancing, and it cannot fail that way.

Worth remembering for the next batch of repeated props: group by material, and
do not reach for per-instance colour to save a draw call that was never the
expensive part.

## D-078 — The Beyoğlu row was a ferry (29 Jul 2026)

A file named `Beyoğlu` measured 2.24 : 1 : 0.50 — wide and shallow, which is
what a row of street fronts measures like. The name and the numbers agreed, so
it was registered as `city_istanbul_beyoglu_row` and placed twice as backdrop
without being looked at.

It was a ferry. Two of them stood beside the pavement, twenty-seven metres long
and four metres from the play boundary.

It is now `city_istanbul_ferry_boat`: one instance, 20 m at the hull to match
the 13.9 m terminal it sits beside, moored on the water off the quay. A ferry
beside a pavement reads as a mistake before a child can name why — the same
reason the sea was added in the first place.

**Measurement narrows an asset down; it does not identify it.** Every previous
delivery was checked against a claim about what it was. This one had no claim
beyond its filename, and the filename was wrong. Anything whose identity rests
on a filename gets asked about rather than assumed.

The facades are still wanted. `docs/BEYOGLU_FACADE_BRIEF.md` specifies them.

## D-079 — The flag stands in the same place in every city (29 Jul 2026)

`kit_turkish_flag` is placed by the scene builder for all 81 provinces, at the
same coordinates beside the spawn. Arriving anywhere in the country begins the
same way, and it is the first shared prop that is placed rather than merely
available. It is solid, so a child can walk up to it and no further.

## D-080 — İstanbul has a theme, streamed (29 Jul 2026)

A four minute recording of *Üsküdar'a Gider İken*, re-encoded from 4.53 MB of
MP3 to **1.60 MB** of Opus in WebM — a smaller file at higher quality than the
64 kbps MP3 it came from.

Music gets its own channel rather than sharing the ambience one: people mute a
song for different reasons than a background bed, and the theme sits quieter
than everything else by default. A theme a child hears for the fourth time
should be under the street rather than over it.

It streams through an `<audio>` element rather than being decoded into an
`AudioBuffer`. Decoded, four minutes of stereo is about 40 MB of memory, which
is not a thing to spend on a tablet. It fades in over four seconds, loops, and
ducks with the ambience when the guide speaks.

Scene data carries `musicUrl`, so the other 80 cities stay silent until each
gets a theme rather than inheriting İstanbul's.

**One thing for the owner to confirm:** the melody is traditional and long out
of copyright, but this particular recording has a performer and an arranger.
Worth being certain the rights sit with the project before publication.

## D-081 — The Beyoğlu row arrived, and it is a row (29 Jul 2026)

30.7 by 14 by 12.3 m, deeper than the 4 m the brief asked for. That turns out
not to matter: it stands beyond the play boundary where only its front is ever
seen, so the depth costs nothing but triangles it already had.

Two instances, one along each side of the walk. 25.01 MB down to 2.55 MB.

## D-082 — Ground is scenery; bounds are gameplay (29 Jul 2026)

They were the same rectangle, so anything standing outside the play area stood
off the edge of the world — the facades appeared to float over a strip of sky
with water showing under them.

The paving now runs 26 m past the boundary in every direction. The child still
stops where they always did; the world does not stop with them.

## D-083 — The street is closed on both sides (29 Jul 2026)

Two facade rows left gaps of open sky between them, which read as holes in the
city rather than as distance. Ten rows now run end to end down both sides.

A street a child cannot see out of is a street. One with blue slots in its walls
is a stage set.

## D-084 — Wind (29 Jul 2026)

The flag leans and the tree canopies sway: two sines at unrelated periods, so
the motion never visibly repeats, with a phase offset per object so twenty-one
trees do not lean in unison — which reads as an earthquake rather than a breeze.

Trunks hold still. A swaying trunk reads as a tree falling over.

The whole flag leans rather than its cloth rippling; rippling needs bones the
delivered file does not have, and at six metres a lean says wind well enough.

`sway()` is pure, so reduced motion is honoured by passing zero strength rather
than by threading a flag through every component that moves.

## D-085 — The tram runs its line (29 Jul 2026)

A tram parked at the kerb is a model of a tram. It now runs 120 m of the west
side, pauses four seconds at each end and comes back — which is what İstanbul's
nostalgic tram does, one street, all day.

It is not solid: a child who wanders on to the line should not be stopped by a
vehicle they cannot see coming. The step function is pure, so a tram that never
arrives or never turns round is a failing test rather than something to watch
for.

## D-086 — Cats are 60 cm (29 Jul 2026)

Raised by half again from 40 cm. The people the street was shown to could not
find them, which is the only measurement that mattered.

## D-082 — Ground is scenery; bounds are gameplay (29 Jul 2026)

They were the same rectangle, so anything standing outside the play area stood
off the edge of the world — the facades appeared to float over a strip of sky
with water showing under them.

The paving now runs 26 m past the boundary in every direction. The child still
stops where they always did; the world does not stop with them.

## D-083 — The street is closed on both sides (29 Jul 2026)

Two facade rows left gaps of open sky between them, which read as holes in the
city rather than as distance. Ten rows now run end to end down both sides.

A street a child cannot see out of is a street. One with blue slots in its walls
is a stage set.

## D-084 — Wind (29 Jul 2026)

The flag leans and the tree canopies sway: two sines at unrelated periods, so
the motion never visibly repeats, with a phase offset per object so twenty-one
trees do not lean in unison — which reads as an earthquake rather than a breeze.

Trunks hold still. A swaying trunk reads as a tree falling over.

The whole flag leans rather than its cloth rippling; rippling needs bones the
delivered file does not have, and at six metres a lean says wind well enough.

`sway()` is pure, so reduced motion is honoured by passing zero strength rather
than by threading a flag through every component that moves.

## D-085 — The tram runs its line (29 Jul 2026)

A tram parked at the kerb is a model of a tram. It now runs 120 m of the west
side, pauses four seconds at each end and comes back — which is what İstanbul's
nostalgic tram does, one street, all day.

It is not solid: a child who wanders on to the line should not be stopped by a
vehicle they cannot see coming. The step function is pure, so a tram that never
arrives or never turns round is a failing test rather than something to watch
for.

## D-086 — Cats are 60 cm (29 Jul 2026)

Raised by half again from 40 cm. The people the street was shown to could not
find them, which is the only measurement that mattered.

## D-087 — The tram was running sideways (29 Jul 2026)

The heading came from `atan2(dx, dz)`, which assumes a model whose nose points
along +Z. The tram is 4.8 m wide and 1.9 m deep, so its length lies along X and
it was crossing the street broadside while travelling down it.

The component now reads the footprint and adds a quarter turn when the model is
wider than it is deep. Reading the shape is more reliable than remembering a
per-asset convention, and it will be right for the next vehicle too.

## D-088 — The guide speaks, using the browser (29 Jul 2026)

`speechSynthesis` reads each stop aloud in English as it opens: the guide's
line, the title, then the fact.

Many six to ten year olds read slowly, and for a good number of them English is
the language of school rather than of home. A stop whose text is only read by
children who can already read it teaches the ones who least need teaching.

Browser speech rather than recordings: 249 stops across 81 cities is a serious
amount of studio time, and this costs nothing, ships nothing and works today.
Recordings can replace it later without the calling code changing — `speak()` is
the whole interface.

Details that matter more than they look:

- **Rate 0.92**, slower than a browser's default, which is pitched at adults
  skimming. A child following the text needs the words at reading speed.
- **A local voice is preferred over a network one.** A network voice pauses
  before it starts, and a guide who takes a second to begin reads as a guide who
  is buffering.
- **Speaking replaces rather than queues.** A child walking straight to the next
  stop should hear where they are, not wait out where they were.
- Speech does not run through the Web Audio graph, so the voice channel's mute
  and volume are applied on the utterance. The mute switch now controls
  something.

## D-089 — Sidedness is never forced off (29 Jul 2026)

Every delivered model had its material forced single-sided, to save fragment
work. That is right for a closed shape and destroys a thin one: a flag is a
single plane, and culling its back face draws half of it.

The Turkish flag on the Maiden's Tower and the flags on the ferry's masts were
torn in half. So, silently, was the standalone flag prop that stands in all 81
cities, and the canvas awning on the market stall.

All four are back to double-sided. The shared simplifier no longer touches
sidedness at all; it still forces `OPAQUE`, which is safe because a transparent
material costs two passes and this project has never needed one.

An audit of every delivered GLB is in the test suite now, so a thin-geometry
model cannot lose its back faces again without something failing.

The pattern behind it: an optimisation that is correct for the common case was
applied to everything without asking which case each model was.

## D-090 — Tapping the ground walks there (29 Jul 2026)

The whole game runs on a tablet, but the virtual stick takes getting used to —
and getting used to a joystick is not what this product is for.

Tapping the ground now sets a destination and the guide walks to it, sliding
along anything in the way. The stick stays for anyone who prefers it, and
touching it cancels the walk.

There is no pathfinding. The guide walks, slides, and gives up after three
seconds without progress — which looks like a child changing their mind and is
a great deal less code than a navigation mesh for a street.

## D-091 — Dressing is derived from the walk, not written per city (29 Jul 2026)

İstanbul's street was a list of hand-picked coordinates. That is fine for one
street and impossible for eighty-one.

The kit is now placed relative to the stops — lamps at a rhythm down both sides,
benches and planters offset from them, a market cluster where the walk is
busiest — and filtered by the checks that always applied. A city nobody has
touched still gets a furnished street.

Hand-placed props are added on top, for what a city has particular to say:
İstanbul's mosque, its dock, its tram line. Nothing İstanbul-specific reaches
another city, and a test holds that line.

## D-092 — Cities are planted like themselves (29 Jul 2026)

Trees were an İstanbul list. A street in Nevşehir lined with plane trees is a
picture of somewhere else, so the mix now comes from the region: poplars and
scrub on the Anatolian plateau, planes and cypresses on the Marmara coast.

A poplar was added for it — tall and narrow, and planted in lines across the
plateau exactly as it is in the model.

## D-093 — Nevşehir is open (29 Jul 2026)

The second city a child can walk into. Keloğlan guides it, the ground is
Cappadocian, the planting is Anatolian, and three of its five stop objects have
not been delivered and render as placeholders.

Opening it before its art is deliberate. The multi-city machinery — a second
guide loading, a second region's colour and planting, progress kept per city,
a street dressed without anyone placing a prop by hand — is worth proving on one
more real street before eighty are built on top of it.

A full playthrough of Nevşehir is simulated alongside İstanbul's: arrive, walk
the markers, meet all five stops, finish the city. It passes.

## D-094 — A finished city stays open (29 Jul 2026)

Entering a completed city dropped the child on the completion panel, whose only
button goes back to the map. A city they had finished was a city they could not
re-enter.

It now opens on the street. The summary is reachable from the HUD, and the panel
has a way back to the street as well as a way out. Stops already collected still
do not re-trigger on approach, but the prompt button gives another look — and
collecting one twice does not award it twice.

**Finishing something should not lock the door to it.**

A side effect worth recording: audio unlocks on the intro button, and a finished
city skips the intro. Without a fallback, revisiting a city would have been
silent with nothing to explain why. The first touch or key press anywhere now
serves as the gesture.

## D-095 — Each city has its own theme, or none (29 Jul 2026)

`CITY_THEMES` maps a city to its music. Nevşehir has *Gökyüzü Balonları*;
Gaziantep has nothing yet and stays silent rather than borrowing İstanbul's.

A Bosphorus song over Cappadocia is the audio equivalent of planting plane trees
there.

## D-096 — The ground follows the region (29 Jul 2026)

Nevşehir was paved in İstanbul cobbles. The ground is the largest thing on
screen, so it is the loudest place to get a region wrong — the same mistake as
planting plane trees there, only harder to miss.

A second surface is generated: red volcanic dust, layered noise at three scales
plus faint wind ripples, with no cells and no mortar because dust has no joints.
Greyscale and tinted by the region's own colour, exactly as the cobbles are.

It tiles at nine metres rather than four. A cobble is 44 cm and repeating it
every four metres is what a street looks like; dust has no unit, so the same
repeat reads as a pattern instead of as ground.

## D-097 — The air follows the region too (29 Jul 2026)

The ambience bed was a sea wash and it played over Cappadocia, three hundred
kilometres from any coast. Two profiles now: a low-passed swell for the coast,
a drier, higher, steadier wind for the plateau. Surf breathes; a plateau wind
does not.

The ground and the trees had already been taught not to lie about where a child
is. The air was still doing it.

## D-098 — Nevşehir's horizon (29 Jul 2026)

Every city needs four answered directions: walls to the sides, distance in
front, something to turn round to.

- **Sides:** ten fairy chimney ridges, five each side.
- **Back:** a Cappadocian valley behind the spawn square, where İstanbul has
  Hagia Sophia.
- **Front:** balloons, once delivered.

The ridge and the stop-1 cluster are the same file at two sizes — six metres to
be walked up to, seventeen to be seen across the street. One download, two roles.

## D-099 — The plateau ambience needed its floor removed, not its ceiling raised
(29 Jul 2026)

The first attempt at regional ambience only raised the low-pass corner, and
Cappadocia still sounded like the sea. The wiring was correct; the acoustics were
wrong.

What makes a noise bed read as surf is the rumble underneath it, and a low-pass
passes that untouched. The plateau profile now cuts the bottom out with a
high-pass at 520 Hz and uses far less integrated noise — brown noise *is* surf
whatever you filter above it. Wind over stone is mid and high, gusty rather than
breathing.

The test asserts the high-pass, not the ceiling, because that is the parameter
that decides it.

## D-100 — Streets after İstanbul are shorter (29 Jul 2026)

İstanbul walks eighteen metres between stops because İstanbul has that much to
look at. Everywhere else asks for eleven, and the play area narrows from 44 m to
30 m with it.

Spacing is *asked for*, then checked: two stops closer together than their
trigger rings would open each other, so the geometry has the last word. That
turned out to matter immediately — the first compact Nevşehir came out barely
shorter than İstanbul, because its stop objects were sized as landscape rather
than as things to stand beside.

The fairy chimney cluster went from 6 m to 4.5, and the tethered balloon from
11 m to 5. Nevşehir's street is now 56 m against İstanbul's 72, and Gaziantep's
is 22.

**The lesson is about where a constraint lives.** Asking for a shorter street
does nothing if the objects on it are too big; the spacing rule surfaced that
instead of quietly producing overlapping rings.

## D-101 — The valley is aligned by its edge, and it stops you (29 Jul 2026)

Placed outside the play area, the valley hung in the sky with nothing under it.
Placed with its centre on the boundary, its 78 m depth swallowed the spawn and a
child appeared inside a valley.

Its *near edge* is now aligned to the boundary, at both ends of the street, and
it is solid — so a child walks up to the rim of a valley and stops there, which
is what the rim of a valley is for. Half of it hanging past the paving is
expected: beyond the rim, the valley is the ground.

The paving margin went from 26 m to 44 m to hide the join.

## D-102 — Balloons over Cappadocia (29 Jul 2026)

Ten of them, drifting: the one image everybody has of this place, and the reason
the front of a Nevşehir street wants sky rather than a wall.

One model at ten scales, heights and distances. Size is the whole trick — a sky
of identical balloons is one balloon copied, while the same balloon at 2.5× down
to 0.48× is a morning with balloons in it, and perspective does the rest.

It is also the stop-2 object, tethered at five metres. One download, two roles,
exactly as the fairy chimneys are both a cluster and a ridge.

They drift rather than fly a route: a balloon has no engine, so it goes where the
air goes — slow lateral drift, a slower rise and fall, and a lean from the same
wind module that moves the flag. The layout is deterministic, because a child who
leaves a city and comes back should find the same morning.

## D-103 — The ambience bed is cut; music alone (30 Jul 2026)

Two attempts at making synthesised ambience sound like a plateau, and the owner
still heard waves both times. Filtered noise reads as water however it is shaped.

The bed is gone. A city has its theme and nothing else, which is quieter and says
nothing untrue about where a child is. The `ambience` channel stays, with its
mute switch, for recorded seagulls and real wind over tuff when they exist.

Knowing when to stop shaping a wrong thing is worth more than a third attempt at
shaping it.

## D-104 — The valley is a rim, not two plates (30 Jul 2026)

One plate behind and one in front left the sides open and read as two separate
landmasses. Cappadocia is a valley a street sits in, so six plates now ring the
play area on all four sides, near edges on the boundary, overlapping — which is
what makes a row of plates look like one landscape.

The chimney ridges moved inside that ring, so a child sees chimneys close and a
valley beyond them.

## D-105 — Balloons cross the sky, everywhere (30 Jul 2026)

They drifted six metres either side of a fixed point, which at balloon distances
is invisible: they read as pinned to the sky. They now cross 260 m and wrap
round, at ten different speeds so they never fly in formation.

They also fly over every city rather than only Cappadocia — a few elsewhere,
the full sky in Nevşehir, because that is the image of the place.

## D-106 — The tethered balloon fires its burner (30 Jul 2026)

Every nine seconds, for two: a ramped cone and a point light, flickering. A
balloon standing still is a balloon; one that fires its burner is a balloon about
to go somewhere, which is a far better thing for a child to walk up to — and the
only way to say *this flies* about something that, at that moment, is not flying.

Ramped rather than switched, because a flame at full size in one frame reads as a
bug. No particle system: on screen two seconds in ten, a shaped flickering cone
is enough.

## D-107 — The featured NPCs walk, and stand where they belong (30 Jul 2026)

All three appear in every dressed city now, not only İstanbul, and each walks a
four metre beat and returns, pausing at both ends. A person rooted to one spot
for a whole visit reads as a statue of a person.

Placing them took three attempts, and the failures are worth recording because
they are the same shape of mistake:

1. Offset from the stop's own x — put a person on the route wherever a stop sat
   near the middle of the street.
2. Offset from the centreline instead — put them on the far side of their own
   stop, belonging to nothing.
3. From the stop, **outward** — beside their stop and clear of the walk. The
   outward direction is chosen from the stop's own position, and only falls back
   to a given side when the stop is on the centreline.

The application moves them and the clip only moves their legs, which is the rule
the cat and the tram already follow.

## D-108 — The animal belongs to the region (30 Jul 2026)

Cats walked every street, including Cappadocia's. İstanbul's cats are one of the
first things a child notices about that city; Nevşehir has no street cats to
speak of, and is named for the opposite animal — *Katpatuka*, the land of
beautiful horses.

Coastal and Marmara regions keep cats. The plateau gets horses.

One component walks either. They are the same problem — a skinned quadruped with
one walk clip, a route of two or three points, a pause at each end — and only the
file, the size and the pace differ. A horse moves at 1.15 m/s against a cat's
0.55, turns more slowly, and its routes are held further from the walk because
two metres of animal wants more room than forty centimetres of one.

The horse arrived with the same 0.01 armature scale as the cat, so it would have
rendered 1.6 cm tall. The engine measures and scales it, as it has since D-044.

## D-109 — Balloons wander; they do not cross and wrap (30 Jul 2026)

They took minutes to appear. A phase seeded into a 260 m wrapping crossing put
some of them 130 m off-screen before they had moved at all, and nobody stays in
one city that long.

Two problems, one fix. Wrapping also meant a balloon reaching the end of its run
teleported back to the start in one frame, in full view of a child looking up at
it.

They now wander: a 45 m arc either side of where they belong, on a ninety second
round trip. Every balloon is in the sky at t = 0, most have covered twenty to
thirty metres by ten seconds, and there is no seam to teleport across.

Three attempts on this one, and the shape of the mistake was the same each time —
choosing the motion first and only then asking what it looks like from where the
child is standing. Six metres of drift was invisible; a wrapping crossing was
invisible for the first minute and then a jump.

`balloonOffsetAt` is pure, so "is the sky full when a child arrives" is a test
rather than something to sit and watch for.

## D-110 — Horses are 2.4 m, and they get their own routes (30 Jul 2026)

At 1.6 m the horses read as ponies on screen. Raised by half again to 2.4 m tall
and just under three metres long, which is taller than the guide and clearly
longer than it is tall — what a horse looks like from beside it.

Growing them broke their routes, and the fix was not a bigger margin. A cat and a
horse want different streets: a cat picks its way between the furniture in short
tight beats near the pavement, a horse walks a long line along the open edge.
Generating one set of routes for both left the horses with almost nowhere to go
once they were their proper size — one surviving route out of five.

They now have their own: two or three runs of twenty to sixty metres down the
outer lanes, against the cat's five beats of six to thirteen. Horses graze at the
edge of a settlement, not between its market stalls.

## D-111 — Derinkuyu's stone door (30 Jul 2026)

Stop 3 of Nevşehir, at 3.9 by 3.0 by 3.8 m — child-scale, something to walk up
to. 19.70 MB down to 1.62 MB, double-sided kept for the carved edges of the
millstone disc.

Its trigger ring is larger than the placeholder's was, which pushed a street lamp
out of the dressing. Lamp density went up and lamps moved further from the
centreline to compensate: a compact city has larger objects relative to its
length, so more of its placements land inside a ring and the generator has to
offer more candidates than it needs.

Nevşehir now has four of five stops delivered. Only the carpet loom is left.

## D-112 — Nevşehir is complete (30 Jul 2026)

The kilim loom and the Avanos pottery wheel land at stops 5 and 4, and every one
of Nevşehir's five stops now points at a delivered file.

| | Delivered | Shipped |
|---|---|---|
| Kilim loom | 25.70 MB | 2.75 MB |
| Pottery wheel | 22.87 MB | 0.84 MB |

The wheel is the smallest stop object in the project at 1.4 m, and the one a
child gets closest to. Its colour map is 1024 rather than 2048 for the same
reason the tile panel's is: resolution follows how much of the screen the object
covers, not how close the child stands.

Both kept double-sided. It matters most on the loom, where the warp threads and
the hanging kilim are single planes — culling their back faces would draw half a
carpet, which is the mistake that tore the flags on the Maiden's Tower.

Two cities are now finished end to end: İstanbul on the Marmara coast with cats,
cobbles, a tram and a ferry terminal; Nevşehir on the plateau with horses, red
dust, balloons and a valley rim. Nothing crosses between them, and a test holds
that line.

## D-113 — The dance is gone (30 Jul 2026)

Keloğlan danced. Behind that were four approved clips drawn from a shuffle bag
with a history persisted to localStorage so a child never saw the same one twice
running, four more clips rejected with written reasons, a replay button on the
completion panel, a branch in the celebration planner, a branch in the hero
component, and a `dance` member on the clip type that every animation function
had to consider.

All of it is removed, along with eight clips from the delivered file.

Both guides now celebrate the same way: a short sequence of gestures. The Hodja
agrees and waves; Keloğlan says an excited word about what the child just did.
`CelebrationStyle` went from a union of two shapes to one interface with one
field.

**The file saving is small — 4.61 MB to 4.34 MB.** Animation data is tiny beside
geometry and textures, and it would be dishonest to sell this as a size win. What
went is a subsystem: a shuffle, a persisted history, a replay path, a union type
and two branches. That is the saving worth having.

D-013 said Nasreddin Hodja does not dance. Now nobody does, and the asymmetry
that decision created goes with it.

## D-114 — The pottery wheel cannot spin (30 Jul 2026)

Asked for, and not done. The delivered model is one mesh, one primitive, no
named parts and no animation, so there is nothing to rotate but the whole object
— frame, shelf and finished jugs included, which would read as a table on a
turntable rather than a potter at work.

Two ways it becomes possible, neither of them guesswork on my side:

1. **A second export with the wheel head and the jug as a separate named mesh.**
   Then it is one line to spin it.
2. **A short spin baked into the file as an animation clip**, the way the cat and
   the horse carry their walks.

The second is better: it can carry the wobble of a jug being shaped, which no
amount of rotating a rigid mesh will.

## D-115 — Gaziantep is open, and it is not shaped like the others (30 Jul 2026)

The third pilot city, with its three stop objects still placeholders.

It tests something neither of the others could: **three stops and one question**,
where they have five and two. A layout that only works for five-stop cities would
work on three of the eighty-one — seventy-eight have fewer.

Two things broke immediately, and both were the same mistake in different places:
code that assumed the shape of the cities it had seen.

- **Nobody stood in it.** The NPC placer required four stops and returned an
  empty list below that. A three-stop city is not a lesser city, it is a shorter
  one. The three now spread across whatever stops a city has, rather than naming
  fixed indices.
- **Its street was 22 m.** At the compact eleven metre spacing, a child could see
  all three stops from where they appeared and walk the city in three seconds.
  Spacing went to fourteen; the street is 28 m.

A test in the NPC placer also had to be rewritten: it required a person to stand
within nine metres of their stop, which is impossible beside the ferry terminal's
9.45 m ring. Belonging is now measured against the stop's own radius — outside
the ring, within four metres of it — which is what the rule always meant.

All three pilot cities are now walkable end to end, and each has a simulated
playthrough that arrives, walks the markers, meets every stop and finishes.

