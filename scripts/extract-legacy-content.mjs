import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const input = process.argv[2] ?? path.resolve('legacy/index.html');
const output = process.argv[3] ?? path.resolve('content/legacy/cities.raw.generated.json');
const source = fs.readFileSync(input, 'utf8');

function extractArray(name) {
  const declaration = `const ${name}=`;
  const start = source.indexOf(declaration);
  if (start < 0) throw new Error(`Could not find ${declaration}`);
  const arrayStart = source.indexOf('[', start);
  let depth = 0;
  let single = false;
  let double = false;
  let template = false;
  let escaped = false;

  for (let i = arrayStart; i < source.length; i += 1) {
    const ch = source[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (!double && !template && ch === "'") single = !single;
    else if (!single && !template && ch === '"') double = !double;
    else if (!single && !double && ch === '`') template = !template;
    if (single || double || template) continue;
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(arrayStart, i + 1);
    }
  }
  throw new Error(`Unclosed array ${name}`);
}

const context = Object.create(null);
const cities1 = vm.runInNewContext(`(${extractArray('CITIES1')})`, context, { timeout: 1000 });
const cities2 = vm.runInNewContext(`(${extractArray('CITIES2')})`, context, { timeout: 1000 });
const cities = [...cities1, ...cities2];

if (cities.length !== 81) throw new Error(`Expected 81 cities, found ${cities.length}`);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(cities, null, 2)}\n`);
console.log(`Extracted ${cities.length} cities to ${output}`);
