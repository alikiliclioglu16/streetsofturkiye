/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Source: asset-manifests/pilot-assets.csv
 * Regenerate: npm run assets:registry
 */

export type ManifestFallbackShape = 'box' | 'cylinder' | 'sphere' | 'plane';
export type ManifestStatus = 'briefed' | 'placeholder' | 'delivered' | string;

export interface ManifestEntry {
  readonly id: string;
  readonly kind: string;
  readonly tier: string;
  readonly status: ManifestStatus;
  /** Three.js order: width (x), height (y), depth (z), in metres. */
  readonly dimensions: readonly [number, number, number];
  readonly triangleBudget: number | null;
  readonly textureBudget: string | null;
  readonly fallbackShape: ManifestFallbackShape;
  readonly notes: string;
}

export const MANIFEST_ENTRIES: readonly ManifestEntry[] = [
  {
    "id": "character_nasreddin_hoca_base",
    "kind": "model",
    "tier": "hero",
    "status": "briefed",
    "dimensions": [
      1,
      1.65,
      0.55
    ],
    "triangleBudget": 40000,
    "textureBudget": "2K atlas",
    "fallbackShape": "cylinder",
    "notes": "Rigged humanoid; idle, walk, wave, point, talk, collect, celebrate"
  },
  {
    "id": "character_keloglan_base",
    "kind": "model",
    "tier": "hero",
    "status": "briefed",
    "dimensions": [
      0.85,
      1.45,
      0.5
    ],
    "triangleBudget": 35000,
    "textureBudget": "2K atlas",
    "fallbackShape": "cylinder",
    "notes": "Rigged humanoid; same animation contract"
  },
  {
    "id": "shared_route_marker",
    "kind": "model",
    "tier": "system",
    "status": "placeholder",
    "dimensions": [
      0.4,
      0.4,
      0.05
    ],
    "triangleBudget": 500,
    "textureBudget": "256",
    "fallbackShape": "cylinder",
    "notes": "Accessible route marker, not color-only"
  },
  {
    "id": "shared_interaction_highlight",
    "kind": "model",
    "tier": "system",
    "status": "placeholder",
    "dimensions": [
      1,
      1,
      1
    ],
    "triangleBudget": null,
    "textureBudget": "none",
    "fallbackShape": "sphere",
    "notes": "Engine effect or outline, no final GLB required"
  },
  {
    "id": "kit_marmara_urban_coastal",
    "kind": "model",
    "tier": "background",
    "status": "briefed",
    "dimensions": [
      2,
      2,
      2
    ],
    "triangleBudget": 60000,
    "textureBudget": "shared 1K atlases",
    "fallbackShape": "box",
    "notes": "Modular pavement, facades, rail, waterfront props"
  },
  {
    "id": "city_istanbul_iznik_tile_panel",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      1.6,
      1.6,
      0.12
    ],
    "triangleBudget": 8000,
    "textureBudget": "1K",
    "fallbackShape": "plane",
    "notes": "Separate selectable tulip motif mesh"
  },
  {
    "id": "city_istanbul_galata_tower",
    "kind": "model",
    "tier": "hero",
    "status": "delivered",
    "dimensions": [
      4.23,
      14,
      4.22
    ],
    "triangleBudget": 35000,
    "textureBudget": "2K",
    "fallbackShape": "cylinder",
    "notes": "Preserve silhouette; no invented text Storybook scale: the real tower is 67 m and a 32 m model filled the frame with masonry. 14 m keeps it the tallest thing on the street while a child can still see all of it."
  },
  {
    "id": "city_istanbul_ferry",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      20,
      6,
      6
    ],
    "triangleBudget": 18000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Simplified city ferry with moving route"
  },
  {
    "id": "collectible_istanbul_iznik_tile",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.25,
      0.25,
      0.05
    ],
    "triangleBudget": 5000,
    "textureBudget": "1K",
    "fallbackShape": "plane",
    "notes": "Turntable-ready"
  },
  {
    "id": "collectible_istanbul_legend_wings",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.35,
      0.22,
      0.12
    ],
    "triangleBudget": 5000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Wooden stylized wings, explicitly legendary"
  },
  {
    "id": "collectible_istanbul_ferry_token",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.2,
      0.2,
      0.04
    ],
    "triangleBudget": 3000,
    "textureBudget": "512",
    "fallbackShape": "cylinder",
    "notes": "Bosphorus ferry token"
  },
  {
    "id": "kit_central_anatolia_cappadocia",
    "kind": "model",
    "tier": "background",
    "status": "briefed",
    "dimensions": [
      2,
      2,
      2
    ],
    "triangleBudget": 80000,
    "textureBudget": "shared 1K atlases",
    "fallbackShape": "box",
    "notes": "Terrain chunks and rock modules"
  },
  {
    "id": "city_nevsehir_fairy_chimney_cluster",
    "kind": "model",
    "tier": "hero",
    "status": "briefed",
    "dimensions": [
      12,
      16,
      10
    ],
    "triangleBudget": 40000,
    "textureBudget": "2K",
    "fallbackShape": "cylinder",
    "notes": "Separate hard cap target mesh"
  },
  {
    "id": "city_nevsehir_pottery_wheel",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      1.2,
      1.1,
      1.2
    ],
    "triangleBudget": 9000,
    "textureBudget": "1K",
    "fallbackShape": "cylinder",
    "notes": "Pot and wheel separable for interaction"
  },
  {
    "id": "city_nevsehir_underground_stone_door",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      2.2,
      2.2,
      0.5
    ],
    "triangleBudget": 8000,
    "textureBudget": "1K",
    "fallbackShape": "cylinder",
    "notes": "Round rolling stone and passage guide"
  },
  {
    "id": "collectible_nevsehir_fairy_chimney",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.18,
      0.3,
      0.18
    ],
    "triangleBudget": 4000,
    "textureBudget": "1K",
    "fallbackShape": "cylinder",
    "notes": "Miniature magnet"
  },
  {
    "id": "collectible_nevsehir_clay_pot",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.22,
      0.28,
      0.22
    ],
    "triangleBudget": 6000,
    "textureBudget": "1K",
    "fallbackShape": "cylinder",
    "notes": "Decorated red-clay pot"
  },
  {
    "id": "collectible_nevsehir_lantern",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.18,
      0.28,
      0.18
    ],
    "triangleBudget": 5000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Warm explorer lantern"
  },
  {
    "id": "kit_southeastern_yellow_stone_bazaar",
    "kind": "model",
    "tier": "background",
    "status": "briefed",
    "dimensions": [
      2,
      2,
      2
    ],
    "triangleBudget": 70000,
    "textureBudget": "shared 1K atlases",
    "fallbackShape": "box",
    "notes": "Yellow-stone facades, arches and market modules"
  },
  {
    "id": "city_gaziantep_zeugma_mosaic_panel",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      1.8,
      1.6,
      0.08
    ],
    "triangleBudget": 10000,
    "textureBudget": "2K",
    "fallbackShape": "plane",
    "notes": "Use approved non-infringing reference recreation; selectable tessera"
  },
  {
    "id": "city_gaziantep_baklava_counter",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      2,
      1.1,
      0.8
    ],
    "triangleBudget": 12000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Separate ingredient objects for sequence interaction"
  },
  {
    "id": "city_gaziantep_coppersmith_workbench",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      2.4,
      1.6,
      1
    ],
    "triangleBudget": 15000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Hammer and copper surface separate for rhythm response"
  },
  {
    "id": "collectible_gaziantep_mosaic_piece",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.18,
      0.18,
      0.05
    ],
    "triangleBudget": 3000,
    "textureBudget": "1K",
    "fallbackShape": "plane",
    "notes": "Single decorative mosaic tile"
  },
  {
    "id": "collectible_gaziantep_baklava",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.16,
      0.08,
      0.16
    ],
    "triangleBudget": 5000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Clean layered cross-section"
  },
  {
    "id": "collectible_gaziantep_copper_pot",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.2,
      0.22,
      0.2
    ],
    "triangleBudget": 6000,
    "textureBudget": "1K",
    "fallbackShape": "cylinder",
    "notes": "Hammered copper surface"
  },
  {
    "id": "kit_kars_goose",
    "kind": "model",
    "tier": "midground",
    "status": "briefed",
    "dimensions": [
      0.35,
      0.85,
      0.75
    ],
    "triangleBudget": 6000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Kars goose; flock animal, walk cycle, no root motion"
  },
  {
    "id": "collectible_kars_stone_rubbing",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.22,
      0.3,
      0.05
    ],
    "triangleBudget": 3000,
    "textureBudget": "1K",
    "fallbackShape": "plane",
    "notes": "Paper rubbing of an interlace carving; slight curl"
  },
  {
    "id": "collectible_kars_express_ticket",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.14,
      0.09,
      0.05
    ],
    "triangleBudget": 2000,
    "textureBudget": "1K",
    "fallbackShape": "plane",
    "notes": "Card ticket, punched, no legible text"
  },
  {
    "id": "collectible_kars_gravyer_wedge",
    "kind": "model",
    "tier": "collectible",
    "status": "briefed",
    "dimensions": [
      0.2,
      0.16,
      0.14
    ],
    "triangleBudget": 5000,
    "textureBudget": "1K",
    "fallbackShape": "box",
    "notes": "Wedge with visible round holes on the cut faces"
  }
] as const;
