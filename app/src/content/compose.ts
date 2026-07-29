import type {
  CanonicalCity,
  CanonicalStop,
  LocalizedText,
} from '@/content/schemas/canonical';
import type {
  SceneDefinition,
  SceneHotspot,
  SceneStatus,
  Transform,
  Vec3,
} from '@/content/schemas/scene';

/**
 * Joins canonical content with the technical scene into the shape the engine
 * and UI consume. This is the only place the two halves meet: canonical strings
 * are read here, never copied into scene files.
 */

export class ContentRefError extends Error {
  constructor(cityId: string, message: string) {
    super(`${cityId}: ${message}`);
    this.name = 'ContentRefError';
  }
}

export interface RuntimeChoice {
  id: string;
  text: LocalizedText;
  correct: boolean;
}

export interface RuntimeHotspot {
  id: string;
  order: number;
  /** Canonical stop this hotspot presents. */
  stopId: string;
  sceneStatus: SceneStatus;
  assetId: string;
  assetStatus: 'commissioned' | 'graybox';
  transform: Transform;
  triggerRadius: number;
  collider: { halfWidth: number; halfDepth: number };
  camera: { position: Vec3; target: Vec3; durationMs: number };
  /** Canonical category, used for the badge on the fact card. */
  category: string;
  /** Display name of the guide who speaks the line. */
  guideName?: string;
  fact: {
    title: LocalizedText;
    body: LocalizedText;
    guideLine: LocalizedText;
    /** Canonical content is presented as authored and is not re-verified here. */
    editorialStatus: 'canonical';
  };
  reward: { assetId: string; emoji: string; label: LocalizedText };
}

export interface RuntimeQuizItem {
  id: string;
  question: LocalizedText;
  options: RuntimeChoice[];
}

export interface RuntimeCity {
  id: string;
  name: LocalizedText;
  regionId: string;
  guideId: 'keloglan' | 'nasreddin-hoca';
  guideAssetId: string;
  coordinates: { longitude: number; latitude: number };
  estimatedMinutes?: number;
  environment: SceneDefinition['environment'];
  /** Static street dressing; shared across cities, carries no content. */
  spawn: Transform;
  route: SceneDefinition['route'];
  intro: { title: LocalizedText; guideLine: LocalizedText; skippable: boolean };
  hotspots: RuntimeHotspot[];
  /** Every canonical stop, including any without a scene yet. */
  canonicalStopCount: number;
  pendingStopIds: string[];
  quiz: RuntimeQuizItem[];
  quizPresentation: { shuffleOptions: boolean };
  /** Static street dressing carried straight through from the scene. */
  props: SceneDefinition['props'];
  /** Waypoints for each street cat; empty in cities that are not dressed yet. */
  catRoutes: SceneDefinition['catRoutes'];
  water: SceneDefinition['water'];
  musicUrl: SceneDefinition['musicUrl'];
  groundSurface: SceneDefinition['groundSurface'];
  tramLine: SceneDefinition['tramLine'];
  backdrop: SceneDefinition['backdrop'];
  /** Featured NPCs standing at their posts; carry no content. */
  npcs: SceneDefinition['npcs'];
  /** Procedural street trees. */
  trees: SceneDefinition['trees'];
  rewards: { cityStarId: string; collectibleAssetIds: string[] };
}

function composeHotspot(
  hotspot: SceneHotspot,
  stopsById: Map<string, CanonicalStop>,
  cityId: string,
): RuntimeHotspot {
  const stop = stopsById.get(hotspot.contentRef.stopId);
  if (!stop) {
    throw new ContentRefError(
      cityId,
      `hotspot ${hotspot.id} references missing canonical stop "${hotspot.contentRef.stopId}"`,
    );
  }

  return {
    id: hotspot.id,
    order: hotspot.order,
    stopId: stop.id,
    sceneStatus: hotspot.sceneStatus,
    assetId: hotspot.assetId,
    assetStatus: hotspot.assetStatus,
    category: stop.category,
    transform: hotspot.transform,
    triggerRadius: hotspot.triggerRadius,
    collider: hotspot.collider,
    camera: hotspot.camera,
    fact: {
      title: stop.title,
      body: stop.description,
      guideLine: stop.guideLine.text,
      editorialStatus: 'canonical',
    },
    reward: {
      assetId: hotspot.rewardAssetId,
      emoji: stop.reward.emoji,
      label: stop.reward.label,
    },
  };
}

export function composeCity(canonical: CanonicalCity, scene: SceneDefinition): RuntimeCity {
  if (canonical.id !== scene.contentRef.cityId) {
    throw new ContentRefError(
      canonical.id,
      `scene contentRef "${scene.contentRef.cityId}" does not match canonical city`,
    );
  }

  const stopsById = new Map(canonical.stops.map((stop) => [stop.id, stop]));
  const hotspots = scene.hotspots.map((hotspot) => composeHotspot(hotspot, stopsById, canonical.id));

  const covered = new Set(hotspots.map((hotspot) => hotspot.stopId));
  const pendingStopIds = canonical.stops
    .filter((stop) => !covered.has(stop.id))
    .map((stop) => stop.id);

  const firstStop = canonical.stops[0];

  return {
    id: canonical.id,
    name: canonical.name,
    regionId: canonical.regionId,
    guideId: canonical.legacyGuideId,
    guideAssetId: scene.guide.assetId,
    coordinates: canonical.coordinates,
    estimatedMinutes: scene.estimatedMinutes,
    environment: scene.environment,
    props: scene.props,
    catRoutes: scene.catRoutes,
    water: scene.water,
    musicUrl: scene.musicUrl,
    groundSurface: scene.groundSurface,
    tramLine: scene.tramLine,
    backdrop: scene.backdrop,
    npcs: scene.npcs,
    trees: scene.trees,
    spawn: scene.spawn,
    route: scene.route,
    intro: {
      // Both strings are canonical; the scene contributes only `skippable`.
      title: canonical.name,
      guideLine: firstStop?.guideLine.text ?? { en: null, tr: null },
      skippable: scene.intro.skippable,
    },
    hotspots,
    canonicalStopCount: canonical.stops.length,
    pendingStopIds,
    quiz: canonical.quiz.map((item) => ({
      id: item.id,
      question: item.question,
      options: item.options.map((option) => ({
        id: option.id,
        text: option.text,
        correct: option.correct,
      })),
    })),
    quizPresentation: scene.quizPresentation,
    rewards: {
      cityStarId: scene.rewards.cityStarId,
      collectibleAssetIds: scene.rewards.collectibleAssetIds,
    },
  };
}

/**
 * Deterministic display shuffle. Canonical order always has the correct option
 * first, so it must not be shown in source order.
 */
export function shuffleOptions<T>(options: readonly T[], seed: string): T[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const result = [...options];
  for (let i = result.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
}
