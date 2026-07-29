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
  selale: [6, 10, 3],
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
  city_nevsehir_fairy_chimney_cluster: [8.7, 6.0, 6.7],
  city_nevsehir_chimney_ridge: [24.7, 17.0, 19.0],
  city_nevsehir_valley: [79.4, 12.0, 78.2],
  city_istanbul_maidens_tower: [7.7, 10.0, 7.6],
  city_istanbul_galata_tower: [4.28, 14.0, 4.28],
  city_istanbul_grand_bazaar: [5.37, 6.0, 3.6],
  city_istanbul_simit_cart: [2.05, 2.19, 0.96],
  kit_street_lamp: [1.25, 5.0, 1.1],
  kit_bench: [1.82, 0.9, 0.7],
  kit_planter_cypress: [0.91, 2.5, 0.91],
  kit_crates: [1.29, 1.0, 1.19],
  kit_market_stall: [2.25, 2.5, 1.61],
  kit_street_cat: [0.45, 0.6, 1.05],
  kit_wall_fountain: [2.0, 3.0, 1.7],
  city_istanbul_streetcar: [4.8, 3.4, 1.9],
  city_istanbul_stone_dock: [4.0, 1.2, 6.6],
};
