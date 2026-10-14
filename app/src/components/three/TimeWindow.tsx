'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Box3, Vector3, type Group, type Object3D } from 'three';
import type { TimeWindow as TimeWindowData } from '@/content/schemas/timewindow';
import { activeCommands, commandsFiredBetween, easeInOutCubic } from '@/engine/timewindow/clock';
import {
  rememberTransform,
  rememberVisibility,
  SpawnRegistry,
  type SceneSnapshot,
} from '@/engine/timewindow/snapshot';
import { resolveAsset } from '@/engine/assets/registry';
import { WINDOW_CUES } from '@/engine/audio/cues';

/**
 * The Time Window, running in the scene.
 *
 * This component owns the *scene* half of a window: spawning, moving, hiding,
 * and sound. It owns none of the decisions — whether the window may run, when
 * it ends, and whether anything is earned all live outside it, in
 * `eligibility.ts`, `machine.ts` and the store. That split is deliberate: every
 * one of those is testable without a renderer, and this file is the only part
 * that is not.
 *
 * The camera is not driven from here either. `PlayerRig` already takes an
 * authored `focus` anchor and lerps to it, which is exactly the move a window
 * needs, so a window supplies that anchor and the existing rig does the work.
 * Writing a second camera controller would have left two of them fighting over
 * `camera.position` every frame.
 */

export interface TimeWindowHandle {
  /** Cleanup, callable twice. Both exits go through it. */
  cleanup: () => void;
}

export function TimeWindowStage({
  window: data,
  elapsed,
  snapshot,
  registry,
  onTouchObject,
  onError,
}: {
  window: TimeWindowData;
  /** Seconds since the window started, driven by the owner's clock. */
  elapsed: number;
  snapshot: SceneSnapshot;
  registry: SpawnRegistry;
  /**
   * Reports a scene object this stage touched, under its snapshot key.
   *
   * Handing the object back rather than writing into a shared record, because
   * the restore pass runs outside the canvas and has no way of its own to turn
   * a note into a pigeon. Without this, `hide` hid things that nothing ever
   * unhid (D-226).
   */
  onTouchObject?: (key: string, object: Object3D) => void;
  onError?: (message: string) => void;
}) {
  const { scene } = useThree();
  const holder = useRef<Group>(null);
  const previousElapsed = useRef(0);

  /**
   * Models this window may spawn, preloaded.
   *
   * Every one of them is in `requires`, and the eligibility guard has already
   * refused to start the window unless they are delivered assets, so these URLs
   * are real and almost certainly in `useGLTF`'s cache from the scene around
   * them. Hooks cannot be conditional, which is why the list is derived from
   * static data rather than from what has spawned so far.
   */
  const spawnUrls = useMemo(() => {
    const assets = new Set<string>();
    for (const event of data.events) if (event.do === 'spawn') assets.add(event.asset);
    return [...assets]
      .map((id) => {
        try {
          return resolveAsset(id, 'high').modelUrl;
        } catch {
          return null;
        }
      })
      .filter((url): url is string => Boolean(url));
  }, [data.events]);

  const loaded = useGLTF(spawnUrls);
  const sources = useMemo(() => {
    const map = new Map<string, Object3D>();
    spawnUrls.forEach((url, index) => {
      const gltf = Array.isArray(loaded) ? loaded[index] : loaded;
      if (gltf?.scene) map.set(url, gltf.scene);
    });
    return map;
  }, [loaded, spawnUrls]);

  /**
   * Objects the scene already holds, found once by their generated note.
   *
   * The scene writes a `note` on every prop it places ("street tree 3", "leaf
   * drift 7"), and that note is the only stable handle a window has on
   * something it did not create. Matching on it by prefix is what lets `hide`
   * take the walking pigeons out while the flying ones are up, without the
   * window needing to know where the generator put them.
   */
  const findByNotePrefix = useCallback(
    (prefix: string): Object3D[] => {
      const found: Object3D[] = [];
      scene.traverse((node) => {
        const note = node.userData?.note;
        const assetId = node.userData?.assetId;
        if (typeof note === 'string' && note.startsWith(prefix)) found.push(node);
        else if (typeof assetId === 'string' && assetId === prefix) found.push(node);
      });
      return found;
    },
    [scene],
  );

  const runFrame = (node: Group) => {
    // One-shot commands: sounds, spawns, despawns, hides.
    for (const command of commandsFiredBetween(data.events, previousElapsed.current, elapsed)) {
      switch (command.do) {
        case 'sound': {
          const cue = WINDOW_CUES[command.cue];
          if (cue) cue();
          else onError?.(`unknown cue "${command.cue}"`);
          break;
        }
        case 'spawn': {
          const asset = (() => {
            try {
              return resolveAsset(command.asset, 'high');
            } catch {
              return null;
            }
          })();
          const source = asset?.modelUrl ? sources.get(asset.modelUrl) : undefined;
          if (!source) {
            // The guard should have caught this. Never fly the camera at nothing.
            onError?.(`spawn "${command.id}" has no model for ${command.asset}`);
            break;
          }
          const object = cloneSkinned(source);
          /**
           * Scaled off its own measured box, like every other instanced model
           * here. The registry's dimensions are the authored size and a clone
           * dropped in raw arrives at whatever the exporter left it at.
           */
          const box = new Box3().setFromObject(object);
          const size = box.getSize(new Vector3());
          const longest = Math.max(size.x, size.y, size.z, 0.001);
          const registered = asset?.entry.dimensions ?? [1, 1, 1];
          const target = Math.max(registered[0], registered[1], registered[2]);
          object.scale.setScalar((target / longest) * command.scale);
          object.position.set(...command.from);
          node.add(object);
          registry.add(command.id, object);
          break;
        }
        case 'despawn':
          registry.remove(command.id);
          break;
        case 'hide': {
          for (const [index, found] of findByNotePrefix(command.notePrefix).entries()) {
            const key = `hide:${command.notePrefix}#${index}`;
            rememberVisibility(snapshot, key, found);
            // Handed to the restore pass, which otherwise has no way to reach
            // it — and an object hidden with nothing to unhide it stays gone.
            onTouchObject?.(key, found);
            found.visible = false;
          }
          break;
        }
        default:
          break;
      }
    }

    // Continuous commands: positions, rotations, scales.
    for (const { command, progress } of activeCommands(data.events, elapsed)) {
      if (command.do === 'move') {
        const object = registry.get(command.id);
        if (!object) continue;
        rememberTransform(snapshot, `spawn:${command.id}`, object);
        const eased = easeInOutCubic(progress);
        const from = movementStart(command.id, object, command.to, eased);
        object.position.lerpVectors(from.from, from.to, eased);
        if (command.curve === 'arc') {
          // A lift through the middle, nothing through the ends: birds leave
          // the ground on a curve, and a straight line reads as a lift shaft.
          object.position.y += Math.sin(eased * Math.PI) * 1.6;
        }
        // Facing follows travel, so a bird is never flying backwards.
        const heading = Math.atan2(from.to.x - from.from.x, from.to.z - from.from.z);
        object.rotation.y = heading;
      }
      if (command.do === 'rotate') {
        const object = registry.get(command.id);
        if (!object) continue;
        rememberTransform(snapshot, `spawn:${command.id}`, object);
        object.rotation.y = easeInOutCubic(progress) * command.turns * Math.PI * 2;
      }
      if (command.do === 'scale') {
        const object = registry.get(command.id);
        if (!object) continue;
        rememberTransform(snapshot, `spawn:${command.id}`, object);
        const eased = easeInOutCubic(progress);
        object.scale.setScalar(1 + (command.to - 1) * eased);
      }
    }

    previousElapsed.current = elapsed;
  };

  useFrame(() => {
    const node = holder.current;
    if (!node) return;
    try {
      runFrame(node);
    } catch (cause) {
      /*
        A window must not be able to take the city with it.

        Everything in this loop touches live three.js objects, and an error
        thrown inside `useFrame` stops the render loop for the whole canvas:
        one bad clone, one disposed material, and the child is left looking at
        a still image of the street. Reported and swallowed; the owner's clock
        carries on and ends the window on time.
      */
      onError?.(cause instanceof Error ? cause.message : String(cause));
      previousElapsed.current = elapsed;
    }
  });

  /**
   * Unmount is a cancel path, and the last one.
   *
   * Whatever route change or error took this component away, the spawned
   * objects are this component's to remove. `clear` is idempotent, so the owner
   * having already called it is fine.
   */
  useEffect(() => {
    return () => registry.clear();
  }, [registry]);

  return <group ref={holder} name="time-window" />;
}

/**
 * Where a move starts.
 *
 * Remembered per object the first time its move runs, so a second move on the
 * same object (the pigeons coming back down) interpolates from where it is
 * rather than from where it originally spawned.
 */
const starts = new WeakMap<Object3D, { id: string; from: Vector3; to: Vector3 }>();

function movementStart(
  id: string,
  object: Object3D,
  to: readonly [number, number, number],
  progress: number,
): { from: Vector3; to: Vector3 } {
  const target = new Vector3(to[0], to[1], to[2]);
  const existing = starts.get(object);
  if (existing && existing.id === id && existing.to.equals(target)) return existing;
  // At progress 0 the object is still where the previous command left it.
  if (progress <= 0.001 || !existing || !existing.to.equals(target)) {
    const entry = { id, from: object.position.clone(), to: target };
    starts.set(object, entry);
    return entry;
  }
  return existing;
}
