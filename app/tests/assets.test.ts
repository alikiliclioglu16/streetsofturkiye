import { readFileSync, readdirSync } from 'node:fs';
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
import { loadComposedCity } from './helpers';

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

describe('asset registry alignment', () => {
  it('covers every row of the manifest', () => {
    const csvIds = manifestIdsFromCsv();
    expect(csvIds).toHaveLength(25);
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

  it('resolves every hotspot, reward and kit reference in every pilot city', () => {
    for (const city of cities) {
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

  it('reports zero unknown assets when building all three pilot scenes', () => {
    for (const city of cities) {
      expect(buildScene(city, 'medium').unknownAssetIds, city.id).toEqual([]);
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
    expect(lamp!.transferBytes).toBe(1_371_280);
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
    // Lamps and benches together; each kind is bounded separately elsewhere.
    expect(scene.props.length).toBeGreaterThanOrEqual(5);
    expect(scene.props.length).toBeLessThanOrEqual(8);

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

  it('adds no props to cities that are not being dressed yet', () => {
    for (const cityId of ['nevsehir', 'gaziantep']) {
      expect(buildScene(loadComposedCity(cityId), 'high').props).toEqual([]);
    }
  });
});
