'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { TimeWindow } from '@/content/schemas/timewindow';
import {
  initialTimeWindowContext,
  skipAvailable,
  timeWindowReducer,
  type CancelReason,
  type TimeWindowContext,
} from '@/engine/timewindow/machine';
import { captionAt } from '@/engine/timewindow/clock';
import {
  restoreSnapshot,
  SpawnRegistry,
  takeSnapshot,
  type RestoreTargets,
  type SceneSnapshot,
  type SnapshotSources,
} from '@/engine/timewindow/snapshot';
import { applyWindowAudio, restoreWindowAudio } from '@/engine/audio/engine';

/**
 * Driving one Time Window from the UI side.
 *
 * The clock lives here rather than in the scene component, for one reason: the
 * window has to keep running — and keep being cancellable — even if the 3D
 * component is remounted by a quality change or a suspended model. A timer
 * owned by the thing it animates stops when that thing goes away, and the
 * scene is then left half-dressed with nothing to put it back.
 *
 * Every exit runs the same two steps in the same order: restore, then cleanup.
 */

export interface TimeWindowRunner {
  readonly context: TimeWindowContext;
  readonly elapsed: number;
  readonly playing: boolean;
  readonly registry: SpawnRegistry;
  readonly snapshot: SceneSnapshot | null;
  readonly caption: { text: { tr: string; en: string }; visible: boolean } | null;
  readonly canSkip: boolean;
  start: () => void;
  cancel: (reason: CancelReason) => void;
}

export function useTimeWindow({
  window: data,
  sources,
  targets,
  onComplete,
  onCancel,
  skipAfterSeconds,
}: {
  window: TimeWindow | null;
  /** Read at start time, once, to build the snapshot. */
  sources: () => SnapshotSources;
  /** Written at restore time. Must still be valid after a route change. */
  targets: () => RestoreTargets;
  onComplete: () => void;
  onCancel: (reason: CancelReason) => void;
  skipAfterSeconds?: number;
}): TimeWindowRunner {
  const duration = data?.duration ?? 0;
  const [context, dispatch] = useReducer(
    timeWindowReducer,
    duration,
    initialTimeWindowContext,
  );

  const registry = useMemo(() => new SpawnRegistry(), []);
  /**
   * The snapshot is both rendered and read from callbacks, so it is held twice.
   *
   * State, because the scene component needs it to write transforms into while
   * the window plays — and a ref read during render is a value React has no
   * reason to keep up to date. Ref, because `cancel` can fire from an unmount
   * handler that closed over an older state value, and restoring the wrong
   * snapshot is worse than restoring none.
   */
  const [snapshotState, setSnapshotState] = useState<SceneSnapshot | null>(null);
  const snapshot = useRef<SceneSnapshot | null>(null);
  const elapsed = useRef(0);
  const frame = useRef<number | null>(null);
  const lastTick = useRef(0);
  /** Guards the one thing that must happen exactly once per run. */
  const settled = useRef(false);

  /**
   * Restore, then cleanup. Idempotent, and the only way out.
   *
   * Both halves can be called twice without harm, which is a requirement
   * rather than a nicety: a cancel and an unmount can arrive in either order
   * for the same window, and on a route change they usually both do.
   */
  const restoreAndCleanup = useCallback(() => {
    const taken = snapshot.current;
    if (taken) {
      restoreSnapshot(taken, targets());
      restoreWindowAudio(taken.audio);
      snapshot.current = null;
      setSnapshotState(null);
    }
    registry.clear();
  }, [registry, targets]);

  const stopClock = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  const finish = useCallback(
    (outcome: 'complete' | 'cancel', reason: CancelReason | null) => {
      if (settled.current) return;
      settled.current = true;
      stopClock();
      restoreAndCleanup();
      if (outcome === 'complete') onComplete();
      else onCancel(reason ?? 'unmount');
    },
    [onCancel, onComplete, restoreAndCleanup, stopClock],
  );

  /**
   * A new window — or none — is a fresh runner.
   *
   * `settled` latches on the way out and nothing cleared it, so after the
   * first stop the hook refused to start anything ever again. That refusal is
   * silent, and the stop it lands on shows no card either, which is how one
   * missing reset became a blank screen (D-226). Keyed on the window's own
   * identity, so it cannot fire in the middle of a run.
   */
  const identity = data ? `${data.stopId}@${data.duration}` : null;
  useEffect(() => {
    settled.current = false;
    elapsed.current = 0;
    lastTick.current = 0;
    dispatch({ type: 'RESET', duration });
    // `duration` moves with `identity`; listing it would reset twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  const start = useCallback(() => {
    if (!data || settled.current) return;
    elapsed.current = 0;
    dispatch({ type: 'START' });

    const taken = takeSnapshot(sources());
    // The audio policy is applied after the snapshot, so the levels recorded
    // are the ones the player had rather than the ducked ones.
    taken.audio = applyWindowAudio(data.audioPolicy);
    snapshot.current = taken;
    setSnapshotState(taken);
    dispatch({ type: 'SNAPSHOT_TAKEN' });

    lastTick.current = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - lastTick.current) / 1000, 0.05);
      lastTick.current = now;
      elapsed.current += delta;
      if (elapsed.current >= data.duration) {
        elapsed.current = data.duration;
        dispatch({ type: 'ELAPSED', seconds: delta });
        finish('complete', null);
        return;
      }
      dispatch({ type: 'ELAPSED', seconds: delta });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [data, finish, sources]);

  const cancel = useCallback(
    (reason: CancelReason) => {
      if (settled.current) return;
      dispatch({ type: 'CANCEL', reason });
      finish('cancel', reason);
    },
    [finish],
  );

  /**
   * Unmount cancels, always.
   *
   * This is the fourth cancel path and the one that cannot be forgotten: a
   * route change tears the city route down without any of the other three
   * firing, and without this the scene's own state would be restored by
   * nothing.
   */
  useEffect(() => {
    return () => {
      stopClock();
      if (!settled.current) {
        settled.current = true;
        restoreAndCleanup();
        onCancel('unmount');
      } else {
        // Already settled, but a late spawn could still be holding GPU memory.
        registry.clear();
      }
    };
    // Intentionally empty: this must run on unmount only, with the latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const caption = data ? captionAt(data.events, context.elapsed) : null;

  return {
    context,
    elapsed: context.elapsed,
    playing: context.state === 'playing',
    registry,
    snapshot: snapshotState,
    caption,
    canSkip: skipAvailable(context, skipAfterSeconds),
    start,
    cancel,
  };
}
