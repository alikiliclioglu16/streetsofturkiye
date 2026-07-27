# Performance Budget

> Revised 27 Jul 2026 for the hero character policy (D-012).

## Hero characters — exempt from the prop budget

| Item | Budget |
|---|---|
| Hero mesh, per character | ~180,000–250,000 triangles |
| Approved Keloğlan GLB | ~222,150 triangles, ~16.7 MB |
| Active heroes in a normal city | **1** |
| Inactive hero | not downloaded, not mounted |
| Hero mesh across quality profiles | identical in all three |

A hero is never decimated automatically. If frames regress, the environment
pays; see the ladder below.

## Everything else

| Ölçüt | Hedef |
|---|---|
| İlk şehir yüklemesi, hero hariç | 8–12 MB altında |
| Hero GLB, ayrı ve tembel yüklenir | ~17 MB'a kadar kabul |
| Ekrandaki toplam üçgen, hero hariç | 250.000 altında |
| Hero yapı (Galata gibi) | 15.000–35.000 üçgen |
| Orta boy obje | 3.000–10.000 üçgen |
| Küçük prop | 500–3.000 üçgen |
| Standart tekstür | 1024 px |
| Hero karakter tekstürü | 2048 px |
| Draw call | 200 altında |
| Mobil | stabil 30 FPS |
| Masaüstü | 50–60 FPS |

## Quality profiles

| | high | balanced | safe |
|---|---|---|---|
| Hero mesh | full | full | full |
| Hero animation | on | on | on |
| Hero shadow | on | on | **off** |
| DPR cap | 2.0 | 1.5 | 1.0 |
| Shadow map | 2048 | 1024 | 512 |
| Post-processing | on | off | off |
| Environment density | 1.0 | 0.65 | 0.35 |
| Distant asset cutoff | 220 m | 140 m | 90 m |

Auto-selection: desktop with 8+ cores and 8 GB+ → `high`; other desktops →
`balanced`; touch devices → `safe`, or `balanced` on 8-core/6 GB+ hardware.

## Degradation ladder

When frames regress, quality is surrendered in this order:

1. post-processing
2. environment decoration density
3. shadow-map resolution
4. nonessential shadows
5. device pixel ratio
6. distant environment assets

The hero mesh and its animation are not on this list, by design.

## Loading rules

- The map route downloads no 3D hero; it shows 2D portraits.
- The hero GLB is requested only after the city shell, canonical content and
  graybox scene are ready.
- The active hero stays cached across cities while the same guide is selected.
- `useGLTF.clear()` runs on a guide switch or explicit memory pressure — never
  on ordinary city unmount.
- A failed hero load falls back to the placeholder; the city stays playable.

## Engineering checks

- No per-frame React state updates.
- One AnimationMixer per active hero, updated only while mounted.
- Scene, hotspot and hero systems dispose on city change.
- Development overlay reports fps, draw calls, triangles, textures, DPR,
  profile, active hero, active clip, hero shadow state and the exact
  environment concessions in force.
