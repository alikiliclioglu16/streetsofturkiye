/**
 * Generates technical scene files for the pilot cities.
 *
 * Scenes hold ONLY 3D and gameplay data: environment, route, transforms,
 * assets, cameras, trigger radii, interaction mechanics and audio ids. Every
 * educational string — titles, descriptions, guide lines, reward labels, quiz
 * questions and options — stays in content/canonical/ and is reached through
 * `contentRef`. A scene file that contains canonical prose fails validation.
 *
 * Usage: node scripts/build-scenes.mjs [cityId ...]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('..');
const CANONICAL = path.join(ROOT, 'content/canonical');
const OUT = path.join(ROOT, 'content/scenes');

const PILOT = ['istanbul', 'nevsehir', 'gaziantep'];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = readJson(path.join(CANONICAL, 'manifest.json'));
const regions = readJson(path.join(CANONICAL, 'regions.json'));

const KIT_BY_REGION = {
  marmara: 'marmara-urban-coastal',
  aegean: 'aegean-olive-coast',
  mediterranean: 'mediterranean-citrus-harbour',
  'central-anatolia': 'central-anatolia-cappadocia',
  'black-sea': 'black-sea-green-timber',
  'eastern-anatolia': 'eastern-anatolia-highland',
  'southeastern-anatolia': 'southeastern-yellow-stone-bazaar',
};

/** Commissioned art, keyed by cityId:legacyArtType. Everything else is graybox. */
const COMMISSIONED_ASSETS = {
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

/** Commissioned collectibles, keyed by canonical stop id. */
const COMMISSIONED_REWARDS = {
  'istanbul-stop-01': 'collectible_istanbul_iznik_tile',
  'istanbul-stop-02': 'collectible_istanbul_legend_wings',
  'istanbul-stop-05': 'collectible_istanbul_ferry_token',
  'nevsehir-stop-01': 'collectible_nevsehir_fairy_chimney',
  'nevsehir-stop-03': 'collectible_nevsehir_lantern',
  'nevsehir-stop-04': 'collectible_nevsehir_clay_pot',
  'gaziantep-stop-01': 'collectible_gaziantep_mosaic_piece',
  'gaziantep-stop-02': 'collectible_gaziantep_baklava',
  'gaziantep-stop-03': 'collectible_gaziantep_copper_pot',
};

/**
 * Canonical category drives the interaction mechanic. Only `inspect-and-find`
 * is implemented; the rest degrade to an accessible choice at runtime, so this
 * records design intent without blocking a route.
 */
const INTERACTION_BY_CATEGORY = {
  history: 'inspect-and-find',
  craft: 'inspect-and-find',
  food: 'sequence-select',
  nature: 'observe-and-answer',
};

const TRIGGER_RADIUS = 4.5;

/**
 * How far in front of a stop the guided walk parks.
 *
 * This MUST stay inside `TRIGGER_RADIUS`. It used to be 6 m, which happened to
 * work for every stop except the last one: the walk passed within range of the
 * intermediate stops on its way to the *next* waypoint, but the final waypoint
 * has no next leg, so the route ended 6 m short and the last stop of every city
 * could never be reached in guided mode.
 */
const APPROACH_OFFSET = 3;

/** Deterministic S-curve layout; the same city always lays out identically. */
function layout(stopCount) {
  const spacing = 14;
  const stopPositions = [];
  for (let i = 0; i < stopCount; i += 1) {
    stopPositions.push([Math.round(Math.sin(i * 0.9) * 7 * 10) / 10, 0, -8 - i * spacing]);
  }
  const route = [[0, 0, 0], ...stopPositions.map(([x, , z]) => [x, 0, z + APPROACH_OFFSET])];
  const minZ = -8 - (stopCount - 1) * spacing - 12;
  return {
    stopPositions,
    route,
    bounds: [
      [-20, 0, 10],
      [20, 0, 10],
      [20, 0, minZ],
      [-20, 0, minZ],
    ],
  };
}

function buildScene(canonical) {
  const region = regions.find((entry) => entry.id === canonical.regionId);
  if (!region) throw new Error(`${canonical.id}: unknown region ${canonical.regionId}`);

  const { stopPositions, route, bounds } = layout(canonical.stops.length);

  const hotspots = canonical.stops.map((stop, index) => {
    const artType = stop.legacyArt.type;
    const assetId = COMMISSIONED_ASSETS[`${canonical.id}:${artType}`] ?? `graybox_${artType}`;
    const rewardAssetId = COMMISSIONED_REWARDS[stop.id] ?? `collectible_${canonical.id}_${stop.order}`;
    const position = stopPositions[index];

    // Decoys are referenced by canonical stop id; their labels are resolved at
    // runtime so no canonical string is copied into this file.
    const decoyStopIds = canonical.stops
      .filter((other) => other.id !== stop.id)
      .slice(0, 2)
      .map((other) => other.id);

    return {
      id: `${canonical.id}-hotspot-${String(stop.order).padStart(2, '0')}`,
      order: stop.order,
      contentRef: { stopId: stop.id },
      /**
       * `ready` means a technical hotspot exists and is walkable.
       * `pending` would mean the canonical stop is known but has no scene yet.
       */
      sceneStatus: 'ready',
      assetId,
      assetStatus: COMMISSIONED_ASSETS[`${canonical.id}:${artType}`] ? 'commissioned' : 'graybox',
      transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
      triggerRadius: TRIGGER_RADIUS,
      camera: {
        position: [position[0] + 3.2, 3.0, position[2] + 6.5],
        target: [position[0], 1.4, position[2]],
        durationMs: 900,
      },
      interaction: {
        type: INTERACTION_BY_CATEGORY[stop.category] ?? 'simple-choice',
        mechanics: {
          targetId: `${stop.id}-target`,
          hintAfterAttempts: 2,
          decoyStopIds,
        },
        /**
         * Gameplay instruction only. `{reward}` is filled at runtime with the
         * canonical reward label; the label itself is never stored here.
         */
        gameplayCopy: {
          instruction: { en: 'Find {reward}.', tr: null },
        },
      },
      rewardAssetId,
      audio: { onSuccessId: 'sfx_reward_chime' },
    };
  });

  return {
    schemaVersion: '2.0.0',
    id: canonical.id,
    contentRef: { cityId: canonical.id },
    canonicalSource: { sha256: manifest.sourceSha256 },
    environment: {
      kitId: KIT_BY_REGION[canonical.regionId],
      timeOfDay: 'midday',
      ambientAudioId: `ambient_${canonical.regionId.replace(/-/g, '_')}`,
      skyPreset: region.sourceVisual.sky,
      groundColor: region.sourceVisual.ground,
    },
    guide: {
      assetId:
        canonical.legacyGuideId === 'keloglan'
          ? 'character_keloglan_base'
          : 'character_nasreddin_hoca_base',
    },
    spawn: { position: [0, 0, 0], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
    route: { mode: 'guided-loop', points: route, bounds },
    intro: { cameraSequenceId: null, skippable: true },
    hotspots,
    quizPresentation: { shuffleOptions: true },
    rewards: {
      cityStarId: `star_${canonical.id}`,
      collectibleAssetIds: hotspots.map((hotspot) => hotspot.rewardAssetId),
    },
    estimatedMinutes: Math.max(3, Math.min(5, canonical.stops.length)),
  };
}

const targets = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const cityIds = targets.length > 0 ? targets : PILOT;

fs.mkdirSync(OUT, { recursive: true });
for (const cityId of cityIds) {
  const canonical = readJson(path.join(CANONICAL, `cities/${cityId}.json`));
  const scene = buildScene(canonical);
  fs.writeFileSync(path.join(OUT, `${cityId}.json`), `${JSON.stringify(scene, null, 2)}\n`);
  console.log(
    `${cityId}: ${scene.hotspots.length} hotspots ` +
      `(${scene.hotspots.filter((h) => h.assetStatus === 'commissioned').length} commissioned, ` +
      `${scene.hotspots.filter((h) => h.assetStatus === 'graybox').length} graybox)`,
  );
}
console.log(`Wrote ${cityIds.length} scene files to ${path.relative(process.cwd(), OUT)}.`);
