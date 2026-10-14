import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Object3D, PerspectiveCamera } from 'three';

import { cityTimeWindowsSchema } from '@/content/schemas/timewindow';
import { useTimeWindow } from '@/engine/timewindow/useTimeWindow';
import {
  rememberTransform,
  type RestoreTargets,
  type SceneColours,
  type SceneSnapshot,
  type SnapshotSources,
} from '@/engine/timewindow/snapshot';

/**
 * The runner, end to end, on a fake scene.
 *
 * The pure pieces are tested next door; what this file is for is the part that
 * only exists once they are wired together — that **every exit really does put
 * the scene back**, including the two that are easy to forget: a route change
 * and an unmount. Those are the ones that leave a child staring at an orange
 * sky with the controls locked, and no test of a reducer can catch them.
 */

const IZMIR = cityTimeWindowsSchema.parse(
  JSON.parse(readFileSync(path.resolve(__dirname, '../../content/timewindows/izmir.json'), 'utf8')),
);

function harness() {
  const camera = new PerspectiveCamera(50, 1.6, 0.1, 500);
  camera.position.set(2, 2.3, -41);
  const pigeon = new Object3D();
  pigeon.position.set(-8.9, 0.2, -39);

  const live: {
    colours: SceneColours;
    audio: { music: number; ambience: number };
    hud: boolean;
    controls: boolean;
    ambient: { intensity: number };
  } = {
    colours: { sky: { top: '#8FD6EC', horizon: '#E8F7FA' }, water: '#2F8FA8', ground: '#D8C48C' },
    audio: { music: 0.28, ambience: 0.35 },
    hud: true,
    controls: true,
    ambient: { intensity: 0.9 },
  };

  const sources = (): SnapshotSources => ({
    camera,
    lights: { ambient: live.ambient },
    colours: live.colours,
    audio: live.audio,
    hudVisible: live.hud,
    controlsEnabled: live.controls,
  });

  const targets = (): RestoreTargets => ({
    camera,
    lights: { ambient: live.ambient },
    objects: { 'spawn:pigeon-a': pigeon },
    materials: {},
    setColours: (colours) => {
      live.colours = colours;
    },
    setAudio: (audio) => {
      live.audio = audio;
    },
    setHudVisible: (visible) => {
      live.hud = visible;
    },
    setControlsEnabled: (enabled) => {
      live.controls = enabled;
    },
  });

  return { camera, pigeon, live, sources, targets };
}

/** What a window does to the scene while it runs. */
function disturb(h: ReturnType<typeof harness>, snapshot: SceneSnapshot) {
  rememberTransform(snapshot, 'spawn:pigeon-a', h.pigeon);
  h.pigeon.position.set(-2.4, 9.4, -43.5);
  h.camera.position.set(7, 9, -34);
  h.live.colours = { sky: { top: '#000000', horizon: '#000000' }, water: '#000000', ground: '#000000' };
  h.live.audio = { music: 0.06, ambience: 0.08 };
  h.live.hud = false;
  h.live.controls = false;
  h.live.ambient.intensity = 0.1;
}

function expectRestored(h: ReturnType<typeof harness>) {
  expect(h.pigeon.position.toArray()).toEqual([-8.9, 0.2, -39]);
  expect(h.live.colours.sky.top).toBe('#8FD6EC');
  expect(h.live.colours.water).toBe('#2F8FA8');
  expect(h.live.audio).toEqual({ music: 0.28, ambience: 0.35 });
  expect(h.live.hud).toBe(true);
  expect(h.live.controls).toBe(true);
  expect(h.live.ambient.intensity).toBe(0.9);
}

function run(h: ReturnType<typeof harness>, onComplete = vi.fn(), onCancel = vi.fn()) {
  const view = renderHook(() =>
    useTimeWindow({
      window: IZMIR.windows[0]!,
      sources: h.sources,
      targets: h.targets,
      onComplete,
      onCancel,
    }),
  );
  return { view, onComplete, onCancel };
}

describe('the runner puts the scene back', () => {
  it('after a skip', () => {
    const h = harness();
    const { view, onComplete, onCancel } = run(h);

    act(() => view.result.current.start());
    expect(view.result.current.snapshot).not.toBeNull();
    disturb(h, view.result.current.snapshot!);

    act(() => view.result.current.cancel('skip'));

    expectRestored(h);
    expect(onCancel).toHaveBeenCalledWith('skip');
    expect(onComplete).not.toHaveBeenCalled();
    expect(view.result.current.registry.size).toBe(0);
  });

  it('after Back to map', () => {
    const h = harness();
    const { view, onCancel } = run(h);
    act(() => view.result.current.start());
    disturb(h, view.result.current.snapshot!);
    act(() => view.result.current.cancel('leave'));
    expectRestored(h);
    expect(onCancel).toHaveBeenCalledWith('leave');
  });

  it('after a route change', () => {
    const h = harness();
    const { view, onCancel } = run(h);
    act(() => view.result.current.start());
    disturb(h, view.result.current.snapshot!);
    act(() => view.result.current.cancel('route'));
    expectRestored(h);
    expect(onCancel).toHaveBeenCalledWith('route');
  });

  it('after an unmount, with no cancel of its own', () => {
    const h = harness();
    const { view, onCancel, onComplete } = run(h);
    act(() => view.result.current.start());
    disturb(h, view.result.current.snapshot!);

    // The route tears the city down. Nothing else fires.
    act(() => view.unmount());

    expectRestored(h);
    expect(onCancel).toHaveBeenCalledWith('unmount');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('and does not settle twice when a cancel is followed by an unmount', () => {
    const h = harness();
    const { view, onCancel } = run(h);
    act(() => view.result.current.start());
    disturb(h, view.result.current.snapshot!);
    act(() => view.result.current.cancel('skip'));
    act(() => view.unmount());
    expectRestored(h);
    // One settlement, not two: the second exit must be a no-op.
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('and ignores a cancel that arrives after the window already settled', () => {
    const h = harness();
    const { view, onCancel } = run(h);
    act(() => view.result.current.start());
    act(() => view.result.current.cancel('skip'));
    act(() => view.result.current.cancel('leave'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('the runner pays out once', () => {
  it('completes when the clock runs out, and only then', async () => {
    vi.useFakeTimers();
    const h = harness();
    const onComplete = vi.fn();
    const { view } = run(h, onComplete);

    act(() => view.result.current.start());
    disturb(h, view.result.current.snapshot!);
    expect(onComplete).not.toHaveBeenCalled();

    // The runner drives itself off requestAnimationFrame; jsdom ties that to
    // timers, so advancing past the window's nine seconds finishes it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expectRestored(h);
    expect(view.result.current.registry.size).toBe(0);
    vi.useRealTimers();
  });
});

describe('the runner is reusable', () => {
  /**
   * The defect this covers was invisible and total.
   *
   * `settled` latched on the first exit and nothing cleared it, so `start` was
   * a no-op from the second stop onwards — and because the fact card is
   * withheld wherever a window is eligible, the stop showed nothing at all.
   * Re-rendering with a different window is what a child does by walking, so
   * that is what is simulated: the same hook, a new window, and it must play.
   */
  it('starts again once the window it holds has changed', () => {
    const h = harness();
    const onCancel = vi.fn();
    type Window = (typeof IZMIR.windows)[number];
    const view = renderHook(
      ({ window }: { window: Window | null }) =>
        useTimeWindow({
          window,
          sources: h.sources,
          targets: h.targets,
          onComplete: vi.fn(),
          onCancel,
        }),
      { initialProps: { window: IZMIR.windows[0]! as Window | null } },
    );

    act(() => view.result.current.start());
    expect(view.result.current.context.state).toBe('playing');
    act(() => view.result.current.cancel('skip'));
    expect(view.result.current.context.state).toBe('cancelling');

    // The child walks out of the ring: no window, then into another one.
    act(() => view.rerender({ window: null }));
    expect(view.result.current.context.state).toBe('idle');

    const second = { ...IZMIR.windows[0]!, stopId: 'izmir-stop-04' };
    act(() => view.rerender({ window: second }));
    expect(view.result.current.context.state).toBe('idle');

    act(() => view.result.current.start());
    expect(view.result.current.context.state).toBe('playing');
    expect(view.result.current.snapshot).not.toBeNull();

    act(() => view.result.current.cancel('leave'));
    expectRestored(h);
    expect(onCancel).toHaveBeenNthCalledWith(1, 'skip');
    expect(onCancel).toHaveBeenNthCalledWith(2, 'leave');
  });
});
