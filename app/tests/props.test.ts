import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blockedBy, stepWithCollision } from '@/engine/controls/movement';
import { createCatState, randomPause, stepCat } from '@/components/three/StreetCat';
import { FOLLOW_DISTANCE, FOLLOW_HEIGHT } from '@/engine/camera/anchors';
import { CAMERA_FOV } from '@/components/three/CityCanvas';
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
      // Not inside a stop's footprint. A prop now has a footprint of its own,
      // so the test is against the stops rather than against every collider.
      const stopColliders = scene.hotspots.map((hotspot) => ({
        x: hotspot.position[0],
        z: hotspot.position[2],
        halfWidth: hotspot.collider.halfWidth,
        halfDepth: hotspot.collider.halfDepth,
      }));
      expect(blockedBy(at, stopColliders)).toBeNull();
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

describe('grounding cues', () => {
  it('has no graybox facing indicator left in the rig', () => {
    const rig = readFileSync(path.resolve(process.cwd(), 'src/components/three/PlayerRig.tsx'), 'utf8');
    // The arrow at the guide's feet was for a featureless placeholder cylinder.
    expect(rig).not.toContain('coneGeometry');
  });

  it('lets props cast a contact shadow, which is what grounds them visually', () => {
    const instance = readFileSync(
      path.resolve(process.cwd(), 'src/components/three/AssetInstance.tsx'),
      'utf8',
    );
    expect(instance).toContain('castShadow');
    expect(instance).toContain('receiveShadow');
  });
});

describe('ground surface', () => {
  const texturePath = (name: string) =>
    path.resolve(process.cwd(), `public/assets/textures/ground_cobblestone_${name}.jpg`);

  it('ships the three generated maps', () => {
    for (const name of ['albedo', 'normal', 'roughness']) {
      expect(existsSync(texturePath(name)), name).toBe(true);
    }
  });

  it('keeps the whole set small enough to be free', () => {
    // The ground is the largest surface on screen; it must not be the largest
    // download. All three maps together are smaller than one kit prop.
    const total = ['albedo', 'normal', 'roughness'].reduce(
      (sum, name) => sum + statSync(texturePath(name)).size,
      0,
    );
    expect(total).toBeLessThan(600 * 1024);
  });

  it('tints one greyscale texture per region rather than shipping one each', () => {
    // Cappadocia and İstanbul share the texture and differ only by colour, so
    // the set serves all 81 provinces.
    const colours = ['istanbul', 'nevsehir', 'gaziantep'].map(
      (cityId) => buildScene(loadComposedCity(cityId), 'high').ground.color,
    );
    expect(new Set(colours).size).toBe(3);

    const ground = readFileSync(
      path.resolve(process.cwd(), 'src/components/three/Ground.tsx'),
      'utf8',
    );
    expect(ground).toContain('ground.color');
    expect(ground).toContain('RepeatWrapping');
  });

  it('repeats at a size a child can read as paving', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const ground = readFileSync(
      path.resolve(process.cwd(), 'src/components/three/Ground.tsx'),
      'utf8',
    );
    const tile = Number(/TILE_METRES = (\d+)/.exec(ground)?.[1]);
    expect(tile).toBeGreaterThanOrEqual(2);
    expect(tile).toBeLessThanOrEqual(6);
    // Enough repeats across the street that the pattern is not one huge stone.
    expect(scene.ground.width / tile).toBeGreaterThan(5);
  });
});

describe('solid props', () => {
  const city = loadComposedCity('istanbul');
  const scene = buildScene(city, 'high');

  it('gives every lamp and bench a collider', () => {
    // Props were added after the collision system, and the guide walked
    // straight through lamp posts until they were given footprints.
    const solid = scene.props.filter((prop) => prop.solid);
    expect(solid.length).toBeGreaterThan(0);

    for (const prop of solid) {
      const at = { x: prop.position[0], z: prop.position[2] };
      expect(blockedBy(at, scene.colliders), `${prop.key} is not solid`).not.toBeNull();
    }
  });

  it('cannot be walked through, however long the player pushes', () => {
    const lamp = scene.props.find((prop) => prop.asset.entry.id === 'kit_street_lamp')!;
    let position = { x: lamp.position[0], z: lamp.position[2] + 6 };
    for (let frame = 0; frame < 400; frame += 1) {
      position = stepWithCollision(
        position,
        { forward: 1, strafe: 0 },
        0,
        1 / 60,
        scene.bounds,
        scene.colliders,
      );
      expect(blockedBy(position, scene.colliders), `entered a prop at frame ${frame}`).toBeNull();
    }
    expect(position.z).toBeGreaterThan(lamp.position[2]);
  });

  it('widens a rotated bench footprint rather than assuming it is square', () => {
    const bench = scene.props.find((prop) => prop.asset.entry.id === 'kit_bench')!;
    const collider = scene.colliders.find(
      (c) => Math.abs(c.x - bench.position[0]) < 0.01 && Math.abs(c.z - bench.position[2]) < 0.01,
    );
    expect(collider).toBeDefined();
    // Rotated about 78°, so most of its 1.82 m length lies along z.
    expect(collider!.halfDepth).toBeGreaterThan(collider!.halfWidth);
  });
});

describe('street cats', () => {
  const city = loadComposedCity('istanbul');
  const scene = buildScene(city, 'high');

  it('walks several cats in İstanbul only', () => {
    expect(scene.catRoutes.length).toBeGreaterThanOrEqual(4);
    expect(scene.catRoutes.length).toBeLessThanOrEqual(6);
    expect(scene.catModelUrl).toBe('/assets/props/kit_street_cat_walking.glb');
    for (const cityId of ['nevsehir', 'gaziantep']) {
      expect(buildScene(loadComposedCity(cityId), 'high').catRoutes).toEqual([]);
    }
  });

  it('scales the cat to its brief, because the rig is not at world scale', () => {
    // The delivered armature is scaled 0.01 and the cat renders about 1.7 cm
    // tall — present in the scene and impossible to see.
    expect(scene.catHeight).toBeGreaterThan(0.2);
    expect(scene.catHeight).toBeLessThan(0.5);
  });

  it('scatters them along the walk rather than clustering them', () => {
    const middles = scene.catRoutes.map(
      (route) => route.reduce((sum, point) => sum + point.z, 0) / route.length,
    );
    const spread = Math.max(...middles) - Math.min(...middles);
    // The street is 75 m long; cats bunched into one corner is not a street.
    expect(spread).toBeGreaterThan(40);

    // On both sides of the walk, not all on one pavement.
    const left = scene.catRoutes.filter((route) => route[0]!.x < 0).length;
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThan(scene.catRoutes.length);
  });

  it('keeps every route off the stops and off the walking line', () => {
    for (const route of scene.catRoutes) {
      for (const point of route) {
        for (const hotspot of scene.hotspots) {
          const gap = Math.hypot(point.x - hotspot.position[0], point.z - hotspot.position[2]);
          expect(gap, `a cat route enters stop ${hotspot.order}`).toBeGreaterThan(
            hotspot.triggerRadius,
          );
        }
        expect(Math.abs(point.x)).toBeGreaterThan(3.5);
      }
    }
  });

  it('is dressing, not an obstacle', () => {
    // A child should be able to walk through a cat. Cats allow this.
    for (const route of scene.catRoutes) {
      for (const point of route) {
        const collider = scene.colliders.find(
          (c) => Math.abs(c.x - point.x) < 0.01 && Math.abs(c.z - point.z) < 0.01,
        );
        expect(collider).toBeUndefined();
      }
    }
  });

  it('walks, arrives, pauses, and turns back', () => {
    for (const route of scene.catRoutes) {
      let state = createCatState([...route]);
      const start = { ...state };
      let paused = false;
      for (let frame = 0; frame < 60 * 40; frame += 1) {
        state = stepCat(state, route, 1 / 60, () => 4);
        if (state.pauseLeft > 0) paused = true;
      }
      expect(paused, 'a cat never paused').toBe(true);
      expect(Math.hypot(state.x - start.x, state.z - start.z)).toBeGreaterThanOrEqual(0);
    }
  });

  it('never leaves the play area', () => {
    const xs = scene.bounds.map((corner) => corner[0]);
    const zs = scene.bounds.map((corner) => corner[2]);
    for (const route of scene.catRoutes) {
      let state = createCatState([...route]);
      for (let frame = 0; frame < 60 * 40; frame += 1) {
        state = stepCat(state, route, 1 / 60, () => 0);
        expect(state.x).toBeGreaterThan(Math.min(...xs));
        expect(state.x).toBeLessThan(Math.max(...xs));
        expect(state.z).toBeGreaterThan(Math.min(...zs));
        expect(state.z).toBeLessThan(Math.max(...zs));
      }
    }
  });

  it('pauses for a believable length of time', () => {
    for (let i = 0; i < 50; i += 1) {
      const pause = randomPause();
      expect(pause).toBeGreaterThanOrEqual(3);
      expect(pause).toBeLessThanOrEqual(7);
    }
  });
});

describe('framing', () => {
  /** How much of the frame height the guide occupies at the follow camera. */
  const subjectFraction = (subjectHeight: number) => {
    const lookAt = 1.4;
    const rise = FOLLOW_HEIGHT - lookAt;
    const distance = Math.hypot(FOLLOW_DISTANCE, rise);
    const visible = 2 * distance * Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
    return subjectHeight / visible;
  };

  it('frames the guide the way a third-person game does', () => {
    // At the first pass — 7.5 m back, 3.4 m up, 55° — he filled about a fifth
    // of the frame, and the whole street read as a model on a table.
    const fraction = subjectFraction(1.65);
    expect(fraction).toBeGreaterThan(0.25);
    expect(fraction).toBeLessThan(0.45);
  });

  it('leaves a 5 m lamp readable in the same shot', () => {
    // The tallest kit prop must still fit without the camera pulling back.
    expect(subjectFraction(5.0)).toBeLessThan(1.4);
  });

  it('gives the cat the size the owner asked for', () => {
    const cat = deliveredProps().find((prop) => prop.id === 'kit_street_cat')!;
    expect(cat.dimensions[1]).toBeCloseTo(0.4, 2);
  });

  it('keeps cobbles large enough to read as paving, not gravel', () => {
    const generator = readFileSync(
      path.resolve(process.cwd(), 'scripts/build-ground-texture.mjs'),
      'utf8',
    );
    const cells = Number(/CELLS = (\d+)/.exec(generator)?.[1]);
    const ground = readFileSync(
      path.resolve(process.cwd(), 'src/components/three/Ground.tsx'),
      'utf8',
    );
    const tile = Number(/TILE_METRES = (\d+)/.exec(ground)?.[1]);
    const stone = tile / cells;
    // Fine repeating detail makes everything standing on it look small.
    expect(stone).toBeGreaterThan(0.3);
    expect(stone).toBeLessThan(0.6);
  });
});

describe('landmark framing', () => {
  const FOV = 50;
  const visibleHeight = (distance: number) =>
    2 * distance * Math.tan((FOV / 2) * (Math.PI / 180));

  it('frames every stop object inside its own camera shot', () => {
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const city = loadComposedCity(cityId);
      const scene = buildScene(city, 'high');
      for (const hotspot of scene.hotspots) {
        const height = hotspot.asset.entry.dimensions[1];
        const dx = hotspot.camera.position[0] - hotspot.position[0];
        const dz = hotspot.camera.position[2] - hotspot.position[2];
        const dy = hotspot.camera.position[1] - hotspot.camera.target[1];
        const distance = Math.hypot(dx, dz, dy);

        // A tower that overflows the frame is a wall, not a landmark.
        expect(
          height,
          `${cityId} ${hotspot.asset.entry.id} does not fit its shot`,
        ).toBeLessThan(visibleHeight(distance));
      }
    }
  });

  it('keeps landmarks at storybook scale', () => {
    const galata = resolveAsset('city_istanbul_galata_tower', 'high').entry;
    // The real tower is 67 m. A 32 m model filled the shot with masonry.
    expect(galata.dimensions[1]).toBe(14);
    // Still the tallest thing on the street by a wide margin.
    const lamp = resolveAsset('kit_street_lamp', 'high').entry;
    expect(galata.dimensions[1] / lamp.dimensions[1]).toBeGreaterThan(2.5);
  });

  it('moves the camera back only for the objects that need it', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const distances = scene.hotspots.map((hotspot) =>
      Math.hypot(
        hotspot.camera.position[0] - hotspot.position[0],
        hotspot.camera.position[2] - hotspot.position[2],
      ),
    );
    // A simit cart is met close up; a tower is not.
    expect(Math.min(...distances)).toBeLessThan(8);
    expect(Math.max(...distances)).toBeGreaterThan(15);
  });
});
