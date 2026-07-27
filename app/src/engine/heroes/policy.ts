/**
 * Hero character policy (DECISION_LOG D-012).
 *
 * Keloğlan and Nasreddin Hodja are production hero characters, not ordinary
 * props. Their mesh is never reduced automatically: when performance regresses
 * the engine gives up environment quality instead, in the order below.
 */

export type QualityProfileId = 'high' | 'balanced' | 'safe';

export interface QualityProfile {
  readonly id: QualityProfileId;
  readonly maxDpr: number;
  /** The hero mesh is identical in every profile; only its shadow varies. */
  readonly heroShadow: boolean;
  readonly shadowMapSize: number;
  readonly postProcessing: boolean;
  /** 0..1 multiplier applied to nonessential scene decoration. */
  readonly environmentDensity: number;
  /** Distant decoration is dropped beyond this radius, in metres. */
  readonly distantAssetCutoff: number;
}

export const QUALITY_PROFILES: Readonly<Record<QualityProfileId, QualityProfile>> = {
  high: {
    id: 'high',
    maxDpr: 2,
    heroShadow: true,
    shadowMapSize: 2048,
    postProcessing: true,
    environmentDensity: 1,
    distantAssetCutoff: 220,
  },
  balanced: {
    id: 'balanced',
    maxDpr: 1.5,
    heroShadow: true,
    shadowMapSize: 1024,
    postProcessing: false,
    environmentDensity: 0.65,
    distantAssetCutoff: 140,
  },
  safe: {
    id: 'safe',
    maxDpr: 1,
    heroShadow: false,
    shadowMapSize: 512,
    postProcessing: false,
    environmentDensity: 0.35,
    distantAssetCutoff: 90,
  },
};

export interface HeroCharacterPolicy {
  readonly enabled: boolean;
  readonly defaultMaxActiveHeroes: number;
  /** Two heroes on screen is an opt-in special case, never normal gameplay. */
  readonly allowTwoHeroScene: boolean;
  readonly meshBudgetTriangles: { readonly recommendedMin: number; readonly recommendedMax: number };
  /** The mesh is the one thing quality profiles may never touch. */
  readonly preserveFullQualityMeshAcrossProfiles: true;
}

export const HERO_POLICY: HeroCharacterPolicy = {
  enabled: true,
  defaultMaxActiveHeroes: 1,
  allowTwoHeroScene: false,
  meshBudgetTriangles: { recommendedMin: 180_000, recommendedMax: 250_000 },
  preserveFullQualityMeshAcrossProfiles: true,
};

/**
 * What the engine gives up, in order, when frames get expensive.
 * The hero mesh and its animation are deliberately absent from this list.
 */
export const DEGRADATION_LADDER = [
  'post-processing',
  'environment-decoration-density',
  'shadow-map-resolution',
  'nonessential-shadows',
  'device-pixel-ratio',
  'distant-environment-assets',
] as const;
export type DegradationStep = (typeof DEGRADATION_LADDER)[number];

/**
 * Concessions the engine has made relative to the `high` profile. Used by the
 * QA overlay and reported in the evidence document.
 */
export function environmentConcessions(profile: QualityProfile): DegradationStep[] {
  const high = QUALITY_PROFILES.high;
  const concessions: DegradationStep[] = [];
  if (!profile.postProcessing && high.postProcessing) concessions.push('post-processing');
  if (profile.environmentDensity < high.environmentDensity) {
    concessions.push('environment-decoration-density');
  }
  if (profile.shadowMapSize < high.shadowMapSize) concessions.push('shadow-map-resolution');
  if (!profile.heroShadow && high.heroShadow) concessions.push('nonessential-shadows');
  if (profile.maxDpr < high.maxDpr) concessions.push('device-pixel-ratio');
  if (profile.distantAssetCutoff < high.distantAssetCutoff) {
    concessions.push('distant-environment-assets');
  }
  return concessions;
}

/** The next profile down, or null when already at the safest setting. */
export function stepDown(profile: QualityProfileId): QualityProfileId | null {
  if (profile === 'high') return 'balanced';
  if (profile === 'balanced') return 'safe';
  return null;
}

export interface DeviceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  coarsePointer: boolean;
  viewportWidth: number;
}

/**
 * Automatic profile selection. Hero characters are expensive, so a mid-range
 * phone starts on `safe` rather than discovering the problem mid-scene.
 */
export function detectProfile(hints: DeviceHints): QualityProfileId {
  const cores = hints.hardwareConcurrency ?? 4;
  const memory = hints.deviceMemory ?? 4;

  if (hints.coarsePointer || hints.viewportWidth < 768) {
    return cores >= 8 && memory >= 6 ? 'balanced' : 'safe';
  }
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4) return 'balanced';
  return 'safe';
}

/**
 * While two heroes are on screen the environment drops to `safe` on touch
 * devices, regardless of the profile the player picked.
 */
export function profileForTwoHeroScene(
  current: QualityProfileId,
  coarsePointer: boolean,
): QualityProfileId {
  if (!coarsePointer) return current;
  return 'safe';
}
