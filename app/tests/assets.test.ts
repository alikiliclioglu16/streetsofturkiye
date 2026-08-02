import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  isModelAsset,
  kitAssetId,
  deliveredProps,
  knownAssetIds,
  manifestEntries,
  resolveAsset,
} from '@/engine/assets/registry';
import { buildScene } from '@/engine/scene/buildScene';
import { PILOT_CITY_IDS } from '@/content/loaders/loadCity';
import { loadComposedCity } from './helpers';
import { readGlbBounds } from './glb-bounds';

const ROOT = path.resolve(process.cwd(), '..');
const MANIFEST = path.join(ROOT, 'asset-manifests/pilot-assets.csv');

/** Reads asset ids straight from the CSV, independently of the generator. */
function manifestIdsFromCsv(): string[] {
  const text = readFileSync(MANIFEST, 'utf8').replace(/^\uFEFF/, '');
  return text
    .split('\n')
    .slice(1)
    .map((line) => line.split(',')[0]?.trim())
    .filter((id): id is string => Boolean(id));
}

const cityIds = readdirSync(path.join(ROOT, 'content/scenes'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''));

const cities = cityIds.map(loadComposedCity);
/** Cities the vertical slice declares finished, as opposed to merely open. */
const pilotCities = cities.filter((city) => (PILOT_CITY_IDS as readonly string[]).includes(city.id));

describe('asset registry alignment', () => {
  it('covers every row of the manifest', () => {
    const csvIds = manifestIdsFromCsv();
    // Not a fixed number. The manifest grows every time a province is briefed,
    // and a count written into a test only records the day it was written.
    expect(csvIds.length).toBeGreaterThan(20);
    expect(new Set(csvIds).size, 'duplicate manifest rows').toBe(csvIds.length);
    // Kit props were never briefed as manifest rows, so they are extra.
    // Commissioned art that has since been delivered stays a manifest row.
    const extras = deliveredProps()
      .map((prop) => prop.id)
      .filter((id) => !csvIds.includes(id));
    const fromManifest = [...knownAssetIds()].filter((id) => !extras.includes(id));
    expect(fromManifest.sort()).toEqual([...csvIds].sort());
  });

  it('keeps the generated manifest in step with the CSV', () => {
    // Guards against editing generated-manifest.ts by hand.
    expect(manifestEntries().map((entry) => entry.id)).toEqual(manifestIdsFromCsv());
  });

  it('resolves every hotspot, reward and kit reference in a pilot city', () => {
    /**
     * Pilot cities only.
     *
     * This used to run over every scene file on disk and read as though the
     * rule were "no city may reference art that does not exist". Kars broke it
     * by being opened before its art, which is deliberate and is how Nevşehir
     * and Gaziantep were opened too (D-008, D-115). The rule this test is
     * actually for is that a city declared finished has nothing missing.
     */
    for (const city of pilotCities) {
      for (const hotspot of city.hotspots) {
        expect(resolveAsset(hotspot.assetId, 'medium').isUnknown, `${city.id}/${hotspot.assetId}`).toBe(false);
      }
      for (const assetId of city.rewards.collectibleAssetIds) {
        expect(resolveAsset(assetId, 'medium').isUnknown, `${city.id}/${assetId}`).toBe(false);
      }
      const kit = resolveAsset(kitAssetId(city.environment.kitId), 'medium');
      expect(kit.isUnknown, `${city.id}/${city.environment.kitId}`).toBe(false);
    }
  });

  it('reports zero unknown assets when building a pilot scene', () => {
    for (const city of pilotCities) {
      expect(buildScene(city, 'medium').unknownAssetIds, city.id).toEqual([]);
    }
  });

  it('gives an unbuilt city a documented placeholder for everything it is missing', () => {
    /**
     * The guarantee that does apply everywhere. A city opened before its art
     * must still be walkable: every unresolved reference falls back to a shape
     * the scene can draw, and the scene reports what is missing rather than
     * failing to build.
     */
    for (const city of cities) {
      const scene = buildScene(city, 'medium');
      expect(scene.hotspots.length, city.id).toBeGreaterThan(0);
      for (const assetId of scene.unknownAssetIds) {
        const asset = resolveAsset(assetId, 'medium');
        expect(asset.isUnknown, assetId).toBe(true);
        expect(asset.modelUrl, assetId).toBeNull();
        expect(asset.entry.placeholder, assetId).toBeTruthy();
      }
    }
  });

  it('treats province stars as UI awards rather than models', () => {
    for (const city of cities) {
      expect(isModelAsset(city.rewards.cityStarId)).toBe(false);
    }
  });

  it('maps content kit ids onto manifest kit ids without renaming either side', () => {
    expect(kitAssetId('marmara-urban-coastal')).toBe('kit_marmara_urban_coastal');
    expect(kitAssetId('central-anatolia-cappadocia')).toBe('kit_central_anatolia_cappadocia');
    expect(kitAssetId('kit_already_prefixed')).toBe('kit_already_prefixed');
  });

  it('carries manifest budgets through to the registry', () => {
    const galata = resolveAsset('city_istanbul_galata_tower', 'high');
    expect(galata.entry.manifest.tier).toBe('hero');
    // 4x4x14 in the manifest: storybook scale, so the tower fits its own shot.
    expect(galata.entry.dimensions[1]).toBe(14);
    expect(galata.entry.manifest.triangleBudget).toBeGreaterThan(0);
  });

  it('falls back to placeholder geometry while no GLB is delivered', () => {
    const propIds = new Set(deliveredProps().map((prop) => prop.id));
    for (const id of knownAssetIds()) {
      if (propIds.has(id)) continue; // delivered, so it has a model
      const resolved = resolveAsset(id, 'medium');
      expect(resolved.modelUrl, id).toBeNull();
      expect(resolved.isPlaceholder, id).toBe(true);
    }
  });
});

describe('delivered street props', () => {
  const lamp = deliveredProps().find((prop) => prop.id === 'kit_street_lamp');

  it('registers the lamp with the measurements taken from the file', () => {
    expect(lamp).toBeDefined();
    expect(lamp!.triangles).toBe(1_834);
    expect(lamp!.transferBytes).toBe(
      statSync(path.resolve(process.cwd(), 'public', lamp!.modelUrl.replace(/^\//, ''))).size,
    );
    expect(lamp!.dimensions).toEqual([1.25, 5.0, 1.1]);
    expect(lamp!.checksum).toHaveLength(64);
  });

  it('resolves through the same registry as everything else', () => {
    const resolved = resolveAsset('kit_street_lamp', 'high');
    expect(resolved.isUnknown).toBe(false);
    // Delivered, so it renders a model rather than a placeholder.
    expect(resolved.isPlaceholder).toBe(false);
    expect(resolved.modelUrl).toBe('/assets/props/kit_street_lamp.glb');
  });

  it('is ground-aligned, because its pivot is centred', () => {
    // The file's base sits 1.5 m below its origin; placing it at y = 0 unaided
    // would bury half the post.
    expect(resolveAsset('kit_street_lamp', 'high').entry.groundAlign).toBe(true);
    // Galata has since been delivered, and a delivered model is measured onto
    // the ground like any other. Undelivered manifest art is not moved.
    expect(resolveAsset('city_istanbul_galata_tower', 'high').entry.groundAlign).toBe(true);
    expect(resolveAsset('city_istanbul_ferry', 'high').entry.groundAlign).toBe(false);
  });

  it('stands lamps clear of the walk and of every solid object', () => {
    const city = loadComposedCity('istanbul');
    const scene = buildScene(city, 'high');
    // The whole street kit together; each kind is bounded separately.
    expect(scene.props.length).toBeGreaterThanOrEqual(14);
    expect(scene.props.length).toBeLessThanOrEqual(28);

    for (const prop of scene.props) {
      const [x, , z] = prop.position;
      for (const hotspot of city.hotspots) {
        const gap = Math.hypot(x - hotspot.transform.position[0], z - hotspot.transform.position[2]);
        expect(gap, `${prop.key} overlaps stop ${hotspot.order}`).toBeGreaterThan(
          hotspot.collider.halfWidth,
        );
      }
      // Inside the play area, or the child sees a lamp they can never reach.
      const xs = city.route.bounds.map((b) => b[0]);
      const zs = city.route.bounds.map((b) => b[2]);
      expect(x).toBeGreaterThan(Math.min(...xs));
      expect(x).toBeLessThan(Math.max(...xs));
      expect(z).toBeGreaterThan(Math.min(...zs));
      expect(z).toBeLessThan(Math.max(...zs));
    }
  });

  it('furnishes a city from the shared kit before anything is hand-placed', () => {
    for (const cityId of ['nevsehir', 'gaziantep']) {
      const ids = buildScene(loadComposedCity(cityId), 'high').props.map(
        (prop) => prop.asset.entry.id,
      );
      // The point is that the generator furnishes a street on its own, not that
      // a city may never have a landmark of its own: Gaziantep's bazaar gate is
      // hand-placed and everything around it is still generated.
      expect(ids.filter((id) => id.startsWith('kit_')).length, cityId).toBeGreaterThan(5);
      const fromAnotherCity = ids.filter(
        (id) => id.startsWith('city_') && !id.startsWith(`city_${cityId}_`),
      );
      expect(fromAnotherCity, cityId).toEqual([]);
    }
  });
});

describe('the registry tells the truth about the files', () => {
  it('records a size the file can actually be scaled to', { timeout: 20_000 }, () => {
    /**
     * The recorded height is what draws every model now (D-120), and the
     * recorded width and depth are what the collider and the trigger ring are
     * built from. Scaling is uniform and taken from height, so those two only
     * agree with each other if the recorded triple has the file's own
     * proportions.
     *
     * It does, everywhere, to within a few per cent — the numbers were taken by
     * measuring each delivery and scaling it, which is why activating the
     * height was safe. This test is what keeps that true: a triple typed in
     * from a brief instead of measured would pass every other test in the suite
     * and put a collider around a shape that is not there.
     */
    for (const prop of deliveredProps()) {
      const file = path.resolve(process.cwd(), 'public', prop.modelUrl.replace(/^\//, ''));
      if (!existsSync(file)) continue;

      const bounds = readGlbBounds(file);
      expect(bounds, prop.id).not.toBeNull();
      const [width, height, depth] = prop.dimensions;

      // Skinned models are authored at armature scale and measure near nothing
      // in bind pose; there is no aspect to compare.
      if (!bounds || bounds.height < 0.05) continue;

      const factor = height / bounds.height;
      const widthError = Math.abs(bounds.width * factor - width) / width;
      const depthError = Math.abs(bounds.depth * factor - depth) / depth;
      expect(widthError, `${prop.id} width`).toBeLessThan(0.08);
      expect(depthError, `${prop.id} depth`).toBeLessThan(0.08);
    }
  });

  it('records the byte count each delivered file actually has', { timeout: 15_000 }, async () => {
    // Two entries once drifted from disk after a re-compression, and a stale
    // checksum is worse than none: it looks like a verification.
    const { statSync, existsSync } = await import('node:fs');
    const path = await import('node:path');
    for (const prop of deliveredProps()) {
      const file = path.resolve(process.cwd(), 'public', prop.modelUrl.replace(/^\//, ''));
      expect(existsSync(file), prop.id).toBe(true);
      expect(statSync(file).size, prop.id).toBe(prop.transferBytes);
    }
  });

  // Hashing about 30 MB of models; the default timeout is occasionally short.
  it('records a checksum that matches the file', { timeout: 30_000 }, async () => {
    const { readFileSync } = await import('node:fs');
    const { createHash } = await import('node:crypto');
    const path = await import('node:path');
    for (const prop of deliveredProps()) {
      const file = path.resolve(process.cwd(), 'public', prop.modelUrl.replace(/^\//, ''));
      const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
      expect(sha, prop.id).toBe(prop.checksum);
    }
  });

  it('registers each asset id exactly once', () => {
    const ids = deliveredProps().map((prop) => prop.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
