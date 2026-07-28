import { describe, expect, it } from 'vitest';
import { blockedBy } from '@/engine/controls/movement';
import { deliveredProps, resolveAsset, trustsModelScale } from '@/engine/assets/registry';
import { buildScene } from '@/engine/scene/buildScene';
import { loadComposedCity } from './helpers';

/**
 * First delivered reusable prop. The point of these tests is that a prop is
 * dressing: it must not stand in the player's way, must not be mistaken for a
 * stop, and must not silently fail to load.
 */
describe('street kit props', () => {
  const city = loadComposedCity('istanbul');
  const scene = buildScene(city, 'high');

  it('is registered as a delivered model, not a placeholder', () => {
    const asset = resolveAsset('kit_street_lamp', 'high');
    expect(asset.isUnknown).toBe(false);
    expect(asset.isPlaceholder).toBe(false);
    expect(asset.modelUrl).toBe('/assets/props/kit_street_lamp.glb');
    expect(asset.entry.dimensions[1]).toBe(5);
  });

  it('places a handful of test instances, not set dressing', () => {
    expect(scene.props.length).toBeGreaterThanOrEqual(5);
    expect(scene.props.length).toBeLessThanOrEqual(8);
    // Only kit props are placed; nothing city-specific has been dressed in yet.
    const kinds = new Set(scene.props.map((prop) => prop.asset.entry.id));
    expect([...kinds].sort()).toEqual(['kit_bench', 'kit_street_lamp']);
  });

  it('stands every prop on the ground plane', () => {
    for (const prop of scene.props) {
      expect(prop.position[1]).toBe(0);
    }
  });

  it('keeps props out of the walking line and off the stops', () => {
    for (const prop of scene.props) {
      const at = { x: prop.position[0], z: prop.position[2] };
      // Not inside a building.
      expect(blockedBy(at, scene.colliders)).toBeNull();
      // Not standing in a trigger ring, where it would clutter the moment a
      // stop opens.
      for (const hotspot of scene.hotspots) {
        const distance = Math.hypot(at.x - hotspot.position[0], at.z - hotspot.position[2]);
        expect(distance, `lamp at ${at.x},${at.z} sits in stop ${hotspot.order}`).toBeGreaterThan(
          hotspot.triggerRadius,
        );
      }
    }
  });

  it('keeps props inside the play area so they are visible from the path', () => {
    const xs = scene.bounds.map((corner) => corner[0]);
    const zs = scene.bounds.map((corner) => corner[2]);
    for (const prop of scene.props) {
      expect(prop.position[0]).toBeGreaterThan(Math.min(...xs));
      expect(prop.position[0]).toBeLessThan(Math.max(...xs));
      expect(prop.position[2]).toBeGreaterThan(Math.min(...zs));
      expect(prop.position[2]).toBeLessThan(Math.max(...zs));
    }
  });

  it('reports no unknown assets once props are added', () => {
    expect(scene.unknownAssetIds).toEqual([]);
  });

  it('leaves the other cities undressed, since this is a single-city test', () => {
    for (const cityId of ['nevsehir', 'gaziantep']) {
      expect(buildScene(loadComposedCity(cityId), 'high').props).toEqual([]);
    }
  });
});

describe('optimised street kit', () => {
  const lamp = deliveredProps().find((p) => p.id === 'kit_street_lamp')!;
  const bench = deliveredProps().find((p) => p.id === 'kit_bench')!;

  it('records the lamp at its re-authored five metres, not its old three', () => {
    expect(lamp.dimensions).toEqual([1.25, 5.0, 1.1]);
    expect(lamp.triangles).toBe(1_834);
    expect(lamp.transferBytes).toBe(1_371_280);
  });

  it('records the bench at its delivered size', () => {
    expect(bench.dimensions).toEqual([1.82, 0.9, 0.7]);
    expect(bench.triangles).toBe(1_586);
    expect(bench.transferBytes).toBe(980_160);
  });

  it('keeps every kit prop under two megabytes', () => {
    // The first lamp was 8.36 MB for 1,834 triangles. Six props at that size
    // would have added 50 MB to the repository.
    for (const prop of deliveredProps()) {
      expect(prop.transferBytes, prop.id).toBeLessThan(2 * 1024 * 1024);
    }
  });

  it("trusts a delivered prop own scale instead of normalising it", () => {
    const lampEntry = resolveAsset('kit_street_lamp', 'high').entry;
    const benchEntry = resolveAsset('kit_bench', 'high').entry;
    expect(trustsModelScale(lampEntry)).toBe(true);
    expect(trustsModelScale(benchEntry)).toBe(true);
    // Normalising these towards anything in common would flatten the very
    // difference that makes a street read as a street.
    expect(lampEntry.dimensions[1] / benchEntry.dimensions[1]).toBeGreaterThan(5);
    // Commissioned city art is still normalised against its brief.
    expect(trustsModelScale(resolveAsset('city_istanbul_galata_tower', 'high').entry)).toBe(false);
  });

  it('places three to five lamps and two to three benches', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const lamps = scene.props.filter((p) => p.asset.entry.id === 'kit_street_lamp');
    const benches = scene.props.filter((p) => p.asset.entry.id === 'kit_bench');
    expect(lamps.length).toBeGreaterThanOrEqual(3);
    expect(lamps.length).toBeLessThanOrEqual(5);
    expect(benches.length).toBeGreaterThanOrEqual(2);
    expect(benches.length).toBeLessThanOrEqual(3);
  });

  it('varies angle and spacing, so the street does not read as a fence', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const rotations = scene.props.map((p) => Math.abs(p.rotationY));
    expect(new Set(rotations).size).toBe(rotations.length);

    const gaps = scene.props
      .map((p) => p.position[2])
      .sort((a, b) => b - a)
      .slice(1)
      .map((z, index) => Math.abs(z - scene.props.map((p) => p.position[2]).sort((a, b) => b - a)[index]!));
    expect(new Set(gaps.map((g) => Math.round(g))).size).toBeGreaterThan(1);
  });

  it('leaves the walking line clear', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    for (const prop of scene.props) {
      // Route points run near x = 0; a prop on the centreline is an obstacle.
      expect(Math.abs(prop.position[0]), prop.key).toBeGreaterThan(3.5);
    }
  });
});
