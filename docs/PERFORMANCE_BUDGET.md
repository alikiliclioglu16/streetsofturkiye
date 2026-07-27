# Performance Budget

These are project production targets, not universal platform limits.

## Runtime targets

| Measure | Mobile target | Desktop target |
|---|---:|---:|
| Frame rate | stable 30 FPS | 60 FPS where practical |
| Initial map interaction | under 3 s on a normal connection after shell load | under 2 s |
| Critical city bundle | ideally 8–12 MB compressed | ideally under 18 MB compressed |
| Active scene triangles | ideally under 250k | ideally under 600k |
| Draw calls | preferably under 150 | preferably under 250 |
| Device pixel ratio | capped approximately 1.0–1.5 | capped approximately 2.0 |

## Asset targets

| Asset | Triangle guidance | Texture guidance |
|---|---:|---:|
| Guide character | 20k–45k | up to 2K atlas |
| Hero landmark | 15k–40k | 1K–2K |
| Midground prop | 3k–12k | 512–1K |
| Small prop | 500–4k | 256–1K |
| Collectible | 3k–12k | up to 1K |
| Background object | 100–2k | shared atlas preferred |

## Quality tiers

### Low

- no optional post-processing;
- reduced shadow resolution or baked-only shadows;
- lower DPR;
- fewer background props and particles;
- low LOD models;
- reduced vegetation density.

### Medium

- default mobile/standard laptop profile;
- limited real-time shadows;
- medium LOD;
- restrained effects.

### High

- higher DPR within cap;
- higher LOD;
- improved shadow quality;
- optional lightweight post-processing.

## Engineering checks

- Do not update React state every animation frame.
- Reuse geometry and materials.
- Instance repeated props.
- Dispose assets when a city unloads unless intentionally cached.
- Avoid loading all city content and GLBs on the map route.
- Measure before adding post-processing.
- Use compressed textures and geometry where the build pipeline supports them.
- Provide a simple debug overlay showing FPS, draw calls, triangles and loaded asset MB in development.
