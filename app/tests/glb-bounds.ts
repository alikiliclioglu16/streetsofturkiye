import { readFileSync } from 'node:fs';

/**
 * Reads a GLB's world bounding box from its JSON chunk alone.
 *
 * There is no glTF library in `package.json` on purpose — the asset scripts
 * install one ad hoc, because it is tooling for occasional work and every
 * install, Vercel's included, would otherwise carry it. But the registry's
 * recorded dimensions are now what draws every model (D-120), and a number
 * that draws things deserves a test rather than a script somebody remembers to
 * run.
 *
 * So: no buffers are decoded. Every accessor in a glTF stores `min` and `max`
 * for its data, so a mesh's local box is already in the JSON, and the world box
 * is those corners pushed through the node hierarchy. That is a few dozen lines
 * and no dependency.
 *
 * It reads bind-pose geometry, so a skinned model measures whatever its rest
 * pose measures — which is the same thing three.js `Box3.setFromObject` reports,
 * and is why the cat and the horse both measure near zero until they are scaled.
 */

type Vec3 = [number, number, number];
type Matrix = readonly number[];

/** Index a matrix without widening to `number | undefined` under strict mode. */
const at = (m: Matrix, i: number): number => m[i] ?? 0;

const IDENTITY: Matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a: Matrix, b: Matrix): Matrix {
  const out: number[] = new Array(16).fill(0);
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += at(a, i * 4 + k) * at(b, k * 4 + j);
      out[i * 4 + j] = sum;
    }
  }
  return out;
}

/** Column-major TRS composition, matching the glTF specification's order. */
function fromTrs(node: Record<string, unknown>): Matrix {
  if (Array.isArray(node.matrix)) return node.matrix as Matrix;

  const translation = (node.translation as Vec3 | undefined) ?? [0, 0, 0];
  const rotation = (node.rotation as [number, number, number, number] | undefined) ?? [0, 0, 0, 1];
  const scale = (node.scale as Vec3 | undefined) ?? [1, 1, 1];
  const [tx, ty, tz] = translation;
  const [qx, qy, qz, qw] = rotation;
  const [sx, sy, sz] = scale;

  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;

  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function apply(m: Matrix, v: Vec3): Vec3 {
  const [x, y, z] = v;
  return [
    at(m, 0) * x + at(m, 4) * y + at(m, 8) * z + at(m, 12),
    at(m, 1) * x + at(m, 5) * y + at(m, 9) * z + at(m, 13),
    at(m, 2) * x + at(m, 6) * y + at(m, 10) * z + at(m, 14),
  ];
}

export interface ModelBounds {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly baseY: number;
}

export function readGlbBounds(file: string): ModelBounds | null {
  const bytes = readFileSync(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67) return null; // 'glTF'

  const chunkLength = bytes.readUInt32LE(12);
  const chunkType = bytes.readUInt32LE(16);
  if (chunkType !== 0x4e4f534a) return null; // JSON
  const gltf = JSON.parse(bytes.subarray(20, 20 + chunkLength).toString('utf8'));

  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];

  const visit = (index: number, parent: Matrix) => {
    const node = gltf.nodes?.[index];
    if (!node) return;
    const world = multiply(fromTrs(node), parent);

    const mesh = gltf.meshes?.[node.mesh];
    for (const primitive of mesh?.primitives ?? []) {
      const accessor = gltf.accessors?.[primitive.attributes?.POSITION];
      if (!accessor?.min || !accessor?.max) continue;

      // Every corner, because a rotated box's extremes are not its own min/max.
      const lo = accessor.min as Vec3;
      const hi = accessor.max as Vec3;
      for (let corner = 0; corner < 8; corner += 1) {
        const local: Vec3 = [
          corner & 1 ? hi[0] : lo[0],
          corner & 2 ? hi[1] : lo[1],
          corner & 4 ? hi[2] : lo[2],
        ];
        const world3 = apply(world, local);
        for (let axis = 0; axis < 3; axis += 1) {
          const value = world3[axis] ?? 0;
          if (value < (min[axis] ?? Infinity)) min[axis] = value;
          if (value > (max[axis] ?? -Infinity)) max[axis] = value;
        }
      }
    }

    for (const child of node.children ?? []) visit(child, world);
  };

  const scene = gltf.scenes?.[gltf.scene ?? 0];
  for (const root of scene?.nodes ?? []) visit(root, IDENTITY);

  if (!Number.isFinite(min[1])) return null;
  return {
    width: max[0] - min[0],
    height: max[1] - min[1],
    depth: max[2] - min[2],
    baseY: min[1],
  };
}
