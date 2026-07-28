import { MANIFEST_ENTRIES, type ManifestEntry, type ManifestFallbackShape } from '@/engine/assets/generated-manifest';
import { assetUrl } from '@/engine/assets/assetHost';

export type QualityTier = 'low' | 'medium' | 'high';
export type PlaceholderShape = ManifestFallbackShape;

/**
 * Props delivered outside the Meshy pilot manifest.
 *
 * `asset-manifests/pilot-assets.csv` is the brief for the three pilot cities and
 * is not a record of what has shipped. Reusable street props live here, with
 * measurements taken from the delivered file rather than from its delivery note.
 */
export interface DeliveredProp {
  readonly id: string;
  readonly modelUrl: string;
  readonly checksum: string;
  readonly triangles: number;
  readonly transferBytes: number;
  /** Width, height, depth of the delivered model, in metres. */
  readonly dimensions: readonly [number, number, number];
  readonly label: string;
  readonly color: string;
  readonly placeholder: PlaceholderShape;
  /**
   * Scale the model to `dimensions` instead of trusting the file.
   *
   * Off by default: a delivered prop is normally authored at the size it means.
   * On where the project has agreed a size the file does not match — Galata
   * arrived at 20 m against an agreed 14.
   */
  readonly scaleToBrief?: boolean;
  readonly notes?: string;
}

/**
 * A delivered prop is authored at its intended size, and the engine trusts it.
 *
 * Height normalisation exists for models whose scale cannot be relied on. A
 * measured, recorded prop is not one of those: normalising a 5 m lamp and a
 * 0.9 m bench towards anything in common would flatten exactly the difference
 * that makes a street read as a street.
 */
export function trustsModelScale(entry: AssetEntry): boolean {
  return entry.manifest.status === 'delivered';
}

const DELIVERED_PROPS: readonly DeliveredProp[] = [
  {
    id: 'kit_street_lamp',
    modelUrl: '/assets/props/kit_street_lamp.glb',
    checksum: '0af61f66a9d80c92ed1bcbafd7d55f73877b0fc6027d041f1905c5c303677ff1',
    triangles: 1_834,
    transferBytes: 1_371_280,
    dimensions: [1.25, 5.0, 1.1],
    label: 'Street lamp',
    color: '#3B4A42',
    placeholder: 'cylinder',
    notes:
      'Optimised re-export: 8.36 MB to 1.31 MB at 1024 textures, and re-authored ' +
      'at 5 m. The mesh node carries a +2.5 m translation, so the root origin is ' +
      'already on the ground.',
  },
  {
    id: 'kit_street_cat',
    modelUrl: '/assets/props/kit_street_cat_walking.glb',
    checksum: 'b2fecf801593c57ecdb20994f7c420ce7cdde9feb32d068b2ce192409cb6e387',
    triangles: 19_303,
    transferBytes: 1_013_936,
    dimensions: [0.3, 0.4, 0.7],
    label: 'Street cat',
    color: '#B8A48A',
    placeholder: 'box',
    notes:
      'Skinned, 27-joint quadruped with a 1 s Walking clip. Delivered at 19,303 ' +
      'triangles against a 800-1,500 brief; accepted for this gate on size, not ' +
      'on budget. Dressing, so it has no collider.',
  },
  {
    id: 'city_istanbul_galata_tower',
    modelUrl: '/assets/city/city_istanbul_galata_tower.glb',
    checksum: '3800f6e11430182b74f1b5c74e7d8c837c4966ba200dd3cd53529d62c7f3e40c',
    triangles: 7_003,
    transferBytes: 2_814_596,
    // Authored at 14 m with its base on y = 0, so nothing is scaled or lifted.
    dimensions: [4.28, 14.0, 4.28],
    label: 'Galata Tower',
    color: '#C9BBA1',
    placeholder: 'cylinder',
    notes:
      'Third version. The first optimisation cut to 34,313 triangles with 448 px ' +
      'textures and welded across UV seams; the tower rendered white and lost its ' +
      'silhouette. This one carries its detail in texture instead of geometry: ' +
      '7,003 triangles with a 2048 colour map and 1024 for the rest, 23.09 MB ' +
      'down to 2.68 MB. Delivered already at the agreed 14 m and grounded.',
  },
  {
    id: 'city_istanbul_grand_bazaar',
    modelUrl: '/assets/city/city_istanbul_grand_bazaar.glb',
    checksum: '1870169a8cf0b8aaec70e03918a05f9e7b95524fba9d219da8c74ae716f1356e',
    triangles: 7_793,
    transferBytes: 1_988_796,
    // The file is authored tiny; these are its own proportions at 6 m.
    dimensions: [5.37, 6.0, 3.6],
    label: 'Grand Bazaar gateway',
    color: '#A8763F',
    placeholder: 'box',
    scaleToBrief: true,
    notes:
      'Delivered at 52.08 MB with four 4096 px PNG maps on 7,793 triangles. ' +
      'Recompressed to a 2048 colour map and 1024 for the rest: 1.90 MB.',
  },
  {
    id: 'kit_crates',
    modelUrl: '/assets/props/kit_crates.glb',
    checksum: '7f181f1cd132f16e1f23d1ac0cf2599b91a730b5fb805790f6645f5e562e240e',
    triangles: 3_755,
    transferBytes: 648_088,
    dimensions: [1.29, 1.0, 1.19],
    label: 'Crates and barrel',
    color: '#9A7B4F',
    placeholder: 'box',
    scaleToBrief: true,
    notes: 'Shared kit prop: 8.49 MB down to 0.62 MB at a 1024 colour map and 512 for the rest.',
  },
  {
    id: 'kit_market_stall',
    modelUrl: '/assets/props/kit_market_stall.glb',
    checksum: '76a498f4039b367aa17ca97c3aef4c599ec31140fc840d5751bb787ef20556d7',
    triangles: 3_851,
    transferBytes: 482_760,
    dimensions: [2.25, 2.5, 1.61],
    label: 'Market stall',
    color: '#B5563C',
    placeholder: 'box',
    scaleToBrief: true,
    notes:
      'Shared kit prop, delivered empty on purpose: the same stall becomes a ' +
      'spice stall in Gaziantep and a pottery stall in Nevşehir by what is ' +
      'placed on it. 6.74 MB down to 0.46 MB.',
  },
  {
    id: 'kit_planter_cypress',
    modelUrl: '/assets/props/kit_planter_cypress.glb',
    checksum: 'ee62dec6b98177caae46b6417bcca99ae0e64c500a9ffc6014ca0b1bf52a86e9',
    triangles: 3_747,
    transferBytes: 679_572,
    dimensions: [0.91, 2.5, 0.91],
    label: 'Cypress planter',
    color: '#3E6B4A',
    placeholder: 'cylinder',
    scaleToBrief: true,
    notes:
      'Shared kit prop, so it carries the under-2 MB rule: 8.40 MB down to ' +
      '0.65 MB at a 1024 colour map and 512 for the rest.',
  },
  {
    id: 'city_istanbul_simit_cart',
    modelUrl: '/assets/city/city_istanbul_simit_cart.glb',
    checksum: '9ac7be8e4a487c68ea5f55ebeaade1eb1c6afbec939af94a4a53a12ba0e24d49',
    triangles: 20_182,
    transferBytes: 1_521_132,
    dimensions: [2.05, 2.19, 0.96],
    label: 'Simit cart',
    color: '#C0392B',
    placeholder: 'box',
    notes:
      'Delivered at 969,492 triangles and 31.33 MB, which would have taken the ' +
      'scene from 50 fps to roughly 12. Simplified in-project to 20,182 ' +
      'triangles and 1.45 MB; see scripts/simplify-model.mjs.',
  },
  {
    id: 'kit_bench',
    modelUrl: '/assets/props/kit_bench.glb',
    checksum: '3a36913072da66782987cb06ad0e1b501fa4a2d22b4ac7f707dc9d1d5d4ce767',
    triangles: 1_586,
    transferBytes: 980_160,
    dimensions: [1.82, 0.9, 0.7],
    label: 'Street bench',
    color: '#7A5A38',
    placeholder: 'box',
    notes: 'Root scale 0.9, origin already on the ground.',
  },
];

export function deliveredProps(): readonly DeliveredProp[] {
  return DELIVERED_PROPS;
}

export interface AssetEntry {
  /** Logical id used by content. Components never reference file paths directly. */
  readonly id: string;
  /** Final GLB path per quality tier. Empty while the asset is still briefed. */
  readonly models?: Partial<Record<QualityTier, string>>;
  /** Geometry drawn until a real GLB arrives (CLAUDE.md rule 10, D-008). */
  readonly placeholder: PlaceholderShape;
  /** Width, height, depth in metres, straight from the manifest. */
  readonly dimensions: readonly [number, number, number];
  readonly color: string;
  readonly label: string;
  /**
   * Lift the model so its lowest point rests on y = 0.
   *
   * Meshy centres a model's origin as often as it grounds it. Measuring the
   * mounted model is more reliable than trusting the export or a hand-written
   * offset, and it costs nothing when the pivot is already correct.
   */
  readonly groundAlign: boolean;
  /** Scale the mounted model to `dimensions` rather than trusting the file. */
  readonly scaleToBrief: boolean;
  readonly manifest: ManifestEntry;
}

/**
 * Model delivery table.
 *
 * Keyed by manifest asset id; every value is a GLB path served from /public.
 * This is the ONLY place a file path may appear — an ESLint rule rejects
 * `.glb` strings in components. All 25 manifest rows are still `briefed` or
 * `placeholder`, so this table is empty and every asset resolves to primitive
 * geometry (D-008).
 */
const MODELS: Readonly<Record<string, Partial<Record<QualityTier, string>>>> = {};

/**
 * Presentation overlay: graybox colour and human-readable label.
 * Not in the CSV because these are engineering scaffolding, not art direction.
 * Anything missing here falls back to a tier-derived default, so a new
 * manifest row never breaks the build.
 */
const PRESENTATION: Readonly<Record<string, { color: string; label: string }>> = {
  character_nasreddin_hoca_base: { color: '#F2B233', label: 'Nasreddin Hoca' },
  character_keloglan_base: { color: '#E0322F', label: 'Keloğlan' },
  shared_route_marker: { color: '#3EC6C9', label: 'Rota işareti' },
  shared_interaction_highlight: { color: '#F2B233', label: 'Etkileşim vurgusu' },
  kit_marmara_urban_coastal: { color: '#8FA6B8', label: 'Marmara kenti kiti' },
  kit_central_anatolia_cappadocia: { color: '#D8C3A5', label: 'Kapadokya kiti' },
  kit_southeastern_yellow_stone_bazaar: { color: '#D9B471', label: 'Sarı taş çarşı kiti' },
  city_istanbul_iznik_tile_panel: { color: '#1B7FA8', label: 'İznik çini paneli' },
  city_istanbul_galata_tower: { color: '#C9BBA1', label: 'Galata Kulesi' },
  city_istanbul_ferry: { color: '#FFF8E7', label: 'Şehir hattı vapuru' },
  city_nevsehir_fairy_chimney_cluster: { color: '#D8C3A5', label: 'Peri bacaları' },
  city_nevsehir_pottery_wheel: { color: '#8C5A3B', label: 'Çömlekçi çarkı' },
  city_nevsehir_underground_stone_door: { color: '#9A8E7A', label: 'Yeraltı taş kapısı' },
  city_gaziantep_zeugma_mosaic_panel: { color: '#C96A2B', label: 'Zeugma mozaik paneli' },
  city_gaziantep_baklava_counter: { color: '#4CAF7D', label: 'Baklava tezgâhı' },
  city_gaziantep_coppersmith_workbench: { color: '#B87333', label: 'Bakırcı tezgâhı' },
  collectible_istanbul_iznik_tile: { color: '#1B7FA8', label: 'İznik çinisi' },
  collectible_istanbul_legend_wings: { color: '#F2B233', label: 'Efsane kanatları' },
  collectible_istanbul_ferry_token: { color: '#16324F', label: 'Vapur jetonu' },
  collectible_nevsehir_fairy_chimney: { color: '#D8C3A5', label: 'Peri bacası minyatürü' },
  collectible_nevsehir_clay_pot: { color: '#8C5A3B', label: 'Toprak testi' },
  collectible_nevsehir_lantern: { color: '#F2B233', label: 'Yeraltı feneri' },
  collectible_gaziantep_mosaic_piece: { color: '#C96A2B', label: 'Mozaik parçası' },
  collectible_gaziantep_baklava: { color: '#4CAF7D', label: 'Baklava dilimi' },
  collectible_gaziantep_copper_pot: { color: '#B87333', label: 'Bakır cezve' },
};

const TIER_COLOR: Readonly<Record<string, string>> = {
  hero: '#C9BBA1',
  midground: '#A8907A',
  background: '#B8B0A2',
  collectible: '#F2B233',
  system: '#3EC6C9',
};

function propToEntry(prop: DeliveredProp): AssetEntry {
  return {
    id: prop.id,
    models: { low: prop.modelUrl, medium: prop.modelUrl, high: prop.modelUrl },
    placeholder: prop.placeholder,
    dimensions: prop.dimensions,
    color: prop.color,
    label: prop.label,
    groundAlign: true,
    scaleToBrief: prop.scaleToBrief ?? false,
    manifest: {
      id: prop.id,
      kind: 'model',
      tier: 'midground',
      status: 'delivered',
      dimensions: prop.dimensions,
      triangleBudget: prop.triangles,
      textureBudget: null,
      fallbackShape: prop.placeholder,
      notes: prop.notes ?? '',
    },
  };
}

function toAssetEntry(manifest: ManifestEntry): AssetEntry {
  const presentation = PRESENTATION[manifest.id];
  const models = MODELS[manifest.id];
  return {
    id: manifest.id,
    ...(models ? { models } : {}),
    placeholder: manifest.fallbackShape,
    dimensions: manifest.dimensions,
    color: presentation?.color ?? TIER_COLOR[manifest.tier] ?? '#9AA5B1',
    label: presentation?.label ?? manifest.id,
    groundAlign: false,
    scaleToBrief: false,
    manifest,
  };
}

const DELIVERED_BY_ID = new Map(DELIVERED_PROPS.map((prop) => [prop.id, prop]));

/**
 * A delivered model attaches to its manifest row rather than replacing it.
 *
 * Galata Tower is both: a commissioned row in the pilot manifest, which carries
 * its tier and triangle budget, and now a delivered file. Registering it only as
 * a delivered prop silently dropped the budget it was commissioned against —
 * exactly the record you want when asking whether a delivery met its brief.
 */
function withDeliveredModel(entry: AssetEntry, prop: DeliveredProp): AssetEntry {
  return {
    ...entry,
    models: { low: prop.modelUrl, medium: prop.modelUrl, high: prop.modelUrl },
    dimensions: prop.dimensions,
    groundAlign: true,
    scaleToBrief: prop.scaleToBrief ?? false,
    manifest: { ...entry.manifest, status: 'delivered' },
  };
}

const BY_ID = new Map<string, AssetEntry>([
  ...MANIFEST_ENTRIES.map((entry): [string, AssetEntry] => {
    const base = toAssetEntry(entry);
    const delivered = DELIVERED_BY_ID.get(entry.id);
    return [entry.id, delivered ? withDeliveredModel(base, delivered) : base];
  }),
  // Kit props and city props that were never briefed as manifest rows.
  ...DELIVERED_PROPS.filter((prop) => !MANIFEST_ENTRIES.some((entry) => entry.id === prop.id)).map(
    (prop): [string, AssetEntry] => [prop.id, propToEntry(prop)],
  ),
]);

/**
 * Environment kits are referenced by content as `marmara-urban-coastal` while
 * the manifest ids them as `kit_marmara_urban_coastal`. This is a documented
 * deterministic rule, not a rename of either side (Gate A finding A-01).
 */
export function kitAssetId(kitId: string): string {
  return kitId.startsWith('kit_') ? kitId : `kit_${kitId.replace(/-/g, '_')}`;
}

/**
 * Province stars are UI awards, not 3D assets, so they are intentionally
 * absent from the manifest and must not be resolved through this registry.
 */
export function isModelAsset(assetId: string): boolean {
  return !assetId.startsWith('star_');
}

export interface ResolvedAsset {
  readonly entry: AssetEntry;
  readonly modelUrl: string | null;
  /** True when no GLB exists yet and placeholder geometry is drawn. */
  readonly isPlaceholder: boolean;
  /** True when the id is absent from the manifest — a content bug. */
  readonly isUnknown: boolean;
}

/**
 * Graybox stand-ins for migrated content.
 *
 * The prototype has 53 distinct art types across 81 provinces; the Meshy
 * manifest only commissions art for the three pilot cities. Rather than let
 * every other stop resolve as "unknown" — which would bury real content bugs
 * in noise — migrated stops resolve to a documented stand-in. These are NOT
 * commissioned art: `docs/MIGRATION_GAPS.md` lists every one that still needs
 * a brief.
 */
const GRAYBOX_SHAPES: Readonly<Record<string, { shape: PlaceholderShape; dimensions: readonly [number, number, number] }>> = {
  bazaar: { shape: 'box', dimensions: [8, 5, 8] },
  simit: { shape: 'box', dimensions: [1.6, 1.4, 0.9] },
  balloon: { shape: 'sphere', dimensions: [6, 8, 6] },
  loom: { shape: 'box', dimensions: [2.2, 1.8, 1.2] },
  chimneys: { shape: 'cylinder', dimensions: [10, 14, 10] },
  cave: { shape: 'cylinder', dimensions: [2.4, 2.4, 0.6] },
  mosque: { shape: 'box', dimensions: [12, 14, 12] },
  theatre: { shape: 'cylinder', dimensions: [14, 5, 14] },
  gol: { shape: 'box', dimensions: [16, 0.2, 16] },
  selale: { shape: 'box', dimensions: [6, 10, 3] },
};

const DEFAULT_GRAYBOX = { shape: 'box' as PlaceholderShape, dimensions: [2.4, 2.4, 2.4] as const };

function grayboxEntry(id: string): AssetEntry {
  const key = id.replace(/^graybox_/, '');
  const shape = GRAYBOX_SHAPES[key] ?? DEFAULT_GRAYBOX;
  const isCollectible = id.startsWith('collectible_');
  return {
    id,
    placeholder: isCollectible ? 'box' : shape.shape,
    dimensions: isCollectible ? [0.22, 0.22, 0.22] : shape.dimensions,
    color: isCollectible ? '#F2B233' : '#A89880',
    label: key.replace(/_/g, ' '),
    groundAlign: false,
    scaleToBrief: false,
    manifest: {
      id,
      kind: 'model',
      tier: isCollectible ? 'collectible' : 'midground',
      status: 'graybox',
      dimensions: isCollectible ? [0.22, 0.22, 0.22] : shape.dimensions,
      triangleBudget: null,
      textureBudget: null,
      fallbackShape: isCollectible ? 'box' : shape.shape,
      notes: 'Graybox stand-in for migrated content; needs a Meshy brief.',
    },
  };
}

/** True when an id resolves to a stand-in rather than commissioned art. */
export function isGraybox(assetId: string): boolean {
  return assetId.startsWith('graybox_') || assetId.startsWith('collectible_');
}

function unknownEntry(id: string): AssetEntry {
  return {
    id,
    placeholder: 'box',
    dimensions: [1, 1, 1],
    color: '#E0322F',
    label: `Eksik varlık: ${id}`,
    groundAlign: false,
    scaleToBrief: false,
    manifest: {
      id,
      kind: 'unknown',
      tier: 'unknown',
      status: 'missing',
      dimensions: [1, 1, 1],
      triangleBudget: null,
      textureBudget: null,
      fallbackShape: 'box',
      notes: 'Not present in asset-manifests/pilot-assets.csv',
    },
  };
}

/**
 * Resolves a logical asset id. Never throws: a missing asset renders a named
 * diagnostic placeholder so one bad id cannot break a city
 * (TECHNICAL_ARCHITECTURE, error strategy).
 */
export function resolveAsset(assetId: string, quality: QualityTier): ResolvedAsset {
  const entry = BY_ID.get(assetId);
  if (!entry) {
    if (isGraybox(assetId)) {
      return { entry: grayboxEntry(assetId), modelUrl: null, isPlaceholder: true, isUnknown: false };
    }
    return { entry: unknownEntry(assetId), modelUrl: null, isPlaceholder: true, isUnknown: true };
  }
  const path = entry.models?.[quality] ?? entry.models?.medium ?? entry.models?.low ?? null;
  const modelUrl = assetUrl(path);
  return { entry, modelUrl, isPlaceholder: modelUrl === null, isUnknown: false };
}

export function knownAssetIds(): readonly string[] {
  return [...BY_ID.keys()];
}

export function manifestEntries(): readonly ManifestEntry[] {
  return MANIFEST_ENTRIES;
}
