import { describe, expect, it } from 'vitest';
import {
  initialInteractionContext,
  interactionReducer,
  resolveInteractionType,
  type InteractionContext,
  type InteractionEvent,
} from '@/engine/interactions/machine';

const run = (events: InteractionEvent[], from: InteractionContext = initialInteractionContext) =>
  events.reduce(interactionReducer, from);

describe('interaction state machine', () => {
  it('walks the full loop from proximity to completion', () => {
    const result = run([
      { type: 'HOTSPOT_IN_RANGE', hotspotId: 'istanbul-iznik-tile' },
      { type: 'BEGIN' },
      { type: 'CAMERA_SETTLED' },
      { type: 'ANSWER', correct: true },
      { type: 'CLAIM_REWARD' },
      { type: 'DISMISS' },
    ]);
    expect(result.state).toBe('complete');
    expect(result.hotspotId).toBe('istanbul-iznik-tile');
  });

  it('counts attempts and returns to active on retry', () => {
    const result = run([
      { type: 'HOTSPOT_IN_RANGE', hotspotId: 'a' },
      { type: 'BEGIN' },
      { type: 'CAMERA_SETTLED' },
      { type: 'ANSWER', correct: false },
      { type: 'RETRY' },
      { type: 'ANSWER', correct: false },
    ]);
    expect(result.state).toBe('retry');
    expect(result.attempts).toBe(2);
  });

  it('cannot skip the interaction to reach the reward', () => {
    const result = run([
      { type: 'HOTSPOT_IN_RANGE', hotspotId: 'a' },
      { type: 'CLAIM_REWARD' },
    ]);
    expect(result.state).toBe('available');
  });

  it('resets when the player walks away', () => {
    const result = run([
      { type: 'HOTSPOT_IN_RANGE', hotspotId: 'a' },
      { type: 'HOTSPOT_OUT_OF_RANGE' },
    ]);
    expect(result).toEqual(initialInteractionContext);
  });

  it('switches to a new hotspot after one is complete', () => {
    const finished = run([
      { type: 'HOTSPOT_IN_RANGE', hotspotId: 'a' },
      { type: 'BEGIN' },
      { type: 'CAMERA_SETTLED' },
      { type: 'ANSWER', correct: true },
      { type: 'CLAIM_REWARD' },
      { type: 'DISMISS' },
    ]);
    const next = interactionReducer(finished, { type: 'HOTSPOT_IN_RANGE', hotspotId: 'b' });
    expect(next.state).toBe('available');
    expect(next.hotspotId).toBe('b');
  });

  it('degrades unimplemented interaction types to an accessible choice', () => {
    expect(resolveInteractionType('inspect-and-find')).toEqual({ resolved: 'inspect-and-find', degraded: false });
    expect(resolveInteractionType('rhythm-repeat')).toEqual({ resolved: 'simple-choice', degraded: true });
    expect(resolveInteractionType('simple-choice')).toEqual({ resolved: 'simple-choice', degraded: false });
  });
});
