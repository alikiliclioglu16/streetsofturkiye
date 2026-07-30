/**
 * Re-authors a delivered model to an agreed height and stands it on y = 0.
 *
 * Meshy normalises its exports into a bounding box, so a delivery's size is an
 * artefact of the exporter rather than a statement about the object. Three
 * files in a row came back exactly 2.00 or 4.00 m tall whatever they depicted.
 *
 * The engine already corrects gross mismatches at runtime, but only outside a
 * half-to-double band — which is the band most normalised exports land in. A
 * 4 m mosaic panel against an agreed 2.2 m is a factor of 0.55 and passes
 * straight through. Correcting it in the file instead means the delivered
 * asset is right on its own terms, and the same number is true whether it is
 * read by the renderer, the scene builder reserving its footprint, or the
 * camera deriving its distance from it (D-051, D-062).
 *
 * Precedent: the street lamp was re-authored at 5 m the same way.
 *
 * The scale is uniform, taken from height. Fitting a model into a briefed box
 * on all three axes would squash whatever proportion the artist gave it, and
 * the brief's width and depth are an expectation rather than a specification —
 * the coppersmith's bench came back deeper than asked for, and that is the
 * bench, not an error.
 *
 * The delivered file is never overwritten.
 *
 * Usage: node scripts/set-model-scale.mjs <input.glb> <output.glb> <targetHeightM>
 *
 * Requires: npm i -D @gltf-transform/core @gltf-transform/extensions \
 *           @gltf-transform/functions sharp
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [, , input, output, heightArg] = process.argv;
if (!input || !output || !heightArg) {
  console.error('usage: set-model-scale.mjs <input.glb> <output.glb> <targetHeightM>');
  process.exit(1);
}

const targetHeight = Number(heightArg);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();

const mul = (m, v) => [
  m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
  m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
  m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
];

function bounds() {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const walk = (node, parent) => {
    const local = node.getMatrix();
    const world = new Array(16).fill(0);
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        for (let k = 0; k < 4; k += 1) world[i * 4 + j] += local[i * 4 + k] * parent[k * 4 + j];
      }
    }
    const mesh = node.getMesh();
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION');
        if (!pos) continue;
        for (let i = 0; i < pos.getCount(); i += 1) {
          const p = mul(world, pos.getElement(i, [0, 0, 0]));
          for (let a = 0; a < 3; a += 1) {
            if (p[a] < min[a]) min[a] = p[a];
            if (p[a] > max[a]) max[a] = p[a];
          }
        }
      }
    }
    for (const child of node.listChildren()) walk(child, world);
  };
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const scene of root.listScenes()) for (const node of scene.listChildren()) walk(node, identity);
  return { min, max };
}

const roots = root.listScenes().flatMap((scene) => scene.listChildren());
const size = (b) => [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
const r2 = (n) => Math.round(n * 100) / 100;

const before = bounds();
const factor = targetHeight / (before.max[1] - before.min[1]);

for (const node of roots) {
  node.setScale(node.getScale().map((v) => v * factor));
  node.setTranslation(node.getTranslation().map((v) => v * factor));
}

/* Stand it on the ground, measured after scaling rather than derived from it. */
const scaled = bounds();
for (const node of roots) {
  const t = node.getTranslation();
  node.setTranslation([t[0], t[1] - scaled.min[1], t[2]]);
}

const after = bounds();
await io.write(output, doc);

console.log(`factor       ${r2(factor)}`);
console.log(`before       ${size(before).map(r2).join(' x ')}   base y = ${r2(before.min[1])}`);
console.log(`after        ${size(after).map(r2).join(' x ')}   base y = ${r2(after.min[1])}`);
