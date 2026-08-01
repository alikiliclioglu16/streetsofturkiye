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

## D-054b — Simplification locks UV seams (28 Jul 2026)

*Numbering note: this entry and the one above it were both written as D-054.
Two different decisions shared one id, and the log has been referenced by id in
three places since. The later of the two is renumbered rather than moved, so it
stays where it belongs chronologically.*

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

## D-116 — Gaziantep's horizon (30 Jul 2026)

A walled stone city on a plain. Eight rows of Antep limestone houses close both
sides, the castle stands on its mound behind the square, and five olive groves
run out in front — the direction İstanbul answers with sea and Nevşehir with a
valley.

Three cities, three different answers to the same four directions, and nothing
borrowed between them. A test holds that line.

The castle is solid and aligned by its near edge, which is the rule the Nevşehir
valley taught: a thirty-seven metre landscape centred on the boundary puts the
child inside it. The groves are not solid — a grove is somewhere you would walk
into, not a wall.

## D-117 — The grove is olives, and is named as one (30 Jul 2026)

The brief asked for a pistachio grove, because pistachios are what Gaziantep's
plain grows. What arrived is an olive grove.

It is registered as `kit_olive_grove`. Registering it under the name it was asked
for would repeat exactly the mistake that put a ferry into İstanbul as a row of
Beyoğlu facades — a file whose name and whose contents disagreed, believed
because the name was plausible.

Olives grow across the south and west, so it is a `kit_` asset rather than a
Gaziantep one, and the next Aegean city already has its groves.

## D-118 — Gaziantep's three stops are delivered (30 Jul 2026)

The mosaic panel, the baklava counter and the coppersmith's workbench. Every
stop in the pilot now points at a delivered file.

| | Delivered | Shipped |
|---|---|---|
| Zeugma mosaic panel | 26.17 MB | 2.20 MB |
| Baklava counter | 21.49 MB | 0.78 MB |
| Coppersmith's workbench | 23.09 MB | 0.78 MB |

The geometry needed nothing. All three arrived around ten thousand triangles,
which is what was asked for, and the entire 70 MB was in the maps: four of
them each, two at 4096 including a metallic-roughness map that was 10 MB on its
own. `simplify-model.mjs` was the wrong tool — it reduces geometry there is no
reason to touch, and it takes every texture to 1024, which is the one thing the
mosaic cannot have. Its subject is the tesserae, and at 1024 the stones stop
being stones.

So textures are now sized by role in their own script, `optimize-textures.mjs`.
Base colour is chosen per asset; normal and metallic-roughness follow one step
below it. The mosaic keeps 2048 and costs 2.20 MB. The other two sit at 1024
and cost 0.78 MB each.

**A black emissive map is not a small texture, it is a texture doing nothing.**
Meshy baked one into all three exports and set `emissiveFactor` to [1,1,1]
beside it. Brightest channel of 5, 0 and 3 out of 255. Three 4096 px maps were
being loaded to add zero. They are dropped, but only after measuring — the
script keeps any emissive map whose brightest channel clears the threshold,
because the next delivery may have a lantern in it.

Sidedness was left exactly as delivered, which is to say double-sided on all
three. It matters most on the baklava case, whose glass front is a single
plane: culling its back face would draw half a display case, which is the
mistake that tore the flags on the Maiden's Tower (D-089).

## D-119 — Gaziantep has a theme (30 Jul 2026)

*Sarı Çoraplı Yol*, 4 minutes 11, converted to Opus in WebM at 59 kbps and
1.76 MB — in line with İstanbul's 1.67 and Nevşehir's 1.39. The MP3 carried an
embedded cover image and metadata; both are stripped, because the engine
streams this through `<audio>` and never shows it.

The test that guarded this was written as "İstanbul and Nevşehir have different
music, and Gaziantep has none". That is a description of a moment, not a rule.
It now walks `PLAYABLE_CITY_IDS` and holds that every playable city has a theme
and no two are the same, so a missing theme fails as loudly as a borrowed one.
The rule was always that a city is silent rather than borrowing a neighbour's;
the old test only enforced half of it.

## D-120 — `scaleToBrief` was never wired up (30 Jul 2026)

Recorded because it is found, not because it is fixed.

`DeliveredProp.scaleToBrief` is documented as forcing the agreed size where a
file disagrees. It is set on twenty-five entries and asserted in four tests.
**Nothing reads it.** The only sizing correction in the engine is in
`AssetInstance`, which scales a model to its recorded height and then declines
to do so unless the factor is below a half or above two — a band meant to leave
small deviations as the artist's intent.

Most Meshy exports land inside that band, because Meshy normalises into a
bounding box: three of the files in D-118 came back at exactly 2.00 or 4.00 m
whatever they depicted. The mosaic was 4 m against an agreed 2.2, a factor of
0.55, and would have passed straight through at nearly twice its size.

The consequence is wider than one city. `dimensions` is also what the scene
builder reserves footprints from and what each stop's camera distance is
derived from (D-051, D-062). So the layout believes the registry and the
renderer believes the file, and for sixteen delivered assets across all three
cities those two disagree by between ten and seventy per cent:

| Asset | Registry | File |
|---|---|---|
| `city_nevsehir_chimney_ridge` | 17 m | 10 m |
| `city_istanbul_ferry_boat` | 9 m | 15 m |
| `city_nevsehir_valley` | 12 m | 6 m |
| `city_gaziantep_castle` | 18 m | 15 m |
| `kit_turkish_flag` | 6 m | 4 m |
| `city_nevsehir_pottery_wheel` | 1.4 m | 2.0 m |

and ten more: `city_gaziantep_stone_houses`, `city_istanbul_beyoglu_row`,
`city_istanbul_iznik_tile_panel`, `city_nevsehir_carpet_loom`,
`city_nevsehir_underground_stone_door`, `city_istanbul_streetcar`,
`city_istanbul_stone_dock`, `kit_wall_fountain`, `kit_hot_air_balloon`,
`kit_olive_grove`.

Two details worth keeping. The valley sits at a factor of exactly 2.0 and the
condition is `factor > 2`, so it misses by nothing at all. And D-112 recorded
the pottery wheel as the smallest stop object in the project at 1.4 m; it is
drawn at 2.0.

**The three new stops were not fixed this way.** Their scale is baked into the
files instead, with `set-model-scale.mjs`, the way the street lamp was
re-authored at 5 m. That keeps today's delivery correct without changing the
size of sixteen objects in three finished cities in the same breath — a change
nobody here can see the result of, and which needs its own screenshot round.

The fix, when it is taken, is to make the flag live and let the renderer agree
with the layout that was already computed from those numbers.

## D-121 — The bazaar gate stands free, and cannot be walked through (30 Jul 2026)

Delivered as `Gateway to the Desert`. What is in the file is a limestone gate
with a pointed arch, crenellations, wall lanterns, and a covered bazaar behind
the opening — awnings, steps, tables. No desert. Registered as
`city_gaziantep_bazaar_gate`, for the reason the olive grove was: a file whose
name and contents disagree gets the name of its contents (D-078, D-117).

The owner's two renders settled the identity. Measurement narrowed it and would
not have decided it, which is the whole of that lesson.

Which way the arch faces was decided by measurement rather than by guessing. At
doorway height the vertices fall into two clusters either side of a gap in X and
run continuously through Z, so the opening is a tunnel along the model's Z axis
and at `rotationY = 0` it faces down the street. The tram ran sideways for a
week for want of this check (D-087).

**It stands in the square behind the spawn, and a child can walk right round
it.** The street cannot hold it: fifteen metres to a side, three trigger rings,
lamps and stalls already on it, and a 6.7 m structure dropped in would leave a
corridor rather than something to circle. In the square the nearest solid thing
is the flag, 4.7 m off its corner, and the castle's mound is eleven metres
behind. Clearance is a test rather than a placement note, checked against every
solid object in the city, because the dressing generator is free to put a lamp
anywhere it likes.

**It is solid, so the arch cannot be walked through.** The collision test is one
axis-aligned rectangle per object and has no way to say "solid here, open
there". A gate with a doorway needs two footprints and a gap between them.
Nothing is broken by this today; it is worth doing when Ani arrives, because a
ruined city is mostly arches.

## D-122 — Balloons are Cappadocia's, and nowhere else's (30 Jul 2026)

The generator gave every city balloons and Nevşehir merely more of them: `many`
for Cappadocia and `few` everywhere else. Three drifted over the Bosphorus and
three over the Antep plain.

A hot air balloon is not weather. It is one valley at dawn, and a few passing
over İstanbul is the same borrowing as a Bosphorus song over Nevşehir or plane
trees on the plateau — a thing the project has a rule about and three tests for,
none of which looked at the sky.

The rule was in the test, wrongly. It read "balloons fly over the whole country,
so every city gets some", which is a sentence about balloons rather than about
this game. Now the sky over every city but Nevşehir is empty, and the test says
so.

## D-123 — Kars is open, and the eastern plateau is not the plateau (30 Jul 2026)

The fourth city, and the first outside the pilot. Three stops and one question,
the same shape as Gaziantep; the guide is Keloğlan; every stop object and the
whole horizon are placeholders.

**Ani is the environment.** Roofless churches standing apart on both sides, the
city walls and the Arslan Gate closing the back, and the Arpaçay gorge in front.
Ani is mostly sky, so the sides are separate shells individually rotated rather
than a continuous wall — İstanbul's facades and Antep's houses are rows because
those are streets, and Ani has not had a street for eight hundred years.

The three stops are the province, not the site: the ruins, the Eastern Express
and the gravyer cheese, which in life are forty-five kilometres apart. That is
how every city here works — İstanbul puts Hagia Sophia, Galata, the Grand
Bazaar, a simit cart and a ferry on one street.

**Two region tables were wrong, and only became visible when an eastern city
opened.**

- Eastern Anatolia resolved to red sand, which is Cappadocia's tuff. Ani stands
  on basalt under short tufted grass. A third ground surface is generated,
  `steppe`: clustered tufts at a tight scale and a sparse field of hard-edged
  stones, no wind ripples at all, because wind moves sand and does not move turf.
  Greyscale like the other two, tinted by the region's own ground colour.
- The eastern planting row contained a cypress, which is a Mediterranean and
  Aegean tree. Poplars line the watercourses on that plateau and the rest is
  scrub.

Neither was a bug anyone could have seen before, because no eastern province had
ever been drawn.

**Four tests confused "open" with "finished".** Opening Kars broke all four, and
the mistake was the same in each: they iterated every scene file on disk, or
every playable city, and asserted things that are only true of a city whose art
has been delivered — every asset resolves, no unknown ids, a theme exists,
playable equals pilot.

Opening a city before its art is deliberate and is how Nevşehir and Gaziantep
were both opened (D-008, D-115). So the assertions are split by scope. A pilot
city has nothing missing. **Any** city, finished or not, must still be walkable:
every unresolved reference falls back to a documented placeholder and the scene
reports what it is missing instead of failing to build — which is now its own
test, and is the guarantee that actually matters.

`PILOT_CITY_IDS` deliberately still lists three. It is what phase 02 is judged
against, and opening a province outside the pilot must not quietly widen a gate
that has not been passed.

## D-124 — The recorded height is what draws every model (30 Jul 2026)

D-120 found the problem; this is the decision.

`AssetInstance` scaled a mounted model to its recorded height and then declined
to, unless the factor fell below a half or above two. `scaleToBrief` existed to
override that and was read by nothing. Both are gone. The recorded height always
wins.

**The measurement that made this safe.** Scaling is uniform and taken from
height, so a model keeps its own proportions — but the collider and the trigger
ring are built from the recorded *width and depth*, and those only agree if the
recorded triple has the file's own aspect. Every delivered asset was checked:
after scaling to the recorded height, width and depth land within 3% of what is
recorded, and most within 1%. The numbers were taken by measuring each delivery
and scaling it, not typed in from a brief.

So the registry was never in disagreement with the files. It recorded the size
each object is meant to be, and the renderer was the one part of the system not
reading it — while the scene builder reserved footprints from it and derived
every stop camera from it.

Sixteen objects change size on screen, all of them towards the size the layout
already assumed: a 17 m chimney ridge that was drawn at 10, a 9 m ferry drawn at
15, a valley drawn at exactly half, and the pottery wheel that D-112 recorded as
the smallest stop object in the project at 1.4 m and that was being drawn at 2.0.

That 3% is now a test rather than a note. It reads each GLB's bounds out of the
JSON chunk — every accessor carries its own min and max, so no buffer has to be
decoded and no glTF library has to be added to `package.json`. A triple typed in
from a brief instead of measured would pass every other test in the suite and put
a collider around a shape that is not there.

## D-125 — A solid object can have a hole in it (30 Jul 2026)

A collider was one axis-aligned rectangle covering the whole of an object's
footprint. That is right for anything a child walks round and wrong for anything
they walk through, and it sealed the bazaar gate's own archway.

An entry may now declare `colliderParts`: rectangles in the object's own metres,
measured from its centre, turned with the object by the scene builder. The gate
has two, and the passage between them is what is left.

**Measured, not chosen.** At walking height the gate's vertices form two dense
clusters with an empty band between: stone from the west edge to x = -0.84,
nothing across to x = +0.84, stone again to the east edge. Each pier is 2.52 m of
the 6.72 m frontage and the opening is 1.68 m — 0.78 m of walking room once the
player's 0.45 m radius is taken off. Narrow on purpose. A gate a child has to aim
at is a gate; one they drift through is a doorway-shaped decoration.

This is worth having before Ani rather than after. A ruined city is mostly
arches.

## D-126 — Kars has geese (30 Jul 2026)

The region table gave the eastern plateau horses, inherited from Cappadocia.
Kars is known for its geese.

A third gait, and not a smaller horse or a larger cat. A cat picks its way alone
between the furniture in short tight beats; a horse walks a long line down the
open edge. Geese go in a flock, slowly, over a short distance, and all in the
same direction — so Kars gets three short runs close together across one piece of
open ground, rather than three animals each minding its own business. Well off
the walking line: a goose on the pavement is something a child walks into, and
nothing in a goose's character would make it stand aside.

The animal was chosen by a ternary — horse, else cat — which would have given the
third animal a cat without saying so. It is a table now.

`kit_kars_goose` is briefed and undelivered, so it draws a placeholder like
everything else in Kars.

One more count came out of a test while doing this: the manifest was asserted to
have exactly twenty-five rows. A number like that records the day it was written
rather than a rule, and it fails every time a province is briefed. What is
actually required is that the manifest has no duplicate rows.

## D-127 — Kars has a theme, and lists in tests keep going stale (30 Jul 2026)

*Kars Yaylası*, 4 minutes 5, converted to Opus in WebM at 1.87 MB — in line with
İstanbul's 1.67, Nevşehir's 1.39 and Gaziantep's 1.85. Cover image and metadata
stripped, as before.

The three collectibles are briefed as manifest rows, so Kars now has every asset
it needs named. Eleven files: four for the horizon, three stops, the goose and
three rewards. `docs/KARS_ASSET_BRIEF.md` carries the whole list.

**Three tests in two days have failed for the same reason**, and it is worth
naming. Each held a literal list or count that was true on the day it was
written:

- the audio directory contents, written as two filenames, then three
- the manifest row count, written as twenty-five
- "only İstanbul has props of its own"
- "playable is exactly the pilot"

None of them was testing anything. A count of rows does not say the manifest is
correct; it says nobody has added a row. The rules underneath were: nothing lives
in the audio directory but a theme belonging to a city that exists; the manifest
has no duplicate rows; a `city_` prop belongs to exactly one city; no pilot city
is closed. Each of those survives a fifth province. The literals did not survive
a fourth.

## D-128 — The goose mesh is here; the rig is not (30 Jul 2026)

`kit_kars_goose_rig_source.glb` — 10,395 triangles, 0.43 × 0.85 × 0.91 m,
standing on y = 0, textures already sized by role, no skin and no animation. It
is marked `RIG_SOURCE_ONLY` and it is not integrated.

**The delivery note was accurate in every particular** — checksum, triangle
count, world size, base offset, skin and animation counts, alpha mode and
sidedness all matched the file. That is the first time in this project, and it is
worth recording as plainly as the three that did not.

Not integrated because Kars generates three goose routes and the file has no
walk. Three birds sliding across the grass with their feet still is exactly the
skating the in-place rule exists to prevent (D-043), and a placeholder is more
honest than that.

Three things measured out of the mesh for whoever rigs it, in
`docs/KARS_GOOSE_PRERIG_REPORT.md`:

- **The legs separate cleanly at shin height and merge into the belly above it.**
  Below the belly the geometry gives the rigger two islands to weight; at thigh
  height there is one continuous surface and nothing to stop weight bleeding
  between the two legs. That is where a bad step will come from.
- **The mesh is not mirror-symmetric** — 12.9% of vertices have a partner across
  x = 0. The rig spec asks for symmetric weighting of the two legs and it cannot
  be got by mirroring; both sides have to be painted.
- **10,395 triangles against a brief of 4,000–8,000**, which is fine: three geese
  cost 31,000 where three horses cost 27,500. It must not grow on the way back.

**A mistake of mine, corrected.** `KARS_ASSET_BRIEF.md` asked for a clip named
`Walk`. The engine looks for `Walking`, and falls back to the first clip in the
file when it does not find it — so the wrong name would have worked in Kars and
broken silently the first time a second clip was added. The rig spec that arrived
with the mesh had it right and the brief had it wrong.

**An option that needs no rig.** Geese standing on the plateau rather than
walking would put a real bird in Kars now. It needs an animal with no routes,
which the engine cannot currently express, and it is a decision about what the
city looks like rather than an engineering one.

## D-129 — Kars has geese, and none of them is rigged (30 Jul 2026)

Three more geese arrived, none with a skin or an animation, as the first had
none. Four static birds and no walk cycle between them.

**Their poses were worth more than a rig.** Measured off the silhouettes rather
than taken from the filenames:

| | long per unit tall | top of the bird, along its length |
|---|---|---|
| Snowy | 0.98 | 89% |
| Embden | 0.98 | 89% |
| Foraging | 1.73 | 30% |

Two upright birds with their heads at one end, and one stretched out with the
tall part a third of the way along — a goose with its neck down. That is a flock:
several animals each doing something slightly different. One rigged bird copied
three times would have moved and still read as one bird, which is the mistake the
sky over Cappadocia avoids by using one balloon at ten sizes.

So they are placed as dressing rather than as the city's animal, and nothing in
the group moves. Not solid, like the cats: getting stuck on a bird is worse than
walking through one.

**The engine needed no change for this.** A standing goose is a prop, and the
prop system already places, grounds, scales and shadows one. The walking path is
untouched and still reserved — `kit_kars_goose` keeps its three routes and draws
nothing, because a briefed asset resolves to a null model. When the rig lands,
walking birds appear on those routes beside the standing ones instead of
replacing them.

**The forager is not scaled to match the others, and that is the point.** The two
uprights were re-authored from 0.60 m to 0.85 m, which is a grown Embden. The
forager was left at 0.60 m and 1.04 m long. A goose is 0.85 m tall with its neck
up and shorter with its head down; the height of this one is a pose, not a
species, and normalising all three to one number would have put a goose the size
of a sheep on the plateau. **Height is only a common scale between models in the
same pose** — nothing in the pipeline knows that, so it has to be decided per
file.

## D-130 — Ani is built, and Kars stands on rock (30 Jul 2026)

Five pieces delivered, all normalised to exactly 8 m and buried 4 m below the
origin, all re-authored here.

| | Delivered | Shipped | Height chosen |
|---|---|---|---|
| Chapel ruin | 24.84 MB | 0.93 MB | 9 m |
| Church ruin | 26.42 MB | 1.00 MB | 11 m |
| Cathedral | 25.01 MB | 2.08 MB | 15 m |
| City walls | 23.88 MB | 1.96 MB | 14 m |
| Arpaçay gorge | 23.80 MB | 2.19 MB | 12 m |

**Three different ruins, not one repeated.** The brief asked for a single church
shell turned six ways. Three arrived, and three silhouettes is what makes a
ruined city read as a place rather than as a pattern. They alternate down each
side so the same building never stands twice running, each is turned
individually, and none is solid — a ruin has no frontage, and squaring them to
the street would rebuild a city that has been down for eight hundred years.

The cathedral was chosen from the three by its plan: it was the widest
delivered, and at 15 m it stands over the chapels by two thirds again.

**The walls came back twice.** The first delivery was 1,996,651 triangles and
78.61 MB — ten times the guide, for a wall. It was not simplified in-project and
not integrated; it was returned. The second is the same building at 9,486.

**Kars stands on fractured bedrock.** `steppe`, written for it two entries ago,
was tufted grass and wrong: Ani is a bare rock shelf. The new surface is Voronoi
again, but with cells far larger, jittered hard so no two are alike, and — the
part that matters — **each slab carries its own height offset**. A flat plane
with cracks drawn on it reads as a floor; a shelf of rock does not. Crevices are
cut narrow and deep rather than laid as mortar. Steppe is kept for the rest of
the eastern plateau, where the next province will not be a ruin on bare stone.

**And one city needs two grounds.** Geese graze; they do not stand on bare rock.
Blending two surfaces across the whole plane would need a splat map and a shader
for one patch in one province, so a `groundPatch` is a small plane lying a
centimetre above the big one, with a soft-edged alpha so it fades into the rock
instead of ending on a corner. It is centred on the flock rather than written
out by hand, so the turf follows the birds.

## D-131 — Two files diverged from what was written, and the audit caught it (30 Jul 2026)

Recorded because it wasted a session and because the thing that caught it should
be kept.

Twice this turn a file ended up holding two versions of the same edit: a
duplicated `ScenePropInstance`, and two blocks of Kars registry entries with
different heights in each. A ground-patch type existed in three shapes across
the schema, the renderer and the builder at once.

The previous session stopped on this and reported the working copy as
untrustworthy, recommending a rebuild. **That was an over-reaction.** The whole
of it reduced to two concrete defects, and the eighteen tests that appeared to
have vanished had not: a test *file* was failing to load, so its cases never ran
and the total simply came out lower. Reading the count as loss rather than as a
symptom is what turned two bugs into an alarm.

What actually found it, in order:

1. A duplicate-definition sweep across every source file — one grep, and it
   named the file and the symbol.
2. `npm run typecheck`, which reported the same object literal carrying one
   property twice.
3. The D-124 aspect test, which holds each recorded triple against its own GLB.
   The divergent registry block had the chapel at 11 m where the file is 9;
   nothing else in the suite would have noticed, and it would have shipped a
   collider around a shape that is not there.

The lesson is not "be suspicious of the working copy". It is **read back what
you wrote before building on it**, and keep the tests that compare a record
against the thing it records.

## D-132 — Kars gets the Hodja, and the source is not edited to say so (30 Jul 2026)

The canonical record gives Kars Keloğlan. The project has decided otherwise, and
the decision is recorded in the scene builder as a `GUIDE_OVERRIDES` entry rather
than by editing `content/canonical/`, which stays read-only. Same reasoning as
the per-hero material correction: the delivered file is not modified, the
correction lives in code where it can be read, tested and undone (D-019).

It also makes the pilot two Hodja cities and two Keloğlan cities instead of one
and three — the first real exercise of the rule that a city loads exactly one
hero and never preloads the other (D-012).

## D-133 — Gaziantep walks dogs, and a city may walk more than one animal (30 Jul 2026)

Two street dogs, rigged and skinned on the first delivery — the first animal in
this project to arrive that way. One caramel, mean colour 98,73,54; one nearly
black at 37,30,25. Both 27 joints, the same armature family as the cat and the
horse, both authored at armature scale and measuring nothing in bind pose.

**The animal was one model per city, and now it is a list.** Routes take a model
in turn, so an even number of routes splits evenly and nothing has to count.
Two of a kind read as a pair; four of one read as one dog copied, which is the
lesson the sky over Cappadocia already taught.

Their clip is named `Armature|Unreal Take|baselayer`. `StreetCat` prefers
`Walking` and falls back to the first clip in the file, which is right here
because there is exactly one clip and no ambiguity about which walk is meant. A
second clip would turn that fallback into a guess, and the file would need
renaming before it arrived.

**Routes are generated for the animal that walks them.** The first attempt read
the region default when building the routes and the override only when choosing
the model, so Gaziantep's dogs were handed the cats' five short hops. Then four
routes written out by eye produced two: Gaziantep's stops sit right of the
centre line and its street is fifteen metres to a side, so a route drawn there
lands inside a trigger ring more often than not. It now offers eight candidates
and takes the first four that clear every ring. A city that quietly ends up with
two dogs instead of four is the kind of thing nobody notices for a month.

## D-134 — A stop can be walked through (30 Jul 2026)

The owner's screenshot of İstanbul showed the Kapalıçarşı gate with its doors
open, an inner arch visible behind it and the ferry terminal beyond that — and a
child could not walk into any of it. The collider came from the footprint, one
rectangle over the whole object, which sealed an archway they were looking
straight through.

`colliderParts` already existed for props (D-125). It now applies to stops too,
through one helper both paths share: a gate does not stop being a gate when it
is also a stop.

Measured, as the Gaziantep gate was. At walking height the vertices leave an
empty band from 37.5% to 62.5% of the width, and the same gap appears across the
depth — this is a deep gateway with an arch at the front, another behind, and
hollow between. At the recorded 5.37 m each pier is 2.01 m and the opening is
1.34 m: **0.44 m of walking room** against a 0.45 m player radius, the tightest
passage in the project. It is narrow because the wooden doors stand open inside
the arch and take up part of it, which is what a real gateway does. Widening it
is moving two numbers if it turns out to be fiddly on a tablet.

## D-135 — Kars's three stops are delivered (30 Jul 2026)

| | Delivered | Shipped | Height |
|---|---|---|---|
| Ani carved doorway | 18.81 MB | 1.75 MB | 5.0 m, as delivered |
| Eastern Express platform | 23.27 MB | 0.77 MB | 3.4 m |
| Gravyer stall | 21.95 MB | 0.77 MB | 2.2 m |

All three arrived buried below the origin — 2.5 m, 2 m and 1.5 m — and all three
were re-authored standing on y = 0.

**Two of the three briefed heights were wrong, and the files were right.**

The doorway was briefed at 3.2 m and is left at the 5 m it came at. Its opening
is a fixed 37.5% of its width, so at 3.2 m the gap would be 0.86 m and a child
with a 0.45 m radius does not fit through it at all. The brief was written before
anyone had asked for it to be walked through. Five metres is also what a church
portal at Ani is, and it stays inside the one-to-five-metre rule for a stop by
exactly nothing.

The stall was briefed at 1.6 m, which described a counter. What arrived is a
stall with a canopy over it, and at 1.6 m the awning would have been at the
guide's shoulder. At 2.2 m it comes out at the briefed width of 2.2 m as well.

The platform is the one that matched.

## D-136 — The Eastern Express crosses Kars and leaves (30 Jul 2026)

Not a stop and not scenery: a twenty metre locomotive that arrives from off the
map, crosses the whole city and goes off the other side, then waits fifteen
seconds and does it again.

**It is not the tram's motion.** İstanbul's tram works one street all day and
turns round at each end in front of the child, so it has a direction to flip and
a pause to take. A train comes in from somewhere else and goes somewhere else:
one direction, no turn, and the pause happens where nobody can see it.

Both ends of the line sit outside the play area by more than the length of the
locomotive, so it is never seen to appear or vanish, and it runs at x = 16 —
outside the fifteen metre walking area, where İstanbul's tram sits on the other
side of the country. A child can watch it and cannot stand on the track. A
hundred and eighty metres at eleven metres a second is about sixteen seconds a
pass.

**Between runs it is not rendered.** Parking it at the end of the line would
leave a locomotive standing on the edge of a plateau, in shot, for fifteen
seconds. Reduced motion holds it off the map entirely rather than freezing it
mid-city — zero strength, not a still frame in an odd place, the same choice
everything else that moves here makes.

The test steps a full minute of the cycle at sixty frames a second and requires
that it crosses, leaves and comes back. A train that never arrives is otherwise
found by standing in Kars for a minute and wondering.

## D-137 — Two more things can be walked through (30 Jul 2026)

The Ani doorway joins the two gates. Same measurement, same result: the middle
37.5% of its width is empty at walking height, each pier is 1.12 m of the 3.57 m
frontage, and the opening is 1.34 m — 0.44 m of walking room, matching the
Kapalıçarşı exactly.

Three objects now carry `colliderParts`, and the pattern is stable enough to
state: **anything with a hole in it gets its footprint measured off the mesh,
never estimated.** The empty band in the vertex histogram is the opening, the
clusters either side are the piers, and the number that matters is what is left
after the player's radius comes off.

## D-138 — Three bugs found by opening the deployed site (30 Jul 2026)

The first session with a browser. Screenshots come back blank here, so nothing
visual was judged — but the DOM, the console, the network and the `?debug=1`
overlay all read cleanly, and they were enough.

**1. Kars's scene said Nasreddin Hodja and Keloğlan walked out of it.**

The overlay reports the resident hero. On İstanbul it said Nasreddin Hodja and
the scene agreed; on Kars it said Keloğlan while `scenes/kars.json` said
`character_nasreddin_hoca_base`.

There were two guide fields read from two sources. `guideAssetId` came from the
scene, which carried the override; `guideId` came from canonical's
`legacyGuideId`, and that is what fed the hero model, the loading message, the
intro panel and the map portrait. They agreed for as long as no city had ever
been assigned a guide against the source, and stopped agreeing the moment one
was (D-132).

`guideId` is now derived from the scene's asset id, so the scene is the single
authority and canonical is still never edited. A test holds the two together for
every playable city.

**2. Kars was on the map and had no card.**

The map drew four provinces a child could tap; the list underneath offered
three, so the only way into Kars was to find it on the map. The list filtered by
`PILOT_CITY_IDS`, which was the same set until Kars opened outside the pilot.
Splitting "open" from "finished" was right (D-123); leaving a piece of interface
reading the wrong one was the cost of it, and it went unnoticed because no test
looks at the map page.

**3. The shadows were not the shadows that were asked for.** `shadows` on its
own asks for PCFSoft, which three.js 0.185 deprecated and silently substitutes
with PCF — it says so in the console on every single load. The type is named
outright now: same picture, no warning, and a decision to make rather than a
substitution nobody chose.

**What could not be measured.** The overlay reported 1–2 fps and then 0, which
is the automated tab being throttled rather than the game being slow, so it says
nothing about performance. Triangle counts and draw calls are real: İstanbul
draws 83 calls and 449k triangles, Kars 80–124 calls and 425–758k. The hero is
88,866 of that, inside its authored budget. **Mobile is still unmeasured, and
this is not the tool that will measure it.**

One thing worth recording as sound: the guide loads and the scene mounts on the
deployed build, both cities were walkable at the data level, every asset probed
returned 200 including the newest, and there was not one console error.

## D-139 — The quiz was showing a child the answer (30 Jul 2026)

Found in a screenshot: the correct option outlined in gold before anything was
chosen.

It was not marked as correct. `Modal` focused the first focusable element on
open, which in the quiz is the first answer, and the browser draws a ring around
whatever has focus. The options are shuffled by a seeded hash — and on **36 of
the 84 questions** that shuffle leaves the correct answer in the first slot. Not
a Kars problem: a third of every quiz in the project.

The dialog takes focus itself now, with `tabIndex={-1}` so it is not in the tab
order. A screen reader still enters the dialog, Tab still reaches every option
in order, and nothing is outlined that the child did not choose.

Two keyboard tests were written against the old behaviour and one of them was
worse than stale: it tabbed to the correct answer by counting through
`item.options`, the canonical order, while the panel renders them shuffled. It
passed by coincidence and would have gone on passing whether or not the keyboard
ever reached the right button. It now finds the button by its text.

## D-140 — Scenery had been reaching into the play area (30 Jul 2026)

Cappadocia's chimney ridges stood at x = ±19. A ridge is 19 m deep and turned
side-on, so its near edge sat at 9.5 — **four and a half metres inside** the
fifteen metre boundary. It had swallowed the dressing along the edges and closed
the horses' routes, which is what the owner's screenshots show.

It got worse rather than started when the recorded height began to draw the
model (D-124): the ridges went from the 10 m they were being drawn at to the
17 m the layout had always assumed, and grew in plan by the same half again. The
number was right. The position had been chosen by eye against the smaller thing
that was actually on screen, and correcting the size moved a piece of scenery
into the street.

Moved to ±27, where the near edge is 17.5.

**And the same test caught Kars**, whose chapels I had placed at ±18 a few hours
earlier: near edge 13.9, a metre inside. Moved to ±21 at the closest.

The rule is now held in every city: a piece of scenery standing beside the walk
must not have its near edge inside the boundary. Touching it is right — that is
the near-edge alignment D-101 asks for. Being inside it is a child walking into
a church.

## D-141 — Gaziantep's castle moved to the end of the walk (30 Jul 2026)

It closed the back of the square, so the one thing in Gaziantep a child would
cross a room to look at was over their shoulder from the moment they arrived,
and the street ran out towards olive groves. Swapped: the castle closes the far
end and grows as they walk towards it; the groves fill the square behind them.

Still aligned by its near edge — a 37 m landscape centred on the boundary would
swallow the last stop.

## D-142 — The Eastern Express runs across, not alongside (30 Jul 2026)

It ran parallel to the street at x = 16, which put it beside and slightly behind
the child for its whole pass. It was deployed for a day and never once seen.

It crosses now: left to right over the open ground past the gravyer stall, at
z = -66, beyond the front boundary. It enters the view from one edge, crosses
everything the child is looking at, and leaves by the other. Two hundred and
eighty metres end to end, sixteen metres a second, ten seconds between runs.

**And it has a track to run on.** Two rails, sleepers every 2.4 m and a ballast
bed, built from boxes rather than briefed as a model: a straight railway is six
numbers and a repeat, and waiting for a file would have meant waiting for it to
say something the geometry already says. Not solid, because it lies where a
child cannot reach.

## D-143 — No models for the rewards (30 Jul 2026)

The collection screen shows each reward as an emoji and a line of English, and
the owner has looked at it and called it enough. So the sixteen collectible
models are not being made, and the missing renderer for them is not being
written.

Recorded because the gap was raised as work outstanding and it is now closed by
a decision rather than by building anything. Four rewards in İstanbul and
Nevşehir still have no brief at all — `collectible_istanbul_3` and its like —
and that no longer matters.

## D-144 — The train could never start (30 Jul 2026)

Reported twice: no train, ever. It was a deadlock, and an ugly one.

`Train` renders nothing while it is waiting, so its group ref is null. The frame
handler read `if (!node || reducedMotion) return;` **before** advancing the
clock. So: waiting → nothing rendered → ref null → clock never advances → still
waiting. Two days on the deployed site and not one train crossed Kars.

The node is needed to *place* the train, not to advance it. The clock now runs
whichever it is, and the ref is checked only where the position is written.

The step function is pure and knows nothing about refs, which is why a test can
hold this: eleven seconds of clock with nothing rendered must leave the train
moving. That test would have failed the day the component was written.

**And it goes both ways now.** Each pass alternates direction — a line with
traffic one way only is a conveyor, and Kars is on a route that runs both ways.

## D-145 — The train has a horn (30 Jul 2026)

Synthesised, like every other cue, and built the opposite way round from the
ambience bed that was cut.

D-103 cut synthesised ambience because filtered noise reads as water however it
is shaped — the owner heard waves over Cappadocia twice. So here **the horn is
the sound and the roll underneath is the garnish**: two sawtooth voices a fifth
apart, sounded together, which is what a European diesel horn actually is and is
unmistakably a train. The pair falls in pitch across the pass, not real Doppler
but enough of it that the train reads as going somewhere. Under it a low tone
through a lowpass — a tone, not noise, for the reason above.

One horn per pass, sounded as it comes into view rather than as it leaves. On
the `ambience` channel, so a parent can silence the world without silencing the
guide.

## D-146 — The ruins moved to the walls, and the railway was left alone (30 Jul 2026)

Eight corner ruins were spread down both ends of the site, which put four of
them along the railway. The owner's judgement, and it is right: the ground by
the track wants to stay open, because the gorge is already doing the work there,
and the walls are what a child turns round to — that is the side that has to
look inhabited.

All eight sit behind the square now, flanking the walls at both ends and
thickening the back so it does not finish in a line. The front stays as gorge,
track and sky.

## D-147 — The back of Kars is closed, and Sarıkamış stands behind it (31 Jul 2026)

Turning round at the spawn showed two ruins in the distance and pale blue sky
between them. Three things were wrong with the back and they compounded.

**One wall is not a wall.** A single 31 m run left the ground either side of it
open. Two segments now, mirrored, facing each other across the square — 59 m of
wall, which covers the whole back including the ground the corner ruins stand
on.

**Sixteen metres apart left a slit.** Two 31 m runs centred at ±16 stop half a
metre short of each other: a one metre gap straight down the middle, directly
ahead of a child who turns round, which is the worst metre on the map to leave
open. Fourteen metres apart overlaps by three.

The test holds coverage rather than spacing — no gap anywhere across the run,
and the run reaching past the street on both sides — so the numbers can move
without the rule moving.

**And there was nothing above any of it.** Sarıkamış is now the largest thing in
the project: 109 m across and 34 m tall, against walls of 14 and a cathedral of
15. That ratio is the whole point. A mountain that does not tower over the
buildings in front of it is a hill, and the reason the back read as empty was
that the tallest thing in it was 14 m and the rest was sky.

Aligned by its near edge, 113 m deep, well behind the walls — centred on the
boundary it would have put the entire city inside a mountain (D-101).

## D-148 — The walls flank; the mountain fills the middle (31 Jul 2026)

D-147 read "karşılıklı" as *paired across the back* and closed it completely.
That was the wrong reading, and closing the back is precisely what put a wall in
front of the mountain: a child turning round saw stonework across the whole view
and Sarıkamış only through a gate arch.

Facing each other means **one each side, with the middle open.**

The two walls now stand at x = ±35, turned in towards the square by 0.3 radians
so they read as two ends of one circuit rather than two flat screens. West runs
from -52.8 to -17.2, east from 17.2 to 52.8, and **34 m of sky is left between
them** — which the mountain, 109 m across, more than covers.

The corner ruins moved out past the walls, and nothing at all now stands within
fifteen metres of the centre line behind the square. That sightline belongs to
Sarıkamış.

The test changed with the decision rather than being loosened around it. It used
to require no gap anywhere across the run; it now requires a gap of at least
twenty metres, a wall on each side of the centre, and a mountain wide enough to
span the opening and more than twice the height of the walls. It also holds the
centre line clear, which is the assertion that would have caught D-147 on the
day it was written.

Two ruins behind the square on **each** side, counted per side rather than in
total: six all on one side would satisfy a total and leave half the back bare,
which is the complaint this exists to answer.

## D-149 — The horizon is measured, not eyed (31 Jul 2026)

Four attempts at "the sides of Kars look empty", and all four missed the same
two windows. Each time the method was the same: read the coordinates, decide
they looked full, move something. A list of positions does not tell you what a
child can see.

Measuring it took one script. Sweep the full circle from where the child stands,
mark every degree that some piece of scenery covers, print the holes:

```
spawn:        91-108   259-266
mid-street:   none
last stop:    85-93
```

Two windows either side at roughly ninety degrees — **the direction a child
looks when they turn to the side rather than round**, which is why turning round
had looked fine and the complaint kept coming back. Eighteen degrees open on one
side and eight on the other, at the spawn, for four turns.

Filled with two ruins apiece, staggered in depth: a nine metre building at forty
metres subtends about twelve degrees, so one would not have closed the eastern
window.

The measurement is a test now, over the spawn and the middle of the street, with
the forty degrees either side of straight ahead exempt — the street runs out
towards the gorge and the railway on purpose, and distance is Kars's answer to
that direction the way the sea is İstanbul's. The owner asked for that ground to
be left alone and it is left alone.

**The remaining hole is 85–93° from the last stop**, out to the east at the far
end of the walk. It is reported rather than filled, because it sits in the
ground that was asked to stay open.

The general lesson, and it is not about Kars: when the complaint is about what
something looks like from somewhere, measure it from there. Every earlier
attempt here was an argument with a screenshot conducted through a coordinate
list.

## D-150 — Van is open (31 Jul 2026)

The fifth city, and the second outside the pilot. Three stops and one question,
the same shape as Gaziantep and Kars. The guide is Nasreddin Hodja and this time
that is canonical rather than an override.

Its theme is in: *Van Halayı*, 3 minutes 22, Opus at 1.46 MB. Everything else is
a placeholder and `docs/VAN_ASSET_BRIEF.md` lists the eleven files.

**Kars stopped being the eastern default.** `REGION_SURFACE` had eastern Anatolia
resolving to `rock`, which was written for Ani — a bare volcanic shelf cracked
into plates. Van stands on a lake shore. The region goes back to `steppe`, which
is what that surface was kept for, and Kars becomes a per-city exception in
`CITY_SURFACE`. Putting Ani's bedrock under Van because both provinces are
eastern is the same mistake as red sand under Ani, one table further along.

**Van has the Van cat, and it is not the street cat repainted.** A Van cat is
white, long-haired and odd-eyed — one blue, one amber — and *What makes the Van
cat special?* is the city's only question. A child who has just been told the
answer should be able to find one walking about. Reusing İstanbul's tabby would
make the question unanswerable from the street, which is a content bug wearing an
art decision's clothes.

It walks like a cat, though: short beats tucked in near the pavement. Different
animal to look at, same one to walk, and the route generator says so in one line
rather than growing a fourth gait.

**The lake is water, and a different water.** İstanbul's sea starts past the play
boundary so a child can see it and never walk into it; Van's lake does the same
and is a paler, greener blue, because Van is soda water and does not look like
the Bosphorus.

**Four directions, none borrowed.** Sides: the citadel ridge — Tushpa is not a
castle on a hill but galleries cut into a limestone spine, which is why Van's
sides do not look like Ani's churches standing in grass. Front: the lake, with
Akdamar out on it. Behind: Erek. Orchards fill the gaps.

## D-151 — Van's sides are a town, and its street ends at the lake (31 Jul 2026)

Two deliveries, and one of them retires a brief entry.

**The citadel ridge is dropped.** The brief asked for the rock spine of Tushpa
down both sides, which is the right idea for the castle and the wrong one for a
street: Van's walk is a town, and the rock is what the town is built against
rather than what it is walled with. Mudbrick and stone townhouses with a bastion
at one end arrived instead, four a side at 12 m.

**Akdamar stands at the end of the walk, not out on the horizon.** It arrived as
a single square plate — island and its own piece of lake together — which
decides where it belongs: near enough that a child walks the whole street
towards it and watches it grow, the way İstanbul's runs towards the sea and
Kars's towards the gorge. Solid, because the far side of an island is water.

**And the lake had to come in to meet it.** The water plane started 101 m out,
which left a 23 m island floating on grass. Moved to a near edge of exactly
z = -59, the play boundary, so the shore is where the child stops.

Two setbacks were wrong on the first pass and both were caught by measuring
rather than by looking:

- 3.6 m of island sat past the water's near edge, on land.
- The houses at x = ±22 put their near edge at 14.3, seventy centimetres inside
  the boundary — the same mistake as Cappadocia's chimneys and Kars's chapels,
  now for the third time, and the third time the standing test found it before a
  screenshot did (D-140).

Both are held by tests now: the island must sit inside the water plate on both
axes, and the walk must run towards it.

## D-152 — Van's four deliveries, and one that is not a stop (31 Jul 2026)

| | Delivered | Shipped | Placed as |
|---|---|---|---|
| Van Kalesi | 25.91 MB | 2.31 MB | behind the square, 59 × 16 m |
| Breakfast table | 28.78 MB | 1.01 MB | stop three |
| White odd-eyed cat | 13.37 MB | 1.07 MB | stop one, in a basket |
| Urartian stele | 22.72 MB | 0.70 MB | **dressing, not stop two** |

**The stele is not stop two, and this is the one thing asked for that was not
done.** Van's second stop is canonically *Akdamar Island*: the card reads "Lake
Van is Türkiye's largest lake — big as a sea! On Akdamar Island stands a
1,100-year-old church…" and hands over a boat ticket. A child standing in front
of an Urartian cuneiform stone while reading that would be looking at the wrong
object, and canonical text is read-only so the card cannot be made to agree.

So it stands beside the walk instead, where it is exactly right: Van was the
Urartian capital and a carved stone by the street is the town's own furniture.
Nothing is wasted and one line moves it if the owner wants it as the stop
anyway.

**The basket was built rather than briefed.** A ring, a floor and a rim — 196
triangles — generated and merged into the cat's own file. Waiting a day for a
shape that is nine numbers and a loop would have been the wrong trade, and the
two have to be one object regardless: a stop is a thing a child walks up to, not
two things that happen to be in the same place.

It keeps a 2048 colour map at 90 cm tall, for the same reason the Zeugma panel
does. The city's only question is *What makes the Van cat special?* and the
answer is the two eyes, one blue and one amber. They have to read from two
metres or the stop teaches nothing.

**Van walks İstanbul's cats.** Its own white cat arrived unrigged. A cat sliding
across the ground with its feet still is worse than a cat of the wrong colour
(D-043), so the rigged tabbies do the walking and the Van cat sits in the basket
where the child is looking anyway.

## D-153 — The cat says something (31 Jul 2026)

A meow, synthesised, and built the way the train horn was rather than the way
the ambience bed was.

A meow is two vowels run together — the mouth opens and closes — so it is one
sawtooth voice with the pitch rising then falling, under a bandpass whose centre
sweeps the other way. **That crossing is what makes it a word instead of a
beep.** A `pitch` argument shifts the whole call, so one function gives a
different cat each time without a second file.

Sounded once when the cat stop opens, because the reason a child stops there is
to look at a cat and a cat that is silent when you crouch in front of it is a
model of a cat. And then in the street every twenty-two to forty-eight seconds,
irregular on purpose: something that arrives on a count becomes a metronome, and
a cat you hear every ten seconds is a cat you start waiting for.

Silent while a stop is open, so it never talks over the guide. On the `ambience`
channel, so it can be muted without muting the guide. Off entirely under reduced
motion.

## D-152 — Van's four deliveries, and why the lake was invisible (31 Jul 2026)

Castle, breakfast table, Urartian stele and the odd-eyed cat. All four
re-authored on y = 0; three had arrived buried.

**The lake was never missing. It was under the paving.** The ground is drawn 44 m
past the play boundary (D-082) and `Water` renders at y = -0.06, *below* it. Van's
water plane started at the boundary, so its first 44 m were hidden and Akdamar —
placed at the end of the walk on purpose — was standing on a car park.

The shore is now where the paving runs out, at z = -103, and Akdamar sits just
past it: sixty-eight metres ahead of the last stop, filling the view a child
walks towards. That is how the sea and the Maiden's Tower already work in
İstanbul, and it is why İstanbul never showed the fault.

**The Urartian stele is dressing, not a stop.** None of Van's three stops is
about Urartu — the second is Akdamar, whose text is a 1,100-year-old island
church and whose reward is a boat ticket. Making the stele that stop would have
a child read about a church and collect a boat ticket in front of a cuneiform
stone. Tushpa is everywhere underfoot in Van and nowhere in the canonical stops.

**İstanbul's rigged cat walks Van** until the odd-eyed one is rigged. The
delivered Van cat has no skin and no animation, so it stands as the stop object
where its two eyes are the point, and the tabby does the walking.

**The registry had to be rebuilt for this city.** Three ids ended up recorded
twice with different byte counts and checksums, and a `city_van_cat_basket`
entry existed for a file that had been deleted. Patching them one at a time
failed twice. Every `city_van_*` entry was stripped and one block regenerated
with the numbers read back off disk.

The test that caught it is the one from D-124 — the registry held against the
files it describes. It has now found a wrong size, a wrong checksum and a
duplicate id on three separate occasions. **A record that is not checked against
the thing it records is a comment.**

## D-153 — Three canoes, and a cat you can hear (31 Jul 2026)

**The canoes are the tram's motion at a fifth of its speed.** Out, pause, back —
which is also what a canoe does at the end of a crossing, so nothing new had to
be written. `Tram` takes a speed now instead of reading a constant, and three
lines at 1.1, 1.5 and 1.9 m/s keep the boats from moving as one object.

They cross the view rather than running along it, which is the lesson the
Eastern Express took two turns to learn (D-142), and they sit past the paving
where the water actually shows (D-152). The point of them is a sentence the
owner put better than the brief did: a child should be able to see that the lake
is something you go *on*. A flat blue plane with an island on it is scenery.

**The cat can be heard.** Synthesised on the same principle as the train horn
(D-145) — the recognisable part is tonal, so it is built from tone rather than
from noise. A meow is two glides, up into the vowel and down out of it, with a
second voice a fifth above; triangle waves, because a sawtooth cat sounds like a
door. Pitch and length vary a little each time so the same cat is not heard
twice.

**One timer for the city, not one per cat.** Five cats each on their own clock
is a cattery. And the interval wanders either side of fifteen seconds, because a
call exactly every fifteen reads as a machine inside about a minute — which is
roughly how long a child spends on one street.

Only where the animal is actually a cat. Gaziantep's dogs and Kars's geese each
want their own voice, and a meow from a goose is worse than silence.

**Two deliveries are being held.** A stone terrace bridge at 1.71 m and a
citadel ridge at 15 m arrived without a place named for them, and the citadel
ridge is the piece that was retired from Van's sides two turns ago (D-151).
Guessing where they go is how the ferry became a row of facades. They are
measured and waiting.

## D-154 — The sea was under the pavement all along (31 Jul 2026)

The owner's screenshot showed İstanbul's ferry and the Maiden's Tower standing
on cobbles with the Bosphorus a strip on the horizon, and asked why they had
been moved on to land.

**They had not been moved.** İstanbul's scene file is byte-identical to the
package this work started from: same water, same bounds, same backdrop, same
positions. The ferry has always been at z = -128 and the tower at z = -146.

What was wrong is older and structural. The paving is drawn 44 m past the play
boundary (D-082), the boundary is at z = -112, and `Water` rendered at
y = -0.06 — **under the ground**. So everything between -112 and -156 stood on
stone with the sea hidden beneath it. Van's lake looked missing for exactly the
same reason a few turns ago (D-152), and I fixed it there by pushing the lake
out past the paving instead of asking why the paving was on top of it.

Water is now drawn at y = +0.02 with a depth bias. That is the right way round
physically — sea over seabed — and it fixes both cities at once. Van's lake and
Akdamar have come back in to the end of the walk, where they were wanted.

**My part in it was making it visible rather than making it.** D-124 took the
ferry from the 15 m it was being drawn at to its recorded 9 m, and a smaller
boat leaves more cobble showing around it.

## D-155 — The ferry crosses the Bosphorus (31 Jul 2026)

It stood still on the water: a twenty metre boat moored in the middle of a
strait. It now runs the Eastern Express's motion — in from off the map, across
everything the child is looking at, out the other side, fifteen seconds, again —
at nine metres a second.

`Train` takes its cue and its interval and its speed as props now, so the two
differ only in the horn. The ferry's is one long low note where the locomotive's
is two bright ones: same construction as D-145, tonal rather than noise, through
a lowpass, taking a second to speak.

## D-156 — Finished cities are not changed without asking (31 Jul 2026)

Recorded because the owner had to say it.

İstanbul is finished. Over the last several turns it has had its collider
changed so the Kapalıçarşı could be walked through, its shadows renamed, its
ferry and tower resized by D-124 and now its ferry set sailing. Some of that was
asked for; the resizing was not, and it changed the look of a city nobody had
complained about.

**The rule from here: a city with all its art delivered is not altered unless
the change is asked for, or is a fault being fixed and is reported as such.**
Where a general improvement would touch one — as the water fix does — say so and
get the nod first, which is what happened here.

## D-157 — The cat is heard in Van only (31 Jul 2026)

The meow went everywhere with a cat in it. The owner cut it back to Van, and it
is the right call: İstanbul's cats are part of the furniture there, and a city
that mews every fifteen seconds is a city insisting on itself. In Van the cat is
the answer to the city's one question, so the sound is doing work rather than
decorating.

Three deliveries also found their places. The **jetty** is stop two — a lake is
not child-scale, so the boarding point stands in for it, the third time this
project has answered that problem the same way. The **citadel ridge**, retired
from Van's sides two turns ago, is back beside the castle where a spine belongs:
rock to the right, orchard to the left, so the back is not symmetrical. The
**stone footbridge**, which arrived with no place named for it, is at the lake
end of the street where the ground runs down to the shore — too small to bridge
anything and too built to be a step, so it is used as what it is.

## D-158 — Akdamar goes back where the owner put it (31 Jul 2026)

I moved it and should not have.

It was out at a hundred and fifteen metres because the water was hidden under
the paving and anything nearer would have been an island in a car park. Once the
water was drawn over the ground (D-154) I brought it in to thirty metres past
the last stop, reasoning that a child should walk towards it. Nobody asked for
that, and the owner had been right the first time.

Near, the island's own square plate of water reads as a teal disc lying on the
grass, because the lake plane no longer covers it. Out in the lake the plane
does cover it, the island sits *in* the water rather than on a saucer of its
own, and — the part I had not thought about — **the canoes pass between the
child and the church** instead of disappearing behind it.

The canoes moved with it: they now cross between the shore and the island rather
than around and beyond it. The church is the thing being looked at; the boats
are what is happening on the way to it.

## D-159 — The ferry passes beyond the tower (31 Jul 2026)

The crossing was at z = -128 and the Maiden's Tower stands at -146, so a twenty
metre boat went between the child and the landmark. It runs at -158 to -166 now,
beyond it, and at four metres a second rather than nine — at nine it read as a
speedboat, and a ferry crossing a strait is slow.

## D-160 — The ground beside Van's castle, measured (31 Jul 2026)

The owner said both sides of the castle looked bare and I had already put an
orchard on one and a ridge on the other. Sweeping the circle from the spawn — the
method that found Kars's two windows (D-149) — showed thirteen degrees still
open in the back quarter, which is what they were seeing.

Two more orchards further out and further round close it, and a second ridge
thickens the other side so the two balance without matching. Measured, then
placed, then measured again: nothing over five degrees left open anywhere a
child stands.

**This is the fourth time a "that area looks empty" has been answered by
guessing at coordinates and the fourth time the sweep found it in one run.** The
lesson from D-149 was written down and then not reached for. It should be the
first thing tried, not the thing tried after three attempts.

## D-161 — Cappadocia's valley leaned over the street (31 Jul 2026)

The screenshot showed a brown mass across the top of the view with sky and the
street visible underneath it.

The file is 39.72 × 6 × 39.12 and the registry records 79.4 × 12 × 78.2 —
exactly double on every axis. So the plates were drawn at half the size the
layout had always assumed, which is why the ring was written with a generous
overlap in the first place. D-124 gave them the size on the record, and a twelve
metre rim aligned exactly on the boundary is about forty degrees of the sky from
a child's eye fifteen metres away. It leans, and because a valley plate is a
dish, you can see under its lip.

Near-edge alignment was right for a six metre rim and wrong for a twelve metre
one. The plates are set back twelve metres past the boundary now. The rule
(D-101) has not changed — it stops a landscape swallowing the play area — but a
piece that tall needs distance as well as alignment.

## D-162 — Two shorelines, put where they belong and left there (31 Jul 2026)

Water is drawn over the ground now (D-154), so wherever the plane's near edge
falls is where the sea appears to start. Both cities had it in the wrong place
and I had moved Van's four times in as many turns, which the owner noticed
before I did.

- **İstanbul: the shore is the Maiden's Tower.** The near edge was at the play
  boundary, so the Bosphorus ran up to the houses. It sits at z = -142 now, four
  metres in front of the tower, which puts the tower in the water where an
  island belongs and the quay on land.
- **Van: the shore is past the last house.** The side houses reach z = -74 and
  the water started at -59, so the far pair stood in the lake. The near edge is
  at -80. The canoes moved with it and cross between -84 and -99, on water and
  still in front of the island.

The balloons came down at the same time. They used to start thirty-four metres
past the last stop and climb to sixty; from the street that is a row of specks
near the top of the sky. Four of them are within thirty metres of the walk now,
at seventeen to thirty metres up, so a child looking ahead has one in view and
the near pair read as baskets with people in them.

And Van's citadel ridge is square to the castle rather than turned. A spine is a
long shape and only reads as one seen broadside; turned even a fifth of a radian
it foreshortens into a lump.

## D-163 — One number for a shoreline (31 Jul 2026)

Van's water was typed into three places — the plane, the canoe lines, the
island — and I changed it four times in four turns. Twice that left the boats
sitting on grass, and the owner noticed the pattern before I did: *this moving
water business, where did it come from.*

`VAN_SHORE_Z` is one constant now and all three derive from it. The test holds
the relationship rather than the numbers: whatever the shore is set to, no canoe
is nearer than it and nothing that stands on land is further.

**A shoreline and the things floating on it cannot be maintained separately.**
That is the general form, and it is the same fault as a registry that records a
size the file does not have (D-124) — two statements of one fact, kept by hand.

## D-164 — The ridge runs beside the street (31 Jul 2026)

It had been square to the castle across the back, where twenty-seven metres of
spine is seen end-on and reads as a lump. Turning it did not help because the
back has no long view.

It runs down the east side of the walk now, and **two of that side's four
townhouses were dropped to let it show.** That is Van: the citadel rock runs
beside the town and the town is built against it, so a continuous row of houses
with a ridge somewhere behind them shows neither.

The owner offered the houses before I asked for them, which is the right trade
and one I would have hesitated over.

## D-165 — The balloons come up out of the valley (31 Jul 2026)

Three attempts. First they ran from thirty-four metres past the last stop out to
a hundred and ninety-six at heights up to sixty — a row of specks near the top
of the sky. Then they were brought down over the walk, which was closer and
still wrong: they hung above the street with nothing to have come from.

They fly two lines now, one from each side, each starting beyond the chimney
ridges at x = ±30 and working inward and upward across the walk. A child looking
up sees them rising off the valley and passing over the rocks, which is what a
morning in Cappadocia is.

Four small ones stay far out. Without them the sky is eight balloons the same
size at the same remove, which is one balloon copied — the fault the original
layout was written to avoid, and which the variety test caught the moment the
near line replaced everything.

## D-166 — Five cities closed, and what the numbers say (31 Jul 2026)

The gate: lint clean, typecheck clean, **344 tests**, build clean, four routes.
`content:check` still fails on one thing and only one — `legacy/index.html` is
not in the package, so the canonical SHA cannot be verified from a fresh
extraction. It is a packaging gap, not a code fault, and it has been open since
the first session.

**Per-visit download**, which is the number that decides whether a child on a
tablet ever sees the city:

| | models | hero | audio | total |
|---|---|---|---|---|
| İstanbul | 8.3 MB | 4.9 MB | 1.6 MB | **14.8 MB** |
| Nevşehir | 14.3 MB | 4.3 MB | 1.3 MB | **20.0 MB** |
| Gaziantep | 14.8 MB | 4.3 MB | 1.8 MB | **20.9 MB** |
| Kars | 17.6 MB | 4.9 MB | 1.8 MB | **24.3 MB** |
| Van | 17.0 MB | 4.9 MB | 1.5 MB | **23.3 MB** |

**The cities are getting heavier, and it is a trend rather than an accident.**
İstanbul has five stops and weighs 14.8 MB; Kars has three and weighs 24.3.
Nothing has gone wrong — the newer horizons are made of more and larger pieces,
and every one of them was recompressed hard. But a sixth city built the same way
lands near 25 MB, and on a 4G connection that is twenty seconds before anything
moves. **This is the first hard limit the project has walked into that is not
about how something looks.**

Resident geometry is not the problem: 94k to 151k unique triangles per city,
against a hero that is 89k of it. Instances drawn run 54 to 71 before balloons.
The deployed overlay showed 83 draw calls in İstanbul and up to 124 in Kars,
which is comfortable.

**Structure holds in all five.** No trigger ring overlaps another anywhere —
the tightest gap is 2.6 m in Nevşehir — every stop has its reward, every city
has its own theme, its own guide, its own ground, its own animal and its own
four answered directions. One asset is still a placeholder: Van's Erek mountain,
which the castle now largely does the work of.

**What is still not tested, after five cities.** No child has played this. No
frame rate has been measured on a real tablet — the browser I can drive throttles
to nothing in the background, so the number it reports is about the browser and
not about the game. Both have been open since the first day of this work and
neither is something I can close from here.

## D-167 — The hero carried a clip it was never allowed to play (31 Jul 2026)

Asked whether the hero's triangles could come down, and the first thing the
measurement found was not triangles at all.

Nasreddin Hodja shipped with `Clapping_Run` — 13.67 seconds, 9,960 keyframes —
which the hero registry has rejected since it was written as "not aligned with
the character tone". It was downloaded on every visit to every city and played
never. His agree gesture is 13 s and capped at 2.5, so ten and a half seconds of
it were keyframes nobody could see either.

Both are stripped. **4.86 MB → 4.45 MB, and nothing looks different**, because
the engine was already refusing to play the parts that are gone. The exclusion
entry stays in the registry so a future re-export carrying the clip again is
still refused rather than quietly played.

**A correction worth making, because it changes what to optimise.** The hero
does not multiply by 81. It is two files, cached by the browser after the first
city, so across a whole country a child downloads it once or twice. What
multiplies by 81 is the per-city art, which is 8 to 18 MB and rising (D-166).

Where the hero *does* count is per frame: at 88,866 triangles it is the single
largest object in every scene and more than half the resident geometry in
İstanbul. Simplification was measured but **not applied**, because it changes
how the guide looks and the authored budget of 70–120k was set with the owner's
approval (D-012, D-072):

| ratio | triangles | file |
|---|---|---|
| as delivered | 88,866 | 4.45 MB |
| 0.7 | 62,206 | 3.68 MB |
| 0.5 | 44,432 | 3.06 MB |
| 0.35 | 31,102 | 2.57 MB |

The skin and every remaining clip survive all three. 0.5 halves the resident
geometry in all 81 provinces and takes the guide below the agreed floor, which
is the owner's call and not mine.

## D-168 — Both guides re-exported: three animations, a tenth of the triangles (31 Jul 2026)

The owner sent new characters with idle, walk and run only, and said plainly why:
the guides do not celebrate, do not talk and do not wave, so the clips were not
included. That is right, and it had been true for a while — D-113 removed the
dance, and what was left of the gestures was a nod capped at 2.5 s and a wave.

| | before | after |
|---|---|---|
| Nasreddin Hodja | 88,866 tris · 4.86 MB | **8,409 tris · 0.95 MB** |
| Keloğlan | 99,966 tris · 4.34 MB | **10,307 tris · 0.91 MB** |

Both arrived with 2048 px PNG maps and 11 MB of texture; sized by role to
1024/512 JPEG they come in under a megabyte each. `alphaMode` arrived BLEND and
is forced OPAQUE, which is what the material record already asked for.

**Per-visit download, every city:**

| | was | now |
|---|---|---|
| İstanbul | 14.8 MB | **10.9 MB** |
| Nevşehir | 20.0 MB | **16.6 MB** |
| Gaziantep | 20.9 MB | **17.5 MB** |
| Van | 23.3 MB | **19.4 MB** |
| Kars | 24.3 MB | **20.4 MB** |

And the guide is no longer the largest object in any scene: it was more than
half the resident geometry in İstanbul and is now under a tenth of it.

**The mesh floor moved from 70,000 to 6,000.** 180–250k came from the delivery
brief; 70–120k came from measuring that against a download (D-012, D-072). Both
were arguments about how much detail a guide needs up close, and the answer —
now that someone has simply tried it — is far less than anyone assumed. The
floor is not a target. It is the point below which a delivery is probably the
wrong file: a proxy, a LOD, half a character. The ceiling has not moved, because
nothing has changed about what a download can afford.

**What the system gave up, deliberately.** `celebration.clips` is empty for both
guides and `successClip` is null. The panel still opens on a clock rather than on
a report from an animation (D-031), which is what makes an empty celebration
harmless — the rule written for an animation that might never arrive now covers
one that certainly will not. `excludedClips` and `maxDurationSeconds` are both
empty and the mechanisms stay, for the next character that arrives carrying
thirteen seconds of something.

Keloğlan ships a `Run_02` that is not mapped. One run is enough, and carrying a
spare clip is cheaper than a rule about when to prefer it.

## D-169 — Ordu is open (31 Jul 2026)

The sixth city, and the first on the Black Sea. Three stops and one question,
the same shape as the last three; the guide is Keloğlan, from canonical.

Cobbles, cats and plane trees all come from the region tables without an
override — the first city that has needed none. The region's own palette does
the rest: the ground tints towards moss and the sky towards pale grey-green, so
a cobbled street reads as a wet one without a new surface being drawn.

**Four directions, and the wettest set in the project.** Sides: timber houses
with deep eaves, and hazelnut groves coming down to the back gardens, which is
what that coast does. Ahead: the sea, and it is a **beach** rather than a quay —
Ordu's shores fly the Blue Flag and the canonical text makes a point of the
surprise. Behind: Boztepe, the hill the cable car climbs, which is also why stop
two exists.

Nothing is borrowed from Van, and the reason is worth stating because both are
cities on water: Van's shore is a bare plateau meeting a lake, and Ordu's is a
forest meeting a sea. Boztepe is green to the summit where Sarıkamış is snow and
Erek is scree — three mountains that would otherwise be one mountain in three
colours.

`ORDU_SHORE_Z` is a constant and the water is measured off it, following the
discipline Van's four moved shorelines forced (D-163).

**The cable car is briefed as optional and should be built.** Every city has one
thing that moves and is not an animal — İstanbul's tram and ferry, Kars's train,
Van's canoes, Cappadocia's balloons — and Ordu's is already in the canonical
text: *glide from the seaside up to Boztepe*. The motion needs nothing new: it is
the tram's, which goes out, pauses and comes back, which is what a cable car
does.

## D-170 — Ordu's horizon and its cable car (31 Jul 2026)

Four deliveries and the theme. *Ordu'nun Kıyısı*, 3:55, Opus at 1.72 MB.

**The houses arrived one centimetre cubed** — 0.01 m on every axis, a Meshy
armature exported at centimetre scale. Nothing in the file said so; only the
measurement did. That is the whole reason every delivery is measured before it
is placed, and it is the most extreme case yet: a factor of 1,100.

**Boztepe came 44 m across where the brief asked for 78**, so it is placed as
three overlapping plates at different angles rather than one. Two were tried
first and the circle sweep found thirteen degrees of sky still open straight
behind the spawn — the method that has now found this class of fault four times
(D-149, D-160) and should be the first thing reached for, not the third.

Its palette confirms what it is without a look: green outweighs red in the
colour map, where Sarıkamış and Erek both run the other way. Three mountains
that would otherwise have been one mountain in three colours.

**The beach deck arrived as a square diorama** — 5.8 by 5.7 rather than the
narrow deck briefed — so it takes a wider footprint and a larger trigger ring
than a stop usually gets. Left at 1.6 m: a child has to see the sea over it, and
anything taller stands in front of the thing the stop is about.

**The cable car runs.** It is the tram's motion at half pace — out, pause, back —
because that is what a cable car does, so nothing new was written. It works the
east side clear of the walk, from the shore end up past the boundary towards the
hill.

Ordu is 9.4 MB a visit with three assets still to come, against İstanbul's 10.9
finished. The lighter heroes are most of that, and the horizon being three
pieces rather than a dozen is the rest.

## D-171 — The cable car goes somewhere (31 Jul 2026)

Two corrections, and the second is mine.

**The seaside diorama was not stop three.** I registered it as the beach deck,
and it is a twenty-two metre stretch of coast with a promenade on it — something
you look at across a bay, not something a child walks up to. It is
`city_ordu_altinordu_seafront` now, standing out on the water opposite Boztepe.
That is the shape of the city: Ordu curls round its own bay, with the hill
behind the town and the far arm of the coast in front of it. It answers the
front the way Akdamar answers Van's and the Maiden's Tower answers İstanbul's.

The actual deck arrived this turn: 4.3 × 1.6 × 4.4, which is what the brief
asked for.

**The cable car ran from nowhere to nowhere.** It worked the east verge on a
line I placed before the station existed — a red cabin sliding along beside the
street. The station is now at the shore end of the walk and the line starts just
off its east edge and climbs to Boztepe behind the town, so a child standing at
stop two watches the thing they have just read about leave the building in front
of them and go where the text says it goes.

**And it hangs.** `Tram` put everything at y = 0, which is right for a tram and
a canoe and wrong for a cable car — it was sliding along the ground. The motion
now takes an optional pair of heights and interpolates between them: the cabin
leaves the station at 4.2 m and reaches the hill at 19. A cable car that stays
level is a tram on stilts.

The station is nine metres across, the widest stop object in the project, so its
trigger ring comes out at 8.5 m. That is correct rather than a problem — the
ring is derived from the footprint, and a station is a building rather than a
piece of furniture.

## D-172 — Paragliders off Boztepe (31 Jul 2026)

Stop one is delivered — the hazelnut stall, 2.5 × 2.0 × 1.9, and the first
model in this project that arrived at the briefed size and needed nothing but
lifting on to y = 0.

**And Ordu has a second moving thing.** Boztepe is a launch site: people run off
the top and circle down over the town, which is the other half of what that hill
is for. The cable car takes them up; this is what comes back down. Three of
them, starting high and behind the walk near the hill, working forward and lower
towards the sea.

**No new behaviour was written.** They use the balloon component — drift, lift,
lean, and a seeded phase so no two move together. A canopy hanging in the air
and a balloon hanging in the air are the same problem, and the only thing that
differs is the model. `paragliders` is the same shape as `balloons` for the same
reason.

Held by a test in the form D-122 established for the balloons: they belong to
Ordu and appear nowhere else. A canopy over the Bosphorus would be exactly the
borrowing that rule exists to stop.

The canopy is 4.5 m tall against a 2.4 m cable car. One drawn at a person's size
reads as a bird.

## D-173 — Ordu loses its sea and gains a plateau (1 Aug 2026)

The owner's screenshot showed the Altınordu seafront across the bay looking
like a raft: a twenty-two metre plate of coast sitting on an infinite blue
plane, with nothing between it and the horizon. It was the right idea and it
read badly, and the fix is not a better island.

**Perşembe Yaylası closes the front instead, and Ordu has no water at all.**
That province is a coast *and* a highland, and the highland is the half a child
can walk out into: eighty-two metres across at fourteen tall, near-edge aligned
like every landscape plate.

It also removes the only thing that had been fragile about this city. Water is
drawn as one flat plane over the ground (D-154) and every object standing near
it has to be checked against a shoreline that has moved five times across two
cities (D-163). Ordu now has no shoreline to maintain.

**The cable station is scenery and the cabin is stop two.** Nine metres of
building is a place rather than something to walk up to, and what a child at
that stop is actually looking at is the red car. The station stands where the
street meets the plateau, the line still starts there, and the cabin they have
just read about leaves the building in front of them and climbs to Boztepe.

**And the gap behind the houses is orchard.** The houses stop at the boundary
and Boztepe starts twenty-two metres past it, which left bare ground either side
of the square — the owner's complaint. On this coast that is exactly what fills
it: hazelnut comes right down to the back gardens. Six more groves, three a
side, and the circle sweep now reports nothing open over five degrees from
either the spawn or the middle of the street.

The grove arrived drawn as a multi-stemmed shrub rather than a round-crowned
tree, which is what the brief asked for and what keeps the planting in the one
world-champion hazelnut province from reading as generic greenery.

## D-174 — Plan coverage is not height coverage (1 Aug 2026)

The owner said the back of Ordu looked empty. The angular sweep (D-149) —
the method that has found this class of fault five times — reported nothing open
over five degrees from any of four viewpoints. It was right and it was not
enough.

**A grove covers the angle at four metres where a house covers it at eleven.**
The sweep marks a direction as filled if anything at all stands in it; a child
sees over the top of the short thing and finds sky. Ordu's house rows stop at
the boundary and Boztepe starts twenty-two metres past it, so the square behind
the spawn had eleven metres of house on each flank and then four-metre groves.

So there is a second measurement now: the elevation of the tallest thing in each
direction above a child's eye. It is a test, ahead exempt as it is in Kars,
requiring eight degrees everywhere else. Ordu's back quarter was under that and
is now at 21.5.

Filled with four more timber houses, two a side, turned in towards the square —
a town under a hill wraps round rather than stopping in a line.

## D-175 — A plate whose subject is its top has to be tilted (1 Aug 2026)

Perşembe Yaylası arrived as a disc seen from above: a river winding across it,
cart tracks, farmhouses, pines. Every landscape plate in this project until now
has been a wall — a ridge, a cliff, a row of houses, a mountain — and standing
this one upright showed a child its rim and nothing else.

Scene props now take an optional `rotationX`. The plateau is tilted twenty-two
degrees towards the town and lifted eleven metres so its near lip clears the
roofline instead of cutting the street off at eye level.

That is not a trick to make a model legible. It is what a yayla is from the
coast: a highland whose flank you look up at. The tilt makes the geometry agree
with the thing it depicts.

## D-176 — The paragliders were among the rooftops (1 Aug 2026)

Placed at 23 to 34 metres, which sounds like sky and is not. Boztepe is 26 m
tall and the timber houses are 11, so the lowest canopy was level with the hill
and the highest only eight metres over it — from the street they read as
something on the ground rather than something flying.

They fly at 42 to 58 now, clear of everything in the city, and half again as
large so they still read at that distance: canopies of 6.5 to 9 m against a
2.4 m cable car.

Held by a test that measures them against the tallest thing standing in the
scene rather than against a number, so the rule survives a taller hill.

## D-177 — The tilt was the wrong way round, and so was the test (1 Aug 2026)

Perşembe Yaylası came out as a black hole in the sky. The tilt introduced last
turn (D-175) had the wrong sign.

A rotation about X turns the top normal to (0, cos θ, sin θ). The child stands
at greater z than the plateau, so the surface faces them only when sin θ is
positive. At -0.38 the disc was tipped away and what showed was its underside,
which has no lighting and no texture worth speaking of.

It is +0.38 now, and the pivot moved from eleven metres to fourteen: the near
lip sits 2.7 m below ground and the far edge at thirty, so the plateau grows out
of the earth and rises away instead of hanging in the air.

**The test confirmed the bug rather than catching it.** I wrote
`expect(rotationX).toBeLessThan(-0.2)` — an assertion copied from the value on
screen instead of derived from what it should be. It now computes the normal and
requires it to face the child, and separately requires the near edge to reach
the ground. Both are statements about the world; the old one was a statement
about my own output.

That is the second time in this project a test has been written to agree with
the code instead of with the requirement (D-139 was the first, tabbing through
the canonical option order while the panel shuffled). **A test derived from the
current behaviour tests nothing.**

## D-178 — The paragliders fly over Boztepe (1 Aug 2026)

Three placements, wrong in two opposite directions before this one.

At 23 to 34 metres they were among the rooftops — Boztepe is 26 m. Raised to 42
to 58 over the street, they left the frame entirely: a child walking down a
street does not look ninety degrees up, so canopies directly overhead are
canopies nobody sees.

They fly over the hill now — twenty to forty metres behind the square, at
thirty-seven to forty-four up. That is where the launch is, and it is where a
child turning round finds them: against the hill they came off, which is the
half of Boztepe the cable car does not tell.

## D-179 — The near *top* corner is what floats (1 Aug 2026)

The plateau still hung in the sky after the tilt was corrected, and the reason
is a geometry mistake I had made twice: I checked where the near **lip** landed
and not where the near **top corner** did.

Tilted forward, the lip drops and the corner above it rises. The lip was buried
at -2.7 m and the corner stood at **+10.3** — ten metres of rock at eye level
with sky underneath it, which is precisely a floating island.

Three changes together:

- **Half again as large.** 82 m across becomes 129, and 90 deep becomes 142. A
  plate that is going to be the horizon has to be bigger than the things in
  front of it.
- **Pivot below ground**, at -5 rather than +14, which puts the near top corner
  at -3.5 and the far rim at 35.8. The land now climbs out of the earth.
- **Tipped less**, 0.28 rather than 0.38. A plate this size does not need a
  steep tilt to show its surface, and a gentler one reads as a slope rather
  than a ramp.

**And it sits on a mountain now.** A tilted plate meeting flat ground has a seam
however deep it is buried, so three Boztepe plates stand along that line —
lower, overlapping, turned — and the ground climbs into the plateau instead of
stopping at it. That is what the owner asked for and it is also what a yayla is:
the flat top of a mountain, not a shelf in the air.

## D-180 — Where a paraglider goes is a camera question (1 Aug 2026)

Four placements. 23–34 m: among the rooftops, because Boztepe is 26. 42–58 m
over the street: out of frame, because a child walking down a street does not
look ninety degrees up. 37–44 m over the hill: behind the child for the whole
walk.

The number that decides it is not height and not distance but the **elevation
angle from where the child stands**. They now sit at 22 to 26 m, twenty to
thirty-five metres out, ahead and to the sides — between 27° and 36°, which is a
glance rather than a craned neck.

The test measures that angle rather than a height, requires 12° to 40°, and
separately requires each canopy to clear anything standing within thirty-five
metres of it. Height alone had already passed three times while the thing was
invisible.

## D-181 — The drift was hiding the paragliders, not the position (1 Aug 2026)

Four placements and the owner still could not see them. It was never where they
were put.

`balloonOffsetAt` wanders **forty-five metres either side** of a balloon's
resting position, along x. That is right over a Cappadocian valley, which is
what it was written for. Ordu's paragliders sat within thirty metres of a
fifteen-metre-wide street, so the wander carried them ninety metres across and
they spent most of their time outside the frame — whatever height they were at.

`driftAmplitude` is optional on a spec now, forty-five by default. Ordu's fly
with eight to eleven, over the town where they were first put.

The test grew a clause for it, and the clause matters more than the placement:
elevation is checked **at both extremes of the wander**, not at the resting
position. A thing that looks right where it is defined and wrong for the rest of
the minute passes any check made at rest.

## D-182 — The beach model finds its third and correct job (1 Aug 2026)

The seaside diorama has been stop three, then the Altınordu seafront across the
bay, and it went when the sea did. It is scenery beside stop three now, standing
in a gap opened in the east row of houses — a coastal town breaks where it meets
the shore.

That is what the stop needed. Its text is about Ordu's Blue Flag beaches and it
had a wooden deck standing on grass. The model carries its own sand and water,
so it reads as a beach in a city that no longer has a sea.

**And a mistake worth recording.** The edit that opened the gap landed in Van's
house loop instead of Ordu's — same shape of code, two hundred lines apart —
and quietly deleted one of Van's east houses. Caught by reading the generated
scene for both cities rather than the one being worked on. When two cities share
a structure, a change to one has to be checked against the other.
