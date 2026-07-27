import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
const targets = files.length ? files : [
  'content/pilot/istanbul.json',
  'content/pilot/nevsehir.json',
  'content/pilot/gaziantep.json'
];

let failed = false;
for (const file of targets) {
  const full = path.resolve(file);
  try {
    const city = JSON.parse(fs.readFileSync(full, 'utf8'));
    const required = ['schemaVersion','id','name','regionId','guideId','environment','spawn','route','hotspots','quiz','rewards'];
    const missing = required.filter((key) => !(key in city));
    if (missing.length) throw new Error(`missing: ${missing.join(', ')}`);
    if (!Array.isArray(city.hotspots) || city.hotspots.length < 1) throw new Error('hotspots must be non-empty');
    if (!Array.isArray(city.quiz) || city.quiz.length < 1) throw new Error('quiz must be non-empty');
    const ids = new Set();
    for (const hotspot of city.hotspots) {
      if (ids.has(hotspot.id)) throw new Error(`duplicate hotspot id ${hotspot.id}`);
      ids.add(hotspot.id);
    }
    console.log(`OK ${file}: ${city.hotspots.length} hotspots, ${city.quiz.length} quiz item(s)`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;
