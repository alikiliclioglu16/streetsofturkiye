import { describe, expect, it } from 'vitest';
import {
  ARRIVE_RADIUS,
  GIVE_UP_SECONDS,
  idleWalk,
  stepWalk,
  turnTowards,
  walkTo,
} from '@/engine/controls/tapToWalk';

/**
 * Walking by tapping.
 *
 * The stick works and a child can learn it. The point of this control is that
 * there is nothing to learn, so the tests are about the ways it could quietly
 * fail to feel that way: never arriving, never giving up, spinning on the spot.
 */
describe('tap to walk', () => {
  const at = (x: number, z: number) => ({ x, z });

  it('walks towards where the child tapped', () => {
    const step = stepWalk(walkTo({ x: 10, z: 0 }), at(0, 0), 1 / 60);
    expect(step.forward).toBe(1);
    expect(step.heading).toBeCloseTo(Math.PI / 2, 3);
  });

  it('stops on arrival rather than circling the point', () => {
    const step = stepWalk(walkTo({ x: 0.2, z: 0.2 }), at(0, 0), 1 / 60);
    expect(step.forward).toBe(0);
    expect(step.state.destination).toBeNull();
  });

  it('arrives from a real walk, in a time a child will wait', () => {
    let state = walkTo({ x: 0, z: -30 });
    let position = at(0, 0);
    let seconds = 0;

    while (state.destination && seconds < GIVE_UP_SECONDS) {
      const step = stepWalk(state, position, 1 / 60);
      state = step.state;
      if (step.heading !== null) {
        position = { x: position.x, z: position.z - (7.4 / 60) };
      }
      seconds += 1 / 60;
    }

    expect(state.destination, 'never arrived').toBeNull();
    expect(seconds).toBeLessThan(6);
    expect(Math.abs(position.z + 30)).toBeLessThan(ARRIVE_RADIUS + 0.2);
  });

  it('gives up when wedged, instead of pressing into a wall forever', () => {
    // A destination inside a building: the guide never gets closer.
    let state = walkTo({ x: 0, z: -30 });
    const stuck = at(0, -10);
    let seconds = 0;

    while (state.destination && seconds < GIVE_UP_SECONDS + 1) {
      state = stepWalk(state, stuck, 1 / 60).state;
      seconds += 1 / 60;
    }

    expect(state.destination, 'kept walking into a wall').toBeNull();
    // Noticed by lack of progress, well before the hard timeout.
    expect(seconds).toBeLessThan(5);
  });

  it('does nothing at all with no destination', () => {
    const step = stepWalk(idleWalk, at(3, 4), 1 / 60);
    expect(step.forward).toBe(0);
    expect(step.heading).toBeNull();
  });

  it('turns rather than snapping round', () => {
    const turned = turnTowards(0, Math.PI, 1 / 60);
    expect(Math.abs(turned)).toBeGreaterThan(0);
    // A quarter of a second of turning does not complete a half turn.
    expect(Math.abs(turned)).toBeLessThan(Math.PI / 2);
  });

  it('takes the short way round the circle', () => {
    // From just under a half turn to just over it: three degrees, not 357.
    const turned = turnTowards(3.0, -3.0, 1 / 60);
    expect(turned).toBeGreaterThan(3.0);
  });
});
