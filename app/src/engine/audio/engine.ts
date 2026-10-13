/**
 * Sound.
 *
 * Three channels, because they are muted for different reasons: a parent may
 * want the room quiet without taking the guide's voice away from a child who
 * cannot yet read fluently, and a child replaying a city may want the guide
 * quiet without losing the seagulls.
 *
 * Nothing here creates an AudioContext until the child has pressed something.
 * Browsers refuse audio before a gesture, and a context created too early stays
 * suspended for the whole session — silence with no error to explain it.
 */

export type AudioChannel = 'voice' | 'music' | 'ambience' | 'ui';

export interface ChannelState {
  readonly muted: boolean;
  /** 0..1, before the channel's own mute is applied. */
  readonly volume: number;
}

export const DEFAULT_CHANNELS: Readonly<Record<AudioChannel, ChannelState>> = {
  // The guide is the reason the channel exists; it is the loudest.
  voice: { muted: false, volume: 1 },
  // A bed, not a feature. Loud ambience is the fastest way to make a parent
  // reach for the mute.
  /**
   * Quiet by design. A theme a child hears for the fourth time should sit under
   * the street rather than over it, and a parent in the room should be able to
   * forget it is playing.
   */
  music: { muted: false, volume: 0.28 },
  ambience: { muted: false, volume: 0.35 },
  ui: { muted: false, volume: 0.6 },
};

/**
 * How far the ambience drops while the guide is speaking.
 *
 * Ducking rather than muting: a bed that vanishes and returns draws more
 * attention than one that steps back.
 */
export const DUCK_FACTOR = 0.35;
export const DUCK_SECONDS = 0.25;

export function effectiveGain(state: ChannelState, ducked: boolean): number {
  if (state.muted) return 0;
  return state.volume * (ducked ? DUCK_FACTOR : 1);
}

interface Nodes {
  context: AudioContext;
  master: GainNode;
  channels: Record<AudioChannel, GainNode>;
}

let nodes: Nodes | null = null;
let channelState: Record<AudioChannel, ChannelState> = { ...DEFAULT_CHANNELS };

/** True once a gesture has let us open a context. */
export function isUnlocked(): boolean {
  return nodes !== null && nodes.context.state === 'running';
}

/**
 * Called from a real user gesture — the intro button. Safe to call repeatedly.
 */
export async function unlockAudio(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return false;

  if (!nodes) {
    const context = new Ctor();
    const master = context.createGain();
    master.gain.value = 1;
    master.connect(context.destination);

    const channels = {} as Record<AudioChannel, GainNode>;
    for (const name of ['voice', 'music', 'ambience', 'ui'] as const) {
      const gain = context.createGain();
      gain.gain.value = effectiveGain(channelState[name], false);
      gain.connect(master);
      channels[name] = gain;
    }
    nodes = { context, master, channels };
  }

  if (nodes.context.state === 'suspended') await nodes.context.resume();
  return nodes.context.state === 'running';
}

export function audioContext(): AudioContext | null {
  return nodes?.context ?? null;
}

export function channelNode(channel: AudioChannel): GainNode | null {
  return nodes?.channels[channel] ?? null;
}

export function setChannelState(channel: AudioChannel, next: ChannelState): void {
  channelState = { ...channelState, [channel]: next };
  const gain = nodes?.channels[channel];
  if (!gain || !nodes) return;
  gain.gain.setTargetAtTime(effectiveGain(next, false), nodes.context.currentTime, 0.05);
}

export function channelStates(): Readonly<Record<AudioChannel, ChannelState>> {
  return channelState;
}

/** Steps the bed and the theme back while the guide speaks, and returns them. */
export function duckAmbience(ducked: boolean): void {
  if (!nodes) return;
  for (const channel of ['ambience', 'music'] as const) {
    nodes.channels[channel].gain.setTargetAtTime(
      effectiveGain(channelState[channel], ducked),
      nodes.context.currentTime,
      DUCK_SECONDS,
    );
  }
}

/**
 * The music level while a Time Window plays.
 *
 * `duck` is the default policy and the one the first window uses: the theme
 * steps back to a quarter rather than disappearing, for the same reason the
 * guide's own ducking does not mute — a bed that vanishes and returns draws
 * more attention than one that steps back.
 *
 * Returns the level it replaced, so the caller can put it in the snapshot and
 * restore the exact number rather than an assumed default. A window that is
 * cancelled while the player had already turned the music down must not come
 * back at full volume.
 */
export const WINDOW_DUCK_FACTOR = 0.22;

export function musicLevel(): number {
  return channelState.music.volume;
}

export function ambienceLevel(): number {
  return channelState.ambience.volume;
}

/**
 * Applies a Time Window's audio policy and returns the levels it replaced.
 *
 * Writes to the gain nodes directly rather than through `setChannelState`,
 * because this is a temporary override and must not become the player's
 * remembered volume.
 */
export function applyWindowAudio(policy: 'duck' | 'mute' | 'keep'): {
  music: number;
  ambience: number;
} {
  const before = { music: channelState.music.volume, ambience: channelState.ambience.volume };
  if (policy === 'keep' || !nodes) return before;

  const factor = policy === 'mute' ? 0 : WINDOW_DUCK_FACTOR;
  for (const channel of ['music', 'ambience'] as const) {
    const state = channelState[channel];
    const target = state.muted ? 0 : state.volume * factor;
    nodes.channels[channel].gain.setTargetAtTime(target, nodes.context.currentTime, DUCK_SECONDS);
  }
  return before;
}

/** Puts the levels back exactly, from the snapshot. */
export function restoreWindowAudio(levels: { music: number; ambience: number }): void {
  if (!nodes) return;
  for (const channel of ['music', 'ambience'] as const) {
    const state = channelState[channel];
    const remembered = channel === 'music' ? levels.music : levels.ambience;
    nodes.channels[channel].gain.setTargetAtTime(
      state.muted ? 0 : remembered,
      nodes.context.currentTime,
      DUCK_SECONDS,
    );
  }
}

/** Releases everything. Called when the player leaves a city. */
export function stopAudio(): void {
  if (!nodes) return;
  void nodes.context.close();
  nodes = null;
}
