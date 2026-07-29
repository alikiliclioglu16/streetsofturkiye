/**
 * The guide's voice, spoken by the browser.
 *
 * Many six to ten year olds read slowly, and for a good number of them English
 * is the language of school rather than of home. A stop whose text is only read
 * by children who can already read it is a stop that teaches the ones who least
 * need teaching. Hearing it removes that barrier.
 *
 * `speechSynthesis` rather than recordings, for now: 249 stops across 81 cities
 * is a serious amount of studio time, and this costs nothing, ships nothing and
 * works today. Recorded audio can replace it later without the calling code
 * changing — `speak()` is the whole interface.
 *
 * Speech does not run through the Web Audio graph, so this channel's mute and
 * volume are applied here rather than on a GainNode.
 */

import { channelStates, duckAmbience } from '@/engine/audio/engine';

export interface SpeechSupport {
  readonly available: boolean;
  readonly voices: number;
}

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

export function speechSupport(): SpeechSupport {
  const engine = synth();
  if (!engine) return { available: false, voices: 0 };
  return { available: true, voices: engine.getVoices().length };
}

/**
 * Picks a voice.
 *
 * English, because that is the language of the content. Beyond that the
 * preference is for a local voice over a network one — a network voice
 * introduces a pause before the guide starts talking, and a guide who takes a
 * second to begin reads as a guide who is buffering.
 */
export function chooseVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  if (english.length === 0) return voices[0] ?? null;

  const local = english.filter((voice) => voice.localService);
  const pool = local.length > 0 ? local : english;

  // A named male voice suits the Hodja; failing that, whatever the browser
  // offers first, which is usually the system default and the best tested.
  const male = pool.find((voice) => /male|david|daniel|alex|fred|george/i.test(voice.name));
  return male ?? pool[0] ?? null;
}

/**
 * Rate.
 *
 * Slower than a browser's default, which is pitched at adults skimming. A child
 * following along with the text on screen needs the words to arrive at about
 * the speed they would read them.
 */
export const SPEECH_RATE = 0.92;
export const SPEECH_PITCH = 0.95;

let speaking = false;

/** True while the guide is talking. */
export function isSpeaking(): boolean {
  return speaking;
}

/**
 * Reads a line aloud, replacing anything already being read.
 *
 * Replacing rather than queueing: a child who walks straight from one stop to
 * the next should hear the stop they are at, not wait out the one behind them.
 */
export function speak(text: string): void {
  const engine = synth();
  if (!engine) return;

  const state = channelStates().voice;
  if (state.muted || text.trim().length === 0) return;

  engine.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice(engine.getVoices());
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }
  utterance.rate = SPEECH_RATE;
  utterance.pitch = SPEECH_PITCH;
  utterance.volume = state.volume;

  utterance.onstart = () => {
    speaking = true;
    // The bed and the theme step back so the guide is not competing with them.
    duckAmbience(true);
  };
  const finish = () => {
    speaking = false;
    duckAmbience(false);
  };
  utterance.onend = finish;
  utterance.onerror = finish;

  engine.speak(utterance);
}

/** Stops the guide mid-sentence, for a panel closing or a city being left. */
export function stopSpeaking(): void {
  const engine = synth();
  if (!engine) return;
  engine.cancel();
  if (speaking) {
    speaking = false;
    duckAmbience(false);
  }
}

/**
 * Everything a stop should say, in the order a child meets it.
 *
 * Kept here rather than in the component so what the guide reads is one
 * decision in one place, and so it can be checked without a browser.
 */
export function stopNarration(input: {
  guideLine: string;
  title: string;
  description: string;
}): string {
  return [input.guideLine, input.title, input.description]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('. ')
    .replace(/\.\.+/g, '.');
}
