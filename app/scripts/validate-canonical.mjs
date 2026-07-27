/**
 * Canonical content authority gate.
 *
 * Fails when:
 *  - the source HTML SHA no longer matches the canonical manifest
 *  - counts drift from the source (81 cities / 249 stops / 84 questions)
 *  - a city's quiz cardinality no longer matches the source, including any
 *    attempt to force two questions per city
 *  - a canonical English string has been edited since the baseline
 *  - a scene references a canonical id that does not exist
 *  - a scene file duplicates canonical educational prose
 *
 * Usage:
 *   node scripts/validate-canonical.mjs
 *   node scripts/validate-canonical.mjs --write-baseline   (after an approved
 *                                                           canonical update)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('..');
const CANONICAL = path.join(ROOT, 'content/canonical');
const SCENES = path.join(ROOT, 'content/scenes');
const SOURCE = path.join(ROOT, 'legacy/index.html');
const BASELINE = path.join(ROOT, 'content/canonical-integrity.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const failures = [];
const fail = (message) => failures.push(message);

const manifest = readJson(path.join(CANONICAL, 'manifest.json'));
const cities = readJson(path.join(CANONICAL, 'cities.all.json'));
const regions = readJson(path.join(CANONICAL, 'regions.json'));
const index = readJson(path.join(CANONICAL, 'city-index.json'));

/* 1 — source authority ---------------------------------------------------- */

if (!fs.existsSync(SOURCE)) {
  fail(`Canonical source missing at ${path.relative(ROOT, SOURCE)}`);
} else {
  const sourceSha = sha256(fs.readFileSync(SOURCE));
  if (sourceSha !== manifest.sourceSha256) {
    fail(
      `Source SHA changed without migration.\n` +
        `      manifest: ${manifest.sourceSha256}\n` +
        `      on disk:  ${sourceSha}\n` +
        `      Re-run the canonical extraction before touching content.`,
    );
  }
}

/* 2 — counts -------------------------------------------------------------- */

const stopCount = cities.reduce((sum, city) => sum + city.stops.length, 0);
const quizCount = cities.reduce((sum, city) => sum + city.quiz.length, 0);
const withOne = cities.filter((city) => city.quiz.length === 1).length;
const withTwo = cities.filter((city) => city.quiz.length === 2).length;

if (regions.length !== 7) fail(`Expected 7 regions, found ${regions.length}`);
if (cities.length !== 81) fail(`Expected 81 cities, found ${cities.length}`);
if (stopCount !== 249) fail(`Expected 249 stops, found ${stopCount}`);
if (quizCount !== 84) fail(`Expected 84 quiz questions, found ${quizCount}`);
if (withOne !== 78) fail(`Expected 78 cities with one question, found ${withOne}`);
if (withTwo !== 3) fail(`Expected 3 cities with two questions, found ${withTwo}`);
if (index.cities.length !== 81) fail(`City index lists ${index.cities.length} cities, expected 81`);

for (const city of cities) {
  for (const quiz of city.quiz) {
    const correct = quiz.options.filter((option) => option.correct).length;
    if (correct !== 1) fail(`${city.id}/${quiz.id}: expected exactly one correct option`);
    if (!quiz.options[0]?.correct) {
      fail(`${city.id}/${quiz.id}: the first source option must be the correct one`);
    }
  }
  const entry = index.cities.find((item) => item.id === city.id);
  if (!entry) fail(`${city.id}: missing from city-index.json`);
  else {
    if (entry.stopCount !== city.stops.length) {
      fail(`${city.id}: index says ${entry.stopCount} stops, content has ${city.stops.length}`);
    }
    if (entry.quizQuestionCount !== city.quiz.length) {
      fail(
        `${city.id}: index says ${entry.quizQuestionCount} questions, content has ${city.quiz.length}`,
      );
    }
  }
}

/* 3 — canonical string integrity ------------------------------------------ */

/** Every English string that carries educational meaning, in document order. */
function canonicalStrings() {
  const strings = [];
  for (const city of cities) {
    strings.push(`${city.id}|name|${city.name.en}`);
    for (const stop of city.stops) {
      strings.push(`${stop.id}|title|${stop.title.en}`);
      strings.push(`${stop.id}|description|${stop.description.en}`);
      strings.push(`${stop.id}|reward|${stop.reward.label.en}`);
      strings.push(`${stop.id}|guide|${stop.guideLine.text.en}`);
    }
    for (const quiz of city.quiz) {
      strings.push(`${quiz.id}|question|${quiz.question.en}`);
      for (const option of quiz.options) strings.push(`${option.id}|option|${option.text.en}`);
    }
  }
  return strings;
}

const strings = canonicalStrings();
const digest = sha256(strings.join('\n'));

if (process.argv.includes('--write-baseline')) {
  fs.writeFileSync(
    BASELINE,
    `${JSON.stringify(
      {
        note: 'Digest of every canonical English string. Regenerate only with project-owner approval.',
        sourceSha256: manifest.sourceSha256,
        stringCount: strings.length,
        digest,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Baseline written: ${strings.length} strings, digest ${digest.slice(0, 12)}…`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  fail('content/canonical-integrity.json is missing; run with --write-baseline');
} else {
  const baseline = readJson(BASELINE);
  if (baseline.digest !== digest) {
    fail(
      `A canonical English string changed.\n` +
        `      baseline: ${baseline.digest}\n` +
        `      current:  ${digest}\n` +
        `      Canonical content is read-only; revert the edit or get owner approval.`,
    );
  }
  if (baseline.sourceSha256 !== manifest.sourceSha256) {
    fail('Integrity baseline was taken against a different source SHA');
  }
}

/* 4 — scenes reference canonical content, and never copy it ---------------- */

/**
 * Any canonical sentence appearing inside a scene file means educational text
 * has been duplicated instead of referenced. Short labels are excluded because
 * a coincidental match would be meaningless.
 */
const PROSE_MIN_LENGTH = 24;
const prose = new Set(
  strings
    .map((entry) => entry.split('|').slice(2).join('|'))
    .filter((value) => value && value.length >= PROSE_MIN_LENGTH),
);

const canonicalById = new Map(cities.map((city) => [city.id, city]));

if (!fs.existsSync(SCENES)) {
  fail('content/scenes is missing');
} else {
  for (const file of fs.readdirSync(SCENES).filter((name) => name.endsWith('.json'))) {
    const scenePath = path.join(SCENES, file);
    const rawScene = fs.readFileSync(scenePath, 'utf8');
    const scene = JSON.parse(rawScene);
    const label = `scenes/${file}`;

    const city = canonicalById.get(scene.contentRef?.cityId);
    if (!city) {
      fail(`${label}: contentRef.cityId "${scene.contentRef?.cityId}" has no canonical city`);
      continue;
    }

    if (scene.canonicalSource?.sha256 !== manifest.sourceSha256) {
      fail(`${label}: canonicalSource.sha256 does not match the current canonical source`);
    }

    const stopIds = new Set(city.stops.map((stop) => stop.id));
    for (const hotspot of scene.hotspots ?? []) {
      if (!stopIds.has(hotspot.contentRef?.stopId)) {
        fail(`${label}: hotspot ${hotspot.id} references missing stop "${hotspot.contentRef?.stopId}"`);
      }
      for (const decoy of hotspot.interaction?.mechanics?.decoyStopIds ?? []) {
        if (!stopIds.has(decoy)) {
          fail(`${label}: hotspot ${hotspot.id} references missing decoy stop "${decoy}"`);
        }
      }
    }

    for (const sentence of prose) {
      if (rawScene.includes(sentence)) {
        fail(
          `${label}: duplicates canonical text — "${sentence.slice(0, 60)}…". ` +
            `Reference it with contentRef instead.`,
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ report */

if (failures.length > 0) {
  console.error('Canonical content validation FAILED\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  `Canonical content OK: ${cities.length} cities, ${stopCount} stops, ${quizCount} questions ` +
    `(${withOne} with one, ${withTwo} with two); ${strings.length} strings match baseline.`,
);
