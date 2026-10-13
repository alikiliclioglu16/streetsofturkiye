import { resolveAsset } from '@/engine/assets/registry';
import type { TimeWindow } from '@/content/schemas/timewindow';

/**
 * The graybox guard.
 *
 * A Time Window may run only when every model it needs is really in the scene.
 * On a stop that is still a coloured box, the camera would fly to a cube and a
 * silhouette would climb out of it — and a child's first experience of this
 * system would be of something broken. Antalya's three stops are exactly that
 * today: designed in full, graybox on screen, and deliberately not wired up.
 *
 * The rule is stated as a positive: a window is eligible when its `requires`
 * all resolve to delivered models. Anything else — a missing id, a placeholder,
 * an asset the registry does not know — falls back to the fact card, which is
 * why that component is not being deleted.
 *
 * **Under no circumstances may a missing asset let the camera fly at nothing.**
 */

export interface EligibilityResult {
  readonly eligible: boolean;
  /** Asset ids that are missing or still placeholders. Empty when eligible. */
  readonly missing: readonly string[];
  readonly reason: 'ok' | 'missing-assets' | 'reduced-motion' | 'no-window';
}

export const ELIGIBLE: EligibilityResult = { eligible: true, missing: [], reason: 'ok' };

/**
 * Does every asset this window names exist as a real model?
 *
 * `resolveAsset` returns an entry with `isPlaceholder` for anything briefed but
 * not delivered, and `isUnknown` for an id nothing knows — a content bug. Both
 * fail the guard, and they are reported together because the caller's job is
 * the same either way.
 */
export function assetsPresent(window: TimeWindow): EligibilityResult {
  const missing: string[] = [];
  for (const assetId of window.requires) {
    try {
      const resolved = resolveAsset(assetId, 'high');
      if (resolved.isPlaceholder || resolved.isUnknown) missing.push(assetId);
    } catch {
      missing.push(assetId);
    }
  }
  if (missing.length > 0) return { eligible: false, missing, reason: 'missing-assets' };
  return ELIGIBLE;
}

/**
 * The whole decision, in one place.
 *
 * Reduced motion is part of eligibility rather than a branch somewhere else, so
 * that there is exactly one answer to "does this stop play a window or show a
 * card" and both callers read it from here.
 */
export function windowEligibility(
  window: TimeWindow | null,
  options: { reducedMotion: boolean },
): EligibilityResult {
  if (!window) return { eligible: false, missing: [], reason: 'no-window' };
  if (options.reducedMotion) return { eligible: false, missing: [], reason: 'reduced-motion' };
  return assetsPresent(window);
}
