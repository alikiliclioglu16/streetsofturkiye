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
    manifest,
  };
}

const BY_ID = new Map<string, AssetEntry>([
  ...MANIFEST_ENTRIES.map((entry): [string, AssetEntry] => [entry.id, toAssetEntry(entry)]),
  ...DELIVERED_PROPS.map((prop): [string, AssetEntry] => [prop.id, propToEntry(prop)]),
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
