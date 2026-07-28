/**
 * Extracts presentation content from the canonical source.
 *
 * The first canonical extraction took stops, quiz questions and guide lines. It
 * left behind three things that are equally authored content: the map of
 * Türkiye, the guides' greetings, and the category badges. They were rebuilt by
 * hand in the app, badly — a scatter of dots instead of a country, a stop line
 * used as a welcome. This pulls them from the same file, under the same SHA.
 *
 * Usage: node scripts/build-presentation.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('..');
const SOURCE = path.join(ROOT, 'legacy/index.html');
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content/canonical/manifest.json'), 'utf8'),
);
const OUT = path.join(ROOT, 'content/canonical/presentation.json');

const html = fs.readFileSync(SOURCE, 'utf8');
const sha = crypto.createHash('sha256').update(fs.readFileSync(SOURCE)).digest('hex');
if (sha !== MANIFEST.sourceSha256) {
  throw new Error(`Source SHA mismatch: ${sha} vs manifest ${MANIFEST.sourceSha256}`);
}

/* --- the map ----------------------------------------------------------- */

const mapStart = html.indexOf('aria-label="Map of Türkiye"');
if (mapStart < 0) throw new Error('Map svg not found');
const svgStart = html.lastIndexOf('<svg', mapStart);
const svgEnd = html.indexOf('</svg>', mapStart);
const svg = html.slice(svgStart, svgEnd);

const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
/** Landmass outlines, longest first; short paths are decorative. */
const landPaths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((d) => d.length > 200);

/* --- guides and greetings ---------------------------------------------- */

const greeting = (key) => {
  const source = new RegExp(`${key}:\\{name:"([^"]+)"[\\s\\S]{0,400}?hi:n=>\`([^\`]+)\``).exec(html);
  if (!source) throw new Error(`Greeting not found for ${key}`);
  return { name: source[1], greeting: source[2].replace('${n}', '{name}') };
};

/* --- the welcome, and the category badges ------------------------------ */

const welcome = /This street has <b>\$\{c\.s\.length\} amazing stops<\/b>([^`]+?)star!/.exec(html);
if (!welcome) throw new Error('Welcome copy not found');

const tagsBlock = /const TAGS=\{([\s\S]*?)\};/.exec(html);
if (!tagsBlock) throw new Error('TAGS not found');
const categories = {};
for (const match of tagsBlock[1].matchAll(/(\w+):\["([^"]+)","([^"]+)"\]/g)) {
  categories[match[1]] = { label: match[2], color: match[3] };
}

const payload = {
  schemaVersion: '1.0',
  contentAuthority: 'index-html-canonical',
  source: { file: 'legacy/index.html', sha256: sha },
  map: { viewBox, landPaths },
  guides: { 'nasreddin-hoca': greeting('hoca'), keloglan: greeting('kel') },
  city: {
    welcomeTitle: 'Welcome to {city}!',
    welcomeBody: ('This street has {stopCount} amazing stops.' + welcome[1].replace(/^\.\s*/, ' ') + 'star!')
      .replace(/\$\{c\.n\}/g, '{city}')
      .replace(/\s+/g, ' ')
      .trim(),
    startButton: "Let's go!",
  },
  categories,
};

fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `Wrote presentation content: ${landPaths.length} land paths, ` +
    `${Object.keys(categories).length} categories, ${Object.keys(payload.guides).length} guides.`,
);
