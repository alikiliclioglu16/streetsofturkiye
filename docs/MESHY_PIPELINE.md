# Meshy.ai Asset Pipeline

## Purpose

Meshy produces source 3D assets. Assets are not considered web-ready until they pass review and optimization.

## Preferred generation route

### Image-to-3D

Use for:

- recognizable historical architecture;
- Nasreddin Hoca and Keloğlan;
- culturally specific craft objects;
- hero collectibles;
- anything whose silhouette or ornament must match references.

### Text-to-3D

Use for:

- generic benches, rocks, trees and crates;
- background market props;
- modular environment fillers;
- low-risk objects without unique historical identity.

## Required input brief

Every asset request must include:

- asset ID;
- tier: hero, midground, background or collectible;
- real-world dimensions;
- expected viewing distance;
- front/side/back reference when available;
- material description;
- style anchor;
- exclusions;
- triangle and texture target;
- required pivot and orientation;
- whether rigging is required.

## Meshy prompt anchor

Append this direction when relevant:

> stylized realistic child-friendly game asset, culturally accurate Turkish context, clean readable silhouette, softened but believable proportions, PBR materials, no text, no logo, no watermark, no floating base, no environment scene, centered, complete back and underside, production-friendly topology

For monuments add:

> preserve the reference silhouette and major architectural proportions; do not invent inscriptions or extra ornament

## Character generation

- neutral A-pose or T-pose;
- fingers separated enough to read but not excessively detailed;
- feet flat and symmetric;
- no props fused to hands unless explicitly required;
- standard humanoid proportions compatible with automated rigging;
- generate the character before generating animation variants.

## Web optimization checklist

Before integration:

- confirm scale in meters;
- set pivot at ground center or documented interaction pivot;
- remove hidden/internal geometry;
- repair normals;
- merge materials when safe;
- reduce texture count;
- resize textures to budget;
- create LOD variants when required;
- export GLB;
- run GLB validation;
- test on transparent and neutral backgrounds;
- record file size and triangle count in asset manifest.

## Naming

```text
{scope}_{location}_{object}_{variant}_{lod}.glb
```

Examples:

```text
city_istanbul_galata_main_lod0.glb
city_istanbul_galata_main_lod1.glb
shared_market_stall_red_lod0.glb
character_nasreddin_hoca_base_lod0.glb
collectible_gaziantep_copper_pot_lod0.glb
```

## Review statuses

- `briefed`
- `generated`
- `art-review`
- `revision`
- `approved-source`
- `optimized`
- `integrated`
- `qa-passed`

Claude must only assume an asset is usable when the registry marks it `optimized` or provides an explicit development placeholder.
