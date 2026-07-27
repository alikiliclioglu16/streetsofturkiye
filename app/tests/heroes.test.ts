import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { heroRenderMode } from '@/components/three/HeroCharacter';
import {
  DEGRADATION_LADDER,
  HERO_POLICY,
  QUALITY_PROFILES,
  detectProfile,
  environmentConcessions,
  profileForTwoHeroScene,
  stepDown,
} from '@/engine/heroes/policy';
import {
  allHeroes,
  allowsCelebrationReplay,
  checkHeroBudget,
  clipDurationCap,
  heroById,
  heroForGuide,
  inactiveHeroes,
  isApprovedDance,
  isDelivered,
  isLocomotion,
  resolveClipName,
} from '@/engine/heroes/registry';
import {
  activeHeroId,
  canMountTwoHeroes,
  heroCacheSnapshot,
  isResident,
  maxActiveHeroes,
  onCityUnmount,
  releaseInactiveHeroes,
  requestHero,
  resetHeroCache,
} from '@/engine/heroes/heroCache';
import { createShuffleBag, draw } from '@/engine/heroes/danceBag';
import {
  celebrationCamera,
  celebrationPlan,
  celebrationReducer,
  currentCelebrationClip,
  initialCelebration,
} from '@/engine/heroes/celebration';
import { clipForState } from '@/engine/heroes/animation';
import {
  CAMERA_SETTLE_TIMEOUT_MS,
  CELEBRATION_TIMEOUT_MS,
  clipTimeoutFor,
} from '@/engine/heroes/watchdog';
import { initialInteractionContext, interactionReducer } from '@/engine/interactions/machine';
import { assetTierForProfile } from '@/engine/quality/quality';
import { loadComposedCity } from './helpers';

beforeEach(() => {
  resetHeroCache();
});

describe('one active hero', () => {
  it('requests exactly one hero for a standard city', () => {
    const city = loadComposedCity('istanbul');
    requestHero(heroForGuide(city.guideId).id, 'city-enter');

    const snapshot = heroCacheSnapshot();
    expect(snapshot.requests).toHaveLength(1);
    expect(snapshot.resident).toHaveLength(1);
    expect(snapshot.resident[0]).toBe('nasreddin-hoca');
  });

  it('never preloads the inactive hero', () => {
    requestHero('nasreddin-hoca');
    expect(isResident('keloglan')).toBe(false);
    expect(heroCacheSnapshot().requests.every((request) => request.heroId === 'nasreddin-hoca')).toBe(true);
  });

  it('caps normal gameplay at one hero and defaults two-hero mode off', () => {
    expect(HERO_POLICY.allowTwoHeroScene).toBe(false);
    expect(canMountTwoHeroes()).toBe(false);
    expect(maxActiveHeroes()).toBe(1);
    expect(maxActiveHeroes(true)).toBe(2);
  });

  it('drops to the safe environment profile on touch devices in a two-hero scene', () => {
    expect(profileForTwoHeroScene('high', true)).toBe('safe');
    expect(profileForTwoHeroScene('high', false)).toBe('high');
  });
});

describe('guide switching and cache policy', () => {
  it('selects a different asset by data, with no hardcoded component path', () => {
    expect(heroForGuide('nasreddin-hoca').assetId).toBe('character_nasreddin_hoca_base');
    expect(heroForGuide('keloglan').assetId).toBe('character_keloglan_base');
    // An unknown guide id falls back instead of breaking the city.
    expect(heroForGuide('unknown-guide').id).toBe('nasreddin-hoca');
  });

  it('releases the previous hero when the guide changes', () => {
    requestHero('nasreddin-hoca');
    const { releasedIds } = requestHero('keloglan');
    expect(releasedIds).toEqual(['nasreddin-hoca']);
    expect(isResident('nasreddin-hoca')).toBe(false);
    expect(isResident('keloglan')).toBe(true);
  });

  it('keeps the active hero resident across city changes', () => {
    requestHero('keloglan');
    expect(onCityUnmount().released).toEqual([]);
    expect(isResident('keloglan')).toBe(true);

    // Re-entering with the same guide reuses the cached model.
    requestHero('keloglan');
    expect(heroCacheSnapshot().released).toEqual([]);
    expect(activeHeroId()).toBe('keloglan');
  });

  it('releases the inactive hero only under explicit memory pressure', () => {
    requestHero('keloglan');
    requestHero('nasreddin-hoca', 'two-hero-scene');
    expect(isResident('keloglan')).toBe(true);
    expect(isResident('nasreddin-hoca')).toBe(true);

    const { released } = releaseInactiveHeroes();
    expect(released).toEqual(['nasreddin-hoca']);
    expect(isResident('keloglan')).toBe(true);
  });
});

describe('full-quality mesh across profiles', () => {
  it('uses the same hero asset in every profile', () => {
    const hero = heroById('keloglan');
    for (const id of ['high', 'balanced', 'safe'] as const) {
      // Profiles change environment tiers; the hero asset id is constant.
      expect(assetTierForProfile(id)).toBeDefined();
      expect(hero.assetId).toBe('character_keloglan_base');
      expect(hero.modelUrl).toBe(heroById('keloglan').modelUrl);
    }
    expect(HERO_POLICY.preserveFullQualityMeshAcrossProfiles).toBe(true);
  });

  it('never lists character quality in the degradation ladder', () => {
    const ladder = [...DEGRADATION_LADDER].join(' ');
    expect(ladder).not.toContain('character');
    expect(ladder).not.toContain('hero');
    expect(ladder).not.toContain('mesh');
  });

  it('spends the safe profile on environment, not on the model', () => {
    const concessions = environmentConcessions(QUALITY_PROFILES.safe);
    expect(concessions).toEqual([
      'post-processing',
      'environment-decoration-density',
      'shadow-map-resolution',
      'nonessential-shadows',
      'device-pixel-ratio',
      'distant-environment-assets',
    ]);
    expect(QUALITY_PROFILES.safe.maxDpr).toBe(1);
    expect(QUALITY_PROFILES.safe.heroShadow).toBe(false);
  });

  it('walks profiles down one step at a time', () => {
    expect(stepDown('high')).toBe('balanced');
    expect(stepDown('balanced')).toBe('safe');
    expect(stepDown('safe')).toBeNull();
  });

  it('starts touch devices below the desktop profile', () => {
    expect(detectProfile({ coarsePointer: true, viewportWidth: 390, hardwareConcurrency: 4, deviceMemory: 4 })).toBe('safe');
    expect(detectProfile({ coarsePointer: false, viewportWidth: 1680, hardwareConcurrency: 12, deviceMemory: 16 })).toBe('high');
  });
});

describe('hero budget reporting', () => {
  it('accepts the approved hero triangle range without decimating', () => {
    const check = checkHeroBudget({ ...heroById('keloglan'), triangles: 222_150 });
    expect(check.withinBudget).toBe(true);
    expect(check.message).toContain('within hero budget');
  });

  it('reports an oversized hero instead of shrinking it', () => {
    const check = checkHeroBudget({ ...heroById('keloglan'), triangles: 400_000 });
    expect(check.withinBudget).toBe(false);
    expect(check.message).toContain('do not decimate');
  });

  it('keeps both heroes in the same technical class', () => {
    expect(allHeroes()).toHaveLength(2);
    expect(inactiveHeroes('keloglan').map((hero) => hero.id)).toEqual(['nasreddin-hoca']);
  });
});

describe('animation', () => {
  it('maps motion onto clips without touching the renderer', () => {
    expect(clipForState({ speed: 0, interacting: false, performing: null })).toBe('idle');
    expect(clipForState({ speed: 3, interacting: false, performing: null })).toBe('walk');
    expect(clipForState({ speed: 6, interacting: false, performing: null })).toBe('run');
    expect(clipForState({ speed: 0, interacting: true, performing: null })).toBe('talk');
    // A one-shot beat outranks locomotion so the guide finishes it.
    expect(clipForState({ speed: 6, interacting: true, performing: 'dance' })).toBe('dance');
    expect(clipForState({ speed: 6, interacting: false, performing: 'agree' })).toBe('agree');
  });

  it('never repeats a celebration dance back to back', () => {
    let bag = createShuffleBag(['Dance_01', 'Dance_02', 'Dance_03']);
    let previous: string | null = null;
    for (let i = 0; i < 200; i += 1) {
      const result = draw(bag, i * 7919);
      bag = result.bag;
      expect(result.clip).not.toBeNull();
      expect(result.clip, `repeat at draw ${i}`).not.toBe(previous);
      previous = result.clip;
    }
  });

  it('hands out every dance once before repeating any', () => {
    let bag = createShuffleBag(['a', 'b', 'c']);
    const drawn: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const result = draw(bag, i + 1);
      bag = result.bag;
      if (result.clip) drawn.push(result.clip);
    }
    expect(new Set(drawn).size).toBe(3);
  });

  it('copes with a hero that has no dance clips yet', () => {
    const result = draw(createShuffleBag([]));
    expect(result.clip).toBeNull();
  });
});

describe('failure behaviour', () => {
  it('falls back to the placeholder whenever the model cannot be shown', () => {
    const url = '/assets/heroes/keloglan.glb';
    expect(heroRenderMode({ ready: true, failed: false, modelUrl: url })).toBe('model');
    // A failed download must not blank the scene.
    expect(heroRenderMode({ ready: true, failed: true, modelUrl: url })).toBe('placeholder');
    // Not delivered yet — the current state of both heroes.
    expect(heroRenderMode({ ready: true, failed: false, modelUrl: null })).toBe('placeholder');
    // City shell not ready: the hero is off the critical path.
    expect(heroRenderMode({ ready: false, failed: false, modelUrl: url })).toBe('placeholder');
  });

  it('renders the model for delivered heroes and the placeholder for the rest', () => {
    for (const hero of allHeroes()) {
      const expected = hero.modelUrl ? 'model' : 'placeholder';
      expect(
        heroRenderMode({ ready: true, failed: false, modelUrl: hero.modelUrl }),
        hero.id,
      ).toBe(expected);
    }
    // Both heroes are delivered.
    expect(heroById('keloglan').modelUrl).not.toBeNull();
    expect(heroById('nasreddin-hoca').modelUrl).not.toBeNull();
  });
});

describe('mixer ownership', () => {
  it('updates exactly one mixer, and only from the mounted hero component', () => {
    const root = path.resolve(process.cwd(), 'src');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) {
          const source = readFileSync(full, 'utf8');
          if (source.includes('mixer.update')) offenders.push(path.relative(root, full));
        }
      }
    };
    walk(root);
    expect(offenders).toEqual(['components/three/HeroCharacter.tsx']);
  });

  it('mounts no hero outside the city scene', () => {
    const mapPage = readFileSync(path.resolve(process.cwd(), 'src/app/map/page.tsx'), 'utf8');
    expect(mapPage).not.toContain('HeroCharacter');
    // The map uses a 2D portrait instead.
    expect(mapPage).toContain('GuidePortrait');
  });
});

describe('delivered Keloğlan model', () => {
  const keloglan = heroById('keloglan');

  it('is registered with the delivered file, checksum and measurements', () => {
    expect(keloglan.modelUrl).toBe(
      '/assets/heroes/Meshy_AI_Little_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    );
    expect(keloglan.checksum).toHaveLength(64);
    expect(keloglan.triangles).toBe(222_150);
    expect(keloglan.transferBytes).toBe(16_722_860);
    expect(keloglan.measuredHeightMeters).toBe(1.7);
  });

  it('keeps the delivered filename so the file traces back to the delivery', () => {
    expect(keloglan.modelUrl).toContain('Meshy_AI_Little_Adventurer_biped');
  });

  it('sits inside the approved hero triangle range without decimation', () => {
    const check = checkHeroBudget(keloglan);
    expect(check.withinBudget).toBe(true);
    expect(check.triangles).toBe(222_150);
  });

  it('maps the four state clips to names that exist in the file', () => {
    const { clips, deliveredClips } = keloglan.animation;
    expect(clips).toEqual({
      idle: 'Idle_11',
      walk: 'Walking',
      run: 'Running',
      talk: 'Talk_Passionately',
    });
    for (const name of Object.values(clips)) {
      expect(deliveredClips, `${name} missing from the GLB`).toContain(name);
    }
  });

  it('records all twelve delivered clips', () => {
    expect(keloglan.animation.deliveredClips).toHaveLength(12);
  });

  it('approves exactly the four agreed celebration clips', () => {
    expect(keloglan.animation.danceClips).toEqual([
      'FunnyDancing_01',
      'FunnyDancing_03',
      'Hip_Hop_Dance',
      'Joyful_Dance_with_Hand_Sway',
    ]);
  });

  it('never selects an excluded clip, and records why each is excluded', () => {
    const excluded = ['Love_You_Pop_Dance', 'ymca_dance', 'Breakdance_1990', 'Step_Hip_Hop_Dance'];
    for (const clip of excluded) {
      expect(keloglan.animation.deliveredClips, clip).toContain(clip);
      expect(keloglan.animation.danceClips, clip).not.toContain(clip);
      expect(isApprovedDance(keloglan, clip), clip).toBe(false);
      expect(keloglan.animation.excludedClips[clip], `${clip} needs a reason`).toBeTruthy();
    }
  });

  it('only ever draws approved clips from the bag', () => {
    let bag = createShuffleBag(keloglan.animation.danceClips);
    for (let i = 0; i < 100; i += 1) {
      const result = draw(bag, i * 104_729);
      bag = result.bag;
      expect(isApprovedDance(keloglan, result.clip!), result.clip ?? '').toBe(true);
    }
  });

  it('reports both heroes as delivered', () => {
    expect(isDelivered(keloglan)).toBe(true);
    expect(isDelivered(heroById('nasreddin-hoca'))).toBe(true);
    // Distinct files, so one cannot silently stand in for the other.
    expect(keloglan.modelUrl).not.toBe(heroById('nasreddin-hoca').modelUrl);
    expect(keloglan.checksum).not.toBe(heroById('nasreddin-hoca').checksum);
  });
});

describe('completion choreography', () => {
  const opts = { reducedMotion: false, planLength: 1 };
  const run = (events: Parameters<typeof celebrationReducer>[1][], options = opts) =>
    events.reduce((ctx, event) => celebrationReducer(ctx, event, options), initialCelebration);

  it('saves progress before any performance starts', () => {
    const afterComplete = run([{ type: 'CITY_COMPLETED' }]);
    expect(afterComplete.state).toBe('saving');
    expect(afterComplete.inputLocked).toBe(true);
    expect(celebrationReducer(afterComplete, { type: 'CAMERA_FRAMED' }, opts).state).toBe('saving');
  });

  it('walks frame → perform → summary', () => {
    const done = run([
      { type: 'CITY_COMPLETED' },
      { type: 'PROGRESS_SAVED' },
      { type: 'CAMERA_FRAMED' },
      { type: 'CLIP_FINISHED' },
    ]);
    expect(done.state).toBe('summary');
    expect(done.performances).toBe(1);
  });

  it('locks input for the whole sequence', () => {
    const states = ['saving', 'framing', 'performing', 'summary'];
    let ctx = initialCelebration;
    const events: Parameters<typeof celebrationReducer>[1][] = [
      { type: 'CITY_COMPLETED' },
      { type: 'PROGRESS_SAVED' },
      { type: 'CAMERA_FRAMED' },
      { type: 'CLIP_FINISHED' },
    ];
    for (const [index, event] of events.entries()) {
      ctx = celebrationReducer(ctx, event, opts);
      expect(ctx.state).toBe(states[index]);
      expect(ctx.inputLocked).toBe(true);
    }
  });

  it('skips the performance under reduced motion and still shows the summary', () => {
    const reduced = { reducedMotion: true, planLength: 1 };
    const done = run([{ type: 'CITY_COMPLETED' }, { type: 'PROGRESS_SAVED' }], reduced);
    expect(done.state).toBe('summary');
    expect(done.performances).toBe(0);
    expect(celebrationReducer(done, { type: 'REPLAY' }, reduced).state).toBe('summary');
  });

  it('skips the performance for a guide with an empty plan', () => {
    const empty = { reducedMotion: false, planLength: 0 };
    expect(run([{ type: 'CITY_COMPLETED' }, { type: 'PROGRESS_SAVED' }], empty).state).toBe('summary');
  });

  it('frames the guide from a medium distance rather than overhead', () => {
    const camera = celebrationCamera([4, 0, -22]);
    expect(camera.target).toEqual([4, 1.0, -22]);
    const horizontal = Math.hypot(camera.position[0] - 4, camera.position[2] - -22);
    expect(horizontal).toBeGreaterThan(3);
    expect(horizontal).toBeLessThan(8);
    expect(camera.position[1]).toBeLessThan(3);
  });
});

describe('per-character celebration policy', () => {
  const keloglan = heroById('keloglan');
  const hoca = heroById('nasreddin-hoca');

  it('gives Keloğlan a dance and Nasreddin Hodja a gesture sequence', () => {
    expect(keloglan.celebration.kind).toBe('dance-bag');
    expect(hoca.celebration.kind).toBe('gesture-sequence');
    expect(celebrationPlan(keloglan)).toEqual(['dance']);
    expect(celebrationPlan(hoca)).toEqual(['agree', 'wave']);
  });

  it('never gives Nasreddin Hodja a dance', () => {
    expect(hoca.animation.danceClips).toEqual([]);
    expect(celebrationPlan(hoca)).not.toContain('dance');
    expect(hoca.animation.deliveredClips.some((clip) => /dance|dancing/i.test(clip))).toBe(false);
  });

  it('offers the replay button only to the dance guide', () => {
    expect(allowsCelebrationReplay(keloglan)).toBe(true);
    expect(allowsCelebrationReplay(hoca)).toBe(false);
  });

  it('plays agree then wave then the panel for Nasreddin Hodja', () => {
    const plan = celebrationPlan(hoca);
    const options = { reducedMotion: false, planLength: plan.length };
    let ctx = celebrationReducer(initialCelebration, { type: 'CITY_COMPLETED' }, options);
    ctx = celebrationReducer(ctx, { type: 'PROGRESS_SAVED' }, options);
    ctx = celebrationReducer(ctx, { type: 'CAMERA_FRAMED' }, options);
    expect(currentCelebrationClip(ctx, plan)).toBe('agree');

    ctx = celebrationReducer(ctx, { type: 'CLIP_FINISHED' }, options);
    expect(ctx.state).toBe('performing');
    expect(currentCelebrationClip(ctx, plan)).toBe('wave');

    ctx = celebrationReducer(ctx, { type: 'CLIP_FINISHED' }, options);
    expect(ctx.state).toBe('summary');
    expect(currentCelebrationClip(ctx, plan)).toBeNull();
  });

  it('keeps Keloğlan on a single drawn dance', () => {
    const plan = celebrationPlan(keloglan);
    const options = { reducedMotion: false, planLength: plan.length };
    let ctx = celebrationReducer(initialCelebration, { type: 'CITY_COMPLETED' }, options);
    ctx = celebrationReducer(ctx, { type: 'PROGRESS_SAVED' }, options);
    ctx = celebrationReducer(ctx, { type: 'CAMERA_FRAMED' }, options);
    expect(currentCelebrationClip(ctx, plan)).toBe('dance');
    ctx = celebrationReducer(ctx, { type: 'CLIP_FINISHED' }, options);
    expect(ctx.state).toBe('summary');
  });

  it('nods on success only for the guide whose policy says so', () => {
    expect(hoca.successClip).toBe('agree');
    expect(keloglan.successClip).toBeNull();
  });
});

describe('delivered Nasreddin Hodja model', () => {
  const hoca = heroById('nasreddin-hoca');

  it('is registered with the delivered file, checksum and measurements', () => {
    expect(hoca.modelUrl).toBe(
      '/assets/heroes/Meshy_AI_Teal_Robed_Sage_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    );
    expect(hoca.checksum).toHaveLength(64);
    expect(hoca.triangles).toBe(197_482);
    expect(hoca.transferBytes).toBe(19_867_032);
    expect(hoca.measuredHeightMeters).toBe(1.7);
  });

  it('sits in the same hero technical class as Keloğlan', () => {
    const check = checkHeroBudget(hoca);
    expect(check.withinBudget).toBe(true);
    expect(hoca.triangles!).toBeGreaterThanOrEqual(180_000);
    expect(hoca.triangles!).toBeLessThanOrEqual(250_000);
  });

  it('maps all six clips to names present in the file', () => {
    const { clips, deliveredClips } = hoca.animation;
    expect(clips).toEqual({
      idle: 'Idle_11',
      walk: 'Walking',
      run: 'Running',
      talk: 'Talk_with_Hands_Open',
      agree: 'Agree_Gesture',
      wave: 'Wave_One_Hand',
    });
    for (const name of Object.values(clips)) {
      expect(deliveredClips, `${name} missing from the GLB`).toContain(name);
    }
  });

  it('never uses the excluded clapping clip', () => {
    expect(hoca.animation.deliveredClips).toContain('Clapping_Run');
    expect(hoca.animation.excludedClips.Clapping_Run).toBeTruthy();
    expect(Object.values(hoca.animation.clips)).not.toContain('Clapping_Run');
    expect(celebrationPlan(hoca).map((clip) => resolveClipName(hoca, clip as never))).not.toContain(
      'Clapping_Run',
    );
  });

  it('caps the 13 second agree gesture so the panel is not held back', () => {
    expect(clipDurationCap(hoca, 'Agree_Gesture')).toBe(4);
    expect(clipDurationCap(hoca, 'Wave_One_Hand')).toBeNull();
  });

  it('falls back through the documented chain when a clip is missing', () => {
    const noAgree = {
      ...hoca,
      animation: { ...hoca.animation, clips: { idle: 'Idle_11', wave: 'Wave_One_Hand' } },
    };
    expect(resolveClipName(noAgree, 'agree')).toBe('Wave_One_Hand');

    const idleOnly = { ...hoca, animation: { ...hoca.animation, clips: { idle: 'Idle_11' } } };
    expect(resolveClipName(idleOnly, 'agree')).toBe('Idle_11');
    expect(resolveClipName(idleOnly, 'wave')).toBe('Idle_11');
    expect(resolveClipName(idleOnly, 'talk')).toBe('Idle_11');
    expect(resolveClipName(idleOnly, 'run')).toBe('Idle_11');
  });

  it('treats only walking and running as locomotion', () => {
    expect(isLocomotion('walk')).toBe(true);
    expect(isLocomotion('run')).toBe(true);
    // Everything else has its horizontal root translation cancelled.
    for (const clip of ['idle', 'talk', 'agree', 'wave', 'dance'] as const) {
      expect(isLocomotion(clip), clip).toBe(false);
    }
  });
});

describe('nothing waits forever', () => {
  it('gives every clip a timeout, capped or not', () => {
    expect(clipTimeoutFor(null)).toBeGreaterThan(0);
    expect(clipTimeoutFor(4)).toBe(5_000);
    // A capped clip must not be given less time than its cap.
    expect(clipTimeoutFor(4)).toBeGreaterThan(4_000);
  });

  it('keeps the sequence backstop longer than any single clip', () => {
    expect(CELEBRATION_TIMEOUT_MS).toBeGreaterThan(clipTimeoutFor(null));
    expect(CAMERA_SETTLE_TIMEOUT_MS).toBeLessThan(CELEBRATION_TIMEOUT_MS);
  });

  it('reaches the summary from every performing step via SKIP', () => {
    for (const hero of allHeroes()) {
      const plan = celebrationPlan(hero);
      const options = { reducedMotion: false, planLength: plan.length };
      let ctx = celebrationReducer(initialCelebration, { type: 'CITY_COMPLETED' }, options);
      ctx = celebrationReducer(ctx, { type: 'PROGRESS_SAVED' }, options);
      ctx = celebrationReducer(ctx, { type: 'CAMERA_FRAMED' }, options);
      // Whatever step it is on, the backstop ends the sequence.
      ctx = celebrationReducer(ctx, { type: 'SKIP' }, options);
      expect(ctx.state, hero.id).toBe('summary');
    }
  });

  it('opens a stalled interaction rather than leaving input locked', () => {
    // The camera watchdog fires the same event the camera would have.
    const entering = (
      [
        { type: 'HOTSPOT_IN_RANGE', hotspotId: 'a' },
        { type: 'BEGIN' },
      ] as Parameters<typeof interactionReducer>[1][]
    ).reduce(interactionReducer, initialInteractionContext);
    expect(entering.state).toBe('entering');
    expect(interactionReducer(entering, { type: 'CAMERA_SETTLED' }).state).toBe('active');
  });
});
