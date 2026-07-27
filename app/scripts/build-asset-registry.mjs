/**
 * Generates src/engine/assets/generated-manifest.ts from
 * asset-manifests/pilot-assets.csv.
 *
 * The CSV is the single source of truth for asset IDs, budgets and fallback
 * shapes (Gate A finding A-01). Running this after any manifest change keeps
 * the registry aligned; a test fails if the generated file drifts.
 *
 * Usage: node scripts/build-asset-registry.mjs [path-to-pilot-assets.csv]
 */
import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2] ?? '../asset-manifests/pilot-assets.csv';
const target = path.resolve('src/engine/assets/generated-manifest.ts');

/** Minimal RFC-4180 reader: the manifest has quoted fields containing commas. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((cell) => cell.trim().length > 0));
}

const SHAPES = new Set(['box', 'cylinder', 'sphere', 'plane']);

/**
 * The manifest states dimensions as width x depth x height in metres.
 * The engine works in Three.js order (x, y, z) = width, height, depth.
 */
function parseDimensions(value, fallbackShape) {
  const parts = value.trim().toLowerCase().split('x');
  if (parts.length !== 3) {
    // "modular" kits have no single footprint; use a neutral module block.
    return [2, 2, 2];
  }
  const [width, depth, height] = parts.map((part) => Number.parseFloat(part));
  if ([width, depth, height].some((n) => !Number.isFinite(n))) {
    return [2, 2, 2];
  }
  // A plane fallback is a thin panel standing upright.
  if (fallbackShape === 'plane') return [width, height, Math.max(depth, 0.05)];
  return [width, height, depth];
}

const raw = fs.readFileSync(path.resolve(source), 'utf8').replace(/^\uFEFF/, '');
const [header, ...rows] = parseCsv(raw);
const columns = header.map((name) => name.trim());
const indexOf = (name) => columns.indexOf(name);

const entries = rows.map((row) => {
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

const duplicates = entries
  .map((entry) => entry.id)
  .filter((id, index, all) => all.indexOf(id) !== index);
if (duplicates.length > 0) {
  throw new Error(`Duplicate asset ids in manifest: ${duplicates.join(', ')}`);
}

const body = `/**
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

export const MANIFEST_ENTRIES: readonly ManifestEntry[] = ${JSON.stringify(entries, null, 2)} as const;
`;

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, body);
console.log(`Wrote ${entries.length} assets to ${path.relative(process.cwd(), target)}`);
