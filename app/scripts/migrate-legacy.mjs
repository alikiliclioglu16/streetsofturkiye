/**
 * Converts the legacy prototype (legacy/index.html) into schema-valid city
 * content under content/pilot/.
 *
 * The prototype is the authored source of truth for facts, stop titles,
 * collectibles, guide lines and quiz questions. Nothing here is invented: every
 * string in the output traces back to a field in CITIES1/CITIES2. What this
 * script *does* generate is spatial layout — positions, bounds and camera
 * anchors — because the prototype is 2D and has none.
 *
 * Usage:
 *   node scripts/migrate-legacy.mjs                 # pilot cities
 *   node scripts/migrate-legacy.mjs --all           # all 81
 *   node scripts/migrate-legacy.mjs --report        # gap report only, no writes
 *   node scripts/migrate-legacy.mjs istanbul izmir  # named cities
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve('..');
const PROTOTYPE = path.join(ROOT, 'legacy/index.html');
const OUT_DIR = path.join(ROOT, 'content/pilot');
const REGIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/regions.json'), 'utf8'));

const PILOT = ['istanbul', 'nevsehir', 'gaziantep'];

/* ------------------------------------------------------------------ input */

function readPrototype() {
  const html = fs.readFileSync(PROTOTYPE, 'utf8');
  const start = html.indexOf('const CITIES1=');
  const end = html.indexOf('const REGIONS=');
  if (start < 0 || end < 0) throw new Error('Could not locate CITIES1/REGIONS in the prototype');
  const context = { result: null };
  vm.createContext(context);
  vm.runInContext(`${html.slice(start, end)}\nresult=[...CITIES1,...CITIES2];`, context);
  return context.result;
}

/* ------------------------------------------------------------- helpers */

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/** Legacy art id, which may arrive as a bare string or [name, options]. */
const artOf = (stop) => (Array.isArray(stop[0]) ? stop[0][0] : stop[0]);

/** The prototype writes English only; Turkish is filled in by editorial later. */
const text = (en) => ({ en, tr: null });

const KIT_BY_REGION = [
  'marmara-urban-coastal',
  'aegean-olive-coast',
  'mediterranean-citrus-harbour',
  'central-anatolia-cappadocia',
  'black-sea-green-timber',
  'eastern-anatolia-highland',
  'southeastern-yellow-stone-bazaar',
];

/**
 * Commissioned assets, from asset-manifests/pilot-assets.csv. Only these three
 * cities have briefed art; every other stop falls back to a graybox stand-in
 * and is listed in the gap report.
 */
const COMMISSIONED = {
  'istanbul:mosque': 'city_istanbul_iznik_tile_panel',
  'istanbul:galata': 'city_istanbul_galata_tower',
  'istanbul:ferry': 'city_istanbul_ferry',
  'nevsehir:chimneys': 'city_nevsehir_fairy_chimney_cluster',
  'nevsehir:pottery': 'city_nevsehir_pottery_wheel',
  'nevsehir:cave': 'city_nevsehir_underground_stone_door',
  'gaziantep:muze': 'city_gaziantep_zeugma_mosaic_panel',
  'gaziantep:tatli': 'city_gaziantep_baklava_counter',
  'gaziantep:craft': 'city_gaziantep_coppersmith_workbench',
};

const COMMISSIONED_COLLECTIBLES = {
  'istanbul:0': 'collectible_istanbul_iznik_tile',
  'istanbul:1': 'collectible_istanbul_legend_wings',
  'istanbul:4': 'collectible_istanbul_ferry_token',
  'nevsehir:0': 'collectible_nevsehir_fairy_chimney',
  'nevsehir:3': 'collectible_nevsehir_clay_pot',
  'nevsehir:2': 'collectible_nevsehir_lantern',
  'gaziantep:0': 'collectible_gaziantep_mosaic_piece',
  'gaziantep:1': 'collectible_gaziantep_baklava',
  'gaziantep:2': 'collectible_gaziantep_copper_pot',
};

/**
 * Tag drives the interaction type. Only `inspect-and-find` is implemented in
 * the engine; the others degrade to an accessible choice and are flagged in
 * the UI, so this mapping records intent without blocking a route.
 */
const INTERACTION_BY_TAG = {
  history: 'inspect-and-find',
  craft: 'inspect-and-find',
  food: 'sequence-select',
  nature: 'observe-and-answer',
};

/* ------------------------------------------------------------- layout */

/**
 * Places stops along a gentle S-curve and derives a play-area polygon around
 * it. Deterministic: the same city always produces the same layout, so content
 * regeneration never silently moves a scene.
 */
function layout(stopCount) {
  const spacing = 14;
  const points = [];
  for (let i = 0; i < stopCount; i += 1) {
    const z = -8 - i * spacing;
    const x = Math.round(Math.sin(i * 0.9) * 7 * 10) / 10;
    points.push([x, 0, z]);
  }

  const route = [[0, 0, 0], ...points.map(([x, , z]) => [x, 0, z + 6])];
  const minZ = -8 - (stopCount - 1) * spacing - 12;
  const bounds = [
    [-20, 0, 10],
    [20, 0, 10],
    [20, 0, minZ],
    [-20, 0, minZ],
  ];
  return { stopPositions: points, route, bounds };
}

function cameraFor(position) {
  const [x, , z] = position;
  return {
    position: [x + 3.2, 3.0, z + 6.5],
    target: [x, 1.4, z],
    durationMs: 900,
  };
}

/* ------------------------------------------------------------ conversion */

function convertCity(city, index, gaps) {
  const regionId = REGIONS[city.R]?.id;
  if (!regionId) throw new Error(`${city.i}: unknown region index ${city.R}`);

  const { stopPositions, route, bounds } = layout(city.s.length);
  const guideId = index % 2 ? 'keloglan' : 'nasreddin-hoca';

  // Decoys for inspect-and-find come from the city's own collectibles, so the
  // wrong answers are still real content rather than invented distractors.
  const collectibleLabels = city.s.map((stop) => stop[5]);

  const hotspots = city.s.map((stop, i) => {
    const art = artOf(stop);
    const assetId = COMMISSIONED[`${city.i}:${art}`] ?? `graybox_${art}`;
    if (!COMMISSIONED[`${city.i}:${art}`]) {
      gaps.assets.add(`${city.i} · ${art} · ${stop[2]}`);
    }

    const rewardId =
      COMMISSIONED_COLLECTIBLES[`${city.i}:${i}`] ?? `collectible_${city.i}_${slug(stop[5])}`;
    if (!COMMISSIONED_COLLECTIBLES[`${city.i}:${i}`]) {
      gaps.collectibles.add(`${city.i} · ${rewardId} · "${stop[5]}"`);
    }

    const decoys = collectibleLabels.filter((_, other) => other !== i).slice(0, 2);
    const position = stopPositions[i];

    return {
      id: `${city.i}-stop-${i + 1}`,
      order: i + 1,
      assetId,
      transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
      triggerRadius: 4.5,
      camera: cameraFor(position),
      interaction: {
        type: INTERACTION_BY_TAG[stop[1]] ?? 'simple-choice',
        config: {
          targetId: `${city.i}-stop-${i + 1}-target`,
          instruction: text(`Find ${stop[5]} at ${stop[2]}.`),
          hintAfterAttempts: 2,
          options: [
            { id: 'correct', text: text(stop[5]), correct: true },
            ...decoys.map((label, d) => ({ id: `decoy-${d}`, text: text(label), correct: false })),
          ],
        },
      },
      fact: {
        title: text(stop[2]),
        body: text(stop[3]),
        // Every claim comes from the prototype and has not been re-checked.
        editorialStatus: 'legacy-unverified',
      },
      rewardId,
    };
  });

  const quiz = city.q.map((item, i) => ({
    id: `${city.i}-quiz-${String(i + 1).padStart(2, '0')}`,
    question: text(item[0]),
    // The prototype always stores the correct answer first.
    options: item[1].map((option, o) => ({
      id: `option-${o + 1}`,
      text: text(option),
      correct: o === 0,
    })),
  }));

  if (quiz.length < 2) gaps.quiz.add(`${city.i} has ${quiz.length} question(s), standard is 2`);

  const guideLine = city.s[0]?.[6] ?? null;

  return {
    schemaVersion: '1.0.0',
    id: city.i,
    name: text(city.n),
    regionId,
    guideId,
    estimatedMinutes: Math.max(3, Math.min(5, city.s.length)),
    coordinates: { longitude: city.lon, latitude: city.lat },
    environment: {
      kitId: KIT_BY_REGION[city.R],
      timeOfDay: 'midday',
      qualityNotes: [`Migrated from prototype; ${city.s.length} stops`],
    },
    spawn: { position: [0, 0, 0], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
    route: { mode: 'guided-loop', points: route, bounds },
    intro: {
      title: text(city.n),
      guideLine: guideLine ? text(guideLine) : text(`Welcome to ${city.n}! Follow me.`),
      skippable: true,
    },
    hotspots,
    quiz,
    rewards: {
      cityStarId: `star_${city.i}`,
      collectibleIds: hotspots.map((hotspot) => hotspot.rewardId),
    },
  };
}

/* ------------------------------------------------------------------ main */

const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const all = args.includes('--all');
const named = args.filter((arg) => !arg.startsWith('--'));

const cities = readPrototype();
const targets = all ? cities.map((c) => c.i) : named.length > 0 ? named : PILOT;

const gaps = { assets: new Set(), collectibles: new Set(), quiz: new Set() };
let written = 0;

for (const cityId of targets) {
  const index = cities.findIndex((c) => c.i === cityId);
  if (index < 0) {
    console.error(`Unknown city: ${cityId}`);
    process.exitCode = 1;
    continue;
  }
  const converted = convertCity(cities[index], index, gaps);
  if (!reportOnly) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUT_DIR, `${cityId}.json`),
      `${JSON.stringify(converted, null, 2)}\n`,
    );
    written += 1;
  }
}

console.log(
  reportOnly
    ? `Analysed ${targets.length} cities (no files written).`
    : `Wrote ${written} city files to ${path.relative(process.cwd(), OUT_DIR)}.`,
);

const report = [
  '# Legacy migration gap report',
  '',
  `Cities processed: ${targets.length}`,
  '',
  `## Stops with no commissioned 3D asset (${gaps.assets.size})`,
  ...[...gaps.assets].sort().map((line) => `- ${line}`),
  '',
  `## Collectibles not in the asset manifest (${gaps.collectibles.size})`,
  ...[...gaps.collectibles].sort().map((line) => `- ${line}`),
  '',
  `## Cities below the two-question standard (${gaps.quiz.size})`,
  ...[...gaps.quiz].sort().map((line) => `- ${line}`),
  '',
  '## Always true for migrated content',
  '- Every fact carries `editorialStatus: "legacy-unverified"`.',
  '- Turkish is null throughout; the prototype is English only.',
  '- Positions, bounds and camera anchors are generated, not authored.',
  '',
];

fs.writeFileSync(path.join(ROOT, 'docs/MIGRATION_GAPS.md'), report.join('\n'));
console.log(`Gap report: docs/MIGRATION_GAPS.md`);
