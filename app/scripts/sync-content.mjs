/**
 * Copies the authored content from the repository root into the app's public
 * folder and derives the map index.
 *
 * The root `content/` tree is the single editable source (Gate A: content
 * source-of-truth safeguard). `app/public/content/` is a build artifact — never
 * edit it by hand. `--check` verifies the copies match without writing, and is
 * what the test suite and CI run.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('..');
const SOURCE = path.join(ROOT, 'content');
const TARGET = path.resolve('public/content');
const LEGACY_INDEX = path.join(SOURCE, 'legacy/cities.normalized.json');

const check = process.argv.includes('--check');

/** Files copied verbatim from root content into public. */
const FILES = [
  'regions.json',
  'pilot/istanbul.json',
  'pilot/nevsehir.json',
  'pilot/gaziantep.json',
];

function readIndex() {
  const cities = JSON.parse(fs.readFileSync(LEGACY_INDEX, 'utf8'));
  return (
    JSON.stringify(
      cities.map((city) => ({
        id: city.id,
        order: city.order,
        name: city.name,
        regionId: city.regionId,
        coordinates: city.coordinates,
        stopCount: city.legacyStops.length,
        quizCount: city.legacyQuiz.length,
        migrationStatus: city.migrationStatus,
      })),
    ) + '\n'
  );
}

const planned = new Map();
for (const file of FILES) {
  planned.set(path.join(TARGET, file), fs.readFileSync(path.join(SOURCE, file), 'utf8'));
}
planned.set(path.join(TARGET, 'city-index.json'), readIndex());

if (check) {
  const drifted = [];
  for (const [target, expected] of planned) {
    const relative = path.relative(process.cwd(), target);
    if (!fs.existsSync(target)) {
      drifted.push(`${relative} is missing`);
      continue;
    }
    if (fs.readFileSync(target, 'utf8') !== expected) {
      drifted.push(`${relative} differs from the root source`);
    }
  }
  if (drifted.length > 0) {
    console.error('Content out of sync:\n  ' + drifted.join('\n  '));
    console.error('\nFix with: npm run content:sync');
    process.exit(1);
  }
  console.log(`Content in sync (${planned.size} files).`);
} else {
  for (const [target, contents] of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  console.log(`Synced ${planned.size} files from ${path.relative(process.cwd(), SOURCE)}.`);
}
