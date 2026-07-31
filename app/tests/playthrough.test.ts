import { describe, expect, it } from 'vitest';
import { PLAYABLE_CITY_IDS } from '@/content/loaders/loadCity';
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
describe('nothing scenic reaches into the play area', () => {
  /**
   * Nevşehir's chimney ridges stood four and a half metres inside the boundary:
   * they had swallowed the dressing along the edges and closed the horses'
   * routes, and it took a screenshot to notice. Scenery is scenery — a child
   * walking to the edge of the street should not be able to reach it.
   *
   * Checked in every city, because nothing about this is Cappadocian.
   */
  for (const cityId of PLAYABLE_CITY_IDS) {
    it(`keeps ${cityId}'s scenery outside the walls`, () => {
      const scene = buildScene(loadComposedCity(cityId), 'high');
      const halfWidth = Math.max(...scene.bounds.map((corner) => Math.abs(corner[0])));

      const front = Math.min(...scene.bounds.map((corner) => corner[2]));
      const back = Math.max(...scene.bounds.map((corner) => corner[2]));

      for (const piece of scene.backdrop) {
        // Only pieces that stand beside the walk. Anything ahead of the street
        // or behind the square is meant to span it — the sea, the walls, the
        // castle — and is judged by its z edge instead, which D-101 covers.
        const [, , pieceZ] = piece.position;
        if (pieceZ > back || pieceZ < front) continue;
        if (Math.abs(piece.position[0]) < halfWidth) continue;

        const [width, , depth] = piece.asset.entry.dimensions;
        // Axis-aligned bounds of the rotated footprint, as the collider uses.
        const cos = Math.abs(Math.cos(piece.rotationY));
        const sin = Math.abs(Math.sin(piece.rotationY));
        const halfX = (width * cos + depth * sin) / 2;
        const nearEdge = Math.abs(piece.position[0]) - halfX;

        // Touching the boundary is right — that is near-edge alignment. Being
        // inside it is what put a chimney ridge across the horses' route.
        expect(nearEdge, `${cityId}: ${piece.asset.entry.id} reaches inside`).toBeGreaterThan(
          halfWidth - 0.5,
        );
      }
    });
  }
});

describe('Van stands between a town and a lake', () => {
  const scene = buildScene(loadComposedCity('van'), 'high');

  it('floats Akdamar on the lake and not on the grass', () => {
    /**
     * The island arrived as one square plate with its own piece of water, so it
     * stands at the end of the walk rather than far out — and the lake plane
     * has to reach it. The first placement left 3.6 m of island sitting on
     * grass past the boundary, which would have been the first thing anybody
     * noticed.
     */
    const island = scene.backdrop.find(
      (piece) => piece.asset.entry.id === 'city_van_akdamar_island',
    )!;
    expect(island).toBeDefined();
    expect(scene.water).not.toBeNull();

    const [, , depth] = island.asset.entry.dimensions;
    const islandNear = island.position[2] + depth / 2;
    const waterNear = scene.water!.centerZ + scene.water!.depth / 2;
    expect(islandNear, 'the island is beached').toBeLessThanOrEqual(waterNear);

    // And the whole of it sits inside the water plate sideways.
    const [width] = island.asset.entry.dimensions;
    expect(Math.abs(island.position[0]) + width / 2).toBeLessThan(scene.water!.width / 2);

    // Solid: the far side of an island is water.
    expect(island.solid).toBe(true);

    // Ahead of the child, so the street runs towards it.
    expect(island.position[2]).toBeLessThan(
      Math.min(...scene.bounds.map((corner) => corner[2])),
    );
  });

  it('keeps the canoes on the water, whatever the shore is set to', () => {
    /**
     * The shoreline was typed into three places and moved four times in as many
     * turns, and twice it left the boats sitting on grass. Shore, canoes and
     * island all come off one constant now, so this holds the relationship
     * rather than the numbers: whatever the shore is, nothing floats on land.
     */
    const shore = scene.water!.centerZ + scene.water!.depth / 2;

    for (const line of scene.canoeLines) {
      for (const [, z] of [line.from, line.to]) {
        expect(z, 'a canoe is on dry land').toBeLessThan(shore);
      }
    }

    // And nothing that stands on land is standing in the lake.
    for (const piece of scene.backdrop) {
      if (piece.asset.entry.id === 'city_van_akdamar_island') continue;
      const [, , depth] = piece.asset.entry.dimensions;
      const cos = Math.abs(Math.cos(piece.rotationY));
      const sin = Math.abs(Math.sin(piece.rotationY));
      const halfZ = (piece.asset.entry.dimensions[0] * sin + depth * cos) / 2;
      expect(piece.position[2] - halfZ, `${piece.asset.entry.id} is in the lake`).toBeGreaterThan(
        shore,
      );
    }
  });

  it('answers its four directions with nothing another city uses', () => {
    const ids = scene.backdrop.map((piece) => piece.asset.entry.id);
    expect(ids).toContain('city_van_townhouses');
    expect(ids).toContain('city_van_akdamar_island');
    expect(ids.some((id) => /istanbul|nevsehir|gaziantep|kars/.test(id))).toBe(false);

    // Steppe, not Ani's bedrock: both are eastern and that is where it stops.
    expect(scene.groundSurface).toBe('steppe');
    /**
     * İstanbul's rigged tabbies walk the street. Van's own white odd-eyed cat
     * arrived without a rig, so it sits in the basket at stop one where a child
     * can look at it — which is where the question is answered anyway. A cat
     * sliding across the ground with its feet still would be worse than a cat
     * of the wrong colour (D-152).
     */
    expect(scene.animal).toBe('cat');
    // The cat arrived before its basket, so stop one is the cat on its own.
    expect(scene.hotspots[0]!.asset.entry.id).toBe('city_van_odd_eyed_cat');
    expect(scene.balloons).toHaveLength(0);
  });
});

describe('Kars looks like Ani', () => {
  const scene = buildScene(loadComposedCity('kars'), 'high');

  it('stands three different ruins apart, and never the same one twice running', () => {
    /**
     * Ani is mostly sky. Its sides are separate buildings with the plateau
     * visible between them, not the continuous run that İstanbul and Gaziantep
     * close their streets with — those are streets, and this has not been one
     * for eight hundred years.
     */
    const ruins = scene.backdrop.filter((prop) => /chapel|church/.test(prop.asset.entry.id));
    expect(ruins.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ruins.map((r) => r.asset.entry.id)).size).toBeGreaterThan(1);

    /**
     * The alternation rule is about the two rows down the street, which a child
     * walks past one after another. The corner ruins that fill the far edges of
     * the plateau are not a row and do not have to alternate — they are the
     * site continuing, seen all at once from a distance.
     */
    const back = Math.max(...scene.bounds.map((corner) => corner[2]));
    /**
     * The row a child walks past, which is the one the alternation is for.
     * The outer ring beyond thirty metres is seen all at once from a distance
     * and is not a row at all.
     */
    const sideShells = ruins.filter((r) => r.position[2] <= back && Math.abs(r.position[0]) < 30);
    for (const side of [-1, 1]) {
      const row = sideShells
        .filter((r) => Math.sign(r.position[0]) === side)
        .sort((a, b) => b.position[2] - a.position[2]);
      expect(row.length, `nothing down side ${side}`).toBeGreaterThan(1);
      for (let i = 1; i < row.length; i += 1) {
        expect(row[i]!.asset.entry.id, `two the same in a row on side ${side}`).not.toBe(
          row[i - 1]!.asset.entry.id,
        );
      }
    }

    /**
     * Both sides of the back are inhabited, and the ground by the railway is
     * left open on purpose because the gorge is already doing the work there.
     *
     * Counted per side rather than in total: six ruins all on one side would
     * satisfy a total and leave half the back bare, which is the complaint
     * this is here to answer.
     */
    for (const side of [-1, 1]) {
      const behindOnThisSide = ruins.filter(
        (r) => r.position[2] > back && Math.sign(r.position[0]) === side,
      );
      expect(behindOnThisSide.length, `nothing behind the square on side ${side}`).toBeGreaterThanOrEqual(2);
    }
    const walls = scene.backdrop.filter((p) => p.asset.entry.id === 'city_kars_ani_walls');
    expect(walls.filter((w) => w.position[0] < 0)).toHaveLength(1);
    expect(walls.filter((w) => w.position[0] > 0)).toHaveLength(1);

    // Turned individually. A ruin has no frontage, and squaring them to the
    // street would rebuild the city rather than leave it fallen.
    const angles = new Set(ruins.map((r) => Math.round(r.rotationY * 100)));
    expect(angles.size).toBe(ruins.length);

    // Nothing solid on the sides: a child may walk between them.
    for (const ruin of ruins) expect(ruin.solid, ruin.asset.entry.id).toBe(false);
  });

  it('closes the ring of scenery, measured rather than eyeballed', () => {
    /**
     * Four attempts were made at "the sides look empty" by reading positions
     * and judging them full. All four missed the same two windows, because a
     * list of coordinates does not tell you what a child can see.
     *
     * This measures it: sweep the full circle from where the child stands,
     * mark every degree some piece of scenery covers, and require no hole. Two
     * windows either side at roughly ninety degrees had been open the whole
     * time — the direction a child looks when they turn to the side rather
     * than round.
     *
     * The front is exempt. The street runs out towards the gorge and the
     * railway on purpose, and distance is Kars's answer to that direction the
     * way the sea is İstanbul's.
     */
    const FRONT_EXEMPT = 40; // degrees either side of straight ahead
    const viewpoints: readonly (readonly [string, number, number])[] = [
      ['the spawn', 0, 0],
      ['mid-street', 0, -24],
    ];

    for (const [name, vx, vz] of viewpoints) {
      const covered = new Array(360).fill(false);
      for (const piece of scene.backdrop) {
        const [width, , depth] = piece.asset.entry.dimensions;
        const cos = Math.abs(Math.cos(piece.rotationY));
        const sin = Math.abs(Math.sin(piece.rotationY));
        const halfX = (width * cos + depth * sin) / 2;
        const halfZ = (width * sin + depth * cos) / 2;
        const [x, , z] = piece.position;

        const angles: number[] = [];
        for (const cx of [x - halfX, x + halfX]) {
          for (const cz of [z - halfZ, z + halfZ]) {
            angles.push(((Math.atan2(cx - vx, cz - vz) * 180) / Math.PI + 360) % 360);
          }
        }
        let lo = Math.min(...angles);
        let hi = Math.max(...angles);
        if (hi - lo > 180) {
          const shifted = angles.map((a) => (a < 180 ? a + 360 : a));
          lo = Math.min(...shifted);
          hi = Math.max(...shifted);
        }
        for (let a = Math.floor(lo); a <= Math.ceil(hi); a += 1) {
          covered[((a % 360) + 360) % 360] = true;
        }
      }

      let run = 0;
      let worst = 0;
      let worstAt = 0;
      for (let a = 0; a < 360; a += 1) {
        const towardsFront = Math.min(a, 360 - a) <= FRONT_EXEMPT;
        if (covered[a] || towardsFront) {
          run = 0;
          continue;
        }
        run += 1;
        if (run > worst) {
          worst = run;
          worstAt = a;
        }
      }
      expect(worst, `${name}: ${worst}° of empty horizon around ${worstAt}°`).toBeLessThan(6);
    }
  });

  it('leaves the middle of the back open, for the mountain to fill', () => {
    /**
     * The walls were centred and overlapping, which closed the back completely
     * — and closing the back is what put a wall in front of Sarıkamış. A child
     * turning round saw stonework across the whole view and the mountain only
     * through a gate arch.
     *
     * They flank now. What this holds is the shape of that decision: two walls,
     * one each side, with real sky between them, and a mountain wide enough and
     * tall enough to be what fills it.
     */
    const walls = scene.backdrop.filter((p) => p.asset.entry.id === 'city_kars_ani_walls');
    expect(walls).toHaveLength(2);

    const spanOf = (piece: (typeof walls)[number]) => {
      const [width, , depth] = piece.asset.entry.dimensions;
      const cos = Math.abs(Math.cos(piece.rotationY));
      const sin = Math.abs(Math.sin(piece.rotationY));
      const halfX = (width * cos + depth * sin) / 2;
      return [piece.position[0] - halfX, piece.position[0] + halfX] as const;
    };
    const [west, east] = walls
      .map(spanOf)
      .sort((a, b) => a[0] - b[0]) as [readonly [number, number], readonly [number, number]];

    // One each side of the centre line, and a real gap between them.
    expect(west[1]).toBeLessThan(0);
    expect(east[0]).toBeGreaterThan(0);
    expect(east[0] - west[1], 'no sky between the walls').toBeGreaterThan(20);

    const mountain = scene.backdrop.find(
      (p) => p.asset.entry.id === 'city_kars_sarikamis_mountain',
    )!;
    expect(mountain).toBeDefined();

    // Wide enough to cover the gap it is seen through, and taller than the
    // walls by enough to read as a mountain rather than a further wall.
    const [mountainWidth, mountainHeight, mountainDepth] = mountain.asset.entry.dimensions;
    expect(mountain.position[0] - mountainWidth / 2).toBeLessThan(west[1]);
    expect(mountain.position[0] + mountainWidth / 2).toBeGreaterThan(east[0]);
    expect(mountainHeight).toBeGreaterThan(walls[0]!.asset.entry.dimensions[1] * 2);

    // And behind them, near edge and all.
    const [, , wallsDepth] = walls[0]!.asset.entry.dimensions;
    expect(mountain.position[2] - mountainDepth / 2).toBeGreaterThan(
      walls[0]!.position[2] + wallsDepth / 2,
    );

    // Nothing else parked on the centre line behind the square, which is the
    // sightline the mountain is seen along.
    const back = Math.max(...scene.bounds.map((corner) => corner[2]));
    for (const piece of scene.backdrop) {
      if (piece.position[2] <= back) continue;
      if (piece.asset.entry.id === 'city_kars_sarikamis_mountain') continue;
      expect(Math.abs(piece.position[0]), `${piece.asset.entry.id} blocks the mountain`).toBeGreaterThan(15);
    }
  });

  it('keeps the gorge outside the play area, aligned by its near edge', () => {
    /**
     * Sixty-four metres deep. Centred on the boundary it would put the child
     * inside the ravine, which is what the Nevşehir valley did first (D-101).
     */
    const gorges = scene.backdrop.filter((p) => p.asset.entry.id === 'city_kars_ani_gorge');
    expect(gorges.length).toBeGreaterThan(0);
    const playFront = Math.min(...scene.bounds.map((corner) => corner[2]));

    for (const gorge of gorges) {
      const [, , depth] = gorge.asset.entry.dimensions;
      const nearEdge = gorge.position[2] + depth / 2;
      expect(nearEdge, 'gorge reaches into the play area').toBeLessThanOrEqual(playFront);
      expect(gorge.solid).toBe(true);
    }
  });

  it('answers its four directions with nothing another city uses', () => {
    const ids = scene.backdrop.map((prop) => prop.asset.entry.id);
    expect(ids).toContain('city_kars_ani_walls');
    expect(ids).toContain('city_kars_ani_cathedral');
    expect(ids.some((id) => /istanbul|nevsehir|gaziantep/.test(id))).toBe(false);

    // Bare rock, with turf only where the geese stand.
    expect(scene.groundSurface).toBe('rock');
    expect(scene.groundPatches).toHaveLength(1);
    expect(scene.groundPatches[0]!.surface).toBe('grass');

    const geese = scene.props.filter((p) => p.asset.entry.id.startsWith('kit_goose'));
    const patch = scene.groundPatches[0]!;
    for (const goose of geese) {
      const gap = Math.hypot(
        goose.position[0] - patch.position[0],
        goose.position[2] - patch.position[2],
      );
      expect(gap, 'a goose standing off the grass').toBeLessThan(patch.radius);
    }
  });
});

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
    // Dogs, not cats. The region default is a cat and Gaziantep overrides it.
    expect(scene.animal).toBe('dog');
    expect(new Set(scene.animals.map((a) => a.asset.entry.id)).size).toBe(2);
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

  it('stands the castle at the end of the walk, not behind it', () => {
    /**
     * It used to close the back of the square, which put the one thing in
     * Gaziantep a child would cross a room to look at over their shoulder from
     * the moment they arrived, with the street running out towards olive
     * groves. It closes the far end now and grows as they walk towards it.
     */
    const castle = scene.backdrop.find(
      (prop) => prop.asset.entry.id === 'city_gaziantep_castle',
    )!;
    const spawnZ = city.spawn.position[2];
    const halfDepth = castle.asset.entry.dimensions[2] / 2;
    const front = Math.min(...scene.bounds.map((corner) => corner[2]));

    // Ahead of the child, and far enough ahead to be a destination.
    expect(castle.position[2]).toBeLessThan(spawnZ - 40);
    // Aligned by its near edge: a 37 m landscape centred on the boundary would
    // put the child inside a castle, which is the mistake the valley made first.
    expect(castle.position[2] + halfDepth).toBeLessThanOrEqual(front + 0.5);
    expect(castle.solid).toBe(true);

    // And the groves it swapped with are behind the square now.
    const groves = scene.backdrop.filter((p) => p.asset.entry.id === 'kit_olive_grove');
    expect(groves.some((grove) => grove.position[2] > spawnZ + 20)).toBe(true);
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
