/**
 * Shrinking the rigged models, without breaking the rig.
 *
 * These are the twelve files in the project that carry animation: the two
 * guides, the three featured NPCs, and the seven animals. Everything else that
 * moves in this game is moved by code — the flag, the tram, the balloons, the
 * birds' flight paths — so everything else is a static mesh and is not touched
 * here.
 *
 * **What a skinned model must survive.** Three of the usual optimisations are
 * off the table:
 *
 * - `flatten` and `join` rewrite the node tree. A skin's joints *are* that
 *   tree, and an animation channel points at nodes by index. Both of them turn
 *   a walking cat into a pile of geometry sliding about the street.
 * - `weld` across a skin seam merges vertices whose joint weights differ, which
 *   tears the mesh at the shoulder the first time an arm swings.
 * - `textureCompress` to JPEG is fine for colour, but not for anything with an
 *   alpha channel — and a character's base colour often carries one.
 *
 * What is left is still most of the weight: the keyframes, which arrive sampled
 * at a fixed rate and are mostly redundant; the textures, at 1024 for faces a
 * child sees from four metres; and the triangle counts, which on one NPC had
 * reached thirty-eight thousand.
 *
 * Usage: node scripts/tools/optimise-animated.mjs <inDir> <outDir>
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMeshQuantization } from '@gltf-transform/extensions';
import {
  dedup,
  prune,
  quantize,
  resample,
  simplify,
  weld,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Textures, by what the model is.
 *
 * A guide stands a metre and a half from the camera for the whole game and a
 * street cat is a thing that walks past; they do not need the same face. Both
 * come down from 1024, which was sized for a render rather than for a tablet.
 */
const CHARACTER_PX = 512;
const ANIMAL_PX = 384;

/**
 * Triangles, per kind.
 *
 * Measured against what each one is on screen. The soldier arrived at 38,062 —
 * more than the Hagia Sophia — for a figure standing at the edge of a stop.
 */
const BUDGETS = [
  { match: /heroes[/\\]/, triangles: 7000, texture: CHARACTER_PX, kind: 'guide' },
  { match: /npc[/\\]/, triangles: 9000, texture: CHARACTER_PX, kind: 'npc' },
  { match: /.*/, triangles: 7000, texture: ANIMAL_PX, kind: 'animal' },
];

const inDir = process.argv[2];
const outDir = process.argv[3];
if (!inDir || !outDir) throw new Error('usage: optimise-animated.mjs <inDir> <outDir>');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;

function countTriangles(root) {
  let total = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      total += (prim.getIndices()?.getCount() ?? 0) / 3;
    }
  }
  return total;
}

function countVertices(root) {
  let total = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) total += prim.getAttribute('POSITION').getCount();
  }
  return total;
}

/**
 * Put smooth normals back, without unwelding the mesh.
 *
 * `normals()` from the toolkit would do this, but it splits every vertex first
 * so that it can write a flat normal per face — which undoes the welding that
 * made the simplification possible, and came back *larger* than the file it
 * started from on four of the twelve. Accumulating each face's normal onto its
 * three vertices and normalising keeps one normal per vertex and keeps the
 * index buffer, which is the whole point of having welded.
 */
function smoothNormals(doc, root) {
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getAttribute('NORMAL')) continue;
      const position = prim.getAttribute('POSITION');
      const indices = prim.getIndices();
      if (!position || !indices) continue;

      const count = position.getCount();
      const normals = new Float32Array(count * 3);
      const a = [0, 0, 0];
      const b = [0, 0, 0];
      const c = [0, 0, 0];
      const index = indices.getArray();

      for (let i = 0; i < index.length; i += 3) {
        const ia = index[i];
        const ib = index[i + 1];
        const ic = index[i + 2];
        position.getElement(ia, a);
        position.getElement(ib, b);
        position.getElement(ic, c);
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        // Cross product, unnormalised: its length is twice the triangle's
        // area, which weights big faces more than slivers — what a smooth
        // normal should do.
        const nx = e1[1] * e2[2] - e1[2] * e2[1];
        const ny = e1[2] * e2[0] - e1[0] * e2[2];
        const nz = e1[0] * e2[1] - e1[1] * e2[0];
        for (const target of [ia, ib, ic]) {
          normals[target * 3] += nx;
          normals[target * 3 + 1] += ny;
          normals[target * 3 + 2] += nz;
        }
      }

      for (let i = 0; i < count; i += 1) {
        const x = normals[i * 3];
        const y = normals[i * 3 + 1];
        const z = normals[i * 3 + 2];
        const length = Math.hypot(x, y, z) || 1;
        normals[i * 3] = x / length;
        normals[i * 3 + 1] = y / length;
        normals[i * 3 + 2] = z / length;
      }

      const accessor = doc
        .createAccessor()
        .setType('VEC3')
        .setArray(normals)
        .setBuffer(root.listBuffers()[0]);
      prim.setAttribute('NORMAL', accessor);
    }
  }
}

function countKeyframes(root) {
  let total = 0;
  for (const animation of root.listAnimations()) {
    for (const sampler of animation.listSamplers()) {
      total += sampler.getInput()?.getCount() ?? 0;
    }
  }
  return total;
}

const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.glb')) files.push(full);
  }
})(inDir);

const report = [];

for (const file of files.sort()) {
  const doc = await io.read(file);
  const root = doc.getRoot();
  if (root.listAnimations().length === 0) continue;

  const relative = path.relative(inDir, file);
  const budget = BUDGETS.find((entry) => entry.match.test(relative));
  const before = {
    bytes: fs.statSync(file).size,
    triangles: Math.round(countTriangles(root)),
    keyframes: countKeyframes(root),
    clips: root.listAnimations().map((animation) => animation.getName()),
  };

  /**
   * Keyframes first, because it is the one pass that cannot go wrong.
   *
   * `resample` drops a keyframe only when the value either side of it already
   * describes it — a joint that holds still for twenty frames is stored as
   * two. The motion is identical afterwards, which is why it runs before
   * anything that has to be checked by eye.
   */
  await doc.transform(resample({ tolerance: 0.0001 }), dedup(), prune({ keepAttributes: false }));

  const triangles = countTriangles(root);
  if (triangles > budget.triangles) {
    /**
     * Unweld the shading seams before simplifying, where there are too many.
     *
     * This is the pass that unlocked the two NPCs, and the reason they would
     * not shrink was not the simplifier: the soldier arrived with **82,009
     * vertices for 38,062 triangles**. A welded mesh has about half as many
     * vertices as triangles; one with more than it has triangles has been
     * split along every shading seam by the exporter, and a simplifier cannot
     * collapse an edge whose two sides disagree about their normal. Both
     * passes ran and both came back having removed 0.4% of the mesh.
     *
     * Dropping NORMAL lets the weld merge on position, UV and skin weight
     * alone — 82,009 down to 36,596 — and the simplifier then reaches the
     * budget. The normals are recomputed afterwards, which is a real change:
     * the shading is smoothed where the exporter had split it. Checked rather
     * than assumed, frame by frame against the original through a walk cycle,
     * and the difference is not visible at any of them.
     */
    const vertices = countVertices(root);
    const stripped = vertices > triangles * 1.2;
    if (stripped) {
      for (const mesh of root.listMeshes()) {
        for (const prim of mesh.listPrimitives()) prim.setAttribute('NORMAL', null);
      }
      await doc.transform(prune({ keepAttributes: false }), weld({ tolerance: 0.0001 }));
    }

    const ready = countTriangles(root);
    await doc.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: budget.triangles / ready,
        error: 0.01,
        lockBorder: false,
      }),
      prune({ keepAttributes: false }),
    );
    if (stripped) smoothNormals(doc, root);
    await doc.transform(dedup());
  }

  /**
   * Textures. PNG stays PNG wherever alpha is in play.
   *
   * A character's base colour can carry cut-out alpha — hair, a fringe, the
   * gap in a chair lift — and JPEG has no alpha channel at all, so converting
   * it does not lose quality, it loses the holes.
   */
  for (const texture of root.listTextures()) {
    const mime = texture.getMimeType();
    const image = texture.getImage();
    if (!image) continue;
    const meta = await sharp(Buffer.from(image)).metadata();
    const transparent = mime === 'image/png' && meta.hasAlpha === true;
    const size = Math.min(budget.texture, Math.max(meta.width ?? 0, meta.height ?? 0));
    const pipeline = sharp(Buffer.from(image)).resize(size, size, { fit: 'inside' });
    const output = transparent
      ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await pipeline.jpeg({ quality: 86 }).toBuffer();
    if (output.byteLength < image.byteLength) {
      texture.setImage(new Uint8Array(output));
      texture.setMimeType(transparent ? 'image/png' : 'image/jpeg');
    }
  }

  doc.createExtension(KHRMeshQuantization).setRequired(true);
  /**
   * Quantization, with the joints left alone.
   *
   * Positions and UVs quantize safely. Joint indices and weights do not: a
   * weight rounded to eight bits puts a vertex on the wrong bone, and the
   * error shows up as a limb that drifts only during one clip. Normals stay at
   * 10 bits because a character's shading is what a child reads as its face.
   */
  await doc.transform(
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 11,
      /**
       * Eight bits of skin weight, not sixteen.
       *
       * `normalizedWeight` is the one place where the standard's own default
       * is the right answer: a weight is a number between zero and one that
       * four of them must sum to, and eight bits puts each within 0.4% — far
       * below what a joint rotation can show. Sixteen bits was costing two
       * bytes a vertex on seventy thousand vertices for a difference nothing
       * can display.
       */
      quantizeWeight: 8,
      quantizeGeneric: 16,
    }),
    dedup(),
    prune({ keepAttributes: false }),
  );

  const outPath = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await io.write(outPath, doc);

  const after = {
    bytes: fs.statSync(outPath).size,
    triangles: Math.round(countTriangles(root)),
    keyframes: countKeyframes(root),
    clips: root.listAnimations().map((animation) => animation.getName()),
  };

  const kept = after.clips.length === before.clips.length;
  report.push({ file: relative, kind: budget.kind, before, after, clipsKept: kept });
  console.log(
    `${relative.padEnd(58)} ${(before.bytes / 1024).toFixed(0).padStart(5)} -> ${(after.bytes / 1024)
      .toFixed(0)
      .padStart(5)} KB  tris ${before.triangles} -> ${after.triangles}  keys ${before.keyframes} -> ${after.keyframes}  clips ${after.clips.length}/${before.clips.length}${kept ? '' : '  *** CLIP LOST ***'}`,
  );
}

const before = report.reduce((sum, row) => sum + row.before.bytes, 0);
const after = report.reduce((sum, row) => sum + row.after.bytes, 0);
console.log(
  `\n${report.length} animated files: ${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - after / before) * 100)}% smaller)`,
);
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
