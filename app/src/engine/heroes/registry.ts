import { HERO_POLICY } from '@/engine/heroes/policy';
import { assetUrl } from '@/engine/assets/assetHost';

/**
 * The two production hero characters.
 *
 * Guide selection is data-driven: canonical content names a `legacyGuideId`
 * and this table resolves it to an asset. No component imports a GLB path.
 */

export type HeroId = 'keloglan' | 'nasreddin-hoca';

/** Clip names the engine drives. Data-driven so new clips need no code change. */
export type HeroClip = 'idle' | 'walk' | 'run' | 'talk' | 'agree' | 'wave';

/** Clips that carry the character across the ground; everything else is in place. */
export const LOCOMOTION_CLIPS: readonly HeroClip[] = ['walk', 'run'];

export function isLocomotion(clip: HeroClip): boolean {
  return LOCOMOTION_CLIPS.includes(clip);
}

/**
 * How a guide celebrates. Behaviour is resolved from this, never from a
 * per-character branch in a component, so a third guide needs no UI rewrite.
 */
/**
 * How a guide celebrates.
 *
 * One shape for every guide. It used to be a union — a shuffled dance bag or an
 * authored gesture sequence — and the dance half is gone (D-113), which took a
 * shuffle, a persisted history and a replay button with it.
 */
export interface CelebrationStyle {
  /** Played once each, in order, before the completion panel appears. */
  readonly clips: readonly HeroClip[];
}

export interface HeroAnimationManifest {
  /** Engine clip name → clip name inside the GLB. */
  readonly clips: Readonly<Partial<Record<HeroClip, string>>>;
  /** Approved celebration clips, drawn from a non-repeating shuffle bag. */
  /**
   * Play-time ceiling per clip, in seconds. Used where a delivered clip runs
   * far longer than the moment it illustrates; absent means play in full.
   */
  readonly maxDurationSeconds?: Readonly<Partial<Record<string, number>>>;
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
  /**
   * Repository-relative path to the full-quality GLB, or null until delivered.
   * Use `heroModelUrl()` to get the URL to fetch — it applies the asset host.
   */
  readonly modelUrl: string | null;
  /** SHA-256 of the delivered GLB, for the asset-delivery audit trail. */
  readonly checksum: string | null;
  readonly triangles: number | null;
  readonly transferBytes: number | null;
  readonly animation: HeroAnimationManifest;
  readonly celebration: CelebrationStyle;
  /** Played once when a stop or a quiz answer is completed, then back to idle. */
  readonly successClip: HeroClip | null;
  /**
   * Material corrections measured from the delivered file.
   *
   * A transparent, double-sided material is drawn twice by three.js — back
   * faces, then front faces. Nasreddin Hodja shipped with `alphaMode: BLEND`
   * although his texture's most transparent pixel is still 82% opaque, so the
   * blend buys nothing and costs a full extra pass of a 197k mesh.
   */
  readonly material?: {
    /** Render opaque despite the file's alpha mode. */
    readonly forceOpaque: boolean;
    readonly reason: string;
  };
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
     *
     * Re-exported 30 Jul 2026 with the eight dance clips removed (D-113).
     */
    modelUrl: '/assets/heroes/Meshy_AI_Little_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    checksum: '6bebefd8280056d1eb380c44b8b6c3fae36ff5c235b3d4eb677903c12924d1d2',
    triangles: 10_307,
    transferBytes: 954780,
    animation: {
      clips: {
        idle: 'Idle_11',
        walk: 'Walking',
        run: 'Running',
      },
      excludedClips: {},
      maxDurationSeconds: {},
      // `Run_02` ships in the file and is not mapped: one run is enough, and a
      // second unmapped clip is cheaper than a decision about when to use it.
      deliveredClips: ['Idle_11', 'Run_02', 'Running', 'Walking'],
    },
    /**
     * Nothing. He stands, walks and runs, and that is the whole character.
     *
     * He used to dance from a shuffled bag of four clips (D-113 cut that to a
     * gesture); the gesture is gone too. The re-export ships three animations
     * because three is what the game uses — the talking and agreeing were
     * downloaded on every visit and, once the dance went, barely surfaced.
     */
    celebration: {
      clips: [],
    },

    successClip: null,
    measuredHeightMeters: 1.7,
    portraitUrl: null,
    portraitColor: '#E0322F',
  },
  'nasreddin-hoca': {
    id: 'nasreddin-hoca',
    assetId: 'character_nasreddin_hoca_base',
    displayName: 'Nasreddin Hodja',
    /**
     * Approved production model, delivered 27 Jul 2026. Meshy filename kept
     * verbatim for traceability.
     */
    modelUrl: '/assets/heroes/Meshy_AI_Teal_Robed_Sage_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    checksum: '600f9d9f167e406dabe046e25c76bf8bf2db2a75ce348a2674a5b4e2a6d4dfde',
    triangles: 8_409,
    transferBytes: 992904,
    animation: {
      clips: {
        idle: 'Idle_11',
        walk: 'Walking',
        run: 'Running',
      },
      excludedClips: {},
      maxDurationSeconds: {},
      deliveredClips: ['Idle_11', 'Running', 'Walking'],
    },
    /**
     * Nothing, and deliberately.
     *
     * He used to have a thirteen second agree gesture capped at 2.5, a wave and
     * a talk, plus a clapping run the registry refused to play at all. The
     * re-export ships three animations because three is what the game uses: the
     * guide stands, walks and runs. Everything else was downloaded on every
     * visit to every province and hardly ever seen.
     */
    celebration: {
      clips: [],
    },
    successClip: null,
    material: {
      forceOpaque: true,
      reason: 'alphaMode BLEND with texture alpha 210-255; measured 27 Jul 2026',
    },
    measuredHeightMeters: 1.7,
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
 * The URL to actually fetch. Identical to `modelUrl` while assets ship with the
 * app; rewritten to the CDN when `NEXT_PUBLIC_ASSET_BASE_URL` is set.
 */
export function heroModelUrl(hero: HeroDefinition): string | null {
  return assetUrl(hero.modelUrl);
}


/**
 * True when the completion UI should offer another celebration.
 *
 * Never, now. It existed for the dance bag: a child who liked the dance could
 * ask for another, and the bag guaranteed a different one. With both guides
 * performing a fixed short gesture, "again" would show the same thing twice.
 */
export function allowsCelebrationReplay(): boolean {
  return false;
}

/** Clips the completion sequence will play, in order. */
export function celebrationSequence(hero: HeroDefinition): readonly HeroClip[] {
  return hero.celebration.clips;
}

/**
 * Resolves an engine clip to a name in the delivered file, applying the
 * documented fallbacks: agree → wave, wave/talk → idle, run → walk → idle.
 */
export function resolveClipName(hero: HeroDefinition, clip: HeroClip): string | null {
  const clips = hero.animation.clips;
  const direct = clips[clip];
  if (direct) return direct;
  if (clip === 'agree') return clips.wave ?? clips.idle ?? null;
  if (clip === 'run') return clips.walk ?? clips.idle ?? null;
  return clips.idle ?? null;
}

export function clipDurationCap(hero: HeroDefinition, clipName: string): number | null {
  return hero.animation.maxDurationSeconds?.[clipName] ?? null;
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
