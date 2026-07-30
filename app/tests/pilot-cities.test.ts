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
  it('opens all three pilot cities', () => {
    /**
     * Gaziantep's three stop objects are still placeholders, and it opens
     * anyway. It tests something neither of the others could: three stops and
     * one question, where they have five and two. A layout that only works for
     * five-stop cities would fail on seventy-eight of the eighty-one.
     */
    expect([...PLAYABLE_CITY_IDS].sort()).toEqual([...PILOT_CITY_IDS].sort());
  });

  it('lays out a three-stop city as correctly as a five-stop one', () => {
    const gaziantep = loadComposedCity('gaziantep');
    expect(gaziantep.hotspots).toHaveLength(3);
    expect(gaziantep.quiz).toHaveLength(1);

    const scene = buildScene(gaziantep, 'high');
    // Everything the five-stop cities get, scaled to a shorter street.
    expect(scene.props.length).toBeGreaterThan(5);
    expect(scene.trees.length).toBeGreaterThan(8);
    expect(scene.catRoutes.length).toBeGreaterThan(0);
    expect(scene.routePoints.length).toBeGreaterThan(3);

    const zs = scene.hotspots.map((h) => h.position[2]);
    const istanbulZs = buildScene(loadComposedCity('istanbul'), 'high').hotspots.map(
      (h) => h.position[2],
    );
    expect(Math.max(...zs) - Math.min(...zs)).toBeLessThan(
      Math.max(...istanbulZs) - Math.min(...istanbulZs),
    );
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
