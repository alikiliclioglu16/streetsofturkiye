import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blockedBy, stepWithCollision } from '@/engine/controls/movement';
import { createCatState, randomPause, stepCat } from '@/components/three/StreetCat';
import { FOLLOW_DISTANCE, FOLLOW_HEIGHT } from '@/engine/camera/anchors';
import { FEATURED_NPCS, isApprovedClip, npcById } from '@/engine/npc/registry';
import { SWAY_RADIANS, heightFactor, sway } from '@/engine/environment/wind';
import { initialTramState, stepTram } from '@/components/three/Tram';
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
    expect(scene.props.length).toBeGreaterThanOrEqual(14);
    expect(scene.props.length).toBeLessThanOrEqual(24);

    // Mostly shared kit, plus a few pieces only İstanbul would have: a red tram
    // and a stone dock belong to this city and to no other.
    const kinds = [...new Set(scene.props.map((prop) => prop.asset.entry.id))].sort();
    expect(kinds.filter((id) => id.startsWith('kit_')).length).toBeGreaterThanOrEqual(5);
    expect(kinds).toContain('city_istanbul_stone_dock');
    // The tram is no longer a prop: it runs its own line.
    expect(kinds).not.toContain('city_istanbul_streetcar');
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

  it('dresses every city from the shared kit, and only İstanbul from its own', () => {
    /**
     * Dressing is derived from the walk, so a city that has never been touched
     * by hand still gets a street. Anything city-specific stays city-specific:
     * a Beyoğlu tram does not turn up in Nevşehir.
     */
    for (const cityId of ['nevsehir', 'gaziantep']) {
      const ids = buildScene(loadComposedCity(cityId), 'high').props.map(
        (prop) => prop.asset.entry.id,
      );
      expect(ids.length, cityId).toBeGreaterThan(5);
      expect(ids.every((id) => id.startsWith('kit_')), cityId).toBe(true);
      expect(ids, cityId).toContain('kit_turkish_flag');
    }

    const istanbul = buildScene(loadComposedCity('istanbul'), 'high').props.map(
      (prop) => prop.asset.entry.id,
    );
    expect(istanbul.some((id) => id.startsWith('city_istanbul_'))).toBe(true);
  });

  it('puts the flag at the same place in every city', () => {
    const positions = ['istanbul', 'nevsehir', 'gaziantep'].map((cityId) => {
      const flag = buildScene(loadComposedCity(cityId), 'high').props.find(
        (prop) => prop.asset.entry.id === 'kit_turkish_flag',
      )!;
      return flag.position.join(',');
    });
    expect(new Set(positions).size).toBe(1);
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

  it('keeps every shared kit prop under two megabytes', () => {
    // The first lamp was 8.36 MB for 1,834 triangles. Six props at that size
    // would have added 50 MB for objects a child walks past.
    //
    // The rule is about repetition, not about size in itself: a `kit_` prop
    // ships to all 81 provinces, so its cost is paid 81 times over. A city
    // landmark appears once and is budgeted separately.
    for (const prop of deliveredProps().filter((entry) => entry.id.startsWith('kit_'))) {
      expect(prop.transferBytes, prop.id).toBeLessThan(2 * 1024 * 1024);
    }
  });

  it('keeps a one-off city landmark within a landmark budget', () => {
    for (const prop of deliveredProps().filter((entry) => entry.id.startsWith('city_'))) {
      expect(prop.transferBytes, prop.id).toBeLessThan(4 * 1024 * 1024);
    }
  });

  it("trusts a delivered prop own scale instead of normalising it", () => {
    const lampEntry = resolveAsset('kit_street_lamp', 'high').entry;
    const benchEntry = resolveAsset('kit_bench', 'high').entry;
    expect(trustsModelScale(lampEntry)).toBe(true);
    expect(trustsModelScale(benchEntry)).toBe(true);
    // Neither is scaled to a brief; both are authored at the size they mean.
    expect(lampEntry.scaleToBrief).toBe(false);
    expect(benchEntry.scaleToBrief).toBe(false);
    // Normalising these towards anything in common would flatten the very
    // difference that makes a street read as a street.
    expect(lampEntry.dimensions[1] / benchEntry.dimensions[1]).toBeGreaterThan(5);
    // Galata is commissioned art that has since been delivered; it keeps the
    // manifest row it was briefed against.
    const galata = resolveAsset('city_istanbul_galata_tower', 'high').entry;
    expect(galata.manifest.tier).toBe('hero');
    expect(galata.manifest.status).toBe('delivered');
  });

  it('scales the kit to the length of the walk, in every city', () => {
    /**
     * The counts come from the street rather than from a list, so a longer
     * walk gets more lamps and a shorter one fewer — and a placement that lands
     * inside a trigger ring is dropped, which is why these are ranges.
     */
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const props = buildScene(loadComposedCity(cityId), 'high').props;
      const lamps = props.filter((p) => p.asset.entry.id === 'kit_street_lamp');
      expect(lamps.length, `${cityId} lamps`).toBeGreaterThanOrEqual(3);
      expect(lamps.length, `${cityId} lamps`).toBeLessThanOrEqual(8);
      expect(props.filter((p) => p.asset.entry.id === 'kit_market_stall').length).toBeGreaterThan(0);
    }
  });

  it('varies angle and spacing, so the street does not read as a fence', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const rotations = scene.props.map((p) => Math.abs(p.rotationY));
    // Near-unique angles: a handful of pieces may coincide, a row may not.
    expect(new Set(rotations).size).toBeGreaterThan(rotations.length * 0.7);

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
      // The route runs from the spawn towards the quay near x = 0, so a prop on
      // that centreline is an obstacle. The square behind the child is not on
      // the route, and the mosque closes it head-on.
      if (prop.position[2] > 10) continue;
      expect(Math.abs(prop.position[0]), prop.key).toBeGreaterThan(3.5);
    }
  });

  it('never puts a prop on the route itself', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    for (const prop of scene.props) {
      let closest = Infinity;
      const points = scene.routePoints;
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i]!;
        const b = points[i + 1]!;
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        const lengthSq = dx * dx + dz * dz;
        const t =
          lengthSq === 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  ((prop.position[0] - a[0]) * dx + (prop.position[2] - a[2]) * dz) / lengthSq,
                ),
              );
        closest = Math.min(
          closest,
          Math.hypot(a[0] + t * dx - prop.position[0], a[2] + t * dz - prop.position[2]),
        );
      }
      // Measured against the walk itself rather than against x = 0, which is
      // what lets the square behind the child be dressed at all.
      expect(closest, prop.key).toBeGreaterThan(2.5);
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
    // Walk at a lamp from the nearest point on that line that is clear.
    const lamp = scene.props.find((prop) => prop.asset.entry.id === 'kit_street_lamp')!;
    let position = { x: lamp.position[0], z: lamp.position[2] + 4 };
    while (blockedBy(position, scene.colliders) !== null && position.z > lamp.position[2] + 1.5) {
      position = { x: position.x, z: position.z - 0.25 };
    }
    expect(blockedBy(position, scene.colliders), 'no clear approach to the lamp').toBeNull();
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

  it('widens a rotated footprint rather than assuming it is square', () => {
    // Benches are placed where the walk allows, so this reads whatever long
    // thin prop the street actually has.
    const bench =
      scene.props.find((prop) => prop.asset.entry.id === 'kit_bench') ??
      scene.props.find((prop) => prop.asset.entry.id === 'kit_market_stall')!;
    const collider = scene.colliders.find(
      (c) => Math.abs(c.x - bench.position[0]) < 0.01 && Math.abs(c.z - bench.position[2]) < 0.01,
    );
    expect(collider).toBeDefined();
    const [width, , depth] = bench.asset.entry.dimensions;
    // Rotated roughly a quarter turn, so its length lies along z.
    expect(collider!.halfDepth).toBeGreaterThan(Math.min(width, depth) / 2);
  });
});

describe('street cats', () => {
  const city = loadComposedCity('istanbul');
  const scene = buildScene(city, 'high');

  it('walks cats in every city, not only İstanbul', () => {
    // Street cats are not an İstanbul feature; they are a Turkish street.
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const city = buildScene(loadComposedCity(cityId), 'high');
      expect(city.catRoutes.length, cityId).toBeGreaterThanOrEqual(3);
      expect(city.catRoutes.length, cityId).toBeLessThanOrEqual(6);
      expect(city.catModelUrl, cityId).toBe('/assets/props/kit_street_cat_walking.glb');
    }
  });

  it('scales the cat to its brief, because the rig is not at world scale', () => {
    // The delivered armature is scaled 0.01 and the cat renders about 1.7 cm
    // tall — present in the scene and impossible to see.
    expect(scene.catHeight).toBeGreaterThan(0.2);
    expect(scene.catHeight).toBeLessThan(0.8);
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
    // Raised by half again: the people the street was shown to could not find
    // the cats at 40 cm.
    expect(cat.dimensions[1]).toBeCloseTo(0.6, 2);
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

describe('featured NPCs', () => {
  const scene = buildScene(loadComposedCity('istanbul'), 'high');

  it('places one of each, in every city, walking a short beat', () => {
    for (const cityId of ['istanbul', 'nevsehir']) {
      const scene = buildScene(loadComposedCity(cityId), 'high');
      const ids = scene.npcs.map((entry) => entry.npc.id).sort();
      expect(ids, cityId).toEqual([
        'featured_craftsman_male',
        'featured_soldier',
        'featured_traveler',
      ]);

      for (const npc of scene.npcs) {
        // A person rooted to one spot for a whole visit reads as a statue.
        expect(npc.walkTo, `${cityId} ${npc.npc.id}`).not.toBeNull();
        const beat = Math.hypot(
          npc.walkTo![0] - npc.position[0],
          npc.walkTo![2] - npc.position[2],
        );
        expect(beat).toBeGreaterThan(1);
        expect(beat).toBeLessThan(12);

        // Off the walk, whatever way the stops zig-zag.
        expect(Math.abs(npc.position[0]), `${cityId} ${npc.npc.id} on the walk`).toBeGreaterThan(4);
      }
    }
  });

  it('blocks every combat clip at the file, not only in code', () => {
    const soldier = npcById('featured_soldier')!;
    for (const banned of ['Attack', 'Spartan_Kick', 'Sword_Shout', 'Axe_Spin_Attack']) {
      expect(isApprovedClip(soldier, banned), banned).toBe(false);
    }
    // And the two the manifest approved but we still declined to use.
    expect(isApprovedClip(soldier, 'Axe_Breathe_and_Look_Around')).toBe(false);
    expect(isApprovedClip(soldier, 'Combat_Idle_Turn_Left')).toBe(false);
    expect(Object.keys(soldier.excludedClips).length).toBeGreaterThan(0);
  });

  it('gives every NPC at least one standing clip', () => {
    for (const entry of scene.npcs) {
      const standing = entry.npc.clips.filter((clip) => clip !== 'Walking' && clip !== 'Running');
      expect(standing.length, entry.npc.id).toBeGreaterThan(0);
    }
  });

  it('stands them beside their stop, never on the walking line', () => {
    const points = scene.routePoints;
    for (const entry of scene.npcs) {
      let closest = Infinity;
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i]!;
        const b = points[i + 1]!;
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        const lengthSq = dx * dx + dz * dz;
        const t =
          lengthSq === 0
            ? 0
            : Math.max(0, Math.min(1, ((entry.position[0] - a[0]) * dx + (entry.position[2] - a[2]) * dz) / lengthSq));
        closest = Math.min(
          closest,
          Math.hypot(a[0] + t * dx - entry.position[0], a[2] + t * dz - entry.position[2]),
        );
      }
      expect(closest, `${entry.npc.id} stands on the walk`).toBeGreaterThan(2.5);

      // Still close enough to read as belonging to a stop.
      const nearest = Math.min(
        ...scene.hotspots.map((hotspot) =>
          Math.hypot(entry.position[0] - hotspot.position[0], entry.position[2] - hotspot.position[2]),
        ),
      );
      expect(nearest, `${entry.npc.id} belongs nowhere`).toBeLessThan(9);
    }
  });

  it('keeps every NPC file under four megabytes', () => {
    for (const npc of FEATURED_NPCS) {
      expect(npc.transferBytes, npc.id).toBeLessThan(4 * 1024 * 1024);
    }
  });
});

describe('street trees', () => {
  const scene = buildScene(loadComposedCity('istanbul'), 'high');

  it('scatters a mix of shapes, not one repeated shape', () => {
    expect(scene.trees.length).toBeGreaterThan(10);
    const kinds = new Set(scene.trees.map((tree) => tree.kind));
    expect(kinds.size).toBeGreaterThan(1);
    const scales = new Set(scene.trees.map((tree) => tree.scale));
    expect(scales.size).toBeGreaterThan(2);
  });

  it('plants them off the walk and clear of the stops', () => {
    for (const tree of scene.trees) {
      expect(Math.abs(tree.position[0])).toBeGreaterThan(8);
      for (const hotspot of scene.hotspots) {
        const gap = Math.hypot(
          tree.position[0] - hotspot.position[0],
          tree.position[2] - hotspot.position[2],
        );
        expect(gap, `a tree grows inside stop ${hotspot.order}`).toBeGreaterThan(
          hotspot.triggerRadius,
        );
      }
    }
  });

  it('plants every city, and plants each one like itself', () => {
    const kindsFor = (cityId: string) =>
      new Set(buildScene(loadComposedCity(cityId), 'high').trees.map((tree) => tree.kind));

    // A street in Nevşehir lined with plane trees would be a picture of
    // somewhere else. Cappadocia gets poplars and scrub.
    expect(kindsFor('nevsehir').has('poplar')).toBe(true);
    expect(kindsFor('istanbul').has('plane')).toBe(true);
    expect(kindsFor('istanbul')).not.toEqual(kindsFor('nevsehir'));

    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      expect(buildScene(loadComposedCity(cityId), 'high').trees.length, cityId).toBeGreaterThan(8);
    }
  });
});

describe('Galata Tower', () => {
  const tower = deliveredProps().find((prop) => prop.id === 'city_istanbul_galata_tower')!;

  it('records what was delivered and what the project agreed', () => {
    expect(tower.triangles).toBe(7_003);
    expect(tower.transferBytes).toBe(2_814_596);
    expect(tower.checksum).toHaveLength(64);
    // Delivered already at the agreed 14 m (D-050), so nothing is rescaled.
    expect(tower.dimensions[1]).toBe(14);
    expect(tower.scaleToBrief ?? false).toBe(false);
    // The reason the first optimisation was rejected survives in the record.
    expect(tower.notes).toMatch(/34,313/);
    expect(tower.notes).toMatch(/seams/);
  });

  it('needs no rescaling, because every delivered asset is authored at its size', () => {
    // `scaleToBrief` exists for a file that disagrees with an agreed size. The
    // third tower arrived at 14 m, so nothing uses it — which is the state to
    // prefer.
    for (const id of [
      'city_istanbul_galata_tower',
      'kit_street_lamp',
      'kit_bench',
      'city_istanbul_simit_cart',
    ]) {
      expect(resolveAsset(id, 'high').entry.scaleToBrief, id).toBe(false);
    }
  });

  it('keeps the guide visible in the landmark shot', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const stop = scene.hotspots.find((hotspot) => hotspot.asset.entry.id === tower.id)!;
    const distance = Math.hypot(
      stop.camera.position[0] - stop.position[0],
      stop.camera.position[2] - stop.position[2],
      stop.camera.position[1] - stop.camera.target[1],
    );
    const visible = 2 * distance * Math.tan(25 * (Math.PI / 180));

    // The tower fits, and the guide is still findable beside it. At the
    // delivered 20 m he fell to 7% of frame height.
    expect(14 / visible).toBeLessThan(1);
    expect(1.65 / visible).toBeGreaterThan(0.08);
  });

  it('stays the tallest thing on the street', () => {
    const lamp = resolveAsset('kit_street_lamp', 'high').entry.dimensions[1];
    expect(tower.dimensions[1] / lamp).toBeGreaterThan(2.5);
    expect(tower.dimensions[1] / 1.65).toBeGreaterThan(7);
  });
});

describe('İstanbul is fully dressed', () => {
  it('has no graybox left at any stop', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    for (const hotspot of scene.hotspots) {
      // Every stop now points at commissioned art rather than a stand-in.
      expect(hotspot.asset.entry.id, `stop ${hotspot.order}`).not.toMatch(/^graybox_/);
      expect(hotspot.asset.isUnknown, `stop ${hotspot.order}`).toBe(false);
    }
  });

  it('has a delivered model at every stop', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const waiting = scene.hotspots
      .filter((hotspot) => hotspot.asset.isPlaceholder)
      .map((hotspot) => hotspot.asset.entry.id);

    // Every one of the five now points at a file that exists.
    expect(waiting).toEqual([]);
  });

  it('leaves the unbuilt ferry brief in the manifest rather than pretending', () => {
    // The boat was briefed and never delivered; a terminal stands in for it.
    // The row stays, unused, so the gap is visible instead of quietly closed.
    const ferry = resolveAsset('city_istanbul_ferry', 'high');
    expect(ferry.isUnknown).toBe(false);
    expect(ferry.isPlaceholder).toBe(true);

    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    expect(scene.hotspots.map((hotspot) => hotspot.asset.entry.id)).not.toContain(
      'city_istanbul_ferry',
    );
  });

  it('keeps every delivered file within the budget for its kind', () => {
    for (const prop of deliveredProps()) {
      const limit = prop.id.startsWith('kit_') ? 2 : 4;
      expect(prop.transferBytes / (1024 * 1024), prop.id).toBeLessThan(limit);
    }
  });

  it('records what each delivery cost before it was recompressed', () => {
    // Four assets arrived far over budget. The record is what stops the next
    // one arriving the same way.
    const heavy = deliveredProps().filter((prop) => /MB/.test(prop.notes ?? ''));
    expect(heavy.length).toBeGreaterThanOrEqual(3);
    for (const prop of heavy) {
      expect(prop.notes, prop.id).toMatch(/\d+\.\d+ MB/);
    }
  });
});

describe('the street kit is complete', () => {
  const KIT = [
    'kit_street_lamp',
    'kit_bench',
    'kit_planter_cypress',
    'kit_market_stall',
    'kit_crates',
    'kit_street_cat',
  ];

  it('has every piece the brief listed', () => {
    const registered = deliveredProps().map((prop) => prop.id);
    for (const id of KIT) {
      expect(registered, id).toContain(id);
    }
  });

  it('holds the whole kit inside one download budget', () => {
    // Six shared props go to all 81 provinces, so their total is what a child
    // waits for on every street, not just this one.
    const total = deliveredProps()
      .filter((prop) => KIT.includes(prop.id))
      .reduce((sum, prop) => sum + prop.transferBytes, 0);
    expect(total / (1024 * 1024)).toBeLessThan(6);
  });

  it('places stalls and crates where a market would spill out', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const market = scene.props.filter((prop) =>
      ['kit_market_stall', 'kit_crates'].includes(prop.asset.entry.id),
    );
    expect(market.length).toBeGreaterThanOrEqual(4);

    // Clustered around the middle of the street rather than spread evenly.
    const depths = market.map((prop) => prop.position[2]);
    const spread = Math.max(...depths) - Math.min(...depths);
    expect(spread).toBeLessThan(30);
  });
});

describe('the sea', () => {
  it('gives İstanbul water and leaves the inland cities dry', () => {
    const istanbul = buildScene(loadComposedCity('istanbul'), 'high');
    expect(istanbul.water).not.toBeNull();
    for (const cityId of ['nevsehir', 'gaziantep']) {
      // Nevşehir is in Cappadocia. It should not be given a shoreline.
      expect(buildScene(loadComposedCity(cityId), 'high').water, cityId).toBeNull();
    }
  });

  it('starts the water past the play boundary, so it cannot be walked into', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const water = scene.water!;
    const nearEdge = water.centerZ + water.depth / 2;
    const playFar = Math.min(...scene.bounds.map((corner) => corner[2]));
    expect(nearEdge).toBeLessThanOrEqual(playFar);
  });

  it("puts the Maiden's Tower on the water, not on the pavement", () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const tower = scene.backdrop.find(
      (prop) => prop.asset.entry.id === 'city_istanbul_maidens_tower',
    )!;
    expect(tower).toBeDefined();

    const water = scene.water!;
    const insideWater =
      Math.abs(tower.position[0] - water.centerX) < water.width / 2 &&
      Math.abs(tower.position[2] - water.centerZ) < water.depth / 2;
    expect(insideWater).toBe(true);
  });

  it('floats what belongs on water and stands what belongs on land', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const water = scene.water!;
    const onWater = (prop: { position: readonly number[] }) =>
      Math.abs(prop.position[0]! - water.centerX) < water.width / 2 &&
      Math.abs(prop.position[2]! - water.centerZ) < water.depth / 2;

    // A ferry beside a pavement reads as a mistake before a child can name why.
    const ferry = scene.backdrop.find(
      (prop) => prop.asset.entry.id === 'city_istanbul_ferry_boat',
    )!;
    expect(ferry, 'the ferry should be in the scene').toBeDefined();
    expect(onWater(ferry), 'the ferry is not on the water').toBe(true);

    const tower = scene.backdrop.find(
      (prop) => prop.asset.entry.id === 'city_istanbul_maidens_tower',
    )!;
    expect(onWater(tower)).toBe(true);
  });

  it('moors one ferry, at a length that matches the terminal', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const ferries = scene.backdrop.filter(
      (prop) => prop.asset.entry.id === 'city_istanbul_ferry_boat',
    );
    expect(ferries).toHaveLength(1);

    const hull = ferries[0]!.asset.entry.dimensions[0];
    const terminal = resolveAsset('city_istanbul_ferry_terminal', 'high').entry.dimensions[0];
    // A boat longer than its own terminal by a factor reads as a cruise liner.
    expect(hull / terminal).toBeGreaterThan(1);
    expect(hull / terminal).toBeLessThan(2);
  });

  it('keeps every backdrop piece out of the play area and out of the way', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    expect(scene.backdrop.length).toBeGreaterThan(0);
    for (const prop of scene.backdrop) {
      // Scenery is never solid: a child who reaches the edge should not be
      // stopped by a building they were never meant to arrive at.
      expect(prop.solid, prop.key).toBe(false);
      const blocked = scene.colliders.some(
        (collider) =>
          Math.abs(collider.x - prop.position[0]) < 0.01 &&
          Math.abs(collider.z - prop.position[2]) < 0.01,
      );
      expect(blocked, prop.key).toBe(false);
    }
  });

  it('puts a tile panel at the stop and the mosque behind it', () => {
    const city = loadComposedCity('istanbul');
    const scene = buildScene(city, 'high');

    // The canonical stop is about the dome and the tiles inside it. The child
    // studies a panel at their own height; the building is scenery behind it.
    expect(city.hotspots[0]!.fact.title.en).toMatch(/Hagia Sophia/);
    const first = scene.hotspots.find((hotspot) => hotspot.order === 1)!;
    expect(first.asset.entry.id).toBe('city_istanbul_iznik_tile_panel');
    expect(first.asset.entry.dimensions[1]).toBeLessThan(3);

    // The mosque is no longer the stop. It stands on the square behind the
    // child, solid, where they can walk up to it and no further.
    const mosque = scene.props.find(
      (prop) => prop.asset.entry.id === 'city_istanbul_hagia_sophia',
    );
    expect(mosque, 'the mosque should be on the square now').toBeDefined();
    expect(mosque!.solid).toBe(true);
    expect(mosque!.position[2]).toBeGreaterThan(0);
  });

  it('gives the child ground behind them, and something to close it', () => {
    const city = loadComposedCity('istanbul');
    const scene = buildScene(city, 'high');
    const spawn = city.spawn.position;
    const behind = Math.max(...scene.bounds.map((corner) => corner[2])) - spawn[2];

    // A child who turns round used to see the world stop ten metres away.
    expect(behind).toBeGreaterThan(30);

    const mosque = scene.props.find(
      (prop) => prop.asset.entry.id === 'city_istanbul_hagia_sophia',
    )!;
    const halfDepth = mosque.asset.entry.dimensions[2] / 2;
    // Standing on the ground, not floating past its edge or out at sea.
    expect(mosque.position[2] + halfDepth).toBeLessThanOrEqual(
      Math.max(...scene.bounds.map((corner) => corner[2])),
    );
  });

  it('starts the child where the tram passes', () => {
    const city = loadComposedCity('istanbul');
    const scene = buildScene(city, 'high');
    const line = scene.tramLine!;

    // The tram no longer waits at the kerb; it runs. What matters is that its
    // line comes past the square, so the child sees it arrive early on.
    const nearSpawn = Math.min(
      ...[line.from, line.to].map((end) =>
        Math.hypot(end[0] - city.spawn.position[0], end[1] - city.spawn.position[2]),
      ),
    );
    expect(nearSpawn).toBeLessThan(30);
  });
});

describe('where the child appears', () => {
  it('never spawns inside anything, in any city', () => {
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const city = loadComposedCity(cityId);
      const scene = buildScene(city, 'high');
      const spawn = { x: city.spawn.position[0], z: city.spawn.position[2] };
      expect(blockedBy(spawn, scene.colliders), `${cityId} spawns inside an object`).toBeNull();
    }
  });

  it('leaves room to look around before meeting anything', () => {
    // Hagia Sophia once stood with its face less than a metre from the spawn:
    // the guide arrived already touching a building.
    const city = loadComposedCity('istanbul');
    const scene = buildScene(city, 'high');
    const spawn = { x: city.spawn.position[0], z: city.spawn.position[2] };

    const clearance = Math.min(
      ...scene.colliders.map((collider) =>
        Math.max(
          Math.abs(spawn.x - collider.x) - collider.halfWidth,
          Math.abs(spawn.z - collider.z) - collider.halfDepth,
        ),
      ),
    );
    expect(clearance).toBeGreaterThan(5);
  });

  it('can walk out of the spawn in every direction without being trapped', () => {
    const city = loadComposedCity('istanbul');
    const scene = buildScene(city, 'high');
    const spawn = { x: city.spawn.position[0], z: city.spawn.position[2] };

    for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      let position = spawn;
      for (let frame = 0; frame < 90; frame += 1) {
        position = stepWithCollision(
          position,
          { forward: 1, strafe: 0 },
          heading,
          1 / 60,
          scene.bounds,
          scene.colliders,
        );
      }
      const moved = Math.hypot(position.x - spawn.x, position.z - spawn.z);
      expect(moved, `trapped facing ${heading.toFixed(2)}`).toBeGreaterThan(2);
    }
  });
});

describe('no graybox filler left', () => {
  it('dresses the street with delivered props, not grey boxes', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    expect(scene.props.length).toBeGreaterThanOrEqual(14);
    for (const prop of scene.props) {
      expect(prop.asset.isPlaceholder, prop.asset.entry.id).toBe(false);
    }
  });

  it('has no procedural decoration boxes in the renderer', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/components/three/CityScene.tsx'),
      'utf8',
    );
    expect(source).not.toContain('decoration');
  });
});

describe('trees render as trees', () => {
  it('groups instances by colour instead of using per-instance colour', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/components/three/StreetTrees.tsx'),
      'utf8',
    );
    /**
     * The first instancing attempt used one material with `vertexColors` and
     * `setColorAt`. The instance colour attribute is added after the shader is
     * compiled, so the shader had nothing to read and every tree rendered
     * black. Grouping by colour costs three extra draw calls and cannot fail
     * that way.
     */
    // Matches the JSX prop, not the comment that explains why it is gone.
    expect(source).not.toMatch(/\bvertexColors[\s/>]/);
    expect(source).not.toContain('setColorAt');
    expect(source).toContain('instancedMesh');
  });

  it('still saves most of the draw calls the trees used to cost', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    // One group per trunk, one per distinct foliage colour: four, against
    // sixty-three when each tree was its own group of meshes.
    const colours = new Set<number>();
    for (const tree of scene.trees) {
      if (tree.kind === 'cypress') colours.add(0);
      else if (tree.kind === 'plane') {
        colours.add(1);
        colours.add(2);
      } else colours.add(2);
    }
    const drawCalls = 1 + colours.size;
    expect(drawCalls).toBeLessThan(8);
    expect(scene.trees.length).toBeGreaterThan(drawCalls * 3);
  });

  it('keeps a mix of shapes, so the street is not one tree repeated', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const kinds = new Set(scene.trees.map((tree) => tree.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });
});

describe('the street is alive', () => {
  it('sways without ever repeating the same lean twice in a row', () => {
    const samples = Array.from({ length: 200 }, (_, i) => sway(i * 0.05, 0));
    expect(new Set(samples.map((s) => s.toFixed(4))).size).toBeGreaterThan(150);
    for (const value of samples) {
      // Four degrees, not a storm.
      expect(Math.abs(value)).toBeLessThanOrEqual(SWAY_RADIANS * 1.4);
    }
  });

  it('does not lean the whole street in unison', () => {
    const atOneMoment = [0, 3, 7, 11, 19].map((phase) => sway(2.5, phase).toFixed(3));
    expect(new Set(atOneMoment).size).toBeGreaterThan(3);
  });

  it('leans a flagpole more than a shrub', () => {
    expect(heightFactor(6)).toBeGreaterThan(heightFactor(1.5));
    expect(heightFactor(20)).toBe(1);
  });

  it('stands still for a child who asked for less motion', () => {
    // Reduced motion passes zero strength rather than threading a flag
    // through every component that moves.
    expect(sway(3.2, 1.1, 0)).toBe(0);
  });

  it('runs the tram end to end and turns it round', () => {
    const line = 120;
    let state = initialTramState();
    let reachedFar = false;
    let cameBack = false;

    for (let frame = 0; frame < 60 * 120; frame += 1) {
      state = stepTram(state, line, 1 / 60);
      if (state.travelled >= line - 0.01) reachedFar = true;
      if (reachedFar && state.travelled <= 0.01) cameBack = true;
      expect(state.travelled).toBeGreaterThanOrEqual(0);
      expect(state.travelled).toBeLessThanOrEqual(line);
    }

    expect(reachedFar, 'the tram never reached the end of its line').toBe(true);
    expect(cameBack, 'the tram never came back').toBe(true);
  });

  it('runs the tram clear of the walk', () => {
    const scene = buildScene(loadComposedCity('istanbul'), 'high');
    const line = scene.tramLine!;
    expect(line).not.toBeNull();
    for (const point of [line.from, line.to]) {
      // A vehicle a child cannot see coming must not cross where they walk.
      expect(Math.abs(point[0])).toBeGreaterThan(10);
    }
  });

  it('gives cats a size the people who were shown the street could find', () => {
    const cat = deliveredProps().find((prop) => prop.id === 'kit_street_cat')!;
    expect(cat.dimensions[1]).toBeCloseTo(0.6, 2);
  });
});

describe('thin geometry survives optimisation', () => {
  it('keeps the flag-carrying models double-sided', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');

    /**
     * A flag is one plane. Culling its back face draws half of it and reads as
     * a torn flag — which is what happened to the Maiden's Tower and the ferry
     * when every material was forced single-sided to save fragments.
     */
    const thin = [
      ['city', 'city_istanbul_maidens_tower'], // flag on the roof
      ['city', 'city_istanbul_ferry_boat'], // flags on the masts
      ['props', 'kit_turkish_flag'], // the flag itself
      ['props', 'kit_market_stall'], // canvas awning
    ] as const;

    for (const [folder, file] of thin) {
      const bytes = readFileSync(resolve(process.cwd(), `public/assets/${folder}/${file}.glb`));
      const jsonLength = bytes.readUInt32LE(12);
      const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
      for (const material of gltf.materials ?? []) {
        expect(material.doubleSided, `${file} lost its back faces`).toBe(true);
        expect(material.alphaMode ?? 'OPAQUE', file).toBe('OPAQUE');
      }
    }
  });

  it('does not force sidedness in the shared simplifier', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const script = readFileSync(resolve(process.cwd(), 'scripts/simplify-model.mjs'), 'utf8');
    // Opaque is safe to force; single-sided is not.
    expect(script).toContain("setAlphaMode('OPAQUE')");
    expect(script).not.toContain('setDoubleSided(false)');
  });
});

describe('Cappadocia looks and sounds like Cappadocia', () => {
  const nevsehir = buildScene(loadComposedCity('nevsehir'), 'high');
  const istanbul = buildScene(loadComposedCity('istanbul'), 'high');

  it('paves the coast and dusts the plateau', () => {
    expect(istanbul.groundSurface).toBe('cobblestone');
    expect(nevsehir.groundSurface).toBe('redsand');
    // The ground is the largest thing on screen, so it is the loudest place to
    // get a region wrong.
    expect(buildScene(loadComposedCity('gaziantep'), 'high').groundSurface).toBe('redsand');
  });

  it('closes both sides with fairy chimneys', () => {
    const ridges = nevsehir.backdrop.filter(
      (prop) => prop.asset.entry.id === 'city_nevsehir_chimney_ridge',
    );
    expect(ridges.length).toBeGreaterThanOrEqual(8);
    // Walls on both sides, the way the Beyoğlu rows work.
    expect(ridges.some((prop) => prop.position[0] < 0)).toBe(true);
    expect(ridges.some((prop) => prop.position[0] > 0)).toBe(true);

    const playHalfWidth = Math.max(...nevsehir.bounds.map((c) => Math.abs(c[0])));
    for (const ridge of ridges) {
      // Between the street and the valley rim: chimneys close, valley beyond.
      expect(Math.abs(ridge.position[0])).toBeGreaterThan(playHalfWidth);
      expect(ridge.solid).toBe(false);
    }
  });

  it('rings the whole city with valley, not just its ends', () => {
    const valleys = nevsehir.backdrop.filter(
      (prop) => prop.asset.entry.id === 'city_nevsehir_valley',
    );
    /**
     * Two plates read as two separate landmasses. Cappadocia is a valley a
     * street sits in, so they ring the play area on all four sides with an
     * overlap — which is what makes a row of plates look like one landscape.
     */
    expect(valleys.length).toBeGreaterThanOrEqual(6);
    expect(valleys.some((v) => v.position[0] < -20)).toBe(true);
    expect(valleys.some((v) => v.position[0] > 20)).toBe(true);
    expect(valleys.some((v) => v.position[2] > 20)).toBe(true);
    expect(valleys.some((v) => v.position[2] < -60)).toBe(true);

    const spawnZ = loadComposedCity('nevsehir').spawn.position[2];
    // Solid, so a child walks up to a rim and stops there.
    for (const valley of valleys) {
      expect(valley.solid).toBe(true);
      const distance = Math.hypot(valley.position[0], valley.position[2] - spawnZ);
      // Never centred on the child: a 78 m deep plate centred at the boundary
      // once swallowed the spawn.
      expect(distance).toBeGreaterThan(30);
    }
  });

  it('borrows nothing from İstanbul', () => {
    const ids = [...nevsehir.backdrop, ...nevsehir.props].map((prop) => prop.asset.entry.id);
    expect(ids.some((id) => id.startsWith('city_istanbul_'))).toBe(false);
  });

  it('draws one chimney file at two sizes rather than shipping two', () => {
    const cluster = deliveredProps().find(
      (prop) => prop.id === 'city_nevsehir_fairy_chimney_cluster',
    )!;
    const ridge = deliveredProps().find((prop) => prop.id === 'city_nevsehir_chimney_ridge')!;
    expect(cluster.triangles).toBe(ridge.triangles);
    // Walked up to at six metres; seen across the street at seventeen.
    expect(ridge.dimensions[1] / cluster.dimensions[1]).toBeGreaterThan(2.5);
  });

  it('plays music and nothing else', async () => {
    /**
     * The synthesised bed was cut. Filtered noise reads as water however it is
     * shaped: two attempts at making it sound like a plateau ended with the
     * owner still hearing waves. A city with a theme and no bed is quieter and
     * says nothing untrue.
     *
     * The channel is still here for recorded ambience later.
     */
    const cues = await import('@/engine/audio/cues');
    expect('startAmbience' in cues).toBe(false);
    const { DEFAULT_CHANNELS } = await import('@/engine/audio/engine');
    expect(DEFAULT_CHANNELS.ambience).toBeDefined();
  });
});

describe('balloons', () => {
  const scene = buildScene(loadComposedCity('nevsehir'), 'high');

  it('crowds the sky over Cappadocia and thins it elsewhere', () => {
    expect(scene.balloons.length).toBeGreaterThanOrEqual(8);
    expect(scene.balloonAsset).not.toBeNull();

    /**
     * Balloons fly over the whole country, so every city gets some — but the
     * full sky is Cappadocia's, because that is the image of the place. A few
     * passing over elsewhere is enough to make a sky look like weather rather
     * than paint.
     */
    for (const cityId of ['istanbul', 'gaziantep']) {
      const elsewhere = buildScene(loadComposedCity(cityId), 'high').balloons;
      expect(elsewhere.length, cityId).toBeGreaterThan(0);
      expect(elsewhere.length, cityId).toBeLessThan(scene.balloons.length);
    }
  });

  it('varies size, height and distance, because that is the whole trick', () => {
    const scales = new Set(scene.balloons.map((b) => b.scale));
    const heights = new Set(scene.balloons.map((b) => b.position[1]));
    const depths = new Set(scene.balloons.map((b) => b.position[2]));

    // A sky of identical balloons is one balloon copied.
    expect(scales.size).toBeGreaterThan(5);
    expect(heights.size).toBeGreaterThan(5);
    expect(depths.size).toBeGreaterThan(5);
    expect(Math.max(...scales) / Math.min(...scales)).toBeGreaterThan(3);
  });

  it('keeps them in the air and out of reach', () => {
    for (const balloon of scene.balloons) {
      // Well above a 1.7 m guide, and never a collider.
      expect(balloon.position[1]).toBeGreaterThan(15);
    }
    const grounded = scene.colliders.some((collider) =>
      scene.balloons.some(
        (b) => Math.abs(collider.x - b.position[0]) < 0.01 && Math.abs(collider.z - b.position[2]) < 0.01,
      ),
    );
    expect(grounded).toBe(false);
  });

  it('lays out the same sky every time a child comes back', () => {
    const again = buildScene(loadComposedCity('nevsehir'), 'high');
    expect(again.balloons).toEqual(scene.balloons);
  });

  it('uses one file for the sky and for the stop a child walks up to', () => {
    const stop = scene.hotspots.find((h) => h.asset.entry.id === 'kit_hot_air_balloon');
    expect(stop, 'stop 2 should be the balloon').toBeDefined();
    expect(scene.balloonAsset!.entry.id).toBe('kit_hot_air_balloon');
    // Tethered at stop height; flying at several times it.
    expect(Math.max(...scene.balloons.map((b) => b.scale))).toBeGreaterThan(0.9);
  });
});

describe('streets after İstanbul are shorter', () => {
  it('halves the walk, and lets the stop objects decide how far is safe', () => {
    const istanbul = buildScene(loadComposedCity('istanbul'), 'high');
    const nevsehir = buildScene(loadComposedCity('nevsehir'), 'high');

    const length = (scene: typeof istanbul) => {
      const zs = scene.hotspots.map((h) => h.position[2]);
      return Math.abs(Math.max(...zs) - Math.min(...zs));
    };

    // İstanbul had more that had to be seen; everywhere else is tighter.
    expect(length(nevsehir)).toBeLessThan(length(istanbul) * 0.8);

    /**
     * Spacing is asked for and then checked. Two stops closer than their trigger
     * rings would open each other, so the geometry has the last word — which is
     * why this is an inequality and not a number.
     */
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const scene = buildScene(loadComposedCity(cityId), 'high');
      const sorted = [...scene.hotspots].sort((a, b) => b.position[2] - a.position[2]);
      for (let i = 1; i < sorted.length; i += 1) {
        const gap = Math.abs(sorted[i]!.position[2] - sorted[i - 1]!.position[2]);
        expect(gap, `${cityId} stops ${i} and ${i + 1}`).toBeGreaterThan(
          sorted[i]!.triggerRadius + sorted[i - 1]!.triggerRadius,
        );
      }
    }
  });
});

describe('balloons actually fly', () => {
  it('crosses the sky rather than swaying on the spot', async () => {
    const { TRAVEL_SPAN, DRIFT_SPEED } = await import('@/components/three/Balloons');
    /**
     * The first version drifted six metres either side of a fixed point, which
     * at balloon distances is invisible: they read as pinned to the sky.
     */
    expect(TRAVEL_SPAN).toBeGreaterThan(150);
    // Crossing that span should take a couple of minutes, not an hour.
    const seconds = TRAVEL_SPAN / DRIFT_SPEED;
    expect(seconds).toBeGreaterThan(60);
    expect(seconds).toBeLessThan(400);
  });

  it('gives each balloon a different speed, so they do not fly in formation', () => {
    const scene = buildScene(loadComposedCity('nevsehir'), 'high');
    const speeds = new Set(scene.balloons.map((b) => b.driftSpeed));
    expect(speeds.size).toBeGreaterThan(3);
  });

  it('fires the burner on the tethered one in bursts, ramped not switched', async () => {
    const { burnerIntensity, isBurning } = await import('@/components/three/BalloonBurner');

    // Off most of the time: a burner that never stops is a lamp.
    const samples = Array.from({ length: 200 }, (_, i) => isBurning(i * 0.05));
    const burning = samples.filter(Boolean).length;
    expect(burning).toBeGreaterThan(10);
    expect(burning).toBeLessThan(samples.length / 2);

    // Ramped: a flame at full size in one frame reads as a bug.
    expect(burnerIntensity(0)).toBeLessThan(0.2);
    const peak = Math.max(...Array.from({ length: 40 }, (_, i) => burnerIntensity(i * 0.05)));
    expect(peak).toBeGreaterThan(0.7);
    // Silent when the child asked for less motion is handled by the component.
    expect(burnerIntensity(5.5)).toBe(0);
  });
});
