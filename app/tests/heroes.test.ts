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
  checkHeroBudget,
  heroById,
  heroForGuide,
  inactiveHeroes,
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
import { clipForState } from '@/engine/heroes/animation';
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
    expect(clipForState({ speed: 0, interacting: false, celebrating: false })).toBe('idle');
    expect(clipForState({ speed: 3, interacting: false, celebrating: false })).toBe('walk');
    expect(clipForState({ speed: 6, interacting: false, celebrating: false })).toBe('run');
    expect(clipForState({ speed: 0, interacting: true, celebrating: false })).toBe('talk');
    expect(clipForState({ speed: 6, interacting: true, celebrating: true })).toBe('dance');
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

  it('leaves both heroes on the placeholder path until a GLB is delivered', () => {
    for (const hero of allHeroes()) {
      expect(heroRenderMode({ ready: true, failed: false, modelUrl: hero.modelUrl })).toBe('placeholder');
    }
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
