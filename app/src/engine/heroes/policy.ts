/**
 * Hero character policy (DECISION_LOG D-012).
 *
 * Keloğlan and Nasreddin Hodja are production hero characters, not ordinary
 * props. Their mesh is never reduced.
 */

export interface QualitySettings {
  readonly maxDpr: number;
  readonly heroShadow: boolean;
  readonly shadowMapSize: number;
  readonly postProcessing: boolean;
  /** 0..1 multiplier on nonessential scene decoration. */
  readonly environmentDensity: number;
  /** Distant decoration is dropped beyond this radius, in metres. */
  readonly distantAssetCutoff: number;
}

/**
 * One configuration, everywhere (D-020).
 *
 * The three-profile system was removed after measurement: with the hero's
 * material corrected the scene holds 60 fps at full quality, and the profiles
 * only bought differences nobody could see. A single setting also means one
 * thing to test instead of three.
 *
 * Post-processing is off because none is implemented; the flag stays so the
 * renderer has one place to read from when some arrives.
 */
export const QUALITY: QualitySettings = {
  maxDpr: 2,
  heroShadow: true,
  shadowMapSize: 2048,
  postProcessing: false,
  environmentDensity: 1,
  distantAssetCutoff: 220,
};

export interface HeroCharacterPolicy {
  readonly enabled: boolean;
  readonly defaultMaxActiveHeroes: number;
  /** Two heroes on screen is an opt-in special case, never normal gameplay. */
  readonly allowTwoHeroScene: boolean;
  readonly meshBudgetTriangles: { readonly recommendedMin: number; readonly recommendedMax: number };
  /** The mesh is the one thing the renderer may never trade away. */
  readonly preserveFullQualityMesh: true;
}

export const HERO_POLICY: HeroCharacterPolicy = {
  enabled: true,
  defaultMaxActiveHeroes: 1,
  allowTwoHeroScene: false,
  /**
   * Revised 28 Jul 2026. The original 180,000-250,000 came from the delivery
   * brief, before anything had been measured against a download. Nasreddin
   * Hodja at 197,482 triangles was 18.95 MB — 38% of everything a child
   * downloads for a city, on a product aimed at tablets.
   *
   * Simplified to 88,866 with UV seams locked, he is 4.86 MB and keeps his
   * skeleton, his weights and all seven clips. The mesh is still never reduced
   * at runtime; this is a change to what is authored, not to what the renderer
   * may trade away.
   */
  meshBudgetTriangles: { recommendedMin: 70_000, recommendedMax: 120_000 },
  preserveFullQualityMesh: true,
};

/**
 * What the engine would give up, in order, if frames ever regressed. Nothing
 * reads this today — quality is fixed — but it records the intent, and the
 * character is deliberately absent from it.
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
