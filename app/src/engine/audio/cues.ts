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
/**
 * A train going past: two horn notes and a low roll under them.
 *
 * Synthesised, like every other cue here, and for the same reason — it costs
 * nothing and needs no file. But it is built the other way round from the
 * ambience bed that was cut: **the horn is the sound and the noise is the
 * garnish.** Filtered noise on its own reads as water whatever is done to it,
 * which is how Cappadocia ended up sounding like the sea twice (D-103). A
 * two-tone diesel horn is unmistakably a train, and the roll underneath only
 * has to keep it company.
 *
 * The two notes are a fifth apart and sounded together, which is what a
 * European locomotive horn actually is, and the pair falls in pitch across the
 * pass — not real Doppler, just enough of it that the train reads as going
 * somewhere rather than standing still and shouting.
 *
 * On the `ambience` channel, so a parent who has had enough of it can silence
 * the world without silencing the guide.
 */
export function playTrainPass(): void {
  const context = audioContext();
  const destination = channelNode('ambience');
  if (!context || !destination) return;

  const start = context.currentTime + 0.01;
  const horn = context.createGain();
  horn.gain.setValueAtTime(0.0001, start);
  horn.gain.exponentialRampToValueAtTime(0.22, start + 0.25);
  horn.gain.setValueAtTime(0.22, start + 1.5);
  horn.gain.exponentialRampToValueAtTime(0.0001, start + 2.6);
  horn.connect(destination);

  // A fifth apart, sounded together: that interval is most of why a horn
  // sounds like a horn rather than like a note.
  for (const [hz, level] of [
    [311, 1],
    [466, 0.7],
  ] as const) {
    const oscillator = context.createOscillator();
    const voice = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(hz, start);
    oscillator.frequency.linearRampToValueAtTime(hz * 0.94, start + 2.6);
    voice.gain.value = level;
    oscillator.connect(voice).connect(horn);
    oscillator.start(start);
    oscillator.stop(start + 2.7);
  }

  // The roll: a low tone, not noise, swelling and fading with the pass.
  const rumble = context.createOscillator();
  const rumbleGain = context.createGain();
  const shelf = context.createBiquadFilter();
  shelf.type = 'lowpass';
  shelf.frequency.value = 180;
  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(46, start);
  rumble.frequency.linearRampToValueAtTime(38, start + 4);
  rumbleGain.gain.setValueAtTime(0.0001, start);
  rumbleGain.gain.exponentialRampToValueAtTime(0.14, start + 1.2);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, start + 4);
  rumble.connect(shelf).connect(rumbleGain).connect(destination);
  rumble.start(start);
  rumble.stop(start + 4.1);
}

/**
 * A cat, once.
 *
 * Synthesised, and built the way the train horn is: a shaped tone, not filtered
 * noise. A meow is two vowels run together — the mouth opens and closes — so
 * this is one sawtooth voice with the pitch rising and falling under a bandpass
 * whose centre sweeps the other way. That crossing is what makes it read as a
 * word rather than a beep.
 *
 * `pitch` shifts the whole call, so the same function gives a different cat
 * each time without a second file.
 *
 * On the `ambience` channel: it belongs to the street, and a parent who has had
 * enough of cats can silence the world without silencing the guide.
 */
export function playMeow(pitch = 1): void {
  const context = audioContext();
  const destination = channelNode('ambience');
  if (!context || !destination) return;

  const start = context.currentTime + 0.01;
  const end = start + 0.62;

  const voice = context.createOscillator();
  voice.type = 'sawtooth';
  voice.frequency.setValueAtTime(430 * pitch, start);
  voice.frequency.linearRampToValueAtTime(620 * pitch, start + 0.13);
  voice.frequency.linearRampToValueAtTime(360 * pitch, end);

  // The mouth: open on the way up, closing on the way down.
  const mouth = context.createBiquadFilter();
  mouth.type = 'bandpass';
  mouth.Q.value = 4.5;
  mouth.frequency.setValueAtTime(760 * pitch, start);
  mouth.frequency.linearRampToValueAtTime(1500 * pitch, start + 0.16);
  mouth.frequency.linearRampToValueAtTime(620 * pitch, end);

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.2, start + 0.07);
  envelope.gain.setValueAtTime(0.2, start + 0.24);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  voice.connect(mouth).connect(envelope).connect(destination);
  voice.start(start);
  voice.stop(end + 0.03);
}

/**
 * A cat, somewhere nearby.
 *
 * Synthesised on the same principle as the train horn (D-145): the recognisable
 * part is tonal, so it is built from tone rather than from noise. A meow is two
 * glides — up into the vowel and down out of it — with the second formant
 * following the first a fifth above. Triangle waves, because a sawtooth cat
 * sounds like a door.
 *
 * Deliberately quiet and deliberately not every cat. It is a street with cats
 * in it, not a pet shop: one call every fifteen seconds or so is a city that has
 * cats, and one every three would be a city being insistent about it.
 *
 * On the `ambience` channel, so a parent can silence the world without
 * silencing the guide.
 */
export function playCatMeow(): void {
  const context = audioContext();
  const destination = channelNode('ambience');
  if (!context || !destination) return;

  const start = context.currentTime + 0.01;
  // A little variation each time, so the same cat is not heard twice.
  const pitch = 620 + Math.random() * 120;
  const length = 0.42 + Math.random() * 0.18;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.13, start + 0.07);
  envelope.gain.setValueAtTime(0.13, start + length * 0.45);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
  envelope.connect(destination);

  for (const [ratio, level] of [
    [1, 1],
    [1.5, 0.35],
  ] as const) {
    const oscillator = context.createOscillator();
    const voice = context.createGain();
    oscillator.type = 'triangle';
    // Up into the vowel, then down out of it.
    oscillator.frequency.setValueAtTime(pitch * 0.72 * ratio, start);
    oscillator.frequency.linearRampToValueAtTime(pitch * ratio, start + length * 0.3);
    oscillator.frequency.linearRampToValueAtTime(pitch * 0.6 * ratio, start + length);
    voice.gain.value = level;
    oscillator.connect(voice).connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + length + 0.05);
  }
}

/**
 * A ferry's horn, which is the train's an octave and a half down.
 *
 * Same construction as the train (D-145) — two voices sounded together, tonal
 * rather than noise — but a ship's horn is one long low note where a locomotive
 * is two bright ones, and it takes a good second to speak. Sounded once as the
 * boat comes into view.
 */
export function playFerryHorn(): void {
  const context = audioContext();
  const destination = channelNode('ambience');
  if (!context || !destination) return;

  const start = context.currentTime + 0.01;
  const horn = context.createGain();
  horn.gain.setValueAtTime(0.0001, start);
  horn.gain.exponentialRampToValueAtTime(0.2, start + 0.9);
  horn.gain.setValueAtTime(0.2, start + 2.2);
  horn.gain.exponentialRampToValueAtTime(0.0001, start + 3.6);
  horn.connect(destination);

  const shelf = context.createBiquadFilter();
  shelf.type = 'lowpass';
  shelf.frequency.value = 520;
  shelf.connect(horn);

  for (const [hz, level] of [
    [104, 1],
    [156, 0.55],
  ] as const) {
    const oscillator = context.createOscillator();
    const voice = context.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(hz, start);
    oscillator.frequency.linearRampToValueAtTime(hz * 0.97, start + 3.6);
    voice.gain.value = level;
    oscillator.connect(voice).connect(shelf);
    oscillator.start(start);
    oscillator.stop(start + 3.7);
  }
}

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
