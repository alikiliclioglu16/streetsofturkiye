import { heroById, inactiveHeroes, type HeroDefinition, type HeroId } from '@/engine/heroes/registry';
import { HERO_POLICY } from '@/engine/heroes/policy';

/**
 * Hero load and cache manager.
 *
 * Rules it enforces (policy sections 1–3):
 *  - a standard city requests exactly one hero;
 *  - the inactive hero is never requested or mounted;
 *  - the active hero stays cached while the player moves between cities, so
 *    the GLB is downloaded once;
 *  - the cache is released only on a guide switch or explicit memory pressure,
 *    never on ordinary city unmount.
 */

export type HeroRequestReason = 'city-enter' | 'city-prefetch' | 'two-hero-scene';

export interface HeroRequest {
  readonly heroId: HeroId;
  readonly url: string | null;
  readonly reason: HeroRequestReason;
  readonly at: number;
}

interface CacheState {
  /** Heroes whose GLB is resident. At most one during normal gameplay. */
  resident: Set<HeroId>;
  active: HeroId | null;
  requests: HeroRequest[];
  /** Urls handed to useGLTF.clear(), recorded for the QA overlay and tests. */
  released: HeroId[];
}

const state: CacheState = { resident: new Set(), active: null, requests: [], released: [] };

/** Test and dev-overlay seam. */
export function heroCacheSnapshot(): {
  resident: HeroId[];
  active: HeroId | null;
  requests: readonly HeroRequest[];
  released: readonly HeroId[];
} {
  return {
    resident: [...state.resident],
    active: state.active,
    requests: [...state.requests],
    released: [...state.released],
  };
}

export function resetHeroCache(): void {
  state.resident.clear();
  state.active = null;
  state.requests = [];
  state.released = [];
}

/**
 * Marks a hero as the one this scene needs and returns its model url.
 *
 * Requesting a different hero releases the previous one: two full-quality
 * heroes are not kept resident unless a two-hero scene explicitly asks.
 */
export function requestHero(
  heroId: HeroId,
  reason: HeroRequestReason = 'city-enter',
): { hero: HeroDefinition; url: string | null; releasedIds: HeroId[] } {
  const hero = heroById(heroId);
  const releasedIds: HeroId[] = [];

  if (reason !== 'two-hero-scene') {
    for (const resident of state.resident) {
      if (resident !== heroId) {
        state.resident.delete(resident);
        state.released.push(resident);
        releasedIds.push(resident);
      }
    }
    state.active = heroId;
  }

  state.resident.add(heroId);
  state.requests.push({ heroId, url: hero.modelUrl, reason, at: Date.now() });

  return { hero, url: hero.modelUrl, releasedIds };
}

/**
 * Called when a city unmounts. Deliberately a no-op for the active hero: the
 * player usually walks straight into another city with the same guide, and
 * re-downloading a 16 MB model each time would be worse than holding it.
 */
export function onCityUnmount(): { released: HeroId[] } {
  return { released: [] };
}

/** Explicit memory pressure, e.g. a `low-memory` signal or a long idle. */
export function releaseInactiveHeroes(): { released: HeroId[] } {
  const released: HeroId[] = [];
  if (state.active === null) return { released };
  for (const hero of inactiveHeroes(state.active)) {
    if (state.resident.has(hero.id)) {
      state.resident.delete(hero.id);
      state.released.push(hero.id);
      released.push(hero.id);
    }
  }
  return { released };
}

/** True when a hero is already resident and can be reused without a download. */
export function isResident(heroId: HeroId): boolean {
  return state.resident.has(heroId);
}

export function activeHeroId(): HeroId | null {
  return state.active;
}

/**
 * Guard for the two-hero special case. Normal gameplay never gets here because
 * `allowTwoHeroScene` is false by default.
 */
export function canMountTwoHeroes(allowTwoHeroScene = HERO_POLICY.allowTwoHeroScene): boolean {
  return allowTwoHeroScene === true;
}

export function maxActiveHeroes(allowTwoHeroScene = HERO_POLICY.allowTwoHeroScene): number {
  return canMountTwoHeroes(allowTwoHeroScene) ? 2 : HERO_POLICY.defaultMaxActiveHeroes;
}
