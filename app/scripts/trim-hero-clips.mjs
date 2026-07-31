/**
 * Removes hero animation that is never played.
 *
 * Two things are dropped, and both are provably invisible because the engine
 * already refuses to play them:
 *
 *  - a clip listed in `excludedClips`. Nasreddin Hodja ships with
 *    `Clapping_Run`, which the hero registry rejects as "not aligned with the
 *    character tone". It has been downloaded on every visit and played never.
 *  - the tail of a clip capped by `maxDurationSeconds`. His agree gesture runs
 *    13 s and is cut at 2.5; the remaining ten and a half seconds are keyframes
 *    nobody will ever see.
 *
 * This does not touch geometry. The hero mesh is not reduced without the
 * owner's word — the authored budget was set with their approval and lowering
 * it changes how the guide looks (D-012, D-072).
 *
 * Usage: node scripts/trim-hero-clips.mjs <in.glb> <out.glb> <drop> <clip:seconds>
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';

const [, , input, output, dropList = '', capList = ''] = process.argv;
const drop = new Set(dropList.split(',').filter(Boolean));
const caps = new Map(capList.split(',').filter(Boolean).map((p) => {
  const [name, seconds] = p.split(':');
  return [name, Number(seconds)];
}));

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);

for (const anim of doc.getRoot().listAnimations()) {
  const name = anim.getName();
  if (drop.has(name)) {
    console.log(`dropped ${name}`);
    anim.dispose();
    continue;
  }
  const cap = caps.get(name);
  if (cap === undefined) continue;

  for (const sampler of anim.listSamplers()) {
    const input_ = sampler.getInput();
    const output_ = sampler.getOutput();
    if (!input_ || !output_) continue;
    const stride = output_.getElementSize();
    const times = [];
    const values = [];
    for (let i = 0; i < input_.getCount(); i += 1) {
      const t = input_.getElement(i, [0])[0];
      if (t > cap) break;
      times.push(t);
      const element = new Array(stride).fill(0);
      output_.getElement(i, element);
      values.push(...element);
    }
    // Two keyframes is the least an animation can be; below that, leave it.
    if (times.length < 2) continue;
    input_.setArray(new Float32Array(times));
    output_.setArray(new Float32Array(values));
  }
  console.log(`capped ${name} at ${cap}s`);
}

await doc.transform(prune(), dedup());
await io.write(output, doc);
