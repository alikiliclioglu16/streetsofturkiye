import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of fs.readdirSync(process.argv[2])) {
  if (!f.endsWith('.glb')) continue;
  const doc = await io.read(`${process.argv[2]}/${f}`);
  const root = doc.getRoot();
  const tex = root.listTextures().map((t) => {
    const size = t.getSize();
    return `${t.getName()||'?'} ${size?.join('x')} ${t.getMimeType()} ${(t.getImage().byteLength/1e6).toFixed(2)}MB`;
  });
  const mats = root.listMaterials().map((m) => `${m.getName()} alpha=${m.getAlphaMode()} base=${m.getBaseColorTexture()?'y':'n'} norm=${m.getNormalTexture()?'y':'n'} mr=${m.getMetallicRoughnessTexture()?'y':'n'} emis=${m.getEmissiveTexture()?'y':'n'}`);
  console.log(`\n=== ${f} ===`);
  console.log(' ext:', root.listExtensionsUsed().map((e)=>e.extensionName).join(',')||'none');
  console.log(' materials:', mats.join(' | '));
  tex.forEach((t)=>console.log('  tex:', t));
}
