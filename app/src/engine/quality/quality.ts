import type { QualityTier } from '@/engine/assets/registry';
import {
  QUALITY_PROFILES,
  detectProfile,
  type QualityProfile,
  type QualityProfileId,
} from '@/engine/heroes/policy';

export type { QualityProfile, QualityProfileId } from '@/engine/heroes/policy';
export { QUALITY_PROFILES, detectProfile, environmentConcessions, stepDown } from '@/engine/heroes/policy';

export function qualityProfile(id: QualityProfileId): QualityProfile {
  return QUALITY_PROFILES[id];
}

/**
 * Which model variant to fetch for ordinary props. Hero characters ignore this
 * entirely: they always use the full-quality mesh (policy rule 4).
 */
export function assetTierForProfile(id: QualityProfileId): QualityTier {
  if (id === 'high') return 'high';
  if (id === 'balanced') return 'medium';
  return 'low';
}

export interface DeviceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  coarsePointer: boolean;
  viewportWidth: number;
}

export function readDeviceHints(): DeviceHints {
  if (typeof window === 'undefined') return { coarsePointer: false, viewportWidth: 1280 };
  const nav = window.navigator as Navigator & { deviceMemory?: number };
  return {
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    viewportWidth: window.innerWidth,
  };
}

export function detectQualityProfile(): QualityProfileId {
  return detectProfile(readDeviceHints());
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
