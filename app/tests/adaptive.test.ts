import { describe, expect, it } from 'vitest';
import {
  COOLDOWN_SAMPLES,
  FPS_FLOOR,
  SAMPLES_BEFORE_STEP,
  considerSample,
  initialAdaptiveState,
  type AdaptiveState,
} from '@/engine/heroes/adaptive';
import { QUALITY_PROFILES } from '@/engine/heroes/policy';

const feed = (fps: number[], profile: 'high' | 'balanced' | 'safe' = 'high', automatic = true) => {
  let state: AdaptiveState = initialAdaptiveState;
  let current = profile;
  const steps: string[] = [];
  for (const sample of fps) {
    const decision = considerSample(state, sample, current, automatic);
    state = decision.state;
    if (decision.nextProfile) {
      current = decision.nextProfile;
      steps.push(decision.nextProfile);
    }
  }
  return { state, current, steps };
};

describe('adaptive quality', () => {
  it('leaves a healthy frame rate alone', () => {
    const { current, steps } = feed(Array(40).fill(58));
    expect(current).toBe('high');
    expect(steps).toEqual([]);
  });

  it('steps down after a sustained low frame rate, not a single dip', () => {
    // One bad sample among good ones must not change anything.
    expect(feed([60, 60, 12, 60, 60]).steps).toEqual([]);
    // Sustained does.
    expect(feed(Array(SAMPLES_BEFORE_STEP).fill(19)).steps).toEqual(['balanced']);
  });

  it('reproduces the measured field case', () => {
    // 19 fps on `high`, held. Two steps take it to the lightest profile.
    const { current, steps } = feed(Array(60).fill(19));
    expect(steps).toEqual(['balanced', 'safe']);
    expect(current).toBe('safe');
  });

  it('waits out a cooldown so the new profile gets a fair reading', () => {
    let state = initialAdaptiveState;
    for (let i = 0; i < SAMPLES_BEFORE_STEP; i += 1) {
      state = considerSample(state, 19, 'high', true).state;
    }
    expect(state.cooldown).toBe(COOLDOWN_SAMPLES);
    // During cooldown a low sample cannot trigger another step.
    const during = considerSample(state, 10, 'balanced', true);
    expect(during.nextProfile).toBeNull();
  });

  it('stops at the lightest profile instead of looping', () => {
    const { steps } = feed(Array(200).fill(5), 'safe');
    expect(steps).toEqual([]);
  });

  it('never overrides a profile the player chose by hand', () => {
    const { steps } = feed(Array(60).fill(5), 'high', false);
    expect(steps).toEqual([]);
  });

  it('never touches the hero mesh, only the environment', () => {
    // The thing adaptive quality is allowed to change.
    const high = QUALITY_PROFILES.high;
    const safe = QUALITY_PROFILES.safe;
    expect(safe.maxDpr).toBeLessThan(high.maxDpr);
    expect(safe.heroShadow).toBe(false);
    // The thing it is not: there is no mesh field to change.
    expect(Object.keys(high)).not.toContain('heroMesh');
    expect(Object.keys(high)).not.toContain('heroTriangles');
  });

  it('uses a floor a child would notice, not a purist one', () => {
    expect(FPS_FLOOR).toBeGreaterThanOrEqual(24);
    expect(FPS_FLOOR).toBeLessThanOrEqual(30);
  });
});
