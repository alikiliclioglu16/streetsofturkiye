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

export type AudioChannel = 'voice' | 'ambience' | 'ui';

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
    for (const name of ['voice', 'ambience', 'ui'] as const) {
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

/** Steps the ambience back while the guide speaks, and returns it after. */
export function duckAmbience(ducked: boolean): void {
  if (!nodes) return;
  const gain = nodes.channels.ambience;
  gain.gain.setTargetAtTime(
    effectiveGain(channelState.ambience, ducked),
    nodes.context.currentTime,
    DUCK_SECONDS,
  );
}

/** Releases everything. Called when the player leaves a city. */
export function stopAudio(): void {
  if (!nodes) return;
  void nodes.context.close();
  nodes = null;
}
