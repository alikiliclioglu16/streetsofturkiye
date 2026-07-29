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

let ambienceSource: AudioBufferSourceNode | null = null;

/**
 * An outdoor bed, also synthesised.
 *
 * Filtered noise with a slow swell: not the sound of any particular thing, but
 * close enough to open air near water that a street stops feeling like a room.
 * Recorded seagulls and a ferry horn belong on top of this later; the bed
 * itself never needs to be a file.
 */
export function startAmbience(): void {
  const context = audioContext();
  const destination = channelNode('ambience');
  if (!context || !destination || ambienceSource) return;

  const seconds = 8;
  const buffer = context.createBuffer(2, context.sampleRate * seconds, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      // Brown-ish noise: closer to wind and water than white noise, which
      // sounds like a broken speaker.
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      const swell = 0.6 + 0.4 * Math.sin((i / data.length) * Math.PI * 2);
      data[i] = last * 3.2 * swell;
    }
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 900;

  source.connect(lowpass).connect(destination);
  source.start();
  ambienceSource = source;
}

export function stopAmbience(): void {
  if (!ambienceSource) return;
  ambienceSource.stop();
  ambienceSource.disconnect();
  ambienceSource = null;
}
