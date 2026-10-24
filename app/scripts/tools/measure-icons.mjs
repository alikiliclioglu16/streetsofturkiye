import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of fs.readdirSync(process.argv[2]).filter((n)=>n.endsWith('.glb')).sort()) {
  const doc = await io.read(`${process.argv[2]}/${f}`);
  const scene = doc.getRoot().listScenes()[0];
  const b = getBounds(scene);
  const size = [b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]];
  console.log(f.replace('.glb',''), 'w/h', (size[0]/size[1]).toFixed(3), 'd/h', (size[2]/size[1]).toFixed(3));
}
