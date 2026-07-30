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

    /**
     * Interface cues and the ambience bed are oscillators and filtered noise,
     * so the only files here are city themes.
     *
     * Not a list of filenames. That was written when there were two, failed
     * when Gaziantep got a theme and failed again when Kars did, and each time
     * it recorded the day it was written rather than the rule. The rule is that
     * nothing lives in this directory except a theme belonging to a city that
     * exists.
     */
    const { PLAYABLE_CITY_IDS } = await import('@/content/loaders/loadCity');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const cityId = file.replace('_theme.webm', '');
      expect(PLAYABLE_CITY_IDS as readonly string[], file).toContain(cityId);
    }
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
  it('gives every playable city music, and no two of them the same', async () => {
    const { buildScene } = await import('@/engine/scene/buildScene');
    const { loadComposedCity } = await import('./helpers');
    const { PLAYABLE_CITY_IDS, PILOT_CITY_IDS } = await import('@/content/loaders/loadCity');

    /**
     * Two halves, and they have different scopes.
     *
     * A finished city must have a theme. An open one need not — Kars is
     * walkable with placeholder art and a silent sky, the same way Gaziantep
     * was. Requiring music of every playable city would mean a province cannot
     * be opened until someone has found a folk song for it, which is the
     * opposite of how every other city here was built.
     *
     * What holds everywhere is that no two cities share one. A Bosphorus song
     * over Cappadocia is the audio equivalent of planting plane trees there,
     * and a city is silent rather than borrowing a neighbour's.
     */
    for (const cityId of PILOT_CITY_IDS) {
      expect(buildScene(loadComposedCity(cityId), 'high').musicUrl, cityId).not.toBeNull();
    }

    const themes = PLAYABLE_CITY_IDS.map(
      (cityId) => buildScene(loadComposedCity(cityId), 'high').musicUrl,
    ).filter((url): url is string => url !== null);
    expect(new Set(themes).size).toBe(themes.length);
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
