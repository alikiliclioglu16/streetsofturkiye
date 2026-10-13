import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Object3D, PerspectiveCamera } from 'three';

import {
  cityTimeWindowsSchema,
  CAPTION_MAX_CHARS,
  CAPTION_MIN_SECONDS,
  timeWindowSchema,
} from '@/content/schemas/timewindow';
import {
  initialTimeWindowContext,
  shouldGrantReward,
  skipAvailable,
  timeWindowReducer,
  SKIP_AVAILABLE_AFTER_SECONDS,
} from '@/engine/timewindow/machine';
import { activeCommands, captionAt, commandsFiredBetween } from '@/engine/timewindow/clock';
import {
  rememberTransform,
  rememberVisibility,
  restoreSnapshot,
  SpawnRegistry,
  takeSnapshot,
  type RestoreTargets,
  type SnapshotSources,
} from '@/engine/timewindow/snapshot';
import { assetsPresent, windowEligibility } from '@/engine/timewindow/eligibility';
import { completeHotspot } from '@/engine/progress/rules';
import { emptyCityProgress } from '@/engine/progress/types';
import { loadComposedCity } from './helpers';

/**
 * Zaman Penceresi.
 *
 * Almost everything that can go wrong with this system is invisible on screen:
 * a scene left half-restored looks fine until the child walks back into it, a
 * second reward is a number in a save file, and a leaked spawn is a few
 * megabytes nobody notices until a tablet runs out of them. So the rules below
 * are mostly about what is *left behind*, not about what happens.
 */

const IZMIR = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../content/timewindows/izmir.json'), 'utf8'),
);

const clockTower = () => {
  const [first] = cityTimeWindowsSchema.parse(IZMIR).windows;
  if (!first) throw new Error('izmir.json has no windows');
  return first;
};

function sources(overrides: Partial<SnapshotSources> = {}): SnapshotSources {
  const camera = new PerspectiveCamera(50, 1.6, 0.1, 500);
  camera.position.set(1, 2, 3);
  return {
    camera,
    lights: { ambient: { intensity: 0.8 }, fill: { intensity: 0.4 } },
    colours: { sky: { top: '#8FD6EC', horizon: '#E8F7FA' }, water: '#2F8FA8', ground: '#D8C48C' },
    audio: { music: 0.28, ambience: 0.35 },
    hudVisible: true,
    controlsEnabled: true,
    ...overrides,
  };
}

function targetsFor(source: SnapshotSources, objects: Record<string, Object3D> = {}) {
  const applied = { colours: source.colours, audio: source.audio, hud: true, controls: true };
  const targets: RestoreTargets = {
    camera: source.camera,
    lights: source.lights,
    objects,
    materials: {},
    setColours: (colours) => {
      applied.colours = colours;
    },
    setAudio: (audio) => {
      applied.audio = audio;
    },
    setHudVisible: (visible) => {
      applied.hud = visible;
    },
    setControlsEnabled: (enabled) => {
      applied.controls = enabled;
    },
  };
  return { targets, applied };
}

describe('the window contract', () => {
  it('rejects a caption longer than the standard', () => {
    const window = clockTower();
    const broken = {
      ...window,
      events: window.events.map((event) =>
        event.do === 'caption'
          ? { ...event, text: { tr: 'x'.repeat(CAPTION_MAX_CHARS + 1), en: 'ok' } }
          : event,
      ),
    };
    expect(timeWindowSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a caption left on screen for less than four seconds', () => {
    const window = clockTower();
    const broken = {
      ...window,
      events: window.events.map((event) =>
        event.do === 'caption' ? { ...event, seconds: CAPTION_MIN_SECONDS - 0.1 } : event,
      ),
    };
    expect(timeWindowSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects an unknown command, which is the whole reason the union is closed', () => {
    const window = clockTower();
    const broken = {
      ...window,
      events: [...window.events, { do: 'explode', at: 2, force: 11 }],
    };
    const parsed = timeWindowSchema.safeParse(broken);
    expect(parsed.success).toBe(false);
  });

  it('rejects a window that runs past its own duration', () => {
    const window = clockTower();
    const broken = {
      ...window,
      events: window.events.map((event) =>
        event.do === 'caption' ? { ...event, at: window.duration - 1, seconds: 4 } : event,
      ),
    };
    expect(timeWindowSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a spawn with no despawn', () => {
    const window = clockTower();
    const broken = {
      ...window,
      events: window.events.filter((event) => !(event.do === 'despawn' && event.id === 'pigeon-a')),
    };
    expect(timeWindowSchema.safeParse(broken).success).toBe(false);
  });

  it('holds İzmir to 8–12 seconds with exactly one caption', () => {
    const window = clockTower();
    expect(window.duration).toBeGreaterThanOrEqual(8);
    expect(window.duration).toBeLessThanOrEqual(12);
    const captions = window.events.filter((event) => event.do === 'caption');
    expect(captions).toHaveLength(1);
    const caption = captions[0];
    if (!caption || caption.do !== 'caption') throw new Error('unreachable');
    expect(caption.text.tr.length).toBeLessThanOrEqual(CAPTION_MAX_CHARS);
    expect(caption.text.en.length).toBeLessThanOrEqual(CAPTION_MAX_CHARS);
    expect(caption.seconds).toBeGreaterThanOrEqual(CAPTION_MIN_SECONDS);
    // Both languages, from the first window. Neither is a placeholder.
    expect(caption.text.tr).not.toEqual(caption.text.en);
  });

  it("rewards exactly what the stop's canonical content rewards", () => {
    const window = clockTower();
    const izmir = loadComposedCity('izmir');
    const hotspot = izmir.hotspots.find((item) => item.stopId === window.stopId);
    expect(hotspot, 'the window points at a stop that exists').toBeTruthy();
    expect(window.reward).toBe(hotspot!.reward.assetId);
  });

  it('points its camera at something the scene really has', () => {
    const window = clockTower();
    const izmir = loadComposedCity('izmir');
    const match = /^hotspot:(\d+)$/.exec(window.camera.target);
    expect(match, 'the first window frames a hotspot').toBeTruthy();
    const order = Number(match![1]);
    expect(izmir.hotspots.some((hotspot) => hotspot.order === order)).toBe(true);
  });
});

describe('the clock', () => {
  const events = clockTower().events;

  it('fires a one-shot command exactly once however the frame rate moves', () => {
    let fired = 0;
    let previous = 0;
    for (let t = 0; t <= 9; t += 0.37) {
      fired += commandsFiredBetween(events, previous, t).filter(
        (command) => command.do === 'sound' && command.cue === 'clock-bell',
      ).length;
      previous = t;
    }
    expect(fired).toBe(1);
  });

  it('keeps a finished tween applied rather than dropping it', () => {
    const move = events.find((event) => event.do === 'move');
    if (!move || move.do !== 'move') throw new Error('unreachable');
    const after = activeCommands(events, move.at + move.seconds + 0.5);
    expect(after.some((entry) => entry.command === move && entry.progress === 1)).toBe(true);
  });

  it('shows the caption for its whole window and not before', () => {
    expect(captionAt(events, 0)?.visible).toBe(false);
    expect(captionAt(events, 5)?.visible).toBe(true);
    expect(captionAt(events, 8.5)?.visible).toBe(false);
  });
});

describe('the lifecycle', () => {
  it('reaches completion only by running out the clock', () => {
    let context = initialTimeWindowContext(9);
    context = timeWindowReducer(context, { type: 'START' });
    context = timeWindowReducer(context, { type: 'SNAPSHOT_TAKEN' });
    expect(context.state).toBe('playing');
    for (let i = 0; i < 90; i += 1) {
      context = timeWindowReducer(context, { type: 'ELAPSED', seconds: 0.1 });
    }
    expect(context.state).toBe('completing');
    expect(shouldGrantReward(context)).toBe(true);
  });

  it.each(['skip', 'leave', 'route', 'unmount'] as const)(
    'accepts a cancel from %s and earns nothing',
    (reason) => {
      let context = initialTimeWindowContext(9);
      context = timeWindowReducer(context, { type: 'START' });
      context = timeWindowReducer(context, { type: 'SNAPSHOT_TAKEN' });
      context = timeWindowReducer(context, { type: 'ELAPSED', seconds: 3 });
      context = timeWindowReducer(context, { type: 'CANCEL', reason });
      expect(context.state).toBe('cancelling');
      expect(context.cancelReason).toBe(reason);
      expect(shouldGrantReward(context)).toBe(false);
    },
  );

  it('accepts a cancel during starting, when the snapshot may already exist', () => {
    let context = initialTimeWindowContext(9);
    context = timeWindowReducer(context, { type: 'START' });
    context = timeWindowReducer(context, { type: 'CANCEL', reason: 'route' });
    expect(context.state).toBe('cancelling');
  });

  it('offers skip late rather than immediately', () => {
    let context = initialTimeWindowContext(9);
    context = timeWindowReducer(context, { type: 'START' });
    context = timeWindowReducer(context, { type: 'SNAPSHOT_TAKEN' });
    context = timeWindowReducer(context, { type: 'ELAPSED', seconds: 0.5 });
    expect(skipAvailable(context)).toBe(false);
    context = timeWindowReducer(context, {
      type: 'ELAPSED',
      seconds: SKIP_AVAILABLE_AFTER_SECONDS,
    });
    expect(skipAvailable(context)).toBe(true);
  });
});

describe('snapshot and restore', () => {
  it('puts the camera, lights, colours, audio, HUD and controls back', () => {
    const source = sources();
    const ambient = source.lights.ambient!;
    const fill = source.lights.fill!;
    const snapshot = takeSnapshot(source);
    const { targets, applied } = targetsFor(source);

    // The window does its worst.
    source.camera!.position.set(40, 30, -90);
    ambient.intensity = 0.05;
    fill.intensity = 0;
    targets.setColours({ sky: { top: '#ff0000', horizon: '#ff8800' }, water: '#000000', ground: '#111111' });
    targets.setAudio({ music: 0.01, ambience: 0.01 });
    targets.setHudVisible(false);
    targets.setControlsEnabled(false);

    restoreSnapshot(snapshot, targets);

    expect(source.camera!.position.toArray()).toEqual([1, 2, 3]);
    expect(ambient.intensity).toBe(0.8);
    expect(fill.intensity).toBe(0.4);
    expect(applied.colours.sky.top).toBe('#8FD6EC');
    expect(applied.colours.water).toBe('#2F8FA8');
    expect(applied.audio).toEqual({ music: 0.28, ambience: 0.35 });
    expect(applied.hud).toBe(true);
    expect(applied.controls).toBe(true);
  });

  it('restores a moved object and keeps the FIRST value when two effects touch it', () => {
    const source = sources();
    const snapshot = takeSnapshot(source);
    const pigeon = new Object3D();
    pigeon.position.set(-8.9, 0.2, -39);

    rememberTransform(snapshot, 'spawn:pigeon-a', pigeon);
    pigeon.position.set(-2.4, 9.4, -43.5);
    // A second command on the same object must not re-record the moved value.
    rememberTransform(snapshot, 'spawn:pigeon-a', pigeon);
    pigeon.rotation.y = 2.2;

    const { targets } = targetsFor(source, { 'spawn:pigeon-a': pigeon });
    restoreSnapshot(snapshot, targets);

    expect(pigeon.position.toArray()).toEqual([-8.9, 0.2, -39]);
    expect(pigeon.rotation.y).toBe(0);
  });

  it('restores visibility of objects a window hid', () => {
    const source = sources();
    const snapshot = takeSnapshot(source);
    const walker = new Object3D();
    rememberVisibility(snapshot, 'leaf drift#0', walker);
    walker.visible = false;

    const { targets } = targetsFor(source, { 'leaf drift#0': walker });
    restoreSnapshot(snapshot, targets);
    expect(walker.visible).toBe(true);
  });

  it('can be restored twice without harm', () => {
    const source = sources();
    const snapshot = takeSnapshot(source);
    const { targets, applied } = targetsFor(source);
    source.camera!.position.set(9, 9, 9);
    restoreSnapshot(snapshot, targets);
    restoreSnapshot(snapshot, targets);
    expect(source.camera!.position.toArray()).toEqual([1, 2, 3]);
    expect(applied.audio).toEqual({ music: 0.28, ambience: 0.35 });
  });
});

describe('spawn cleanup', () => {
  const spawn = () => {
    const registry = new SpawnRegistry();
    const parent = new Object3D();
    for (const id of ['pigeon-a', 'pigeon-b', 'pigeon-c']) {
      const bird = new Object3D();
      parent.add(bird);
      registry.add(id, bird);
    }
    return { registry, parent };
  };

  it('leaves nothing behind after a skip', () => {
    const { registry, parent } = spawn();
    expect(registry.size).toBe(3);
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.ids).toEqual([]);
    expect(parent.children).toHaveLength(0);
  });

  it('can be cleaned up twice', () => {
    const { registry } = spawn();
    registry.clear();
    expect(() => registry.clear()).not.toThrow();
    expect(registry.size).toBe(0);
  });

  it('disposes rather than orphans when an id is spawned twice', () => {
    const registry = new SpawnRegistry();
    const parent = new Object3D();
    const first = new Object3D();
    const second = new Object3D();
    parent.add(first);
    parent.add(second);
    registry.add('pigeon-a', first);
    registry.add('pigeon-a', second);
    expect(registry.size).toBe(1);
    expect(parent.children).toEqual([second]);
  });
});

describe('the graybox guard', () => {
  it('lets İzmir run, because its models are delivered', () => {
    expect(assetsPresent(clockTower()).eligible).toBe(true);
  });

  it('refuses a window whose asset is still a placeholder', () => {
    const window = { ...clockTower(), requires: ['city_antalya_falez_edge'] };
    const result = assetsPresent(window);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('missing-assets');
    expect(result.missing).toContain('city_antalya_falez_edge');
  });

  it('refuses a window whose asset nothing knows', () => {
    const window = { ...clockTower(), requires: ['city_nowhere_invented'] };
    expect(assetsPresent(window).eligible).toBe(false);
  });

  it('falls back to the fact card under reduced motion', () => {
    const result = windowEligibility(clockTower(), { reducedMotion: true });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('reduced-motion');
  });

  it('falls back to the fact card when a stop has no window at all', () => {
    expect(windowEligibility(null, { reducedMotion: false }).reason).toBe('no-window');
  });
});

describe('the reward gate', () => {
  const window = () => clockTower();

  it('grants once on a first completion', () => {
    const progress = completeHotspot(emptyCityProgress('izmir'), 'izmir-hotspot-03', window().reward);
    expect(progress.collectedRewardIds).toEqual([window().reward]);
    expect(progress.completedHotspotIds).toEqual(['izmir-hotspot-03']);
  });

  it('grants nothing on a replay', () => {
    const first = completeHotspot(emptyCityProgress('izmir'), 'izmir-hotspot-03', window().reward);
    const second = completeHotspot(first, 'izmir-hotspot-03', window().reward);
    expect(second.collectedRewardIds).toHaveLength(1);
    expect(second.completedHotspotIds).toHaveLength(1);
    // Unchanged object: nothing was written, so nothing is saved either.
    expect(second).toBe(first);
  });

  it('gives the reduced-motion player exactly the same progress', () => {
    const cinematic = completeHotspot(
      emptyCityProgress('izmir'),
      'izmir-hotspot-03',
      window().reward,
    );
    const factCard = completeHotspot(
      emptyCityProgress('izmir'),
      'izmir-hotspot-03',
      window().reward,
    );
    expect(factCard.completedHotspotIds).toEqual(cinematic.completedHotspotIds);
    expect(factCard.collectedRewardIds).toEqual(cinematic.collectedRewardIds);
  });

  it('earns nothing from a cancelled window', () => {
    let context = initialTimeWindowContext(9);
    context = timeWindowReducer(context, { type: 'START' });
    context = timeWindowReducer(context, { type: 'SNAPSHOT_TAKEN' });
    context = timeWindowReducer(context, { type: 'CANCEL', reason: 'skip' });
    const progress = shouldGrantReward(context)
      ? completeHotspot(emptyCityProgress('izmir'), 'izmir-hotspot-03', window().reward)
      : emptyCityProgress('izmir');
    expect(progress.collectedRewardIds).toEqual([]);
  });
});
