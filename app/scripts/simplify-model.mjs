/**
 * Simplifies an over-budget delivered model.
 *
 * The simit cart arrived at 969,492 triangles and 31.33 MB against a brief of
 * 3,000-6,000. Dropped into the scene it would have taken the frame from 50 fps
 * to roughly 12 — one cart costing five times the guide. Rather than send it
 * back and wait, it is simplified here: geometry through meshoptimizer, textures
 * through sharp.
 *
 * The delivered file is never overwritten. The simplified copy goes to
 * public/assets and the original stays wherever it was delivered, so the
 * decision is reversible and the reduction is reproducible.
 *
 * Usage: node scripts/simplify-model.mjs <input.glb> <output.glb> <ratio>
 *   ratio 0.003 took the simit cart to 20,182 triangles and 1.45 MB.
 *   ratio 0.15 took Galata Tower to 70,462 triangles and 2.67 MB.
 *
 * Choose the ratio by what the object has to read as. A cart is a cart at 20k
 * triangles; a tower needs its gallery, its conical roof and its finial, and
 * loses all three long before the triangle count looks alarming.
 *
 * Requires: npm i -D @gltf-transform/core @gltf-transform/extensions \
 *           @gltf-transform/functions meshoptimizer sharp
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, dedup, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [,, input, output, ratioArg] = process.argv;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);

const count = () => doc.getRoot().listMeshes()
  .flatMap((m) => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);

const before = count();
await doc.transform(
  dedup(),
  weld(),
    // lockBorder keeps UV and material seams intact. Without it the simplifier
  // welds across them and the texture tears: the first Galata Tower came back
  // white and shapeless because its seams had been collapsed.
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratioArg), error: 0.002, lockBorder: true }),
  // A cart seen from two metres does not need a 1024 map on every channel.
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [1024, 1024], quality: 86 }),
  prune(),
);
await io.write(output, doc);
console.log(JSON.stringify({ before: Math.round(before), after: Math.round(count()) }));
