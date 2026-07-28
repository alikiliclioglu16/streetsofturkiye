/**
 * Publishes content into the app's public folder.
 *
 * Sources, both read-only to the app:
 *   ../content/canonical/  educational authority derived from the source HTML
 *   ../content/scenes/     technical 3D scene data
 *
 * `public/content/` is a build artifact — never edit it by hand.
 * `--check` compares without writing and is what the tests and CI run.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('..');
const TARGET = path.resolve('public/content');
const check = process.argv.includes('--check');

/** cities.all.json is deliberately excluded: 366 KB never needs to reach a browser. */
const CANONICAL_FILES = [
  'manifest.json',
  'regions.json',
  'city-index.json',
  'taxonomy.json',
  'presentation.json',
];

const planned = new Map();

for (const file of CANONICAL_FILES) {
  planned.set(
    path.join(TARGET, 'canonical', file),
    fs.readFileSync(path.join(ROOT, 'content/canonical', file), 'utf8'),
  );
}

const cityDir = path.join(ROOT, 'content/canonical/cities');
for (const file of fs.readdirSync(cityDir).filter((name) => name.endsWith('.json'))) {
  planned.set(
    path.join(TARGET, 'canonical/cities', file),
    fs.readFileSync(path.join(cityDir, file), 'utf8'),
  );
}

const sceneDir = path.join(ROOT, 'content/scenes');
for (const file of fs.readdirSync(sceneDir).filter((name) => name.endsWith('.json'))) {
  planned.set(path.join(TARGET, 'scenes', file), fs.readFileSync(path.join(sceneDir, file), 'utf8'));
}

if (check) {
  const drifted = [];
  for (const [target, expected] of planned) {
    const relative = path.relative(process.cwd(), target);
    if (!fs.existsSync(target)) drifted.push(`${relative} is missing`);
    else if (fs.readFileSync(target, 'utf8') !== expected) drifted.push(`${relative} differs from source`);
  }
  // Stale files would keep serving retired content.
  const served = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else served.push(full);
    }
  };
  walk(TARGET);
  for (const file of served) {
    if (!planned.has(file)) drifted.push(`${path.relative(process.cwd(), file)} is stale`);
  }

  if (drifted.length > 0) {
    console.error(`Content out of sync:\n  ${drifted.join('\n  ')}`);
    console.error('\nFix with: npm run content:sync');
    process.exit(1);
  }
  console.log(`Content in sync (${planned.size} files).`);
} else {
  fs.rmSync(TARGET, { recursive: true, force: true });
  for (const [target, contents] of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  console.log(`Published ${planned.size} files to ${path.relative(process.cwd(), TARGET)}.`);
}
