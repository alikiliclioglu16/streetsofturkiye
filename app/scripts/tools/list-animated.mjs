/** Which GLBs carry animation, and what the clips are. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
import path from 'node:path';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const root = process.argv[2];
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.glb')) files.push(full);
  }
})(root);

for (const file of files.sort()) {
  const doc = await io.read(file);
  const anims = doc.getRoot().listAnimations();
  if (anims.length === 0) continue;
  const skins = doc.getRoot().listSkins().length;
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) tris += (prim.getIndices()?.getCount() ?? 0) / 3;
  const tex = doc.getRoot().listTextures();
  console.log(
    `${path.relative(root, file).padEnd(62)} ${(fs.statSync(file).size / 1024).toFixed(0).padStart(5)} KB  clips=${anims.length} skins=${skins} tris=${Math.round(tris)} tex=[${tex.map((t) => (t.getSize() ?? []).join('x')).join(' ')}]`,
  );
  console.log(`   ${anims.map((a) => a.getName()).join(', ')}`);
}
