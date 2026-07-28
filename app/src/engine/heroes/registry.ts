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
export type HeroClip = 'idle' | 'walk' | 'run' | 'talk' | 'dance' | 'agree' | 'wave';

/** Clips that carry the character across the ground; everything else is in place. */
export const LOCOMOTION_CLIPS: readonly HeroClip[] = ['walk', 'run'];

export function isLocomotion(clip: HeroClip): boolean {
  return LOCOMOTION_CLIPS.includes(clip);
}

/**
 * How a guide celebrates. Behaviour is resolved from this, never from a
 * per-character branch in a component, so a third guide needs no UI rewrite.
 */
export type CelebrationStyle =
  | {
      readonly kind: 'dance-bag';
      /** Non-repeating pool drawn from a shuffle bag. */
      readonly pool: readonly string[];
      readonly allowReplay: true;
    }
  | {
      readonly kind: 'gesture-sequence';
      /** Played once each, in order, before the completion panel appears. */
      readonly sequence: readonly HeroClip[];
      readonly allowReplay: false;
    };

export interface HeroAnimationManifest {
  /** Engine clip name → clip name inside the GLB. */
  readonly clips: Readonly<Partial<Record<HeroClip, string>>>;
  /** Approved celebration clips, drawn from a non-repeating shuffle bag. */
  readonly danceClips: readonly string[];
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
      maxDurationSeconds: {},
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
    celebration: {
      kind: 'dance-bag',
      pool: [
        'FunnyDancing_01',
        'FunnyDancing_03',
        'Hip_Hop_Dance',
        'Joyful_Dance_with_Hand_Sway',
      ],
      allowReplay: true,
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
    checksum: 'bb359aa93d2405917c9fbc310cdb25ccad89a9f7af0b57401937d6c88fecee24',
    triangles: 197_482,
    transferBytes: 19_867_032,
    animation: {
      clips: {
        idle: 'Idle_11',
        walk: 'Walking',
        run: 'Running',
        talk: 'Talk_with_Hands_Open',
        agree: 'Agree_Gesture',
        wave: 'Wave_One_Hand',
      },
      /** Nasreddin Hodja does not dance (character decision, 27 Jul 2026). */
      danceClips: [],
      excludedClips: {
        Clapping_Run: 'not aligned with the character tone',
      },
      /**
       * The raw agree gesture runs 13.0 s of continuous motion. Left uncapped
       * it held the completion panel back for 17 s, and as a per-stop nod it
       * kept the guide in a held pose while the child was already walking.
       * Remove this entry to play it in full.
       */
      maxDurationSeconds: { Agree_Gesture: 2.5 },
      deliveredClips: [
        'Agree_Gesture',
        'Clapping_Run',
        'Idle_11',
        'Running',
        'Talk_with_Hands_Open',
        'Walking',
        'Wave_One_Hand',
      ],
    },
    celebration: {
      kind: 'gesture-sequence',
      sequence: ['agree', 'wave'],
      allowReplay: false,
    },
    successClip: 'agree',
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
 * Guards the celebration pool. An excluded clip must never reach the player,
 * including through the "another dance" button.
 */
export function isApprovedDance(hero: HeroDefinition, clipName: string): boolean {
  if (clipName in hero.animation.excludedClips) return false;
  return hero.animation.danceClips.includes(clipName);
}

/** True when the completion UI should offer another celebration. */
export function allowsCelebrationReplay(hero: HeroDefinition): boolean {
  return hero.celebration.kind === 'dance-bag' && hero.celebration.allowReplay;
}

/** Clips the completion sequence will play, in order. Empty for dance guides. */
export function celebrationSequence(hero: HeroDefinition): readonly HeroClip[] {
  return hero.celebration.kind === 'gesture-sequence' ? hero.celebration.sequence : [];
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
