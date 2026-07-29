import { describe, expect, it } from 'vitest';
import { PILOT_CITY_IDS, PLAYABLE_CITY_IDS } from '@/content/loaders/loadCity';
import { buildScene } from '@/engine/scene/buildScene';
import { heroForGuide } from '@/engine/heroes/registry';
import { loadComposedCity } from './helpers';

/**
 * All three pilot cities are open. Content and scenes existed before this;
 * these tests are what make opening them safe rather than hopeful.
 */
describe('pilot cities', () => {
  it('opens two cities, with the rest ready and closed', () => {
    /**
     * Nevşehir opens with a second guide, a second region's colour and its own
     * planting. Three of its five stop objects are still placeholders, which is
     * the point: the multi-city machinery is worth proving on one more street
     * before eighty are built on it.
     */
    expect([...PLAYABLE_CITY_IDS]).toEqual(['istanbul', 'nevsehir']);
    for (const cityId of PLAYABLE_CITY_IDS) {
      expect(PILOT_CITY_IDS).toContain(cityId);
    }
    expect(PILOT_CITY_IDS.length).toBeGreaterThan(PLAYABLE_CITY_IDS.length);
  });

  for (const cityId of PILOT_CITY_IDS) {
    describe(cityId, () => {
      const city = loadComposedCity(cityId);
      const scene = buildScene(city, 'high');

      it('builds with no unknown assets', () => {
        expect(scene.unknownAssetIds).toEqual([]);
      });

      it('covers every canonical stop with a hotspot', () => {
        expect(city.pendingStopIds).toEqual([]);
        expect(scene.hotspots).toHaveLength(city.canonicalStopCount);
      });

      it('has a guide with a delivered model', () => {
        expect(heroForGuide(city.guideId).modelUrl).not.toBeNull();
      });

      it('carries its own region colours rather than the default grey', () => {
        expect(scene.ground.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(scene.sky.top).toMatch(/^#[0-9a-f]{6}$/i);
        expect(scene.sky.horizon).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('has at least one canonical quiz question', () => {
        expect(city.quiz.length).toBeGreaterThanOrEqual(1);
        for (const item of city.quiz) {
          expect(item.options.filter((option) => option.correct)).toHaveLength(1);
        }
      });

      it('spawns the player outside every solid object', () => {
        const spawn = { x: city.spawn.position[0], z: city.spawn.position[2] };
        for (const collider of scene.colliders) {
          const inside =
            Math.abs(spawn.x - collider.x) <= collider.halfWidth &&
            Math.abs(spawn.z - collider.z) <= collider.halfDepth;
          expect(inside, `spawn is inside ${collider.x},${collider.z}`).toBe(false);
        }
      });
    });
  }

  it('gives the three cities visibly different regions', () => {
    const grounds = PILOT_CITY_IDS.map(
      (cityId) => buildScene(loadComposedCity(cityId), 'high').ground.color,
    );
    const skies = PILOT_CITY_IDS.map(
      (cityId) => buildScene(loadComposedCity(cityId), 'high').sky.top,
    );
    // Three cities that look identical would make the pilot pointless.
    expect(new Set(grounds).size).toBe(3);
    expect(new Set(skies).size).toBe(3);
  });

  it('sends each city to the guide its canonical record names', () => {
    const guides = Object.fromEntries(
      PILOT_CITY_IDS.map((cityId) => [cityId, loadComposedCity(cityId).guideId]),
    );
    // Straight from the canonical records, which alternate by province order.
    expect(guides).toEqual({
      istanbul: 'nasreddin-hoca',
      nevsehir: 'keloglan',
      gaziantep: 'keloglan',
    });
    // Both delivered heroes are actually used by the pilot.
    expect(new Set(Object.values(guides)).size).toBe(2);
  });
});
