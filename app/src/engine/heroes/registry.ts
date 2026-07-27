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
  /** Celebration clips drawn from a non-repeating shuffle bag. */
  readonly danceClips: readonly string[];
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
  /** 2D portrait used on the map and collection routes. Never a 3D mount. */
  readonly portraitUrl: string | null;
  readonly portraitColor: string;
}

const HEROES: Readonly<Record<HeroId, HeroDefinition>> = {
  keloglan: {
    id: 'keloglan',
    assetId: 'character_keloglan_base',
    displayName: 'Keloğlan',
    // Approved production model. Set when the GLB lands in /public/assets.
    modelUrl: null,
    checksum: null,
    triangles: null,
    transferBytes: null,
    animation: {
      clips: { idle: 'Idle', walk: 'Walk', run: 'Run', talk: 'Talk' },
      danceClips: ['Dance_01', 'Dance_02', 'Dance_03'],
    },
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
      clips: { idle: 'Idle', walk: 'Walk', run: 'Run', talk: 'Talk' },
      danceClips: ['Dance_01', 'Dance_02'],
    },
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
