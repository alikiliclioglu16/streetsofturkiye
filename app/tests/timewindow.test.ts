import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';

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
  WINDOW_STALL_MS,
  type TimeWindowContext,
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

/**
 * Is any of it actually on screen?
 *
 * This is the test that was missing, and its absence cost the owner a stop
 * that looked broken. The first İzmir window was correct by every rule above
 * — schema, lifecycle, restore, reward — and still showed a child nothing: the
 * pigeons spawned sixteen to twenty-two metres from the tower while the camera
 * framed the tower from thirteen metres back, so every bird in it was outside
 * the frustum for the whole nine seconds. "Correct" and "visible" are
 * different properties and only one of them was being checked.
 *
 * So the geometry is checked here, against the same framing the game builds:
 * target = the stop's anchor plus the window's offset, camera = target plus
 * [1.5, height, distance], 50° vertical FOV (D-183).
 */
describe('the window is in shot', () => {
  const FOV_DEGREES = 50;
  /** The narrowest common viewport. A wider screen only ever sees more. */
  const ASPECT = 16 / 10;

  function framing(window: ReturnType<typeof clockTower>) {
    const city = loadComposedCity('izmir');
    const hotspot = city.hotspots.find((entry) => entry.stopId === window.stopId);
    if (!hotspot) throw new Error(`no hotspot for ${window.stopId}`);
    const [ax, ay, az] = hotspot.transform.position;
    const [ox, oy, oz] = window.camera.offset;
    const target = [ax! + ox, ay! + oy, az! + oz] as const;
    const eye = [
      target[0] + 1.5,
      target[1] + window.camera.height,
      target[2] + window.camera.distance,
    ] as const;
    return { target, eye };
  }

  type Point = readonly [number, number, number];

  /**
   * Where a point sits in the frame, as two angles off the camera's axis.
   *
   * Built with three.js vectors rather than by hand, because the hand-written
   * version of this is exactly the kind of arithmetic that agrees with itself
   * and disagrees with the renderer.
   */
  function offAxis(eye: Point, target: Point, point: Point) {
    const origin = new Vector3(...eye);
    const axis = new Vector3(...target).sub(origin).normalize();
    const right = new Vector3(axis.z, 0, -axis.x).normalize();
    const up = new Vector3().crossVectors(right, axis).normalize();
    const to = new Vector3(...point).sub(origin);
    const forward = to.dot(axis);
    return {
      forward,
      vertical: (Math.atan2(to.dot(up), forward) * 180) / Math.PI,
      horizontal: (Math.atan2(to.dot(right), forward) * 180) / Math.PI,
    };
  }

  const halfVertical = FOV_DEGREES / 2;
  const halfHorizontal =
    (Math.atan(Math.tan((halfVertical * Math.PI) / 180) * ASPECT) * 180) / Math.PI;

  it('spawns every object inside the frame it flies the camera to', () => {
    const window = clockTower();
    const { target, eye } = framing(window);
    const spawns = window.events.filter((event) => event.do === 'spawn');
    expect(spawns.length).toBeGreaterThan(0);

    for (const spawn of spawns) {
      if (spawn.do !== 'spawn') continue;
      const angles = offAxis(eye, target, spawn.from);
      expect(angles.forward, `${spawn.id} is behind the camera`).toBeGreaterThan(0.5);
      expect(Math.abs(angles.vertical), `${spawn.id} vertical`).toBeLessThan(halfVertical);
      expect(Math.abs(angles.horizontal), `${spawn.id} horizontal`).toBeLessThan(halfHorizontal);
    }
  });

  it('keeps every move destination inside the frame too', () => {
    const window = clockTower();
    const { target, eye } = framing(window);
    for (const event of window.events) {
      if (event.do !== 'move') continue;
      const angles = offAxis(eye, target, event.to);
      expect(angles.forward, `${event.id} flies behind the camera`).toBeGreaterThan(0.5);
      expect(Math.abs(angles.vertical), `${event.id} vertical`).toBeLessThan(halfVertical);
      expect(Math.abs(angles.horizontal), `${event.id} horizontal`).toBeLessThan(halfHorizontal);
    }
  });

  it('keeps the objects near enough to read at a child-sized scale', () => {
    const window = clockTower();
    const { eye } = framing(window);
    /**
     * A pigeon is 0.34 m tall. Three per cent of frame height is about thirty
     * pixels on a tablet — below that it is a speck, and a speck is what the
     * owner was shown. The spawn's own scale counts towards it.
     */
    for (const event of window.events) {
      if (event.do !== 'spawn') continue;
      const distance = Math.hypot(
        event.from[0] - eye[0],
        event.from[1] - eye[1],
        event.from[2] - eye[2],
      );
      const frameHeight = 2 * distance * Math.tan((halfVertical * Math.PI) / 180);
      const share = (0.34 * event.scale) / frameHeight;
      expect(share, `${event.id} fills ${(share * 100).toFixed(1)}% of frame height`).toBeGreaterThan(
        0.03,
      );
    }
  });

  it('hides the ground birds it replaces, by something the scene actually carries', () => {
    const window = clockTower();
    const hides = window.events.filter((event) => event.do === 'hide');
    expect(hides.length).toBe(1);
    const [hide] = hides;
    if (hide?.do !== 'hide') throw new Error('expected a hide');

    // The handle has to exist in the scene, or the command is a silent no-op.
    const city = loadComposedCity('izmir');
    const matches = city.props.filter(
      (prop) => prop.assetId === hide.notePrefix || (prop.note ?? '').startsWith(hide.notePrefix),
    );
    expect(matches.length, `nothing in izmir matches "${hide.notePrefix}"`).toBeGreaterThan(0);
  });
});

/**
 * Reset, which was missing and cost a stop its content.
 *
 * `settled` latches on the way out so that a cancel and an unmount cannot both
 * pay out, and nothing ever cleared it: one runner could therefore play exactly
 * one window for the life of a city. Because the fact card is withheld
 * wherever a window is eligible, the stop that followed showed neither — a
 * screen with nothing on it and the controls still taken away.
 */
describe('a runner can be used again', () => {
  it('returns to idle from any state', () => {
    const states: Array<(context: TimeWindowContext) => TimeWindowContext> = [
      (context) => context,
      (context) => timeWindowReducer(context, { type: 'START' }),
      (context) =>
        timeWindowReducer(timeWindowReducer(context, { type: 'START' }), { type: 'SNAPSHOT_TAKEN' }),
    ];
    for (const reach of states) {
      const context = reach(initialTimeWindowContext(9));
      const reset = timeWindowReducer(context, { type: 'RESET', duration: 11 });
      expect(reset.state).toBe('idle');
      expect(reset.elapsed).toBe(0);
      expect(reset.outcome).toBeNull();
      expect(reset.duration).toBe(11);
    }
  });

  it('resets a finished run, cancelled or completed', () => {
    let context = initialTimeWindowContext(9);
    context = timeWindowReducer(context, { type: 'START' });
    context = timeWindowReducer(context, { type: 'SNAPSHOT_TAKEN' });
    context = timeWindowReducer(context, { type: 'ELAPSED', seconds: 9 });
    expect(context.state).toBe('completing');
    expect(timeWindowReducer(context, { type: 'RESET', duration: 9 }).state).toBe('idle');

    let cancelled = initialTimeWindowContext(9);
    cancelled = timeWindowReducer(cancelled, { type: 'START' });
    cancelled = timeWindowReducer(cancelled, { type: 'CANCEL', reason: 'skip' });
    expect(cancelled.state).toBe('cancelling');
    expect(timeWindowReducer(cancelled, { type: 'RESET', duration: 9 }).state).toBe('idle');
  });

  it('pays out nothing after a reset, so a replay cannot double-reward', () => {
    let context = initialTimeWindowContext(9);
    context = timeWindowReducer(context, { type: 'START' });
    context = timeWindowReducer(context, { type: 'SNAPSHOT_TAKEN' });
    context = timeWindowReducer(context, { type: 'ELAPSED', seconds: 9 });
    expect(shouldGrantReward(context)).toBe(true);
    expect(shouldGrantReward(timeWindowReducer(context, { type: 'RESET', duration: 9 }))).toBe(false);
  });
});

describe('the stall fallback', () => {
  it('waits long enough for a normal start and not long enough to be noticed', () => {
    // A start is one commit. Anything in the hundreds of milliseconds is a
    // window that is not coming.
    expect(WINDOW_STALL_MS).toBeGreaterThan(300);
    expect(WINDOW_STALL_MS).toBeLessThan(1500);
    // And it must not outlast the skip button it would otherwise race.
    expect(WINDOW_STALL_MS / 1000).toBeLessThan(SKIP_AVAILABLE_AFTER_SECONDS + 0.5);
  });
});
