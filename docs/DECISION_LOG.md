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

