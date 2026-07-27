'use client';

import { useSyncExternalStore } from 'react';

export interface ClientEnvironment {
  readonly webgl: boolean;
  readonly coarsePointer: boolean;
}

const SERVER_SNAPSHOT: ClientEnvironment = { webgl: true, coarsePointer: false };

let cached: ClientEnvironment | null = null;

function detectWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function snapshot(): ClientEnvironment {
  // Must return a stable reference between renders or React loops forever.
  if (!cached) {
    cached = {
      webgl: detectWebgl(),
      coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    };
  }
  return cached;
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia('(pointer: coarse)');
  const handler = () => {
    cached = null;
    onChange();
  };
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}

/**
 * Reads device capabilities as an external store rather than through effect
 * state, so the server render and the first client render agree and no
 * cascading re-render is triggered.
 */
export function useClientEnvironment(): ClientEnvironment {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAPSHOT);
}
