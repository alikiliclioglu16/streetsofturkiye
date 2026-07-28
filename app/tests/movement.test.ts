import { describe, expect, it } from 'vitest';
import { loadComposedCity } from './helpers';
import {
  blockedBy,
  clampToBounds,
  isInsideBounds,
  RUN_SPEED,
  stepPosition,
  stepWithCollision,
} from '@/engine/controls/movement';
import { clipForState } from '@/engine/heroes/animation';
import { decayOrbit, followCameraPosition } from '@/engine/camera/anchors';
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


describe('scene building', () => {
  it('orders hotspots and resolves every asset without throwing', () => {
    const scene = buildScene(city, 'medium');
    // İstanbul carries five stops in the prototype; order is 1..n, contiguous.
    expect(scene.hotspots.map((hotspot) => hotspot.order)).toEqual(
      city.hotspots.map((_, index) => index + 1),
    );
    expect(scene.unknownAssetIds).toEqual([]);
    // Stops with a delivered model render it; the rest still fall back to a
    // placeholder, and neither path throws.
    const delivered = scene.hotspots.filter((hotspot) => !hotspot.asset.isPlaceholder);
    expect(delivered.map((hotspot) => hotspot.asset.entry.id)).toContain(
      'city_istanbul_simit_cart',
    );
    for (const hotspot of scene.hotspots) {
      expect(hotspot.asset.isUnknown, hotspot.asset.entry.id).toBe(false);
    }
  });

  it('returns a diagnostic placeholder for an unknown asset id', () => {
    const resolved = resolveAsset('city_atlantis_lighthouse', 'high');
    expect(resolved.isUnknown).toBe(true);
    expect(resolved.modelUrl).toBeNull();
    expect(resolved.entry.label).toContain('city_atlantis_lighthouse');
  });
});



describe('solid objects', () => {
  const scene = loadComposedCity('istanbul');
  const colliders = scene.hotspots.map((hotspot) => ({
    x: hotspot.transform.position[0],
    z: hotspot.transform.position[2],
    halfWidth: hotspot.collider.halfWidth,
    halfDepth: hotspot.collider.halfDepth,
  }));

  it('gives every stop a footprint', () => {
    for (const hotspot of scene.hotspots) {
      expect(hotspot.collider.halfWidth, `${hotspot.id} width`).toBeGreaterThan(0);
      expect(hotspot.collider.halfDepth, `${hotspot.id} depth`).toBeGreaterThan(0);
    }
  });

  it('refuses to place the player inside an object', () => {
    for (const collider of colliders) {
      expect(blockedBy({ x: collider.x, z: collider.z }, colliders)).not.toBeNull();
    }
  });

  it('cannot be walked through, however long the player pushes', () => {
    // Aim straight at Galata Tower and hold forward, from the nearest point on
    // that line that is clear of everything else. The mosque at the top of the
    // street is broad enough to contain a naive starting point.
    const galata = colliders[1]!;
    let position = { x: galata.x, z: galata.z + 14 };
    while (blockedBy(position, colliders) !== null && position.z > galata.z + 5) {
      position = { x: position.x, z: position.z - 0.5 };
    }
    expect(blockedBy(position, colliders), 'no clear approach to the tower').toBeNull();
    for (let frame = 0; frame < 600; frame += 1) {
      position = stepWithCollision(position, { forward: 1, strafe: 0 }, 0, 1 / 60, scene.route.bounds, colliders);
      expect(blockedBy(position, colliders), `entered a solid object at frame ${frame}`).toBeNull();
    }
    // Stopped in front of it rather than passing through.
    expect(position.z).toBeGreaterThan(galata.z);
  });

  it('slides along a wall instead of sticking to it', () => {
    const galata = colliders[1]!;
    const start = { x: galata.x, z: galata.z + galata.halfDepth + 0.6 };
    // Pushing diagonally into the face should still make lateral progress.
    let position = start;
    for (let frame = 0; frame < 120; frame += 1) {
      position = stepWithCollision(
        position,
        { forward: 1, strafe: 1 },
        0,
        1 / 60,
        scene.route.bounds,
        colliders,
      );
    }
    expect(Math.abs(position.x - start.x)).toBeGreaterThan(1);
    expect(blockedBy(position, colliders)).toBeNull();
  });

  it('keeps every guided waypoint outside the objects', () => {
    for (const point of scene.route.points) {
      expect(blockedBy({ x: point[0], z: point[2] }, colliders), `waypoint ${point}`).toBeNull();
    }
  });

  it('leaves room to stand inside every trigger ring', () => {
    for (const hotspot of scene.hotspots) {
      const reach = Math.max(hotspot.collider.halfWidth, hotspot.collider.halfDepth);
      expect(hotspot.triggerRadius, hotspot.id).toBeGreaterThan(reach);
    }
  });

  it('never lets two trigger rings claim the same ground', () => {
    for (let i = 0; i < scene.hotspots.length; i += 1) {
      for (let j = i + 1; j < scene.hotspots.length; j += 1) {
        const a = scene.hotspots[i]!;
        const b = scene.hotspots[j]!;
        const gap = Math.hypot(
          a.transform.position[0] - b.transform.position[0],
          a.transform.position[2] - b.transform.position[2],
        );
        expect(gap, `${a.id} / ${b.id}`).toBeGreaterThanOrEqual(a.triggerRadius + b.triggerRadius);
      }
    }
  });
});

describe('route markers', () => {
  /**
   * The route is no longer walked automatically — guided mode is gone — but the
   * markers on the ground are how a child knows where to go next. Every stop
   * must still sit on that path, or the markers lead nowhere.
   */
  it('leads past every stop', () => {
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const scene = loadComposedCity(cityId);
      for (const hotspot of scene.hotspots) {
        const target = {
          x: hotspot.transform.position[0],
          z: hotspot.transform.position[2],
        };
        let closest = Infinity;
        const points = scene.route.points;
        for (let i = 0; i < points.length - 1; i += 1) {
          const a = points[i]!;
          const b = points[i + 1]!;
          const dx = b[0] - a[0];
          const dz = b[2] - a[2];
          const lengthSq = dx * dx + dz * dz;
          const t =
            lengthSq === 0
              ? 0
              : Math.max(0, Math.min(1, ((target.x - a[0]) * dx + (target.z - a[2]) * dz) / lengthSq));
          closest = Math.min(closest, Math.hypot(a[0] + t * dx - target.x, a[2] + t * dz - target.z));
        }
        expect(closest, `${cityId} stop ${hotspot.order}`).toBeLessThanOrEqual(hotspot.triggerRadius);
      }
    }
  });
});

describe('controls', () => {
  it('sends the right key to the player\'s right', () => {
    // Looking along +z with +y up, the player's right is -x. A right-strafe
    // input must therefore decrease x. This was inverted on the first build.
    const bounds = loadComposedCity('istanbul').route.bounds;
    const from = { x: 0, z: 0 };
    const right = stepPosition(from, { forward: 0, strafe: -1 }, 0, 1 / 60, bounds);
    expect(right.x).toBeLessThan(from.x);
    const left = stepPosition(from, { forward: 0, strafe: 1 }, 0, 1 / 60, bounds);
    expect(left.x).toBeGreaterThan(from.x);
  });

  it('runs faster than it walks, by enough for the run clip to play', () => {
    const scene = loadComposedCity('istanbul');
    const colliders = scene.hotspots.map((hotspot) => ({
      x: hotspot.transform.position[0],
      z: hotspot.transform.position[2],
      halfWidth: hotspot.collider.halfWidth,
      halfDepth: hotspot.collider.halfDepth,
    }));
    const start = { x: scene.spawn.position[0], z: scene.spawn.position[2] };
    const walked = stepWithCollision(start, { forward: 1, strafe: 0 }, 0, 1 / 60, scene.route.bounds, colliders, false);
    const ran = stepWithCollision(start, { forward: 1, strafe: 0 }, 0, 1 / 60, scene.route.bounds, colliders, true);
    const walkDistance = Math.hypot(walked.x - start.x, walked.z - start.z) * 60;
    const runDistance = Math.hypot(ran.x - start.x, ran.z - start.z) * 60;

    expect(runDistance).toBeGreaterThan(walkDistance);
    expect(runDistance).toBeGreaterThan(RUN_SPEED - 0.1);
    // The run clip threshold has to sit between the two, or it never plays.
    expect(clipForState({ speed: walkDistance, interacting: false, performing: null })).toBe('walk');
    expect(clipForState({ speed: runDistance, interacting: false, performing: null })).toBe('run');
  });

});

describe('camera orbit', () => {
  it('lets the camera swing round without turning the guide', () => {
    // Dragging changes only the offset; the guide's heading is untouched.
    const heading = 1.2;
    const offset = Math.PI;
    const front = followCameraPosition(0, 0, heading + offset, 0);
    const behind = followCameraPosition(0, 0, heading, 0);
    // Opposite sides of him, so his face becomes reachable.
    expect(Math.hypot(front[0] - behind[0], front[2] - behind[2])).toBeGreaterThan(10);
  });

  it('recentres behind him only while he walks', () => {
    // Standing still, a chosen angle is kept.
    expect(decayOrbit(1.5, false, 1)).toBe(1.5);
    // Walking, it eases back to centre rather than snapping.
    const once = decayOrbit(1.5, true, 1);
    expect(once).toBeLessThan(1.5);
    expect(once).toBeGreaterThan(0);

    let offset = 1.5;
    for (let i = 0; i < 60; i += 1) offset = decayOrbit(offset, true, 1 / 6);
    expect(Math.abs(offset)).toBeLessThan(0.05);
  });
});
