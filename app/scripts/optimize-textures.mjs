/**
 * Brings a delivery's textures into budget without touching its geometry.
 *
 * `simplify-model.mjs` exists for the other case: a model that arrived with far
 * more triangles than it needs. It reduces geometry and squashes every texture
 * to 1024. That is the wrong tool for a delivery whose mesh is already in
 * budget and whose cost is entirely in its maps — and it is the wrong tool for
 * anything whose colour map has to stay at 2048, because a mosaic at 1024
 * becomes a smear (D-057).
 *
 * Textures are sized by role. Base colour is chosen per asset; normal and
 * metallic-roughness sit one step below it.
 *
 * Two things are removed rather than resized:
 *
 *  - A black emissive map. Meshy bakes one into every export and sets
 *    `emissiveFactor` to [1,1,1] beside it. When the map is black the material
 *    emits nothing, so a 4096 px texture and a texture unit are being spent to
 *    add zero. Measured, not assumed: the map is only dropped when its brightest
 *    pixel is below the threshold below.
 *  - Unused data, through dedup and prune.
 *
 * `doubleSided` is never touched. Forcing it off saves fragments on a closed
 * shape and destroys a thin one — a flag is one plane, and culling its back
 * face draws half of it (D-089). `alphaMode` is forced OPAQUE, which is safe.
 *
 * Geometry is not modified at all: no weld, no simplify. Welding across a UV
 * seam is what returned the first Galata Tower white and shapeless (D-054b), and
 * there is nothing to gain here to justify the risk.
 *
 * The delivered file is never overwritten. The optimised copy is written to the
 * output path and the original stays where it was delivered, so the reduction
 * is reversible and reproducible.
 *
 * Usage:
 *   node scripts/optimize-textures.mjs <input.glb> <output.glb> <baseColorPx>
 *
 *   baseColorPx 2048 -> normal and metallic-roughness at 1024
 *   baseColorPx 1024 -> normal and metallic-roughness at 512
 *
 * Requires: npm i -D @gltf-transform/core @gltf-transform/extensions \
 *           @gltf-transform/functions sharp
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune } from '@gltf-transform/functions';
import sharp from 'sharp';

const [, , input, output, baseArg] = process.argv;
if (!input || !output || !baseArg) {
  console.error('usage: optimize-textures.mjs <input.glb> <output.glb> <baseColorPx>');
  process.exit(1);
}

/** A map whose brightest channel is below this is treated as carrying nothing. */
const BLACK_THRESHOLD = 8;

const basePx = Number(baseArg);
const secondaryPx = basePx / 2;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
const bytesOf = () => root.listTextures().reduce((n, t) => n + (t.getImage()?.byteLength ?? 0), 0);
const before = bytesOf();

/* 1 — drop emissive maps that are black --------------------------------- */

for (const material of root.listMaterials()) {
  const emissive = material.getEmissiveTexture();
  if (!emissive) continue;

  const stats = await sharp(Buffer.from(emissive.getImage())).stats();
  const brightest = Math.max(...stats.channels.slice(0, 3).map((c) => c.max));
  if (brightest > BLACK_THRESHOLD) {
    console.log(`kept emissive on ${material.getName()}: brightest channel ${brightest}`);
    continue;
  }

  console.log(`dropped emissive on ${material.getName()}: brightest channel ${brightest}`);
  material.setEmissiveTexture(null);
  material.setEmissiveFactor([0, 0, 0]);
}

/* 2 — resize what is left, by role -------------------------------------- */

const roleOf = (texture) => {
  for (const material of root.listMaterials()) {
    if (material.getBaseColorTexture() === texture) return { role: 'baseColor', px: basePx, quality: 88 };
    if (material.getNormalTexture() === texture) return { role: 'normal', px: secondaryPx, quality: 92 };
    if (material.getMetallicRoughnessTexture() === texture) {
      return { role: 'metallicRoughness', px: secondaryPx, quality: 90 };
    }
    if (material.getOcclusionTexture() === texture) return { role: 'occlusion', px: secondaryPx, quality: 90 };
  }
  return { role: 'other', px: secondaryPx, quality: 88 };
};

for (const texture of root.listTextures()) {
  const image = texture.getImage();
  if (!image) continue;

  const { role, px, quality } = roleOf(texture);
  const was = await sharp(Buffer.from(image)).metadata();
  const encoded = await sharp(Buffer.from(image))
    .resize(px, px, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();

  texture.setImage(encoded).setMimeType('image/jpeg');
  console.log(
    `${texture.getName()} [${role}] ${was.width}x${was.height} -> ${Math.min(px, was.width)}px, ` +
      `${mb(image.byteLength)} -> ${mb(encoded.byteLength)}`,
  );
}

/* 3 — alpha, and unused data -------------------------------------------- */

for (const material of root.listMaterials()) {
  material.setAlphaMode('OPAQUE');
}

await doc.transform(dedup(), prune());
await io.write(output, doc);

console.log(`textures ${mb(before)} -> ${mb(bytesOf())}`);
