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
    expect(scene.catRoutes.length).toBeGreaterThanOrEqual(3);
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
