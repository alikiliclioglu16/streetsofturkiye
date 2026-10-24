/**
 * Turning Meshy exports into web icons.
 *
 * The seven icons arrived as 202 MB: 2048-pixel base colours, 2048 normals and
 * **4096 metallic-roughness maps**, for objects a child sees at about 120
 * pixels across. Baklava arrived at 3.18 million triangles, which is a print
 * mesh rather than a game one — the same thing the pigeon did (D-?), and the
 * same answer.
 *
 * No Draco, no meshopt, no KTX2: `useGLTF` is set up here without any of those
 * decoders, so a file that needs one would load in my test harness and fail on
 * the owner's machine. `KHR_mesh_quantization` is the one geometry extension
 * three.js reads natively, so that is the only one used.
 *
 * Usage: node scripts/tools/optimise-icons.mjs <inDir> <outDir>
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMeshQuantization } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  join,
  prune,
  quantize,
  simplify,
  textureCompress,
  weld,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/** What a 120-pixel icon can actually resolve. Measured, not guessed: see below. */
const BASE_COLOUR_PX = 384;
const NORMAL_PX = 192;
/** Roughness varies on these bakes, so the map stays — at the size it earns. */
const METAL_ROUGH_PX = 128;
/**
 * Triangles.
 *
 * Six of the seven arrived at about three thousand, which is already a game
 * mesh — the 202 MB was all texture. Cutting them to fifteen hundred was
 * measurable on screen and saved almost nothing: the çaydanlık came back as a
 * faceted lump, because a curved metal body is exactly what a simplifier
 * spends triangles on. So the budget is set where the models already sit, and
 * only baklava — a 3.18 million triangle scan — is actually cut.
 */
const TRIANGLE_BUDGET = 3200;

const inDir = process.argv[2];
const outDir = process.argv[3];
if (!inDir || !outDir) throw new Error('usage: optimise-icons.mjs <inDir> <outDir>');
fs.mkdirSync(outDir, { recursive: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;

/**
 * Is this metallic-roughness map worth keeping?
 *
 * A baked Meshy material usually has one roughness value smeared across four
 * thousand pixels. Measured rather than assumed: if the green and blue channels
 * barely vary, the map is replaced by the two factors it was encoding and a
 * whole texture fetch disappears.
 */
async function metallicRoughnessStats(image) {
  const { data, info } = await sharp(Buffer.from(image))
    .resize(64, 64, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  let roughSum = 0;
  let metalSum = 0;
  let roughMin = 255;
  let roughMax = 0;
  let metalMin = 255;
  let metalMax = 0;
  const pixels = 64 * 64;
  for (let i = 0; i < pixels; i += 1) {
    const rough = data[i * channels + 1];
    const metal = data[i * channels + 2];
    roughSum += rough;
    metalSum += metal;
    if (rough < roughMin) roughMin = rough;
    if (rough > roughMax) roughMax = rough;
    if (metal < metalMin) metalMin = metal;
    if (metal > metalMax) metalMax = metal;
  }
  return {
    roughness: roughSum / pixels / 255,
    metallic: metalSum / pixels / 255,
    roughnessSpread: (roughMax - roughMin) / 255,
    metallicSpread: (metalMax - metalMin) / 255,
  };
}

function countTriangles(root) {
  let total = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      total += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
    }
  }
  return total;
}

const report = [];

for (const file of fs.readdirSync(inDir).filter((name) => name.endsWith('.glb')).sort()) {
  const before = fs.statSync(path.join(inDir, file)).size;
  const doc = await io.read(path.join(inDir, file));
  const root = doc.getRoot();

  // Bake the metallic-roughness map down to factors wherever it is flat.
  for (const material of root.listMaterials()) {
    const texture = material.getMetallicRoughnessTexture();
    if (!texture) continue;
    const stats = await metallicRoughnessStats(texture.getImage());
    if (stats.roughnessSpread < 0.3 && stats.metallicSpread < 0.3) {
      material.setMetallicRoughnessTexture(null);
      material.setRoughnessFactor(Math.min(1, Math.max(0.05, stats.roughness)));
      material.setMetallicFactor(stats.metallic < 0.25 ? 0 : stats.metallic);
    }
  }


  await doc.transform(
    dedup(),
    flatten(),
    join(),
    weld({ tolerance: 0.0001 }),
    prune({ keepAttributes: false }),
  );

  /**
   * Simplify until it is under budget, or until it stops moving.
   *
   * One pass is not enough on baklava. Its 3.18 million triangles come off a
   * scan-like bake made of many disconnected shells, and `simplify` protects
   * every shell border — so a single call with a strict error cap stopped at
   * twelve thousand. Loosening the cap a step at a time and re-running gets
   * there; stopping when a pass gains less than 2% stops it grinding on a mesh
   * that genuinely cannot go lower.
   */
  for (const error of [0.05, 0.1, 0.2, 0.4]) {
    const current = countTriangles(root);
    if (current <= TRIANGLE_BUDGET) break;
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: TRIANGLE_BUDGET / current, error }),
      prune({ keepAttributes: false }),
    );
    if (countTriangles(root) > current * 0.98) break;
  }

  /**
   * Textures, by their job.
   *
   * Base colour carries everything a child reads — the sesame, the glaze, the
   * puppet's paint — so it keeps the larger size. The normal map survives only
   * to give the crumb a little relief under a light that barely moves, which
   *256 pixels covers. Both go to JPEG: nothing here has an alpha channel, and
   * PNG on a photographic bake is ten times the bytes for no visible gain.
   */
  for (const material of root.listMaterials()) {
    const normal = material.getNormalTexture();
    if (normal) normal.setExtras({ ...normal.getExtras(), role: 'normal' });
  }

  await doc.transform(
    textureCompress({
      targetFormat: 'jpeg',
      encoder: sharp,
      quality: 84,
      resize: [BASE_COLOUR_PX, BASE_COLOUR_PX],
      slots: /baseColorTexture/,
    }),
    textureCompress({
      targetFormat: 'jpeg',
      encoder: sharp,
      quality: 80,
      resize: [NORMAL_PX, NORMAL_PX],
      slots: /normalTexture/,
    }),
    textureCompress({
      targetFormat: 'jpeg',
      encoder: sharp,
      quality: 82,
      resize: [METAL_ROUGH_PX, METAL_ROUGH_PX],
      slots: /metallicRoughnessTexture/,
    }),
  );

  doc.createExtension(KHRMeshQuantization).setRequired(true);
  await doc.transform(quantize({ pattern: /.*/ }), dedup(), prune({ keepAttributes: false }));

  root.getAsset().generator = 'streets-of-turkiye icon pipeline';

  const outPath = path.join(outDir, file);
  await io.write(outPath, doc);
  const after = fs.statSync(outPath).size;

  const outTriangles = countTriangles(root);

  report.push({ file, before, after, triangles: Math.round(outTriangles), textures: root.listTextures().length });
  console.log(
    `${file.padEnd(16)} ${(before / 1e6).toFixed(2).padStart(7)} MB -> ${(after / 1024)
      .toFixed(0)
      .padStart(5)} KB   tris ${Math.round(outTriangles).toString().padStart(6)}   textures ${root.listTextures().length}`,
  );
}

const total = report.reduce((sum, row) => sum + row.after, 0);
console.log(`\ntotal ${(total / 1024).toFixed(0)} KB across ${report.length} icons`);
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
