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
import {
  DEFAULT_GRAYBOX_DIMENSIONS,
  GRAYBOX_DIMENSIONS,
  readManifest,
} from './lib/manifest.mjs';


const ROOT = path.resolve('..');
const manifestById = new Map(
  readManifest(path.join(ROOT, 'asset-manifests/pilot-assets.csv')).map((entry) => [entry.id, entry]),
);
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
 * Geometry is derived per object rather than from one global number.
 *
 * A 9 m wide tower and a 1.6 m tile panel cannot share an approach distance:
 * park 3 m from the tower's centre and you are standing inside it. So the
 * collider comes from the manifest footprint, the guided walk parks just
 * outside that collider, and the trigger ring sits outside the parking spot.
 *
 *   collider halfDepth ──> approach = halfDepth + CLEARANCE
 *                      ──> trigger  = approach + TRIGGER_MARGIN
 */
const CLEARANCE = 1.5;
const TRIGGER_MARGIN = 2.5;
const STOP_SPACING = 18;

/** Footprint of whatever will stand at this stop, in metres. */
function footprintFor(assetId, artType) {
  const manifest = manifestById.get(assetId);
  if (manifest) return manifest.dimensions;
  return GRAYBOX_DIMENSIONS[artType] ?? DEFAULT_GRAYBOX_DIMENSIONS;
}

function geometryFor(assetId, artType) {
  const [width, , depth] = footprintFor(assetId, artType);
  const halfWidth = Math.max(width, 0.4) / 2;
  const halfDepth = Math.max(depth, 0.4) / 2;

  // Approached from the front, so parking distance follows the depth.
  const approach = Math.round((halfDepth + CLEARANCE) * 100) / 100;

  /**
   * The ring must clear the widest side, not just the depth. The 20 m Bosphorus
   * ferry was the case that exposed this: sized on depth alone its trigger ring
   * sat entirely inside the hull, so the player could never stand in it.
   */
  const reach = Math.max(halfWidth, halfDepth);
  const triggerRadius = Math.round((Math.max(reach, approach) + TRIGGER_MARGIN) * 100) / 100;
  return { halfWidth, halfDepth, approach, triggerRadius };
}

/**
 * Street dressing.
 *
 * Deliberately sparse: this is a visual fit test for the first delivered prop,
 * not final set dressing. Lamps stand at the pavement edge, offset from the
 * walking line so a child never has to walk around one, and placed against the
 * three areas worth judging the fit by: the bazaar, the tower, and open street.
 */
function streetProps(cityId, stopPositions, geometry) {
  if (cityId !== 'istanbul') return [];

  const prop = (assetId, x, z, rotationY, note) => ({
    assetId,
    position: [x, 0, Math.round(z * 10) / 10],
    rotationY: Math.round(rotationY * 1000) / 1000,
    note,
  });

  /**
   * Placements are hand-chosen but machine-checked. Spacing and angle vary on
   * purpose: a row of identical lamps at identical intervals reads as a fence,
   * not a street.
   */
  const candidates = [
    // Pedestrian segment near the start of the walk, lamp and bench together
    // so the child meets both at child-height distance.
    prop('kit_street_lamp', -8.5, -13, Math.PI / 2 + 0.12, 'pedestrian segment, near the start'),
    prop('kit_bench', -7.2, -16.5, Math.PI / 2 - 0.25, 'bench beside the first lamp, scale reference'),

    // Open walkway beside the tall landmark.
    prop('kit_street_lamp', 16.5, -24.5, -Math.PI / 2 - 0.18, 'open walkway by the tall landmark'),

    // Mid-walk street edge, then the market end.
    prop('kit_street_lamp', -9.5, -36.5, Math.PI / 2 - 0.3, 'street edge, mid-walk'),
    prop('kit_bench', 15.0, -40.0, -Math.PI / 2 + 0.2, 'bench facing the market end of the street'),
    prop('kit_street_lamp', 11.5, -60.5, -Math.PI / 2 + 0.22, 'street edge near the food stop'),
  ];

  /**
   * A prop inside a trigger ring stands in the shot the moment that stop opens,
   * and a prop on the route centreline is something to walk around. Both are
   * checked here rather than judged by eye.
   */
  const ROUTE_CLEARANCE = 3.5;
  return candidates.filter((item) => {
    const clearOfStops = stopPositions.every((stop, index) => {
      const gap = Math.hypot(item.position[0] - stop[0], item.position[2] - stop[2]);
      return gap > geometry[index].triggerRadius;
    });
    const clearOfWalk = Math.abs(item.position[0]) > ROUTE_CLEARANCE;
    return clearOfStops && clearOfWalk;
  });
}

/** Deterministic S-curve layout; the same city always lays out identically. */
function layout(stopCount, approaches) {
  const spacing = STOP_SPACING;
  const stopPositions = [];
  for (let i = 0; i < stopCount; i += 1) {
    stopPositions.push([Math.round(Math.sin(i * 0.9) * 7 * 10) / 10, 0, -8 - i * spacing]);
  }
  const route = [
    [0, 0, 0],
    ...stopPositions.map(([x, , z], i) => [x, 0, Math.round((z + approaches[i]) * 100) / 100]),
  ];
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

  const geometry = canonical.stops.map((stop) => {
    const artType = stop.legacyArt.type;
    const assetId = COMMISSIONED_ASSETS[`${canonical.id}:${artType}`] ?? `graybox_${artType}`;
    return geometryFor(assetId, artType);
  });
  const { stopPositions, route, bounds } = layout(
    canonical.stops.length,
    geometry.map((entry) => entry.approach),
  );

  const hotspots = canonical.stops.map((stop, index) => {
    const artType = stop.legacyArt.type;
    const assetId = COMMISSIONED_ASSETS[`${canonical.id}:${artType}`] ?? `graybox_${artType}`;
    const rewardAssetId = COMMISSIONED_REWARDS[stop.id] ?? `collectible_${canonical.id}_${stop.order}`;
    const position = stopPositions[index];
    const { halfWidth, halfDepth, triggerRadius } = geometry[index];

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
      /** Solid footprint. The player walks around this, not through it. */
      collider: { halfWidth, halfDepth },
      triggerRadius,
      camera: {
        position: [position[0] + 3.2, 3.0, position[2] + 6.5],
        target: [position[0], 1.4, position[2]],
        durationMs: 900,
      },
      /**
       * How the stop is presented. Stops present and hand over the collectible;
       * they do not ask questions, so there is no answer mechanic here.
       */
      presentation: { style: 'fact-card' },
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
    props: streetProps(canonical.id, stopPositions, geometry),
    /**
     * The cat walks the pavement beside the first bench, well clear of every
     * trigger ring and of the walking line, so it is something the child
     * notices rather than something they collide with.
     */
    catRoute:
      canonical.id === 'istanbul'
        ? [
            { x: -11.5, z: -19.0 },
            { x: -6.0, z: -22.5 },
            { x: -10.0, z: -27.0 },
          ]
        : [],
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
