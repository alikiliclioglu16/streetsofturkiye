import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  isModelAsset,
  kitAssetId,
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
    expect([...knownAssetIds()].sort()).toEqual([...csvIds].sort());
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
    expect(galata.entry.dimensions[1]).toBe(32); // 9x9x32 in the manifest
    expect(galata.entry.manifest.triangleBudget).toBeGreaterThan(0);
  });

  it('falls back to placeholder geometry while no GLB is delivered', () => {
    for (const id of knownAssetIds()) {
      const resolved = resolveAsset(id, 'medium');
      expect(resolved.modelUrl, id).toBeNull();
      expect(resolved.isPlaceholder, id).toBe(true);
    }
  });
});
