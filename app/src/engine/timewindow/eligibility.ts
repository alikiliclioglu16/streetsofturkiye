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
  readonly reason: 'ok' | 'missing-assets' | 'reduced-motion' | 'no-window' | 'disabled';
}

export const ELIGIBLE: EligibilityResult = { eligible: true, missing: [], reason: 'ok' };

/**
 * The master switch, and it is off.
 *
 * The owner saw the finished slice at Konak and asked for the old stop back:
 * *"Bu yeni durak tarzını beğenmedim, eski tarza geri dönelim. Bilgi kartı
 * çıkması yeterli."* So every stop in every city shows the fact card again.
 *
 * Off at one line rather than by deletion, on purpose. The engine underneath is
 * sound — the restore path, the four cancel exits, the reward gate and the
 * graybox guard all hold, and 50 tests cover them — and the thing that was
 * wrong was the stop it produced, not the machinery. Deleting it would throw
 * away the part that was right along with the part that was not, and the design
 * in `docs/TIME_WINDOW_DESIGN.md` still describes sixty-three stops. Flipping
 * this to `true` brings it back; nothing else has to be rebuilt.
 *
 * While it is off, `content/timewindows/` is read and validated and nothing
 * plays. That is deliberate too: a switch that also stops the content being
 * checked is a switch that quietly rots what it is guarding.
 */
export const TIME_WINDOWS_ENABLED = false;

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
  options: { reducedMotion: boolean; enabled?: boolean },
): EligibilityResult {
  // The switch is an argument with a default rather than a read of the
  // constant, so the three rules below stay testable while it is off.
  if (!(options.enabled ?? TIME_WINDOWS_ENABLED)) {
    return { eligible: false, missing: [], reason: 'disabled' };
  }
  if (!window) return { eligible: false, missing: [], reason: 'no-window' };
  if (options.reducedMotion) return { eligible: false, missing: [], reason: 'reduced-motion' };
  return assetsPresent(window);
}
