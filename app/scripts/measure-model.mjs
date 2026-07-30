/**
 * Measures a delivered GLB before anything is decided about it.
 *
 * Delivery notes have been wrong more than once, so nothing here is taken from
 * the file name or from what the brief asked for. Everything printed is read
 * out of the file itself: bytes, SHA-256, triangles, meshes, materials,
 * alphaMode, doubleSided, world bounding box, base offset relative to y = 0,
 * texture sizes and animation clip names.
 *
 * This narrows a file down. It does not identify it — a row of building
 * facades and a ferry measure much the same, and the difference cost this
 * project two placements (D-078).
 *
 * Usage: node scripts/measure-model.mjs <file.glb> [more.glb ...]
 *
 * Requires: npm i -D @gltf-transform/core @gltf-transform/extensions \
 *           @gltf-transform/functions sharp
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
const r2 = (n) => Math.round(n * 100) / 100;

/** Multiplies a node's world matrix down the hierarchy, so the box is where
 *  the model actually sits rather than where its geometry was authored. */
const worldBounds = (doc) => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  const mul = (m, v) => [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
  ];

  const walk = (node, parent) => {
    const local = node.getMatrix();
    const world = new Array(16).fill(0);
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        for (let k = 0; k < 4; k += 1) {
          world[i * 4 + j] += local[i * 4 + k] * parent[k * 4 + j];
        }
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
  for (const scene of doc.getRoot().listScenes()) {
    for (const node of scene.listChildren()) walk(node, identity);
  }
  return { min, max };
};

for (const file of process.argv.slice(2)) {
  const bytes = fs.readFileSync(file);
  const doc = await io.read(file);
  const root = doc.getRoot();

  const prims = root.listMeshes().flatMap((m) => m.listPrimitives());
  const triangles = prims.reduce(
    (n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION')?.getCount() ?? 0) / 3,
    0,
  );

  const { min, max } = worldBounds(doc);
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  const materials = root.listMaterials().map((m) => ({
    name: m.getName() || '(unnamed)',
    alphaMode: m.getAlphaMode(),
    doubleSided: m.getDoubleSided(),
  }));

  const textures = root.listTextures().map((t) => {
    const s = t.getSize();
    return {
      name: t.getName() || '(unnamed)',
      mime: t.getMimeType(),
      px: s ? `${s[0]}x${s[1]}` : 'unknown',
      bytes: t.getImage()?.byteLength ?? 0,
    };
  });

  const skins = root.listSkins().length;
  const clips = root.listAnimations().map((a) => {
    const end = a.listSamplers().reduce((t, s) => {
      const input = s.getInput();
      if (!input) return t;
      return Math.max(t, input.getElement(input.getCount() - 1, [0])[0]);
    }, 0);
    return `${a.getName() || '(unnamed)'} (${r2(end)}s)`;
  });

  console.log(`\n=== ${file.split('/').pop()} ===`);
  console.log(`bytes        ${mb(bytes.length)}  (${bytes.length})`);
  console.log(`sha256       ${crypto.createHash('sha256').update(bytes).digest('hex')}`);
  console.log(`triangles    ${Math.round(triangles).toLocaleString()}`);
  console.log(`meshes       ${root.listMeshes().length}   primitives ${prims.length}   skins ${skins}`);
  console.log(`world size   ${r2(size[0])} w x ${r2(size[1])} h x ${r2(size[2])} d  (metres, as authored)`);
  console.log(`bbox min     [${min.map(r2).join(', ')}]`);
  console.log(`bbox max     [${max.map(r2).join(', ')}]`);
  console.log(`base offset  y = ${r2(min[1])}   ${Math.abs(min[1]) < 0.01 ? '(sits on y=0)' : '(NOT on y=0)'}`);
  console.log(`materials    ${materials.length}`);
  for (const m of materials) {
    console.log(`  - ${m.name}: alphaMode=${m.alphaMode} doubleSided=${m.doubleSided}`);
  }
  console.log(`textures     ${textures.length}`);
  for (const t of textures) {
    console.log(`  - ${t.name}: ${t.px} ${t.mime} ${mb(t.bytes)}`);
  }
  console.log(`animations   ${clips.length ? clips.join(', ') : 'none'}`);
}
