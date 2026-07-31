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
  /**
   * Revised again 31 Jul 2026, and by a long way.
   *
   * 180–250k came from the delivery brief. 70–120k came from measuring that
   * against a download. Both were arguments about how much detail a guide needs
   * to hold up close — and the answer, once the owner re-exported both
   * characters at a tenth of the count, is far less than anyone had assumed:
   * Nasreddin Hodja is 8,409 triangles and Keloğlan 10,307, at a metre and
   * seven from a camera that never gets closer than about three.
   *
   * The floor is what matters here. It is not a target to reach; it is the
   * point below which a delivery is probably the wrong file — a proxy, a LOD,
   * or half a character. Six thousand is under both current heroes with room,
   * and the ceiling stays where it was because nothing has changed about what
   * a download can afford.
   */
  meshBudgetTriangles: { recommendedMin: 6_000, recommendedMax: 120_000 },
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
