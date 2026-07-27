import { describe, expect, it } from 'vitest';
import { loadComposedCity } from './helpers';
import { clampToBounds, isInsideBounds, stepPosition } from '@/engine/controls/movement';
import { advanceGuided, createGuidedState, guidedPauseHotspot } from '@/engine/controls/guided';
import { buildScene } from '@/engine/scene/buildScene';
import { resolveAsset } from '@/engine/assets/registry';

const city = loadComposedCity('istanbul');
const bounds = city.route.bounds;

describe('movement bounds', () => {
  it('accepts the authored spawn point', () => {
    expect(isInsideBounds({ x: city.spawn.position[0], z: city.spawn.position[2] }, bounds)).toBe(true);
  });

  it('rejects a point far outside the play area', () => {
    expect(isInsideBounds({ x: 500, z: 500 }, bounds)).toBe(false);
  });

  it('keeps the player inside when they walk at a wall', () => {
    const from = { x: 0, z: 8 };
    const clamped = clampToBounds(from, { x: 0, z: 900 }, bounds);
    expect(isInsideBounds(clamped, bounds)).toBe(true);
  });

  it('never leaves the bounds however long the player pushes forward', () => {
    let position = { x: city.spawn.position[0], z: city.spawn.position[2] };
    for (let frame = 0; frame < 600; frame += 1) {
      position = stepPosition(position, { forward: 1, strafe: 0.4 }, 0.9, 1 / 60, bounds);
      expect(isInsideBounds(position, bounds)).toBe(true);
    }
  });
});

describe('guided route follower', () => {
  it('reaches the end of the authored route', () => {
    let state = createGuidedState(city.route.points);
    for (let frame = 0; frame < 3000 && !state.finished; frame += 1) {
      state = advanceGuided(state, city.route.points, 1 / 60, false);
    }
    expect(state.finished).toBe(true);
    const last = city.route.points[city.route.points.length - 1]!;
    expect(Math.hypot(state.position.x - last[0], state.position.z - last[2])).toBeLessThan(0.5);
  });

  it('holds still while a panel is open', () => {
    const state = createGuidedState(city.route.points);
    const paused = advanceGuided(state, city.route.points, 1 / 60, true);
    expect(paused).toEqual(state);
  });

  it('stays inside the play area for the whole route', () => {
    let state = createGuidedState(city.route.points);
    for (let frame = 0; frame < 3000 && !state.finished; frame += 1) {
      state = advanceGuided(state, city.route.points, 1 / 60, false);
      expect(isInsideBounds(state.position, bounds)).toBe(true);
    }
  });
});

describe('scene building', () => {
  it('orders hotspots and resolves every asset without throwing', () => {
    const scene = buildScene(city, 'medium');
    // İstanbul carries five stops in the prototype; order is 1..n, contiguous.
    expect(scene.hotspots.map((hotspot) => hotspot.order)).toEqual(
      city.hotspots.map((_, index) => index + 1),
    );
    expect(scene.unknownAssetIds).toEqual([]);
    expect(scene.hotspots.every((hotspot) => hotspot.asset.isPlaceholder)).toBe(true);
  });

  it('returns a diagnostic placeholder for an unknown asset id', () => {
    const resolved = resolveAsset('city_atlantis_lighthouse', 'high');
    expect(resolved.isUnknown).toBe(true);
    expect(resolved.modelUrl).toBeNull();
    expect(resolved.entry.label).toContain('city_atlantis_lighthouse');
  });
});

describe('guided mode stop behaviour', () => {
  const stops = city.hotspots.map((hotspot) => ({
    id: hotspot.id,
    position: { x: hotspot.transform.position[0], z: hotspot.transform.position[2] },
    triggerRadius: hotspot.triggerRadius,
    order: hotspot.order,
  }));
  const firstStop = stops[0]!;

  it('halts when it reaches an unfinished stop', () => {
    expect(guidedPauseHotspot(firstStop.position, stops, [])).toBe(firstStop.id);
  });

  it('stays halted while the interaction is unresolved', () => {
    let state = createGuidedState(city.route.points);
    let paused = false;
    for (let frame = 0; frame < 900; frame += 1) {
      const blocked = guidedPauseHotspot(state.position, stops, []);
      if (blocked) paused = true;
      state = advanceGuided(state, city.route.points, 1 / 60, blocked !== null);
    }
    expect(paused).toBe(true);
    // It never reached the end of the route because the first stop held it.
    expect(state.finished).toBe(false);
  });

  it('resumes once the stop is completed', () => {
    expect(guidedPauseHotspot(firstStop.position, stops, [firstStop.id])).toBeNull();
  });

  it('does not halt again at a completed stop', () => {
    const completed = stops.map((stop) => stop.id);
    let state = createGuidedState(city.route.points);
    for (let frame = 0; frame < 3000 && !state.finished; frame += 1) {
      expect(guidedPauseHotspot(state.position, stops, completed)).toBeNull();
      state = advanceGuided(state, city.route.points, 1 / 60, false);
    }
    expect(state.finished).toBe(true);
  });

  it('walks the whole route when every stop is done', () => {
    const completed = stops.map((stop) => stop.id);
    let state = createGuidedState(city.route.points);
    for (let frame = 0; frame < 3000 && !state.finished; frame += 1) {
      const blocked = guidedPauseHotspot(state.position, stops, completed);
      state = advanceGuided(state, city.route.points, 1 / 60, blocked !== null);
    }
    expect(state.finished).toBe(true);
  });
});
