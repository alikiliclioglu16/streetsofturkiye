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
  const channels: AudioChannel[] = ['voice', 'music', 'ambience', 'ui'];

  it('starts locked, because a browser will not allow sound before a gesture', () => {
    expect(isUnlocked()).toBe(false);
  });

  it('has a channel for each reason a person mutes', () => {
    expect(Object.keys(DEFAULT_CHANNELS).sort()).toEqual(['ambience', 'music', 'ui', 'voice']);
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
    const {
      playCollect,
      playCorrect,
      playRetry,
      playCityComplete,
      startAmbience,
      stopAmbience,
      stopMusic,
    } = await import('@/engine/audio/cues');

    // None of these may throw where AudioContext does not exist — a server
    // render, a test, or a browser that has refused us.
    await expect(unlockAudio()).resolves.toBe(false);
    expect(() => setChannelState('ui', { muted: true, volume: 1 })).not.toThrow();
    expect(() => duckAmbience(true)).not.toThrow();
    for (const cue of [
      playCollect,
      playCorrect,
      playRetry,
      playCityComplete,
      startAmbience,
      stopAmbience,
      stopMusic,
    ]) {
      expect(() => cue(), cue.name).not.toThrow();
    }
    expect(() => stopAudio()).not.toThrow();
  });

  it('synthesises every cue, and streams the one thing that is a recording', async () => {
    const { readdirSync, statSync } = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(process.cwd(), 'public/assets/audio');
    const files = readdirSync(dir);

    // Interface cues and the ambience bed are oscillators and filtered noise,
    // so the only file here is the city theme.
    expect(files).toEqual(['istanbul_theme.webm']);
    for (const file of files) {
      // Opus in WebM, streamed rather than decoded into memory.
      expect(file.endsWith('.webm'), file).toBe(true);
      expect(statSync(path.join(dir, file)).size / (1024 * 1024)).toBeLessThan(2.5);
    }
  });

  it('keeps the theme under the street rather than over it', () => {
    expect(DEFAULT_CHANNELS.music.volume).toBeLessThan(DEFAULT_CHANNELS.voice.volume);
    expect(DEFAULT_CHANNELS.music.volume).toBeLessThan(DEFAULT_CHANNELS.ui.volume);
  });
});
