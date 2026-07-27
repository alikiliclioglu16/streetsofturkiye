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
