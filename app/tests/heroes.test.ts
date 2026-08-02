import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { heroRenderMode } from '@/components/three/HeroCharacter';
import { DEGRADATION_LADDER, HERO_POLICY, QUALITY } from '@/engine/heroes/policy';
import {
  allHeroes,
  checkHeroBudget,
  clipDurationCap,
  heroById,
  heroForGuide,
  inactiveHeroes,
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
import {
  BEAT_MS,
  FRAMING_MS,
  celebrationCamera,
  celebrationPlan,
  celebrationReducer,
  initialCelebration,
} from '@/engine/heroes/celebration';
import { clipForState } from '@/engine/heroes/animation';
import {
  CAMERA_SETTLE_TIMEOUT_MS,
  CELEBRATION_TIMEOUT_MS,
  clipTimeoutFor,
} from '@/engine/heroes/watchdog';
import { initialInteractionContext, interactionReducer } from '@/engine/interactions/machine';
import { assetTier } from '@/engine/quality/quality';
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

describe('single quality configuration', () => {
  it('runs one configuration everywhere', () => {
    // Measurement removed the profiles: full quality holds 60 fps.
    expect(QUALITY.maxDpr).toBe(2);
    expect(QUALITY.heroShadow).toBe(true);
    expect(QUALITY.shadowMapSize).toBe(2048);
    expect(QUALITY.environmentDensity).toBe(1);
    expect(assetTier()).toBe('high');
  });

  it('keeps the same hero asset regardless of anything', () => {
    const hero = heroById('keloglan');
    expect(hero.assetId).toBe('character_keloglan_base');
    expect(HERO_POLICY.preserveFullQualityMesh).toBe(true);
  });

  it('never lists character quality in the degradation ladder', () => {
    const ladder = [...DEGRADATION_LADDER].join(' ');
    expect(ladder).not.toContain('character');
    expect(ladder).not.toContain('hero');
    expect(ladder).not.toContain('mesh');
  });
});

describe('hero budget reporting', () => {
  it('accepts the approved hero triangle range without decimating at runtime', () => {
    const check = checkHeroBudget({ ...heroById('keloglan'), triangles: 99_966 });
    expect(check.withinBudget).toBe(true);
    expect(check.message).toContain('within hero budget');
  });

  it('reports an oversized hero instead of shrinking it', () => {
    // 222,150 was the original delivery, and it is now over budget: the range
    // moved when 18.95 MB per hero met a product aimed at tablets.
    const check = checkHeroBudget({ ...heroById('keloglan'), triangles: 222_150 });
    expect(check.withinBudget).toBe(false);
    expect(check.message).toContain('do not decimate');
  });

  it('holds both heroes to the same technical class', () => {
    const sizes = allHeroes().map((hero) => hero.transferBytes ?? 0);
    for (const size of sizes) {
      // A hero is the single largest thing a child downloads for a city.
      expect(size / (1024 * 1024)).toBeLessThan(6);
    }
    // Neither is more than half again the other.
    expect(Math.max(...sizes) / Math.min(...sizes)).toBeLessThan(1.5);
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
    // A locked performance owns the screen and outranks everything.
    expect(
      clipForState({ speed: 6, interacting: true, performing: 'wave', performanceLocked: true }),
    ).toBe('wave');
    // An unlocked beat is cosmetic: walking away cancels it.
    expect(clipForState({ speed: 6, interacting: false, performing: 'agree' })).toBe('run');
    expect(clipForState({ speed: 3, interacting: false, performing: 'agree' })).toBe('walk');
    // Standing still, the nod plays.
    expect(clipForState({ speed: 0, interacting: false, performing: 'agree' })).toBe('agree');
  });

  it('never leaves the guide gliding in a held pose', () => {
    // The five-second slide: collect at a stop, walk off immediately.
    let clip = clipForState({ speed: 0, interacting: false, performing: 'agree' });
    expect(clip).toBe('agree');
    clip = clipForState({ speed: 4.2, interacting: false, performing: 'agree' }, clip);
    expect(clip).toBe('walk');
  });

  it('caps nothing, because there is nothing left to cap', () => {
    /**
     * Nasreddin Hodja's agree gesture ran 13 s and was capped at 2.5. Both are
     * gone: the re-export ships idle, walk and run, and the guide neither nods
     * nor waves (D-168). The cap mechanism stays for the next character that
     * arrives with a thirteen second anything.
     */
    for (const hero of allHeroes()) {
      expect(Object.keys(hero.animation.maxDurationSeconds ?? {})).toEqual([]);
    }
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
  it('owns hero animation in one place, and animates nothing else from there', () => {
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
    /**
     * Every file that drives a mixer must clone its own skeleton.
     *
     * This was a list of the three files allowed to hold one, and it went stale
     * the first time a fourth animated thing was added — the birds, which have
     * as much right to a mixer as the street cat does. A list is not a test
     * (D-127): it was true the day it was written and said nothing about
     * whether anything worked.
     *
     * The rule underneath it is what actually matters, and it is the D-042 bug:
     * sharing a mixer means sharing a skeleton, and a skeleton driven from
     * somewhere else renders at bind pose — which is what drew the guide 1.7 cm
     * tall. So what is asserted is that anything animating has cloned with
     * `SkeletonUtils`, and that the guide's own animation still lives in one
     * place.
     */
    expect(offenders.length).toBeGreaterThan(0);
    for (const file of offenders) {
      const source = readFileSync(path.join(root, file), 'utf8');
      expect(source, `${file} drives a mixer without cloning its skeleton`).toContain(
        'SkeletonUtils',
      );
    }
    expect(offenders.filter((file) => /HeroCharacter/.test(file))).toEqual([
      'components/three/HeroCharacter.tsx',
    ]);
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
    expect(keloglan.triangles).toBe(10_307);
    expect(keloglan.transferBytes).toBe(954_780);
    expect(keloglan.measuredHeightMeters).toBe(1.7);
  });

  it('keeps the delivered filename so the file traces back to the delivery', () => {
    expect(keloglan.modelUrl).toContain('Meshy_AI_Little_Adventurer_biped');
  });

  it('sits inside the approved hero triangle range without decimation', () => {
    const check = checkHeroBudget(keloglan);
    expect(check.withinBudget).toBe(true);
    expect(check.triangles).toBe(10_307);
  });

  it('maps its three state clips to names that exist in the file', () => {
    expect(keloglan.animation.clips).toEqual({
      idle: 'Idle_11',
      walk: 'Walking',
      run: 'Running',
    });
    for (const name of Object.values(keloglan.animation.clips)) {
      expect(keloglan.animation.deliveredClips).toContain(name);
    }
  });

  it('records what the file actually ships, mapped or not', () => {
    // `Run_02` is in the file and unmapped: one run is enough, and carrying the
    // spare is cheaper than a rule about when to use it.
    expect([...keloglan.animation.deliveredClips].sort()).toEqual([
      'Idle_11',
      'Run_02',
      'Running',
      'Walking',
    ]);
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

  it('frames the guide from the front, at his height, not from behind', () => {
    // Heading 0 means he faces +z, so the camera must sit at greater z.
    const camera = celebrationCamera([4, 0, -22], 0);
    expect(camera.target[0]).toBe(4);
    expect(camera.target[1]).toBeGreaterThan(1);
    expect(camera.position[2]).toBeGreaterThan(-22);

    const horizontal = Math.hypot(camera.position[0] - 4, camera.position[2] + 22);
    expect(horizontal).toBeGreaterThan(3);
    expect(horizontal).toBeLessThan(8);
    expect(camera.position[1]).toBeLessThan(3);
  });

  it('stays in front however he is turned', () => {
    for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const camera = celebrationCamera([0, 0, 0], heading);
      // Dot product of the camera direction with his facing must be positive.
      const facing = { x: Math.sin(heading), z: Math.cos(heading) };
      const dot = camera.position[0] * facing.x + camera.position[2] * facing.z;
      expect(dot, `heading ${heading}`).toBeGreaterThan(0);
    }
  });
});

describe('per-character celebration policy', () => {
  it('has no celebration to play, and reaches the panel anyway', () => {
    /**
     * The guides do not celebrate any more. What has to keep working is the
     * thing D-031 protects: the panel opens on a clock, not on a report from an
     * animation that may never arrive — and now certainly will not.
     */
    for (const hero of allHeroes()) {
      expect(celebrationPlan(hero)).toEqual([]);
    }
  });


  it('gives both guides three animations and nothing else', () => {
    /**
     * The dance went first (D-113), then the gestures (D-168). Both guides now
     * stand, walk and run, which is everything the game ever asked them to do —
     * and the models came back at a tenth of the triangles for it.
     */
    for (const hero of allHeroes()) {
      expect(Object.keys(hero.animation.clips).sort()).toEqual(['idle', 'run', 'walk']);
      expect(hero.celebration.clips).toEqual([]);
      expect(hero.successClip).toBeNull();
    }
  });

  it('ships no dance clips in either delivered file', () => {
    for (const hero of allHeroes()) {
      const delivered = hero.animation.deliveredClips ?? [];
      expect(delivered.some((name) => /danc/i.test(name)), hero.id).toBe(false);
    }
  });

  it('keeps every celebration beat short enough for a child to sit through', () => {
    // Time-driven, not event-driven: nothing waits on a report that may not come.
    expect(FRAMING_MS).toBeLessThan(1_500);
    expect(BEAT_MS).toBeLessThan(4_000);
    const longest = FRAMING_MS + BEAT_MS * Math.max(...allHeroes().map((h) => celebrationPlan(h).length));
    expect(longest).toBeLessThan(7_000);
  });
});

describe('delivered Nasreddin Hodja model', () => {
  const hoca = heroById('nasreddin-hoca');

  it('is registered with the delivered file, checksum and measurements', () => {
    expect(hoca.modelUrl).toBe(
      '/assets/heroes/Meshy_AI_Teal_Robed_Sage_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    );
    expect(hoca.checksum).toHaveLength(64);
    expect(hoca.triangles).toBe(8_409);
    expect(hoca.transferBytes).toBe(992_904);
    expect(hoca.measuredHeightMeters).toBe(1.7);
  });

  it('sits in the same hero technical class as Keloğlan', () => {
    /**
     * The floor moved from 70,000 to 6,000 (D-168). It was never a target — it
     * is the point below which a delivery is probably the wrong file, a proxy
     * or a LOD or half a character. Both guides came back at a tenth of the old
     * count and hold up at a metre seven from a camera that never gets closer
     * than about three.
     */
    const check = checkHeroBudget(hoca);
    expect(check.withinBudget).toBe(true);
    for (const hero of allHeroes()) {
      expect(hero.triangles!, hero.displayName).toBeGreaterThanOrEqual(6_000);
      expect(hero.triangles!, hero.displayName).toBeLessThanOrEqual(120_000);
    }
  });

  it('maps its three clips to names present in the file', () => {
    expect(hoca.animation.clips).toEqual({
      idle: 'Idle_11',
      walk: 'Walking',
      run: 'Running',
    });
    for (const name of Object.values(hoca.animation.clips)) {
      expect(hoca.animation.deliveredClips).toContain(name);
    }
  });

  it('excludes nothing, because nothing unwanted is delivered any more', () => {
    /**
     * `Clapping_Run` was rejected as off-tone and then downloaded on every
     * visit for weeks, unplayed. It is not in the file at all now (D-168), and
     * neither is anything else the game does not use.
     */
    expect(hoca.animation.excludedClips).toEqual({});
    expect(hoca.animation.deliveredClips).not.toContain('Clapping_Run');
  });

  it('ships no gesture to cap', () => {
    expect(hoca.animation.deliveredClips).not.toContain('Agree_Gesture');
    expect(clipDurationCap(hoca, 'Agree_Gesture')).toBeNull();
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
    for (const clip of ['idle', 'talk', 'agree', 'wave'] as const) {
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

describe('material corrections', () => {
  it('records why Nasreddin Hodja is forced opaque', () => {
    const hoca = heroById('nasreddin-hoca');
    expect(hoca.material?.forceOpaque).toBe(true);
    // The reason has to survive in the file, not just in a chat message.
    expect(hoca.material?.reason).toMatch(/BLEND/);
    expect(hoca.material?.reason).toMatch(/210/);
  });

  it('leaves Keloğlan alone, because his material was already opaque', () => {
    expect(heroById('keloglan').material).toBeUndefined();
  });
});
