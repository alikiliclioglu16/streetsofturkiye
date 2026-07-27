import { describe, expect, it } from 'vitest';
import { assetUrl } from '@/engine/assets/assetHost';
import { heroById, heroModelUrl, isDelivered } from '@/engine/heroes/registry';

/**
 * These run with no NEXT_PUBLIC_ASSET_BASE_URL set, which is the default: the
 * app serves its own binaries. The point of the test is that every consumer
 * goes through `assetUrl`, so flipping the env var moves everything at once.
 */
describe('asset host', () => {
  it('serves from the app when no external host is configured', () => {
    expect(assetUrl('/assets/heroes/x.glb')).toBe('/assets/heroes/x.glb');
  });

  it('passes absolute urls through untouched', () => {
    expect(assetUrl('https://cdn.example.com/x.glb')).toBe('https://cdn.example.com/x.glb');
  });

  it('leaves a missing asset missing', () => {
    expect(assetUrl(null)).toBeNull();
  });

  it('resolves both delivered heroes through the host layer', () => {
    for (const id of ['keloglan', 'nasreddin-hoca'] as const) {
      const hero = heroById(id);
      expect(isDelivered(hero), id).toBe(true);
      expect(heroModelUrl(hero), id).toBe(hero.modelUrl);
    }
  });

  it('keeps the repository path as the record of what was delivered', () => {
    // The registry stores paths, not hosts, so moving the CDN never rewrites
    // the delivery audit trail.
    expect(heroById('keloglan').modelUrl?.startsWith('/assets/')).toBe(true);
    expect(heroById('nasreddin-hoca').modelUrl?.startsWith('/assets/')).toBe(true);
  });
});
