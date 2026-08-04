import { readFileSync } from 'node:fs';
import path from 'node:path';
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
  it('offers a card for every city a child can enter', async () => {
    /**
     * Found on the deployed site: the map drew four provinces you could tap and
     * the list below it offered three cards, so the only way into Kars was to
     * find it on the map.
     *
     * The list filtered by `PILOT_CITY_IDS`, which was the same set until Kars
     * opened outside the pilot (D-123). Splitting those two ideas was right;
     * leaving a piece of UI reading the wrong one was not.
     */
    const source = readFileSync(
      path.join(process.cwd(), 'src/app/map/page.tsx'),
      'utf8',
    );
    const cardList = source.slice(source.indexOf('pilotCities'), source.indexOf('pilotCities') + 800);
    expect(cardList, 'the card list still filters by the pilot').not.toMatch(
      /filter\([^)]*PILOT_CITY_IDS/,
    );
  });

  it('walks the guide the scene names, in every city', async () => {
    /**
     * Found by opening the deployed site and reading the debug overlay: Kars's
     * scene said Nasreddin Hodja and Keloğlan walked out of it.
     *
     * The hero model, the loading message, the intro panel and the map
     * portrait were all keyed off canonical's `legacyGuideId`, while the scene
     * carried the override. Two fields, two sources, and they agreed right up
     * until the first city was assigned a guide against the source.
     */
    const { loadComposedCity } = await import('./helpers');
    const byAsset: Record<string, string> = {
      character_nasreddin_hoca_base: 'nasreddin-hoca',
      character_keloglan_base: 'keloglan',
    };
    for (const cityId of PLAYABLE_CITY_IDS) {
      const city = loadComposedCity(cityId);
      expect(byAsset[city.guideAssetId], `${cityId} guide asset`).toBeDefined();
      expect(city.guideId, `${cityId}: model and guide id disagree`).toBe(
        byAsset[city.guideAssetId],
      );
    }
    expect(loadComposedCity('kars').guideId).toBe('nasreddin-hoca');
  });

  it('opens every pilot city, and is allowed to open more', () => {
    /**
     * Gaziantep's three stop objects were still placeholders when it opened,
     * and it opened anyway. It tested something neither of the others could:
     * three stops and one question, where they have five and two.
     *
     * This was written as "playable is exactly the pilot", which held only for
     * as long as no fourth city existed. Kars is open and is not a pilot city:
     * the pilot is the scope phase 02 is judged against, and opening a province
     * outside it must not quietly widen that. What has to stay true is that no
     * pilot city is closed.
     */
    for (const cityId of PILOT_CITY_IDS) {
      expect(PLAYABLE_CITY_IDS as readonly string[], cityId).toContain(cityId);
    }
  });

  it('lays out a three-stop city as correctly as a five-stop one', () => {
    const gaziantep = loadComposedCity('gaziantep');
    expect(gaziantep.hotspots).toHaveLength(3);
    expect(gaziantep.quiz).toHaveLength(1);

    const scene = buildScene(gaziantep, 'high');
    // Everything the five-stop cities get, scaled to a shorter street.
    expect(scene.props.length).toBeGreaterThan(5);
    /**
     * Planted, by whichever of the two routes this city uses. Gaziantep lines
     * its street with delivered pistachios now, so the procedural list is empty
     * and counting it alone said a planted street was bare.
     */
    const planted =
      scene.trees.length +
      gaziantep.props.filter((prop) => prop.note?.startsWith('street tree')).length;
    expect(planted).toBeGreaterThan(8);
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
