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
    expect(files.sort()).toEqual(['istanbul_theme.webm', 'nevsehir_theme.webm']);
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

describe('the guide speaks', () => {
  it('reads a stop in the order a child meets it', async () => {
    const { stopNarration } = await import('@/engine/audio/speech');
    const line = stopNarration({
      guideLine: 'Look up, my friend!',
      title: 'Galata Tower',
      description: 'Sailors once watched for fires from the top.',
    });
    expect(line).toBe(
      'Look up, my friend!. Galata Tower. Sailors once watched for fires from the top.',
    );
  });

  it('says nothing when a stop has nothing to say', async () => {
    const { stopNarration } = await import('@/engine/audio/speech');
    expect(stopNarration({ guideLine: '', title: '', description: '' })).toBe('');
  });

  it('prefers an English voice, and a local one over a network one', async () => {
    const { chooseVoice } = await import('@/engine/audio/speech');
    const voices = [
      { name: 'Yelda', lang: 'tr-TR', localService: true },
      { name: 'Google UK English Male', lang: 'en-GB', localService: false },
      { name: 'Daniel', lang: 'en-GB', localService: true },
    ] as unknown as SpeechSynthesisVoice[];

    // A network voice pauses before it starts, and a guide who takes a second
    // to begin reads as a guide who is buffering.
    expect(chooseVoice(voices)?.name).toBe('Daniel');
  });

  it('falls back rather than going silent when no English voice exists', async () => {
    const { chooseVoice } = await import('@/engine/audio/speech');
    const voices = [{ name: 'Yelda', lang: 'tr-TR', localService: true }] as unknown as SpeechSynthesisVoice[];
    expect(chooseVoice(voices)?.name).toBe('Yelda');
    expect(chooseVoice([])).toBeNull();
  });

  it('reads slower than a browser reads to an adult', async () => {
    const { SPEECH_RATE } = await import('@/engine/audio/speech');
    // A child following the text on screen needs the words at about the speed
    // they would read them.
    expect(SPEECH_RATE).toBeLessThan(1);
    expect(SPEECH_RATE).toBeGreaterThan(0.8);
  });

  it('is safe to call where the browser has no speech at all', async () => {
    const { speak, stopSpeaking, isSpeaking, speechSupport } = await import(
      '@/engine/audio/speech'
    );
    expect(speechSupport().available).toBe(false);
    expect(() => speak('hello')).not.toThrow();
    expect(() => stopSpeaking()).not.toThrow();
    expect(isSpeaking()).toBe(false);
  });
});

describe('each city has its own theme', () => {
  it('gives İstanbul and Nevşehir different music, and neither to Gaziantep', async () => {
    const { buildScene } = await import('@/engine/scene/buildScene');
    const { loadComposedCity } = await import('./helpers');

    const istanbul = buildScene(loadComposedCity('istanbul'), 'high').musicUrl;
    const nevsehir = buildScene(loadComposedCity('nevsehir'), 'high').musicUrl;

    expect(istanbul).not.toBeNull();
    expect(nevsehir).not.toBeNull();
    // A Bosphorus song over Cappadocia is the audio equivalent of planting
    // plane trees there.
    expect(istanbul).not.toBe(nevsehir);
    // Silent rather than borrowing a neighbour's.
    expect(buildScene(loadComposedCity('gaziantep'), 'high').musicUrl).toBeNull();
  });

  it('keeps every theme small enough to stream on a tablet', async () => {
    const { readdirSync, statSync } = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(process.cwd(), 'public/assets/audio');
    for (const file of readdirSync(dir)) {
      expect(statSync(path.join(dir, file)).size / (1024 * 1024), file).toBeLessThan(2.5);
    }
  });
});
