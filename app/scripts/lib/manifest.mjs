import fs from 'node:fs';

/** Minimal RFC-4180 reader shared by the registry and scene builders. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((entry) => entry.some((cell) => cell.trim().length > 0));
}

const SHAPES = new Set(['box', 'cylinder', 'sphere', 'plane']);

/** Manifest states width x depth x height; the engine wants width, height, depth. */
export function parseDimensions(value, fallbackShape) {
  const parts = value.trim().toLowerCase().split('x');
  if (parts.length !== 3) return [2, 2, 2];
  const [width, depth, height] = parts.map((part) => Number.parseFloat(part));
  if ([width, depth, height].some((n) => !Number.isFinite(n))) return [2, 2, 2];
  if (fallbackShape === 'plane') return [width, height, Math.max(depth, 0.05)];
  return [width, height, depth];
}

export function readManifest(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
  const [header, ...rows] = parseCsv(raw);
  const columns = header.map((name) => name.trim());
  const indexOf = (name) => columns.indexOf(name);
  return rows.map((row) => {
    const get = (name) => (row[indexOf(name)] ?? '').trim();
    const fallback = get('fallback');
    const shape = SHAPES.has(fallback) ? fallback : 'box';
    return {
      id: get('asset_id'),
      kind: get('kind'),
      tier: get('tier'),
      status: get('status'),
      dimensions: parseDimensions(get('dimensions_m'), fallback),
      triangleBudget: Number.parseInt(get('triangle_budget'), 10) || null,
      textureBudget: get('texture_budget') || null,
      fallbackShape: shape,
      notes: get('notes'),
    };
  });
}

/**
 * Footprints for graybox stand-ins, mirroring src/engine/assets/registry.ts.
 * Keeping them here lets the scene builder size colliders for migrated stops
 * that have no commissioned asset yet.
 */
export const GRAYBOX_DIMENSIONS = {
  bazaar: [8, 5, 8],
  simit: [1.6, 1.4, 0.9],
  balloon: [6, 8, 6],
  loom: [2.2, 1.8, 1.2],
  chimneys: [10, 14, 10],
  cave: [2.4, 2.4, 0.6],
  mosque: [12, 14, 12],
  theatre: [14, 5, 14],
  gol: [16, 0.2, 16],
  /**
   * Van. A cat in a basket is the smallest stop object in the project; the
   * jetty is long rather than tall, because what a child walks up to is the
   * boarding point and the island is out on the water.
   */
  vancat: [1.1, 0.9, 0.9],
  selale: [6, 10, 3],
  /**
   * Kars. A ruined doorway and a cheese stall are ordinary stop objects; the
   * platform is not, and its footprint says so — a train is long, and the
   * approach distance and trigger ring are derived from depth, so giving it a
   * cube's footprint would park the child inside the locomotive.
   */
  antik: [2.6, 3.2, 1.0],
  tren: [6.0, 3.4, 2.6],
  stall: [2.2, 1.6, 1.1],
};

export const DEFAULT_GRAYBOX_DIMENSIONS = [2.4, 2.4, 2.4];

/**
 * Footprints of models that have actually been delivered.
 *
 * The scene builder sizes colliders, trigger rings and approach distances from
 * a footprint. Delivered city art is registered in the TypeScript asset
 * registry, which this script cannot import, so the measurements are mirrored
 * here — and a test compares the two so they cannot drift apart.
 *
 * Without this the Grand Bazaar kept the 8 x 8 graybox footprint after a
 * 5.37 x 3.6 gateway was delivered: a trigger ring half again too wide, which
 * silently rejected two prop placements that were nowhere near it.
 */
export const DELIVERED_DIMENSIONS = {
  city_istanbul_hagia_sophia: [16.9, 10.0, 17.9],
  city_istanbul_iznik_tile_panel: [1.51, 2.2, 1.06],
  city_istanbul_ferry_terminal: [13.9, 8.0, 8.9],
  city_istanbul_ferry_boat: [20.2, 9.0, 4.5],
  city_istanbul_beyoglu_row: [30.7, 14.0, 12.3],
  kit_turkish_flag: [3.5, 6.0, 1.0],
  kit_hot_air_balloon: [3.1, 5.0, 3.1],
  city_nevsehir_fairy_chimney_cluster: [6.5, 4.5, 5.0],
  city_nevsehir_chimney_ridge: [24.7, 17.0, 19.0],
  city_nevsehir_valley: [79.4, 12.0, 78.2],
  city_gaziantep_zeugma_mosaic_panel: [1.82, 2.2, 0.69],
  city_gaziantep_baklava_counter: [2.26, 1.3, 0.86],
  city_gaziantep_coppersmith_workbench: [2.18, 1.9, 1.65],
  /**
   * Van, briefed and not yet delivered. Named here so the street is laid out
   * for the objects that are coming: `gol` would otherwise hand the jetty a
   * sixteen metre square, which is the lake's footprint and not the boarding
   * point's.
   */
  city_van_erek_mountain: [96.0, 30.0, 90.0],
  kit_van_cat: [0.2, 0.55, 0.76],
  city_van_castle: [59.09, 16.0, 32.77],
  city_van_odd_eyed_cat: [0.29, 0.8, 1.11],
  city_van_breakfast_table: [2.93, 1.3, 2.92],
  city_van_urartu_stele: [1.4, 2.6, 0.96],
  city_van_akdamar_island: [23.19, 11.0, 23.18],
  /**
   * Ordu, briefed and not yet delivered. Named so the street is laid out for
   * what is coming: the beach deck is wide and low, the cable station is tall,
   * and `fruit` would otherwise hand all three the same cube.
   */
  /**
   * Bolu, briefed and not yet delivered. Named here so the street is laid out
   * for what is coming: `gol` would otherwise hand the jetty the lake's own
   * sixteen metre square and a twelve metre trigger ring.
   */
  city_bolu_yedigoller_jetty: [8.51, 2.6, 9.0],
  city_bolu_mengen_kitchen: [2.57, 2.4, 2.0],
  city_bolu_ski_lift_station: [7.1, 4.2, 7.05],
  city_bolu_forest_row: [41.9, 13.0, 20.43],
  city_bolu_lake_forest: [70.0, 12.0, 60.0],
  city_bolu_kartalkaya_peak: [72.3, 27.67, 68.51],
  kit_bolu_fir: [4.65, 9.0, 4.66],
  kit_chairlift_chair: [1.54, 1.9, 0.9],
  kit_bolu_leaf_fall: [1.35, 0.14, 1.34],
  kit_bolu_deer: [1.2, 2.8, 3.4],
  city_ordu_hazelnut_stall: [2.49, 2.0, 1.93],
  city_ordu_paraglider: [5.55, 4.5, 3.03],
  city_ordu_beach_deck: [4.29, 1.6, 4.44],
  city_ordu_beach_front: [9.43, 2.6, 9.23],
  city_ordu_cable_station: [9.01, 4.4, 8.91],
  city_ordu_persembe_plateau: [129.13, 22.0, 141.9],
  kit_ordu_hazelnut_grove: [7.63, 4.4, 7.86],
  city_ordu_timber_houses: [24.13, 11.0, 15.23],
  city_ordu_boztepe_hill: [43.57, 26.0, 45.09],
  city_ordu_cable_car: [2.4, 2.4, 2.26],
  kit_ordu_hazelnut_tree: [4.3, 4.5, 4.4],
  kit_balikesir_pelican: [1.08, 1.0, 1.0],
  kit_balikesir_olive_tree: [5.65, 5.5, 5.51],
  city_balikesir_kaz_daglari: [71.39, 32.0, 71.11],
  city_balikesir_olive_terrace: [34.99, 12.0, 34.74],
  city_balikesir_cunda_island: [37.68, 16.0, 28.77],
  city_balikesir_manyas_reeds: [13.24, 4.5, 7.24],
  city_balikesir_manyas_islet: [26.52, 5.0, 24.34],
  city_mardin_stone_doorway: [2.59, 3.6, 0.82],
  city_mardin_telkari_bench: [2.43, 2.2, 1.95],
  city_mardin_minaret_courtyard: [4.28, 4.6, 5.32],
  kit_izmir_pigeon_walking: [0.28, 0.34, 0.56],
  kit_izmir_pigeon_flying: [0.34, 0.3, 0.29],
  kit_izmir_surfer_a: [2.27, 1.8, 0.82],
  kit_izmir_surfer_b: [0.66, 1.75, 1.75],
  kit_erzurum_oak: [6.48, 6.5, 6.64],
  city_erzurum_lace_portal: [3.1, 4.0, 2.65],
  city_erzurum_ski_gear: [2.98, 2.2, 2.9],
  city_erzurum_oltu_workbench: [2.21, 2.2, 1.94],
  kit_erzurum_snow_drift: [2.46, 0.8, 2.46],
  kit_erzurum_wolf: [2.52, 3.5, 4.62],
  kit_erzurum_skier_a: [0.9, 1.8, 2.34],
  kit_erzurum_skier_b: [1.16, 1.8, 0.96],
  city_erzurum_cag_kebap: [3.3, 2.6, 2.37],
  city_erzurum_stone_houses: [32.99, 13.0, 13.92],
  city_erzurum_palandoken: [74.21, 32.0, 77.65],
  city_erzurum_cifte_minareli: [25.57, 22.0, 13.93],
  kit_mardin_sweets_cart: [1.91, 1.9, 1.08],
  kit_mardin_dove_flight: [2.14, 1.6, 2.42],
  kit_mardin_dove_perched: [2.04, 1.6, 0.71],
  city_mardin_terrace_houses: [15.17, 14.0, 16.11],
  city_mardin_parapet: [3.54, 1.4, 0.55],
  city_mardin_plain: [148.72, 14.0, 139.14],
  city_mardin_citadel_rock: [75.92, 24.0, 79.67],
  city_mardin_deyrulzafaran: [33.77, 18.0, 33.92],
  city_balikesir_mossy_cascade: [4.9, 2.4, 5.2],
  city_balikesir_olive_press: [3.44, 2.6, 3.3],
  city_balikesir_hosmerim_counter: [2.9, 2.4, 1.35],
  /**
   * Trabzon, measured off the delivered files.
   *
   * All eight came back on a proportion of their own rather than the brief's,
   * which is what these rows are for: the collider, the parking spot and the
   * trigger ring all come off this footprint, and the fresco doorway is 2.92
   * across where the graybox cube it replaced was 2.4.
   */
  city_trabzon_sumela_fresco_door: [2.92, 4.2, 2.41],
  city_trabzon_kemence_stand: [1.01, 2.2, 1.12],
  city_trabzon_hamsi_stall: [2.83, 2.4, 2.36],
  city_trabzon_tea_slope: [15.74, 13.0, 21.16],
  city_trabzon_sumela_cliff: [36.34, 26.0, 26.03],
  city_trabzon_uzungol: [55.1, 26.0, 58.68],
  kit_trabzon_fishing_boat: [6.05, 3.4, 2.44],
  city_van_akdamar_jetty: [3.96, 1.8, 2.23],
  city_van_citadel_ridge: [26.92, 9.0, 8.44],
  kit_stone_footbridge: [4.1, 1.2, 1.95],
  city_van_canoe: [5.07, 1.0, 1.24],
  kit_van_orchard: [9.85, 4.2, 9.79],
  city_van_townhouses: [26.7, 12.0, 15.34],
  city_kars_ani_carved_doorway: [3.57, 5.0, 1.06],
  city_kars_eastern_express_platform: [5.45, 3.4, 3.47],
  city_kars_gravyer_stall: [2.21, 2.2, 1.19],
  city_kars_eastern_express: [20.01, 3.6, 2.96],
  city_kars_sarikamis_mountain: [109.36, 34.0, 113.46],
  city_kars_ani_chapel: [7.95, 9.0, 8.7],
  city_kars_ani_church: [8.8, 11.0, 11.78],
  city_kars_ani_cathedral: [20.23, 15.0, 22.15],
  city_kars_ani_walls: [30.96, 14.0, 20.71],
  city_kars_ani_gorge: [47.87, 12.0, 63.66],
  kit_goose_standing_a: [0.33, 0.85, 0.84],
  kit_goose_standing_b: [0.39, 0.85, 0.83],
  kit_goose_foraging: [0.4, 0.6, 1.04],
  city_gaziantep_bazaar_gate: [6.72, 6.0, 5.9],
  city_gaziantep_stone_houses: [20.7, 12.0, 12.0],
  city_gaziantep_castle: [36.8, 18.0, 37.0],
  kit_olive_grove: [13.4, 5.0, 13.8],
  city_nevsehir_underground_stone_door: [3.9, 3.0, 3.82],
  city_nevsehir_carpet_loom: [2.06, 2.4, 1.27],
  city_nevsehir_pottery_wheel: [1.38, 1.4, 1.35],
  city_istanbul_maidens_tower: [7.7, 10.0, 7.6],
  city_istanbul_galata_tower: [4.28, 14.0, 4.28],
  city_istanbul_grand_bazaar: [5.37, 6.0, 3.6],
  city_istanbul_simit_cart: [2.05, 2.19, 0.96],
  kit_street_lamp: [1.25, 5.0, 1.1],
  kit_bench: [1.82, 0.9, 0.7],
  kit_planter_cypress: [0.91, 2.5, 0.91],
  kit_crates: [1.29, 1.0, 1.19],
  kit_market_stall: [2.25, 2.5, 1.61],
  kit_street_dog_tan: [0.45, 0.83, 1.43],
  kit_street_dog_dark: [0.45, 0.83, 1.43],
  kit_street_cat: [0.45, 0.6, 1.05],
  kit_anatolian_horse: [0.72, 2.4, 2.97],
  kit_wall_fountain: [2.0, 3.0, 1.7],
  city_istanbul_streetcar: [4.8, 3.4, 1.9],
  city_istanbul_stone_dock: [4.0, 1.2, 6.6],
};
