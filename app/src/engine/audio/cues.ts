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
/**
 * What the air sounds like, by region.
 *
 * The first bed was a sea wash, and it played over Cappadocia — three hundred
 * kilometres from any coast. A child who hears waves in Nevşehir is being told
 * something untrue about where they are, and the ground and the trees had
 * already been taught not to do that.
 *
 * The first attempt at telling them apart only raised the low-pass corner, and
 * Cappadocia still sounded like the sea. Raising the ceiling changes nothing
 * about a sound whose character lives in the floor: what makes a wash read as
 * surf is the rumble underneath it, and a low-pass passes that untouched.
 *
 * So the plateau profile cuts the bottom out with a high-pass, and uses far
 * less integrated noise — brown noise *is* surf, whatever you filter above it.
 * Wind over stone is mid and high, gusty rather than breathing.
 *
 * - `highpass` — where the floor is removed. This is the parameter that matters.
 * - `cutoff` — the low-pass ceiling.
 * - `brownness` — how much the noise is integrated. Low is airy, high is watery.
 * - `swell` — a slow rise and fall. Surf breathes; a plateau wind gusts.
 */
export interface AmbienceProfile {
  readonly highpass: number;
  readonly cutoff: number;
  readonly brownness: number;
  readonly swell: number;
  readonly level: number;
}

export const AMBIENCE_PROFILES: Readonly<Record<string, AmbienceProfile>> = {
  coastal: { highpass: 0, cutoff: 900, brownness: 0.02, swell: 0.4, level: 3.2 },
  plateau: { highpass: 520, cutoff: 3400, brownness: 0.16, swell: 0.16, level: 1.1 },
};

export function ambienceProfileFor(surface: 'cobblestone' | 'redsand'): AmbienceProfile {
  return surface === 'redsand' ? AMBIENCE_PROFILES.plateau! : AMBIENCE_PROFILES.coastal!;
}

export function startAmbience(profile: AmbienceProfile = AMBIENCE_PROFILES.coastal!): void {
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
      last = (last + profile.brownness * white) / (1 + profile.brownness);
      const swell = 1 - profile.swell + profile.swell * Math.sin((i / data.length) * Math.PI * 2);
      data[i] = last * profile.level * swell;
    }
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = profile.cutoff;

  /**
   * The floor.
   *
   * Removing the low end is what stops a noise bed sounding like water. With
   * this at zero the plateau sounded exactly like the coast however high the
   * ceiling went.
   */
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = profile.highpass;
  highpass.Q.value = 0.7;

  source.connect(highpass).connect(lowpass).connect(destination);
  source.start();
  ambienceSource = source;
}

export function stopAmbience(): void {
  if (!ambienceSource) return;
  ambienceSource.stop();
  ambienceSource.disconnect();
  ambienceSource = null;
}


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
