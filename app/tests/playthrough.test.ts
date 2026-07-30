import { describe, expect, it } from 'vitest';
import { buildScene } from '@/engine/scene/buildScene';
import { blockedBy, stepWithCollision, RUN_SPEED } from '@/engine/controls/movement';
import { interactionReducer, initialInteractionContext } from '@/engine/interactions/machine';
import { completeHotspot, completeQuiz, quizUnlocked } from '@/engine/progress/rules';
import { emptyCityProgress } from '@/engine/progress/types';
import { celebrationPlan, celebrationReducer, initialCelebration } from '@/engine/heroes/celebration';
import { heroForGuide } from '@/engine/heroes/registry';
import { loadComposedCity } from './helpers';

/**
 * A whole visit, simulated.
 *
 * Every other test checks one rule. This one asks the only question that
 * matters: can a child arrive in İstanbul, walk to all five stops, collect all
 * five things, pass the quiz and win the star — using the same functions the
 * running game uses.
 */
describe('a child completes İstanbul', () => {
  const city = loadComposedCity('istanbul');
  const scene = buildScene(city, 'high');

  it('follows the route markers and meets every stop on the way', () => {
    /**
     * A child follows the markers on the ground rather than aiming at a
     * building through it. Walking straight at a stop is fine and stops you at
     * its wall; the route is what gets you round the tower to the next one.
     */
    let position = { x: city.spawn.position[0], z: city.spawn.position[2] };
    let progress = emptyCityProgress(city.id);
    let interaction = initialInteractionContext;
    const met = new Set<number>();

    expect(blockedBy(position, scene.colliders), 'spawned inside something').toBeNull();

    const meetNearbyStops = () => {
      for (const hotspot of scene.hotspots) {
        if (met.has(hotspot.order)) continue;
        const distance = Math.hypot(position.x - hotspot.position[0], position.z - hotspot.position[2]);
        if (distance > hotspot.triggerRadius) continue;

        interaction = interactionReducer(interaction, {
          type: 'HOTSPOT_IN_RANGE',
          hotspotId: hotspot.id,
        });
        interaction = interactionReducer(interaction, { type: 'BEGIN' });
        interaction = interactionReducer(interaction, { type: 'CAMERA_SETTLED' });
        expect(interaction.state, `stop ${hotspot.order} did not open`).toBe('active');

        // The same sequence collectFromStop runs: take the item, then close.
        interaction = interactionReducer(interaction, { type: 'ANSWER', correct: true });
        interaction = interactionReducer(interaction, { type: 'CLAIM_REWARD' });
        const canonical = city.hotspots.find((entry) => entry.id === hotspot.id)!;
        progress = completeHotspot(progress, hotspot.id, canonical.reward.assetId);
        interaction = interactionReducer(interaction, { type: 'DISMISS' });
        expect(interaction.state, `stop ${hotspot.order} did not close`).toBe('complete');
        met.add(hotspot.order);
      }
    };

    meetNearbyStops();

    for (const waypoint of scene.routePoints) {
      const target = { x: waypoint[0], z: waypoint[2] };
      let reached = false;

      for (let frame = 0; frame < 60 * 20 && !reached; frame += 1) {
        const heading = Math.atan2(target.x - position.x, target.z - position.z);
        position = stepWithCollision(
          position,
          { forward: 1, strafe: 0 },
          heading,
          1 / 60,
          scene.bounds,
          scene.colliders,
          true,
        );
        meetNearbyStops();
        if (Math.hypot(position.x - target.x, position.z - target.z) < 0.5) reached = true;
      }

      expect(reached, `could not reach the marker at ${target.x}, ${target.z}`).toBe(true);
      expect(blockedBy(position, scene.colliders), 'walked into something').toBeNull();
    }

    expect([...met].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(progress.completedHotspotIds).toHaveLength(5);
    expect(progress.collectedRewardIds).toHaveLength(5);
  });

  it('triggers a stop before the child can walk into it', () => {
    // The ring has to reach further than the object plus the player's own
    // width, or a child walking straight at a stop meets a wall instead.
    for (const hotspot of scene.hotspots) {
      const reach = Math.max(hotspot.collider.halfWidth, hotspot.collider.halfDepth) + 0.45;
      expect(hotspot.triggerRadius, `stop ${hotspot.order}`).toBeGreaterThan(reach);
    }
  });

  it('opens the quiz only after every stop, and finishes the city', () => {
    let progress = emptyCityProgress(city.id);
    for (const hotspot of city.hotspots.slice(0, 4)) {
      progress = completeHotspot(progress, hotspot.id, hotspot.reward.assetId);
      expect(quizUnlocked(city, progress), 'quiz opened early').toBe(false);
    }
    const last = city.hotspots[4]!;
    progress = completeHotspot(progress, last.id, last.reward.assetId);
    expect(quizUnlocked(city, progress)).toBe(true);

    progress = completeQuiz(city, progress);
    expect(progress.cityCompleted).toBe(true);
  });

  it('celebrates and reaches the summary', () => {
    const hero = heroForGuide(city.guideId);
    const plan = celebrationPlan(hero);
    const options = { reducedMotion: false, planLength: plan.length };
    let celebration = celebrationReducer(initialCelebration, { type: 'CITY_COMPLETED' }, options);
    celebration = celebrationReducer(celebration, { type: 'PROGRESS_SAVED' }, options);
    celebration = celebrationReducer(celebration, { type: 'CAMERA_FRAMED' }, options);
    for (let beat = 0; beat < plan.length; beat += 1) {
      celebration = celebrationReducer(celebration, { type: 'CLIP_FINISHED' }, options);
    }
    expect(celebration.state).toBe('summary');
  });

  it('runs the street in a time a child will sit through', () => {
    const points = scene.routePoints;
    let length = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      length += Math.hypot(points[i + 1]![0] - points[i]![0], points[i + 1]![2] - points[i]![2]);
    }
    const walkSeconds = length / RUN_SPEED;
    expect(walkSeconds).toBeLessThan(90);
    expect(city.estimatedMinutes).toBeGreaterThanOrEqual(3);
    expect(city.estimatedMinutes).toBeLessThanOrEqual(8);
  });
});

/**
 * The same visit, in the second city.
 *
 * İstanbul was built by hand and its playthrough proves İstanbul works.
 * Nevşehir was dressed by the generic path with a different guide, a different
 * region and three stop objects that have not been delivered — which is exactly
 * where a second city would break if the machinery were still İstanbul-shaped.
 */
describe('a child completes Nevşehir', () => {
  const city = loadComposedCity('nevsehir');
  const scene = buildScene(city, 'high');

  it('sends a different guide', () => {
    expect(city.guideId).not.toBe(loadComposedCity('istanbul').guideId);
    expect(city.guideId).toBe('keloglan');
  });

  it('looks like Cappadocia rather than İstanbul', () => {
    const istanbul = buildScene(loadComposedCity('istanbul'), 'high');
    expect(scene.ground.color).not.toBe(istanbul.ground.color);
    expect(new Set(scene.trees.map((t) => t.kind))).not.toEqual(
      new Set(istanbul.trees.map((t) => t.kind)),
    );
    // Landlocked: no sea, and nothing borrowed from the Bosphorus.
    expect(scene.water).toBeNull();
    expect(scene.props.every((prop) => !prop.asset.entry.id.startsWith('city_istanbul'))).toBe(true);
  });

  it('has a street even though nobody dressed it by hand', () => {
    expect(scene.props.length).toBeGreaterThan(5);
    expect(scene.trees.length).toBeGreaterThan(8);
    // Horses walk fewer, longer runs than cats do.
    expect(scene.catRoutes.length).toBeGreaterThanOrEqual(2);
  });

  it('can be walked end to end and finished', () => {
    let position = { x: city.spawn.position[0], z: city.spawn.position[2] };
    let progress = emptyCityProgress(city.id);
    const met = new Set<number>();

    expect(blockedBy(position, scene.colliders), 'spawned inside something').toBeNull();

    const meetNearbyStops = () => {
      for (const hotspot of scene.hotspots) {
        if (met.has(hotspot.order)) continue;
        const distance = Math.hypot(
          position.x - hotspot.position[0],
          position.z - hotspot.position[2],
        );
        if (distance > hotspot.triggerRadius) continue;
        const canonical = city.hotspots.find((entry) => entry.id === hotspot.id)!;
        progress = completeHotspot(progress, hotspot.id, canonical.reward.assetId);
        met.add(hotspot.order);
      }
    };

    meetNearbyStops();
    for (const waypoint of scene.routePoints) {
      const target = { x: waypoint[0], z: waypoint[2] };
      let reached = false;
      for (let frame = 0; frame < 60 * 20 && !reached; frame += 1) {
        const heading = Math.atan2(target.x - position.x, target.z - position.z);
        position = stepWithCollision(
          position,
          { forward: 1, strafe: 0 },
          heading,
          1 / 60,
          scene.bounds,
          scene.colliders,
          true,
        );
        meetNearbyStops();
        if (Math.hypot(position.x - target.x, position.z - target.z) < 0.5) reached = true;
      }
      expect(reached, `could not reach ${target.x}, ${target.z}`).toBe(true);
    }

    expect([...met].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    progress = completeQuiz(city, progress);
    expect(progress.cityCompleted).toBe(true);
  });
});

describe('a finished city stays open', () => {
  it('opens on the street, not on the summary', async () => {
    const { useGameStore } = await import('@/stores/useGameStore');
    // Entering used to drop the child on the completion panel, whose only
    // button goes back to the map — so a city they had finished was a city they
    // could not re-enter.
    const source = await import('node:fs').then(({ readFileSync }) =>
      readFileSync('src/stores/useGameStore.ts', 'utf8'),
    );
    expect(source).not.toContain("progress.cityCompleted ? 'complete' : 'intro'");
    expect(typeof useGameStore.getState().resumeExploring).toBe('function');
    expect(typeof useGameStore.getState().reviewCompletion).toBe('function');
  });

  it('will not reopen a summary for a city that is not finished', async () => {
    const { useGameStore } = await import('@/stores/useGameStore');
    const before = useGameStore.getState().phase;
    useGameStore.getState().reviewCompletion();
    expect(useGameStore.getState().phase).toBe(before);
  });

  it('lets a child collect a stop only once, however often they revisit', () => {
    const city = loadComposedCity('istanbul');
    let progress = emptyCityProgress(city.id);
    const first = city.hotspots[0]!;

    progress = completeHotspot(progress, first.id, first.reward.assetId);
    progress = completeHotspot(progress, first.id, first.reward.assetId);
    progress = completeHotspot(progress, first.id, first.reward.assetId);

    // Revisiting is for looking again, not for farming stars.
    expect(progress.completedHotspotIds).toEqual([first.id]);
    expect(progress.collectedRewardIds).toEqual([first.reward.assetId]);
  });
});

/**
 * The third city, and the first that is not shaped like the other two.
 *
 * Three stops and one question against İstanbul's five and two. Everything that
 * assumes a five-stop city — the quiz gate, the layout, the route, the
 * completion — has to hold here or it holds on three cities out of eighty-one.
 */
describe('a child completes Gaziantep', () => {
  const city = loadComposedCity('gaziantep');
  const scene = buildScene(city, 'high');

  it('is a shorter city, not a broken one', () => {
    expect(city.hotspots).toHaveLength(3);
    expect(city.quiz).toHaveLength(1);
    expect(scene.hotspots).toHaveLength(3);
    expect(blockedBy(
      { x: city.spawn.position[0], z: city.spawn.position[2] },
      scene.colliders,
    )).toBeNull();
  });

  it('opens its quiz after three stops, not after five', () => {
    let progress = emptyCityProgress(city.id);
    for (const [index, hotspot] of city.hotspots.entries()) {
      expect(quizUnlocked(city, progress), `after ${index} stops`).toBe(false);
      progress = completeHotspot(progress, hotspot.id, hotspot.reward.assetId);
    }
    expect(quizUnlocked(city, progress)).toBe(true);

    progress = completeQuiz(city, progress);
    expect(progress.cityCompleted).toBe(true);
  });

  it('can be walked end to end and finished', () => {
    let position = { x: city.spawn.position[0], z: city.spawn.position[2] };
    let progress = emptyCityProgress(city.id);
    const met = new Set<number>();

    const meetNearbyStops = () => {
      for (const hotspot of scene.hotspots) {
        if (met.has(hotspot.order)) continue;
        const distance = Math.hypot(
          position.x - hotspot.position[0],
          position.z - hotspot.position[2],
        );
        if (distance > hotspot.triggerRadius) continue;
        const canonical = city.hotspots.find((entry) => entry.id === hotspot.id)!;
        progress = completeHotspot(progress, hotspot.id, canonical.reward.assetId);
        met.add(hotspot.order);
      }
    };

    meetNearbyStops();
    for (const waypoint of scene.routePoints) {
      const target = { x: waypoint[0], z: waypoint[2] };
      let reached = false;
      for (let frame = 0; frame < 60 * 20 && !reached; frame += 1) {
        const heading = Math.atan2(target.x - position.x, target.z - position.z);
        position = stepWithCollision(
          position,
          { forward: 1, strafe: 0 },
          heading,
          1 / 60,
          scene.bounds,
          scene.colliders,
          true,
        );
        meetNearbyStops();
        if (Math.hypot(position.x - target.x, position.z - target.z) < 0.5) reached = true;
      }
      expect(reached, `could not reach ${target.x}, ${target.z}`).toBe(true);
    }

    expect([...met].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    progress = completeQuiz(city, progress);
    expect(progress.cityCompleted).toBe(true);
  });

  it('looks like the south-east and not like the other two', () => {
    // Dust like Cappadocia, cats like İstanbul: the region decides each, and
    // they do not have to agree.
    expect(scene.groundSurface).toBe('redsand');
    expect(scene.animal).toBe('cat');
    // Its own landmark is allowed; another city's is not.
    const fromAnotherCity = scene.props.filter(
      (prop) =>
        prop.asset.entry.id.startsWith('city_') &&
        !prop.asset.entry.id.startsWith('city_gaziantep_'),
    );
    expect(fromAnotherCity).toEqual([]);
    // And no balloons. They are Cappadocia's and nowhere else's.
    expect(scene.balloons).toHaveLength(0);
  });

  it('answers its four directions its own way', () => {
    /**
     * A walled stone city on a plain: houses to the sides, a castle on its mound
     * behind, olive groves running out in front. İstanbul answers the front with
     * sea and Nevşehir with a valley; none of the three borrows another's.
     */
    const ids = scene.backdrop.map((prop) => prop.asset.entry.id);
    expect(ids).toContain('city_gaziantep_stone_houses');
    expect(ids).toContain('city_gaziantep_castle');
    expect(ids).toContain('kit_olive_grove');
    expect(ids.some((id) => /istanbul|nevsehir/.test(id))).toBe(false);

    const houses = scene.backdrop.filter(
      (prop) => prop.asset.entry.id === 'city_gaziantep_stone_houses',
    );
    const playHalfWidth = Math.max(...scene.bounds.map((corner) => Math.abs(corner[0])));
    expect(houses.some((h) => h.position[0] < 0)).toBe(true);
    expect(houses.some((h) => h.position[0] > 0)).toBe(true);
    for (const house of houses) {
      expect(Math.abs(house.position[0])).toBeGreaterThan(playHalfWidth);
    }
  });

  it('stands the castle on the ground behind the child, not over them', () => {
    const castle = scene.backdrop.find(
      (prop) => prop.asset.entry.id === 'city_gaziantep_castle',
    )!;
    const spawnZ = city.spawn.position[2];
    const halfDepth = castle.asset.entry.dimensions[2] / 2;

    // Aligned by its near edge: a 37 m landscape centred on the boundary would
    // put the child inside a castle, which is the mistake the valley made first.
    expect(castle.position[2] - halfDepth).toBeGreaterThanOrEqual(
      Math.max(...scene.bounds.map((corner) => corner[2])) - 0.5,
    );
    expect(castle.position[2]).toBeGreaterThan(spawnZ + 20);
    expect(castle.solid).toBe(true);
  });

  it('leaves the olive groves walkable', () => {
    // A grove is somewhere you would walk into, not a wall.
    for (const grove of scene.backdrop.filter(
      (prop) => prop.asset.entry.id === 'kit_olive_grove',
    )) {
      expect(grove.solid).toBe(false);
    }
  });
});
