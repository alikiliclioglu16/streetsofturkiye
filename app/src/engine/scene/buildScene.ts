import type { CityDefinition, Vec3 } from '@/content/schemas/city';
import { kitAssetId, resolveAsset, type QualityTier, type ResolvedAsset } from '@/engine/assets/registry';
import { orderedHotspots } from '@/engine/interactions/machine';

export interface SceneHotspot {
  readonly id: string;
  readonly order: number;
  readonly asset: ResolvedAsset;
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
  readonly triggerRadius: number;
  readonly camera: { position: Vec3; target: Vec3; durationMs: number };
}

export interface SceneGround {
  readonly centerX: number;
  readonly centerZ: number;
  readonly width: number;
  readonly depth: number;
}

export interface SceneDescription {
  readonly cityId: string;
  readonly hotspots: readonly SceneHotspot[];
  readonly routePoints: readonly Vec3[];
  readonly bounds: readonly Vec3[];
  readonly ground: SceneGround;
  readonly spawn: Vec3;
  readonly spawnHeading: number;
  readonly routeMarker: ResolvedAsset;
  readonly guide: ResolvedAsset;
  /** Regional environment kit for this city, resolved from `environment.kitId`. */
  readonly kit: ResolvedAsset;
  /** Collectibles awarded in this city, resolved for the collection UI. */
  readonly rewards: readonly ResolvedAsset[];
  /** Asset ids that resolved to a diagnostic placeholder because they are unknown. */
  readonly unknownAssetIds: readonly string[];
}

const GUIDE_ASSETS: Record<string, string> = {
  'nasreddin-hoca': 'character_nasreddin_hoca_base',
  keloglan: 'character_keloglan_base',
};

/**
 * Converts validated content into engine configuration.
 * Contains no city-specific copy or transforms: adding a city must not require
 * editing this file (CLAUDE.md rules 2 and 3).
 */
export function buildScene(city: CityDefinition, quality: QualityTier): SceneDescription {
  const hotspots = orderedHotspots(city).map<SceneHotspot>((hotspot) => ({
    id: hotspot.id,
    order: hotspot.order,
    asset: resolveAsset(hotspot.assetId, quality),
    position: hotspot.transform.position,
    rotation: hotspot.transform.rotation,
    scale: hotspot.transform.scale,
    triggerRadius: hotspot.triggerRadius,
    camera: hotspot.camera,
  }));

  const xs = city.route.bounds.map((point) => point[0]);
  const zs = city.route.bounds.map((point) => point[2]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  const guideAssetId = GUIDE_ASSETS[city.guideId] ?? 'character_nasreddin_hoca_base';
  const kit = resolveAsset(kitAssetId(city.environment.kitId), quality);
  const guide = resolveAsset(guideAssetId, quality);
  const routeMarker = resolveAsset('shared_route_marker', quality);
  const rewards = city.rewards.collectibleIds.map((rewardId) => resolveAsset(rewardId, quality));

  // Every asset the city touches is checked, not just the hotspot models.
  const unknownAssetIds = [...hotspots.map((h) => h.asset), kit, guide, routeMarker, ...rewards]
    .filter((asset) => asset.isUnknown)
    .map((asset) => asset.entry.id);

  return {
    cityId: city.id,
    hotspots,
    routePoints: city.route.points,
    bounds: city.route.bounds,
    ground: {
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      width: maxX - minX + 4,
      depth: maxZ - minZ + 4,
    },
    spawn: city.spawn.position,
    spawnHeading: city.spawn.rotation[1],
    routeMarker,
    guide,
    kit,
    rewards,
    unknownAssetIds,
  };
}
