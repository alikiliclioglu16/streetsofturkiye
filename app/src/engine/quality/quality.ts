import type { QualityTier } from '@/engine/assets/registry';

export interface QualitySettings {
  readonly tier: QualityTier;
  readonly maxDpr: number;
  readonly shadows: boolean;
  readonly shadowMapSize: number;
  readonly backgroundPropDensity: number;
  readonly postProcessing: boolean;
}

/** Values follow the tier table in docs/PERFORMANCE_BUDGET.md. */
const SETTINGS: Record<QualityTier, QualitySettings> = {
  low: { tier: 'low', maxDpr: 1.0, shadows: false, shadowMapSize: 512, backgroundPropDensity: 0.35, postProcessing: false },
  medium: { tier: 'medium', maxDpr: 1.5, shadows: true, shadowMapSize: 1024, backgroundPropDensity: 0.7, postProcessing: false },
  high: { tier: 'high', maxDpr: 2.0, shadows: true, shadowMapSize: 2048, backgroundPropDensity: 1, postProcessing: true },
};

export function qualitySettings(tier: QualityTier): QualitySettings {
  return SETTINGS[tier];
}

export interface DeviceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  coarsePointer: boolean;
  viewportWidth: number;
}

/** Automatic tier selection; the user can always override it in settings. */
export function detectQualityTier(hints: DeviceHints): QualityTier {
  const cores = hints.hardwareConcurrency ?? 4;
  const memory = hints.deviceMemory ?? 4;

  if (hints.coarsePointer || hints.viewportWidth < 768) {
    return cores >= 8 && memory >= 6 ? 'medium' : 'low';
  }
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

export function readDeviceHints(): DeviceHints {
  if (typeof window === 'undefined') {
    return { coarsePointer: false, viewportWidth: 1280 };
  }
  const nav = window.navigator as Navigator & { deviceMemory?: number };
  return {
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    viewportWidth: window.innerWidth,
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
