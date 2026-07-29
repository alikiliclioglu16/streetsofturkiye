import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHANNELS,
  DUCK_FACTOR,
  effectiveGain,
  isUnlocked,
  type AudioChannel,
} from '@/engine/audio/engine';

/**
 * The audio engine has no context in a test environment, which is the point:
 * everything here has to be safe to call before a browser has let us make a
 * sound, and safe to call in a server render.
 */
describe('audio channels', () => {
  const channels: AudioChannel[] = ['voice', 'ambience', 'ui'];

  it('starts locked, because a browser will not allow sound before a gesture', () => {
    expect(isUnlocked()).toBe(false);
  });

  it('has a channel for each reason a person mutes', () => {
    expect(Object.keys(DEFAULT_CHANNELS).sort()).toEqual(['ambience', 'ui', 'voice']);
    for (const channel of channels) {
      expect(DEFAULT_CHANNELS[channel].muted, channel).toBe(false);
    }
  });

  it('keeps the guide louder than the bed behind him', () => {
    expect(DEFAULT_CHANNELS.voice.volume).toBeGreaterThan(DEFAULT_CHANNELS.ambience.volume);
    expect(DEFAULT_CHANNELS.ui.volume).toBeGreaterThan(DEFAULT_CHANNELS.ambience.volume);
  });

  it('silences a muted channel completely, ducked or not', () => {
    const muted = { muted: true, volume: 1 };
    expect(effectiveGain(muted, false)).toBe(0);
    expect(effectiveGain(muted, true)).toBe(0);
  });

  it('steps the ambience back while the guide speaks rather than removing it', () => {
    const bed = DEFAULT_CHANNELS.ambience;
    const ducked = effectiveGain(bed, true);
    expect(ducked).toBeGreaterThan(0);
    expect(ducked).toBeLessThan(effectiveGain(bed, false));
    expect(DUCK_FACTOR).toBeGreaterThan(0.2);
  });

  it('can be driven with no audio context present', async () => {
    const { unlockAudio, setChannelState, duckAmbience, stopAudio } = await import(
      '@/engine/audio/engine'
    );
    const { playCollect, playCorrect, playRetry, playCityComplete, startAmbience, stopAmbience } =
      await import('@/engine/audio/cues');

    // None of these may throw where AudioContext does not exist — a server
    // render, a test, or a browser that has refused us.
    await expect(unlockAudio()).resolves.toBe(false);
    expect(() => setChannelState('ui', { muted: true, volume: 1 })).not.toThrow();
    expect(() => duckAmbience(true)).not.toThrow();
    for (const cue of [playCollect, playCorrect, playRetry, playCityComplete, startAmbience, stopAmbience]) {
      expect(() => cue(), cue.name).not.toThrow();
    }
    expect(() => stopAudio()).not.toThrow();
  });

  it('ships no audio files, because every cue is synthesised', async () => {
    const { existsSync } = await import('node:fs');
    const path = await import('node:path');
    // The whole sound design is oscillators and filtered noise, so it costs
    // nothing to download. Recorded voice and seagulls land on top of it later.
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/audio'))).toBe(false);
  });
});
