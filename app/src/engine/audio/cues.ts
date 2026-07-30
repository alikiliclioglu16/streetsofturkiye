import { audioContext, channelNode } from '@/engine/audio/engine';

/**
 * Sound without files.
 *
 * The interface cues are synthesised rather than recorded, for the same reason
 * the cobblestone is generated: they are simple enough that a few oscillators
 * say it, and every kilobyte here is one a child waits for.
 *
 * The notes are a pentatonic set. It has no semitone clashes, so any two of
 * these can overlap — a collect landing on top of a correct answer — without
 * sounding like a mistake.
 */
const PENTATONIC = {
  d4: 293.66,
  e4: 329.63,
  g4: 392.0,
  a4: 440.0,
  b4: 493.88,
  d5: 587.33,
  e5: 659.25,
  g5: 783.99,
} as const;

type Note = keyof typeof PENTATONIC;

interface Blip {
  note: Note;
  /** Seconds from the start of the cue. */
  at: number;
  duration: number;
  gain: number;
}

/** A short bell-like tone. Triangle waves read as friendly rather than electronic. */
function playBlip(blip: Blip, startedAt: number): void {
  const context = audioContext();
  const destination = channelNode('ui');
  if (!context || !destination) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = PENTATONIC[blip.note];

  const begin = startedAt + blip.at;
  const end = begin + blip.duration;
  envelope.gain.setValueAtTime(0.0001, begin);
  envelope.gain.exponentialRampToValueAtTime(blip.gain, begin + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(envelope).connect(destination);
  oscillator.start(begin);
  oscillator.stop(end + 0.02);
}

function playCue(blips: readonly Blip[]): void {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime + 0.01;
  for (const blip of blips) playBlip(blip, now);
}

/** Something went into the backpack. Rising, because it is a gain. */
export function playCollect(): void {
  playCue([
    { note: 'd5', at: 0, duration: 0.12, gain: 0.35 },
    { note: 'g5', at: 0.08, duration: 0.18, gain: 0.3 },
  ]);
}

/** A correct answer. Two notes, up. */
export function playCorrect(): void {
  playCue([
    { note: 'e4', at: 0, duration: 0.14, gain: 0.3 },
    { note: 'b4', at: 0.1, duration: 0.24, gain: 0.28 },
  ]);
}

/**
 * A wrong answer.
 *
 * Deliberately not a buzzer. A child who gets a question wrong in a learning
 * game should hear something neutral and try again, not a noise that says they
 * failed. Two soft notes, gently down, at a lower volume than the others.
 */
export function playRetry(): void {
  playCue([
    { note: 'a4', at: 0, duration: 0.16, gain: 0.18 },
    { note: 'e4', at: 0.11, duration: 0.22, gain: 0.16 },
  ]);
}

/** A whole city finished. The longest cue in the game, and still under a second. */
export function playCityComplete(): void {
  playCue([
    { note: 'd4', at: 0, duration: 0.16, gain: 0.3 },
    { note: 'g4', at: 0.1, duration: 0.16, gain: 0.3 },
    { note: 'b4', at: 0.2, duration: 0.2, gain: 0.32 },
    { note: 'd5', at: 0.32, duration: 0.34, gain: 0.34 },
    { note: 'g5', at: 0.34, duration: 0.42, gain: 0.22 },
  ]);
}

/* ------------------------------------------------------------------ */

/**
 * There is no ambience bed.
 *
 * Filtered noise was tried in two flavours — a low swell for the coast, a drier
 * high-passed wind for the plateau — and neither sounded like a place. It
 * sounded like filtered noise, which on the coast was mistaken for the sea and
 * on the plateau was still mistaken for the sea.
 *
 * A bed that has to be explained is not doing its job. The music carries the
 * scene until real recordings exist, and the `ambience` channel is kept so they
 * have somewhere to arrive. Its mute switch is gone until then: a control that
 * silences nothing is worse than no control, which is why the audio toggles were
 * removed once before (D-026).
 */

/* ------------------------------------------------------------------ */

let musicElement: HTMLAudioElement | null = null;
let musicSource: MediaElementAudioSourceNode | null = null;

/**
 * The city theme.
 *
 * Streamed through an <audio> element rather than decoded into memory: a four
 * minute track is 1.6 MB on the wire and about 40 MB decoded, and a child on a
 * tablet should not pay that to hear a song.
 *
 * It fades in over a few seconds. A theme that starts at full volume the
 * instant a city loads announces itself; one that arrives underneath the
 * seagulls is just there.
 */
export function startMusic(url: string): void {
  const context = audioContext();
  const destination = channelNode('music');
  if (!context || !destination || musicElement) return;

  const element = new Audio(url);
  element.loop = true;
  element.crossOrigin = 'anonymous';
  element.preload = 'auto';

  const source = context.createMediaElementSource(element);
  const fade = context.createGain();
  fade.gain.setValueAtTime(0.0001, context.currentTime);
  fade.gain.exponentialRampToValueAtTime(1, context.currentTime + 4);

  source.connect(fade).connect(destination);
  void element.play().catch(() => {
    // A browser that refuses playback leaves the street quiet rather than
    // broken; the ambience and cues are unaffected.
  });

  musicElement = element;
  musicSource = source;
}

export function stopMusic(): void {
  if (musicElement) {
    musicElement.pause();
    musicElement.src = '';
    musicElement = null;
  }
  if (musicSource) {
    musicSource.disconnect();
    musicSource = null;
  }
}
