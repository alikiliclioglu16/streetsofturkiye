import type { CityDefinition, HotspotDefinition, InteractionType } from '@/content/schemas/city';

/**
 * Deterministic interaction state machine (TECHNICAL_ARCHITECTURE).
 * Both the UI and the 3D scene react to this state; neither infers progress
 * on its own.
 */
export type InteractionState =
  | 'idle'
  | 'available'
  | 'entering'
  | 'active'
  | 'success'
  | 'retry'
  | 'reward'
  | 'complete';

export type InteractionEvent =
  | { type: 'HOTSPOT_IN_RANGE'; hotspotId: string }
  | { type: 'HOTSPOT_OUT_OF_RANGE' }
  | { type: 'BEGIN' }
  | { type: 'CAMERA_SETTLED' }
  | { type: 'ANSWER'; correct: boolean }
  | { type: 'RETRY' }
  | { type: 'CLAIM_REWARD' }
  | { type: 'DISMISS' };

export interface InteractionContext {
  readonly state: InteractionState;
  readonly hotspotId: string | null;
  readonly attempts: number;
}

export const initialInteractionContext: InteractionContext = {
  state: 'idle',
  hotspotId: null,
  attempts: 0,
};

/**
 * Pure reducer. Unhandled events return the same context object so callers can
 * cheaply skip re-renders.
 */
export function interactionReducer(
  context: InteractionContext,
  event: InteractionEvent,
): InteractionContext {
  switch (context.state) {
    case 'idle':
      if (event.type === 'HOTSPOT_IN_RANGE') {
        return { state: 'available', hotspotId: event.hotspotId, attempts: 0 };
      }
      return context;

    case 'available':
      if (event.type === 'HOTSPOT_OUT_OF_RANGE') return initialInteractionContext;
      if (event.type === 'HOTSPOT_IN_RANGE') {
        return { state: 'available', hotspotId: event.hotspotId, attempts: 0 };
      }
      if (event.type === 'BEGIN') return { ...context, state: 'entering' };
      return context;

    case 'entering':
      if (event.type === 'CAMERA_SETTLED') return { ...context, state: 'active' };
      if (event.type === 'DISMISS') return initialInteractionContext;
      return context;

    case 'active':
      if (event.type === 'ANSWER') {
        return event.correct
          ? { ...context, state: 'success' }
          : { ...context, state: 'retry', attempts: context.attempts + 1 };
      }
      if (event.type === 'DISMISS') return initialInteractionContext;
      return context;

    case 'retry':
      if (event.type === 'RETRY') return { ...context, state: 'active' };
      if (event.type === 'ANSWER') {
        return event.correct
          ? { ...context, state: 'success' }
          : { ...context, state: 'retry', attempts: context.attempts + 1 };
      }
      if (event.type === 'DISMISS') return initialInteractionContext;
      return context;

    case 'success':
      // The fact card is read here; the reward follows the action (D-009).
      if (event.type === 'CLAIM_REWARD') return { ...context, state: 'reward' };
      return context;

    case 'reward':
      if (event.type === 'DISMISS') return { ...context, state: 'complete' };
      return context;

    case 'complete':
      if (event.type === 'HOTSPOT_OUT_OF_RANGE') return initialInteractionContext;
      if (event.type === 'HOTSPOT_IN_RANGE') {
        if (event.hotspotId === context.hotspotId) return context;
        return { state: 'available', hotspotId: event.hotspotId, attempts: 0 };
      }
      return context;

    default:
      return context;
  }
}

/** Interaction types with a bespoke implementation in this build. */
const IMPLEMENTED: readonly InteractionType[] = ['inspect-and-find'];

/**
 * Phase 01 implements `inspect-and-find` fully. Every other type degrades to
 * the accessible `simple-choice` presentation rather than blocking the route
 * (PRODUCT_REQUIREMENTS section 5).
 */
export function resolveInteractionType(type: InteractionType): {
  resolved: InteractionType;
  degraded: boolean;
} {
  if (IMPLEMENTED.includes(type)) return { resolved: type, degraded: false };
  return { resolved: 'simple-choice', degraded: type !== 'simple-choice' };
}

export function hotspotById(city: CityDefinition, hotspotId: string): HotspotDefinition | undefined {
  return city.hotspots.find((hotspot) => hotspot.id === hotspotId);
}

export function orderedHotspots(city: CityDefinition): HotspotDefinition[] {
  return [...city.hotspots].sort((a, b) => a.order - b.order);
}
