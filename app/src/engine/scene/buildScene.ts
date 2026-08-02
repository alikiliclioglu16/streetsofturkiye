import type { RuntimeCity as CityDefinition } from '@/content/compose';
import type { Vec3 } from '@/content/schemas/scene';
import { ColliderPart, kitAssetId, resolveAsset, type QualityTier, type ResolvedAsset } from '@/engine/assets/registry';
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

/** Which region's surface a piece of ground is drawn with. */
export type GroundSurface = 'cobblestone' | 'redsand' | 'steppe' | 'rock' | 'forest';

/**
 * Surfaces that exist only as a patch over another one.
 *
 * Grass is not a city surface and no province is paved with it: it is the
 * ten metres of turf the Kars geese stand on, and its colour map carries an
 * alpha channel that a full-city ground would have no use for.
 */
export type PatchSurface = 'grass';

/**
 * A circle of a different ground, laid over the city's own.
 *
 * One city needs two grounds: Ani is a rock shelf, and the corner where the
 * geese stand is not, because geese graze. Blending two surfaces across the
 * whole plane would need a splat map and a shader for a single patch in a
 * single province, so this is a small plane laid over the big one with a
 * soft-edged alpha.
 */
export interface SceneGroundPatch {
  readonly position: Vec3;
  readonly radius: number;
  readonly surface: PatchSurface;
  readonly color: string;
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
  readonly rotationX: number;
  /** False for dressing the player should walk through, like a stray cat. */
  readonly solid: boolean;
}

export interface SceneDescription {
  readonly cityId: string;
  readonly catRoutes: readonly (readonly { x: number; z: number }[])[];
  /** Circles of a different ground laid over the city's own. */
  readonly groundPatches: readonly SceneGroundPatch[];
  readonly npcs: readonly {
    readonly key: string;
    readonly npc: FeaturedNpc;
    readonly position: Vec3;
    readonly rotationY: number;
    /** Far end of a short beat this person walks and returns along. */
    readonly walkTo: Vec3 | null;
  }[];
  readonly trees: readonly StreetTreeSpec[];
  readonly animal: SceneDefinition['animal'];
  readonly catModelUrl: string | null;
  /** Every animal walking this street, with the model each one uses. */
  readonly animals: readonly {
    readonly key: string;
    readonly asset: ResolvedAsset;
    readonly modelUrl: string | null;
    readonly route: readonly { x: number; z: number }[];
    readonly targetHeight: number;
  }[];
  /** Briefed height for a cat, in metres; the delivered rig is not at world scale. */
  readonly catHeight: number;
  readonly props: readonly ScenePropInstance[];
  /** Scenery beyond the play area; never solid. */
  readonly backdrop: readonly ScenePropInstance[];
  readonly water: SceneDefinition['water'];
  readonly musicUrl: string | null;
  readonly groundSurface: SceneDefinition['groundSurface'];
  readonly balloons: SceneDefinition['balloons'];
  readonly paragliders: SceneDefinition['paragliders'];
  readonly paragliderAsset: ResolvedAsset | null;
  readonly balloonAsset: ResolvedAsset | null;
  readonly tramLine: SceneDefinition['tramLine'];
  readonly trainLine: SceneDefinition['trainLine'];
  readonly canoeLines: SceneDefinition['canoeLines'];
  readonly ferryLine: SceneDefinition['ferryLine'];
  readonly cableCarLine: SceneDefinition['cableCarLine'];
  readonly cableCarAsset: ResolvedAsset | null;
  readonly ferryAsset: ResolvedAsset | null;
  readonly canoeAsset: ResolvedAsset | null;
  readonly trainAsset: ResolvedAsset | null;
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
    rotationX: prop.rotationX ?? 0,
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
    rotationX: prop.rotationX ?? 0,
    solid: prop.solid ?? false,
  }));

  /**
   * Turns an object's declared footprint pieces into world rectangles.
   *
   * Shared by props and stops, because a gate does not stop being a gate when
   * it is also a stop: the Kapalıçarşı is both, and a single rectangle over it
   * sealed an archway a child was looking straight through.
   */
  const partColliders = (
    parts: readonly ColliderPart[],
    position: Vec3,
    rotationY: number,
  ): RectCollider[] => {
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    return parts.map((part) => {
      const bounds = rotatedFootprint(part.halfWidth * 2, part.halfDepth * 2, rotationY);
      return {
        x: position[0] + part.offsetX * cos + part.offsetZ * sin,
        z: position[2] - part.offsetX * sin + part.offsetZ * cos,
        halfWidth: bounds.halfWidth,
        halfDepth: bounds.halfDepth,
      };
    });
  };

  const colliders: RectCollider[] = [
    ...hotspots.flatMap((hotspot) => {
      const parts = hotspot.asset.entry.colliderParts;
      if (parts?.length) return partColliders(parts, hotspot.position, hotspot.rotation[1]);
      return [
        {
          x: hotspot.position[0],
          z: hotspot.position[2],
          halfWidth: hotspot.collider.halfWidth,
          halfDepth: hotspot.collider.halfDepth,
        },
      ];
    }),
    ...[...props, ...backdrop]
      .filter((prop) => prop.solid)
      .flatMap((prop) => {
        const [width, , depth] = prop.asset.entry.dimensions;
        const parts = prop.asset.entry.colliderParts;

        /**
         * An object that is solid in places and open in others contributes one
         * rectangle per piece instead of one covering the whole of it.
         *
         * A single rectangle is right for anything a child walks round and
         * wrong for anything they walk through: the bazaar gate is two piers
         * with a passage between them, and drawing one box over it would seal
         * its own archway.
         */
        if (!parts?.length) {
          const { halfWidth, halfDepth } = rotatedFootprint(width, depth, prop.rotationY);
          return [{ x: prop.position[0], z: prop.position[2], halfWidth, halfDepth }];
        }
        return partColliders(parts, prop.position, prop.rotationY);
      }),
  ];

  /**
   * The animal that walks this street: a cat on the coast, a horse on the
   * central plateau, a goose in Kars. One component walks any of them — they
   * are the same problem, and only the file, the size and the pace differ.
   *
   * A ternary held two and would have quietly given the third a cat.
   */
  /**
   * A city's animals, as a list rather than a single model.
   *
   * Every city used to walk one animal at several sizes. Gaziantep walks two
   * different street dogs, one tan and one nearly black, and two of a kind read
   * as a pair where four of one read as one dog copied — the lesson the sky
   * over Cappadocia already taught.
   *
   * Routes take their model in turn, so an even number of routes gives an even
   * split. Nothing here has to know how many of each there are.
   */
  const ANIMAL_ASSETS: Record<string, readonly string[]> = {
    horse: ['kit_anatolian_horse'],
    goose: ['kit_kars_goose'],
    dog: ['kit_street_dog_tan', 'kit_street_dog_dark'],
    /**
     * Van's own cat, and not the street cat with a different coat.
     *
     * A Van cat is white, long-haired, and famously odd-eyed — one blue, one
     * amber. That is the answer to the city's own quiz question, and a child
     * who has just been told it should be able to find one walking about.
     * Reusing İstanbul's tabby would make the question unanswerable from the
     * street.
     */
    vancat: ['kit_van_cat'],
    deer: ['kit_bolu_deer'],
    cat: ['kit_street_cat'],
  };
  const animalIds = ANIMAL_ASSETS[city.animal] ?? ['kit_street_cat'];
  const animalAssets = animalIds.map((id) => resolveAsset(id, quality));
  const cat = animalAssets[0]!;
  const animals =
    city.animal === 'none'
      ? []
      : city.catRoutes
          .map((route, index) => {
            const asset = animalAssets[index % animalAssets.length]!;
            return {
              key: `animal-${index}`,
              asset,
              modelUrl: asset.modelUrl,
              route,
              targetHeight: asset.entry.dimensions[1],
            };
          })
          .filter((entry) => entry.modelUrl !== null);

  const npcs = city.npcs
    .map((entry, index) => {
      const npc = npcById(entry.npcId);
      return npc
        ? {
            key: `npc-${index}`,
            npc,
            position: entry.position,
            rotationY: entry.rotationY,
            walkTo: entry.walkTo,
          }
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
    trainLine: city.trainLine,
    canoeLines: city.canoeLines,
    ferryLine: city.ferryLine,
    cableCarLine: city.cableCarLine,
    /**
     * Each line carries its own vehicle.
     *
     * Ordu's is a red gondola and Bolu's is an open two-person chair. They are
     * the same machine doing different jobs, and putting a sightseeing gondola
     * on a ski hill is exactly the borrowing the four-directions rule exists to
     * stop.
     */
    cableCarAsset: city.cableCarLine
      ? resolveAsset(
          city.id === 'bolu' ? 'city_bolu_chairlift_chair' : 'city_ordu_cable_car',
          quality,
        )
      : null,
    ferryAsset: city.ferryLine ? resolveAsset('city_istanbul_ferry_boat', quality) : null,
    canoeAsset: city.canoeLines.length ? resolveAsset('city_van_canoe', quality) : null,
    trainAsset: city.trainLine ? resolveAsset('city_kars_eastern_express', quality) : null,
    catRoutes: city.catRoutes,
    groundPatches: city.groundPatches ?? [],
    npcs,
    trees,
    animal: city.animal,
    animals,
    catModelUrl: city.animal === 'none' || city.catRoutes.length === 0 ? null : cat.modelUrl,
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
    paragliders: city.paragliders,
    paragliderAsset: city.paragliders.length ? resolveAsset('city_ordu_paraglider', quality) : null,
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
