import type { RuntimeCity as CityDefinition } from '@/content/compose';
import type { Vec3 } from '@/content/schemas/scene';
import { kitAssetId, resolveAsset, type QualityTier, type ResolvedAsset } from '@/engine/assets/registry';
import { orderedHotspots } from '@/engine/interactions/machine';
import type { RectCollider } from '@/engine/controls/movement';
import type { SceneDefinition } from '@/content/schemas/scene';
import { npcById, type FeaturedNpc } from '@/engine/npc/registry';
import type { StreetTreeSpec } from '@/components/three/StreetTree';

export interface SceneHotspot {
  readonly id: string;
  readonly order: number;
  readonly asset: ResolvedAsset;
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: Vec3;
  readonly triggerRadius: number;
  readonly collider: { halfWidth: number; halfDepth: number };
  readonly camera: { position: Vec3; target: Vec3; durationMs: number };
}

export interface SceneGround {
  readonly centerX: number;
  readonly centerZ: number;
  readonly width: number;
  readonly depth: number;
  /** Region ground tone, straight from the canonical region record. */
  readonly color: string;
}

export interface SceneSky {
  /** Zenith and horizon colours; the canonical source authored both. */
  readonly top: string;
  readonly horizon: string;
}

export interface ScenePropInstance {
  readonly key: string;
  readonly asset: ResolvedAsset;
  readonly position: Vec3;
  readonly rotationY: number;
  /** False for dressing the player should walk through, like a stray cat. */
  readonly solid: boolean;
}

export interface ScenePropInstance {
  readonly key: string;
  readonly asset: ResolvedAsset;
  readonly position: Vec3;
  readonly rotationY: number;
  /** False for dressing the player should walk through, like a stray cat. */
  readonly solid: boolean;
}

export interface SceneDescription {
  readonly cityId: string;
  readonly catRoutes: readonly (readonly { x: number; z: number }[])[];
  readonly npcs: readonly {
    readonly key: string;
    readonly npc: FeaturedNpc;
    readonly position: Vec3;
    readonly rotationY: number;
  }[];
  readonly trees: readonly StreetTreeSpec[];
  readonly catModelUrl: string | null;
  /** Briefed height for a cat, in metres; the delivered rig is not at world scale. */
  readonly catHeight: number;
  readonly props: readonly ScenePropInstance[];
  /** Scenery beyond the play area; never solid. */
  readonly backdrop: readonly ScenePropInstance[];
  readonly water: SceneDefinition['water'];
  readonly musicUrl: string | null;
  readonly groundSurface: SceneDefinition['groundSurface'];
  readonly balloons: SceneDefinition['balloons'];
  readonly balloonAsset: ResolvedAsset | null;
  readonly tramLine: SceneDefinition['tramLine'];
  readonly tramAsset: ResolvedAsset | null;
  readonly sky: SceneSky;
  readonly colliders: readonly RectCollider[];
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
    collider: hotspot.collider,
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
  const rewards = city.rewards.collectibleAssetIds.map((assetId: string) => resolveAsset(assetId, quality));

  // Every asset the city touches is checked, not just the hotspot models.
  const unknownAssetIds = [
    ...hotspots.map((h) => h.asset),
    ...city.props.map((prop) => resolveAsset(prop.assetId, quality)),
    ...city.backdrop.map((prop) => resolveAsset(prop.assetId, quality)),
    kit,
    guide,
    routeMarker,
    ...rewards,
  ]
    .filter((asset) => asset.isUnknown)
    .map((asset) => asset.entry.id);

  const props: ScenePropInstance[] = city.props.map((prop, index) => ({
    key: `${prop.assetId}-${index}`,
    asset: resolveAsset(prop.assetId, quality),
    position: prop.position,
    rotationY: prop.rotationY,
    solid: prop.solid ?? true,
  }));

  /**
   * Everything solid, in one list.
   *
   * Props were added after the collision system and nobody gave them
   * footprints, so the guide walked straight through lamp posts and benches.
   * A prop's footprint comes from its registry dimensions; rotating it means
   * taking the axis-aligned bounds of the rotated rectangle, because the
   * collision test is axis-aligned.
   */
  const rotatedFootprint = (width: number, depth: number, rotationY: number) => {
    const cos = Math.abs(Math.cos(rotationY));
    const sin = Math.abs(Math.sin(rotationY));
    const halfW = width / 2;
    const halfD = depth / 2;
    return {
      halfWidth: halfW * cos + halfD * sin,
      halfDepth: halfW * sin + halfD * cos,
    };
  };

  const backdrop: ScenePropInstance[] = city.backdrop.map((prop, index) => ({
    key: `backdrop-${index}`,
    asset: resolveAsset(prop.assetId, quality),
    position: prop.position,
    rotationY: prop.rotationY,
    solid: prop.solid ?? false,
  }));

  const colliders: RectCollider[] = [
    ...hotspots.map((hotspot) => ({
      x: hotspot.position[0],
      z: hotspot.position[2],
      halfWidth: hotspot.collider.halfWidth,
      halfDepth: hotspot.collider.halfDepth,
    })),
    ...[...props, ...backdrop]
      .filter((prop) => prop.solid)
      .map((prop) => {
        const [width, , depth] = prop.asset.entry.dimensions;
        const { halfWidth, halfDepth } = rotatedFootprint(width, depth, prop.rotationY);
        return { x: prop.position[0], z: prop.position[2], halfWidth, halfDepth };
      }),
  ];

  const cat = resolveAsset('kit_street_cat', quality);

  const npcs = city.npcs
    .map((entry, index) => {
      const npc = npcById(entry.npcId);
      return npc
        ? { key: `npc-${index}`, npc, position: entry.position, rotationY: entry.rotationY }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const trees: StreetTreeSpec[] = city.trees.map((tree, index) => ({
    key: `tree-${index}`,
    position: tree.position,
    kind: tree.kind,
    scale: tree.scale,
    rotationY: tree.rotationY,
  }));


  return {
    cityId: city.id,
    backdrop,
    water: city.water,
    musicUrl: city.musicUrl,
    tramLine: city.tramLine,
    tramAsset: city.tramLine ? resolveAsset('city_istanbul_streetcar', quality) : null,
    catRoutes: city.catRoutes,
    npcs,
    trees,
    catModelUrl: city.catRoutes.length > 0 ? cat.modelUrl : null,
    catHeight: cat.entry.dimensions[1],
    props,
    colliders,
    hotspots,
    routePoints: city.route.points,
    bounds: city.route.bounds,
    ground: {
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      width: maxX - minX + 4,
      depth: maxZ - minZ + 4,
      color: city.environment.groundColor ?? '#D9CFBC',
    },
    groundSurface: city.groundSurface,
    balloons: city.balloons,
    balloonAsset: city.balloons.length > 0 ? resolveAsset('kit_hot_air_balloon', quality) : null,
    sky: {
      top: city.environment.skyPreset?.[0] ?? '#BFE4F2',
      horizon: city.environment.skyPreset?.[1] ?? city.environment.skyPreset?.[0] ?? '#DCF1FA',
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
