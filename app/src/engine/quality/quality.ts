import type { QualityTier } from '@/engine/assets/registry';
import { QUALITY, type QualitySettings } from '@/engine/heroes/policy';

export type { QualitySettings } from '@/engine/heroes/policy';
export { QUALITY } from '@/engine/heroes/policy';

export function qualitySettings(): QualitySettings {
  return QUALITY;
}

/**
 * Which model variant to fetch for ordinary props. Hero characters ignore this
 * entirely: they always use the full-quality mesh.
 */
export function assetTier(): QualityTier {
  return 'high';
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
