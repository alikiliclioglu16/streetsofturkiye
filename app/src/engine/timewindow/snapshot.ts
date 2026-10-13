import type { Camera, Object3D } from 'three';

/**
 * Putting the scene back.
 *
 * **One snapshot, restored from one place.** The obvious alternative — each
 * effect writing its own `undo` — is correct only if all twelve commands are
 * written correctly and keep being written correctly as more are added. A
 * single snapshot recovers the scene even when one of them is wrong, and that
 * difference matters because the failure mode here is not a crash: it is a
 * child arriving back at the map with the sky still orange and nothing in the
 * logs.
 *
 * What has to be captured is everything a window can touch. The list below is
 * the one in `docs/TIME_WINDOW_DESIGN.md` §5.3, and it is deliberately long
 * rather than clever; a field left out of it is a field that stays broken.
 */

export interface MaterialLike {
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
}

export interface SceneColours {
  sky: { top: string; horizon: string };
  water: string | null;
  ground: string;
}

/**
 * Everything a window may change, as it was before it started.
 *
 * Captured by value, never by reference: holding the live object and reading it
 * back at restore time returns the changed value, which is the classic way a
 * snapshot silently does nothing.
 */
export interface SceneSnapshot {
  camera: {
    position: [number, number, number];
    quaternion: [number, number, number, number];
    fov: number | null;
  };
  /** Ambient and fill light intensities, by a stable key. */
  lights: Record<string, number>;
  colours: SceneColours;
  /** Transform of every object a window moved, rotated or scaled. */
  transforms: Record<
    string,
    {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }
  >;
  /** Emissive, opacity and transparency of every material a window touched. */
  materials: Record<string, { emissiveIntensity: number; opacity: number; transparent: boolean }>;
  /** Visibility of objects a window hid. */
  visibility: Record<string, boolean>;
  /** Channel volumes, so ducking is undone exactly rather than approximately. */
  audio: { music: number; ambience: number };
  hudVisible: boolean;
  controlsEnabled: boolean;
}

export interface SnapshotSources {
  camera: Camera | null;
  lights: Record<string, { intensity: number }>;
  colours: SceneColours;
  audio: { music: number; ambience: number };
  hudVisible: boolean;
  controlsEnabled: boolean;
}

export function takeSnapshot(sources: SnapshotSources): SceneSnapshot {
  const camera = sources.camera;
  return {
    camera: {
      position: camera ? [camera.position.x, camera.position.y, camera.position.z] : [0, 0, 0],
      quaternion: camera
        ? [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w]
        : [0, 0, 0, 1],
      fov: camera && 'fov' in camera ? (camera as unknown as { fov: number }).fov : null,
    },
    lights: Object.fromEntries(
      Object.entries(sources.lights).map(([key, light]) => [key, light.intensity]),
    ),
    colours: {
      sky: { ...sources.colours.sky },
      water: sources.colours.water,
      ground: sources.colours.ground,
    },
    transforms: {},
    materials: {},
    visibility: {},
    audio: { ...sources.audio },
    hudVisible: sources.hudVisible,
    controlsEnabled: sources.controlsEnabled,
  };
}

/**
 * Record an object's transform before touching it — once.
 *
 * Called by the effect that is about to change it, which is why it must ignore
 * a second call for the same key: a `move` and a `rotate` on the same object
 * would otherwise have the second one capture the first one's work as the
 * "original".
 */
export function rememberTransform(snapshot: SceneSnapshot, key: string, object: Object3D): void {
  if (snapshot.transforms[key]) return;
  snapshot.transforms[key] = {
    position: [object.position.x, object.position.y, object.position.z],
    rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
    scale: [object.scale.x, object.scale.y, object.scale.z],
  };
}

export function rememberMaterial(snapshot: SceneSnapshot, key: string, material: MaterialLike): void {
  if (snapshot.materials[key]) return;
  snapshot.materials[key] = {
    emissiveIntensity: material.emissiveIntensity ?? 1,
    opacity: material.opacity ?? 1,
    transparent: material.transparent ?? false,
  };
}

export function rememberVisibility(snapshot: SceneSnapshot, key: string, object: Object3D): void {
  if (key in snapshot.visibility) return;
  snapshot.visibility[key] = object.visible;
}

export interface RestoreTargets {
  camera: Camera | null;
  lights: Record<string, { intensity: number }>;
  objects: Record<string, Object3D>;
  materials: Record<string, MaterialLike>;
  setColours: (colours: SceneColours) => void;
  setAudio: (audio: { music: number; ambience: number }) => void;
  setHudVisible: (visible: boolean) => void;
  setControlsEnabled: (enabled: boolean) => void;
}

/**
 * Put everything back.
 *
 * Idempotent: calling it twice is harmless, because every write is an
 * assignment to a value held in the snapshot rather than a delta. That is a
 * requirement, not a happy accident — cancel and unmount can both fire for the
 * same window, in either order.
 */
export function restoreSnapshot(snapshot: SceneSnapshot, targets: RestoreTargets): void {
  const camera = targets.camera;
  if (camera) {
    camera.position.set(...snapshot.camera.position);
    camera.quaternion.set(...snapshot.camera.quaternion);
    if (snapshot.camera.fov !== null && 'fov' in camera) {
      (camera as unknown as { fov: number; updateProjectionMatrix: () => void }).fov =
        snapshot.camera.fov;
      (camera as unknown as { updateProjectionMatrix: () => void }).updateProjectionMatrix();
    }
  }

  for (const [key, intensity] of Object.entries(snapshot.lights)) {
    const light = targets.lights[key];
    if (light) light.intensity = intensity;
  }

  for (const [key, transform] of Object.entries(snapshot.transforms)) {
    const object = targets.objects[key];
    if (!object) continue;
    object.position.set(...transform.position);
    object.rotation.set(...transform.rotation);
    object.scale.set(...transform.scale);
  }

  for (const [key, values] of Object.entries(snapshot.materials)) {
    const material = targets.materials[key];
    if (!material) continue;
    if ('emissiveIntensity' in material) material.emissiveIntensity = values.emissiveIntensity;
    if ('opacity' in material) material.opacity = values.opacity;
    if ('transparent' in material) material.transparent = values.transparent;
  }

  for (const [key, visible] of Object.entries(snapshot.visibility)) {
    const object = targets.objects[key];
    if (object) object.visible = visible;
  }

  targets.setColours(snapshot.colours);
  targets.setAudio(snapshot.audio);
  targets.setHudVisible(snapshot.hudVisible);
  targets.setControlsEnabled(snapshot.controlsEnabled);
}

/**
 * Spawned objects, tracked by the id the command gave them.
 *
 * `dispose` on the geometry and material as well as removal from the parent:
 * a window that runs five times in a session otherwise leaves five sets of
 * buffers on the GPU, which is invisible until a tablet runs out of them.
 */
export class SpawnRegistry {
  private readonly entries = new Map<string, Object3D>();

  add(id: string, object: Object3D): void {
    // A re-spawn of the same id disposes the first, rather than orphaning it.
    this.remove(id);
    this.entries.set(id, object);
  }

  get(id: string): Object3D | undefined {
    return this.entries.get(id);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  get ids(): string[] {
    return [...this.entries.keys()];
  }

  get size(): number {
    return this.entries.size;
  }

  remove(id: string): void {
    const object = this.entries.get(id);
    if (!object) return;
    disposeTree(object);
    object.parent?.remove(object);
    this.entries.delete(id);
  }

  /** Idempotent by construction: a second call finds an empty map. */
  clear(): void {
    for (const id of [...this.entries.keys()]) this.remove(id);
  }
}

function disposeTree(root: Object3D): void {
  root.traverse((node) => {
    const mesh = node as unknown as {
      geometry?: { dispose?: () => void };
      material?: { dispose?: () => void } | { dispose?: () => void }[];
    };
    mesh.geometry?.dispose?.();
    const material = mesh.material;
    if (Array.isArray(material)) {
      for (const item of material) item.dispose?.();
    } else {
      material?.dispose?.();
    }
  });
}
