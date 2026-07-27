import { HERO_POLICY } from '@/engine/heroes/policy';

/**
 * The two production hero characters.
 *
 * Guide selection is data-driven: canonical content names a `legacyGuideId`
 * and this table resolves it to an asset. No component imports a GLB path.
 */

export type HeroId = 'keloglan' | 'nasreddin-hoca';

/** Clip names the engine drives. Data-driven so new clips need no code change. */
export type HeroClip = 'idle' | 'walk' | 'run' | 'talk' | 'dance';

export interface HeroAnimationManifest {
  /** Engine clip name → clip name inside the GLB. */
  readonly clips: Readonly<Partial<Record<HeroClip, string>>>;
  /** Approved celebration clips, drawn from a non-repeating shuffle bag. */
  readonly danceClips: readonly string[];
  /** Clips present in the GLB but withheld from production, with the reason. */
  readonly excludedClips: Readonly<Record<string, string>>;
  /** Every clip the delivered file actually contains, for traceability. */
  readonly deliveredClips: readonly string[];
}

export interface HeroDefinition {
  readonly id: HeroId;
  /** Asset id in asset-manifests/pilot-assets.csv. */
  readonly assetId: string;
  readonly displayName: string;
  /** Full-quality GLB. Null until the model is delivered. */
  readonly modelUrl: string | null;
  /** SHA-256 of the delivered GLB, for the asset-delivery audit trail. */
  readonly checksum: string | null;
  readonly triangles: number | null;
  readonly transferBytes: number | null;
  readonly animation: HeroAnimationManifest;
  /**
   * Measured height of the rendered model, in metres. The scene scales to the
   * manifest height using this, so a model delivered in different units lands
   * at the right size without editing the file.
   */
  readonly measuredHeightMeters: number | null;
  /** 2D portrait used on the map and collection routes. Never a 3D mount. */
  readonly portraitUrl: string | null;
  readonly portraitColor: string;
}

const HEROES: Readonly<Record<HeroId, HeroDefinition>> = {
  keloglan: {
    id: 'keloglan',
    assetId: 'character_keloglan_base',
    displayName: 'Keloğlan',
    /**
     * Approved production model, delivered 27 Jul 2026. The Meshy filename is
     * kept verbatim so the file in the repository can be traced back to the
     * delivery without a rename in between.
     */
    modelUrl: '/assets/heroes/Meshy_AI_Little_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    checksum: '41f8f1fa2f0bac36085d2dc903fd34ab46577aa338e436a727359d1a9fa13f68',
    triangles: 222_150,
    transferBytes: 16_722_860,
    animation: {
      clips: {
        idle: 'Idle_11',
        walk: 'Walking',
        run: 'Running',
        talk: 'Talk_Passionately',
      },
      danceClips: [
        'FunnyDancing_01',
        'FunnyDancing_03',
        'Hip_Hop_Dance',
        'Joyful_Dance_with_Hand_Sway',
      ],
      excludedClips: {
        Love_You_Pop_Dance: 'romantic theme is outside project art direction',
        ymca_dance: 'outside Turkish cultural art direction',
        Breakdance_1990: 'clip is 0.50 s long and reads as incomplete',
        Step_Hip_Hop_Dance: 'measured 0.83 m forward root displacement',
      },
      deliveredClips: [
        'Breakdance_1990',
        'FunnyDancing_01',
        'FunnyDancing_03',
        'Hip_Hop_Dance',
        'Idle_11',
        'Joyful_Dance_with_Hand_Sway',
        'Love_You_Pop_Dance',
        'Running',
        'Step_Hip_Hop_Dance',
        'Talk_Passionately',
        'Walking',
        'ymca_dance',
      ],
    },
    measuredHeightMeters: 1.7,
    portraitUrl: null,
    portraitColor: '#E0322F',
  },
  'nasreddin-hoca': {
    id: 'nasreddin-hoca',
    assetId: 'character_nasreddin_hoca_base',
    displayName: 'Nasreddin Hodja',
    modelUrl: null,
    checksum: null,
    triangles: null,
    transferBytes: null,
    animation: {
      // Not yet produced. Mirrors the Keloğlan clip contract so the same
      // Meshy brief can be reused, per the hero technical-class rule.
      clips: {
        idle: 'Idle_11',
        walk: 'Walking',
        run: 'Running',
        talk: 'Talk_Passionately',
      },
      danceClips: [],
      excludedClips: {},
      deliveredClips: [],
    },
    measuredHeightMeters: null,
    portraitUrl: null,
    portraitColor: '#F2B233',
  },
};

/** Canonical `legacyGuideId` values map 1:1 onto hero ids. */
export function heroForGuide(guideId: string): HeroDefinition {
  const hero = HEROES[guideId as HeroId];
  if (hero) return hero;
  // Unknown guide ids fall back rather than breaking a city.
  return HEROES['nasreddin-hoca'];
}

export function heroById(heroId: HeroId): HeroDefinition {
  return HEROES[heroId];
}

/** True when the hero has a delivered GLB rather than a placeholder. */
export function isDelivered(hero: HeroDefinition): boolean {
  return hero.modelUrl !== null;
}

/**
 * Guards the celebration pool. An excluded clip must never reach the player,
 * including through the "another dance" button.
 */
export function isApprovedDance(hero: HeroDefinition, clipName: string): boolean {
  if (clipName in hero.animation.excludedClips) return false;
  return hero.animation.danceClips.includes(clipName);
}

export function allHeroes(): readonly HeroDefinition[] {
  return Object.values(HEROES);
}

/** The other hero, which must not be preloaded during normal gameplay. */
export function inactiveHeroes(activeId: HeroId): readonly HeroDefinition[] {
  return allHeroes().filter((hero) => hero.id !== activeId);
}

export interface BudgetCheck {
  readonly withinBudget: boolean;
  readonly triangles: number | null;
  readonly message: string;
}

/**
 * Hero meshes are allowed to be large; this only reports, and never triggers
 * an automatic mesh downgrade (policy rule 4).
 */
export function checkHeroBudget(hero: HeroDefinition): BudgetCheck {
  const { recommendedMin, recommendedMax } = HERO_POLICY.meshBudgetTriangles;
  if (hero.triangles === null) {
    return { withinBudget: true, triangles: null, message: `${hero.displayName}: model not delivered yet` };
  }
  if (hero.triangles > recommendedMax) {
    return {
      withinBudget: false,
      triangles: hero.triangles,
      message: `${hero.displayName}: ${hero.triangles.toLocaleString('en-US')} triangles exceeds the ${recommendedMax.toLocaleString('en-US')} hero ceiling — report it, do not decimate`,
    };
  }
  if (hero.triangles < recommendedMin) {
    return {
      withinBudget: true,
      triangles: hero.triangles,
      message: `${hero.displayName}: ${hero.triangles.toLocaleString('en-US')} triangles is below the hero range; confirm it is the approved model`,
    };
  }
  return {
    withinBudget: true,
    triangles: hero.triangles,
    message: `${hero.displayName}: ${hero.triangles.toLocaleString('en-US')} triangles, within hero budget`,
  };
}
