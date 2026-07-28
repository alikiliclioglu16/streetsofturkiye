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
  DELIVERED_DIMENSIONS,
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
  'istanbul:bazaar': 'city_istanbul_grand_bazaar',
  'istanbul:simit': 'city_istanbul_simit_cart',
  'istanbul:ferry': 'city_istanbul_ferry_terminal',
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

/**
 * How far the first stop sits from where the child appears.
 *
 * It was 8 m, which put the face of a 14 m-deep Hagia Sophia less than a metre
 * from the spawn: the guide arrived already touching a building. A child needs
 * to see where they are before they meet anything.
 */
const FIRST_STOP_Z = -26;

/** Footprint of whatever will stand at this stop, in metres. */
function footprintFor(assetId, artType) {
  // A delivered model outranks the brief it was made against: the collider and
  // the trigger ring should match what is actually standing there.
  const delivered = DELIVERED_DIMENSIONS[assetId];
  if (delivered) return delivered;
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
    prop('kit_street_lamp', -10.5, -39, Math.PI / 2 + 0.12, 'pedestrian segment, near the start'),
    prop('kit_bench', -9.0, -42.5, Math.PI / 2 - 0.25, 'bench beside the first lamp, scale reference'),

    // Open walkway beside the tall landmark.
    prop('kit_street_lamp', 16.5, -42.5, -Math.PI / 2 - 0.18, 'open walkway by the tall landmark'),

    // Mid-walk street edge, then the market end.
    prop('kit_street_lamp', -9.5, -54.5, Math.PI / 2 - 0.3, 'street edge, mid-walk'),
    prop('kit_bench', 15.0, -58, -Math.PI / 2 + 0.2, 'bench facing the market end of the street'),
    prop('kit_street_lamp', 11.5, -78.5, -Math.PI / 2 + 0.22, 'street edge near the food stop'),

    // Planters read as tended street furniture rather than scenery, so they sit
    // close to the pavement edge in pairs.
    prop('kit_planter_cypress', -8.0, -37, 0.3, 'planter at the start of the walk'),
    prop('kit_planter_cypress', 6.8, -35, -0.4, 'planter opposite the first bench'),
    prop('kit_planter_cypress', -6.4, -48, 0.15, 'planter mid-walk'),
    prop('kit_planter_cypress', 8.5, -88, -0.25, 'planter towards the quay'),

    /**
     * Market furniture belongs to the market end of the street, near the
     * covered gateway. A stall alone reads as abandoned, so each one has its
     * crates beside it.
     */
    prop('kit_market_stall', -8.8, -57, Math.PI / 2 - 0.35, 'stall on the market approach'),
    prop('kit_crates', -7.4, -59.6, 0.55, 'crates beside the first stall'),
    prop('kit_market_stall', 13.5, -64.5, -Math.PI / 2 + 0.28, 'stall across from the gateway'),
    prop('kit_crates', 12.2, -67.4, -0.9, 'crates beside the second stall'),
    // A fountain at each end of the walk: İstanbul's street corners have them,
    // and they give the long stretches something to arrive at.
    prop('kit_wall_fountain', 9.5, -34, -Math.PI / 2 + 0.2, 'fountain near the first landmark'),
    prop('kit_wall_fountain', -14.5, -87, Math.PI / 2 - 0.15, 'fountain towards the quay'),

    // The red tram is Beyoğlu, parked rather than running.
    /**
     * The mosque closes the square behind the child. It is solid: a building a
     * child can walk through is worse than one they cannot reach, and standing
     * it on the ground at the back of the play area means it is neither
     * floating in the void nor out at sea.
     */
    prop('city_istanbul_hagia_sophia', 0, 28, Math.PI + 0.06, 'the mosque, closing the square'),

    // Waiting at the edge of the square, as if the child had just stepped off.
    prop('city_istanbul_streetcar', -12.5, 6, 0.12, 'tram at the edge of the square'),

    // Where the street meets the water.
    prop('city_istanbul_stone_dock', 12, -106, -0.25, 'dock at the quay'),

    prop('kit_crates', -9.6, -73, 0.2, 'crates stacked along the street edge'),
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
    /**
     * The centreline rule only applies where the walk actually runs. The square
     * behind the child is not on the route, so the mosque can close it head-on.
     */
    const onTheWalk = item.position[2] <= 10;
    const clearOfWalk = !onTheWalk || Math.abs(item.position[0]) > ROUTE_CLEARANCE;
    return clearOfStops && clearOfWalk;
  });
}

/**
 * Cat routes.
 *
 * Kept off the walking line and outside every trigger ring, and checked here
 * rather than by eye. A cat that wanders into a stop's ring stands in the shot
 * the moment that stop opens.
 */
function catRoutes(stopPositions, geometry) {
  const candidates = [
    [
      { x: -11.5, z: -37 },
      { x: -6.0, z: -40.5 },
      { x: -10.0, z: -45 },
    ],
    [
      { x: 12.0, z: -51 },
      { x: 16.5, z: -55.5 },
    ],
    [
      { x: -13.0, z: -66 },
      { x: -7.5, z: -70 },
      { x: -12.5, z: -74.5 },
    ],
    [
      { x: 13.0, z: -30 },
      { x: 17.0, z: -35 },
    ],
    [
      { x: 13.0, z: -73 },
      { x: 17.0, z: -77 },
      { x: 12.5, z: -81 },
    ],
  ];

  const clear = (point) =>
    Math.abs(point.x) > 4 &&
    stopPositions.every((stop, index) => {
      const gap = Math.hypot(point.x - stop[0], point.z - stop[2]);
      return gap > geometry[index].triggerRadius;
    });

  return candidates.filter((route) => route.every(clear));
}

/**
 * Where the camera stands to show a stop.
 *
 * A fixed distance cannot frame both a 2 m simit cart and a tall landmark: at
 * 5.65 m only 5.3 m of height is visible, so a tower filled the shot with
 * masonry and the child never saw the tower. The distance is derived from the
 * object instead, framing it to about 85% of the frame height.
 *
 * The guide is small in a landmark shot. That is what looking up at a landmark
 * is, and it lasts only while the stop is open.
 */
const STOP_CAMERA_FILL = 0.85;
const STOP_CAMERA_FOV = 50;

function stopCamera(position, height) {
  const halfFov = (STOP_CAMERA_FOV / 2) * (Math.PI / 180);
  const needed = height / STOP_CAMERA_FILL / (2 * Math.tan(halfFov));
  const distance = Math.max(5.0, Math.round(needed * 10) / 10);
  const eye = Math.max(2.4, Math.round(height * 0.45 * 10) / 10);
  return {
    position: [
      position[0] + Math.round(distance * 0.45 * 10) / 10,
      eye,
      position[2] + Math.round(distance * 10) / 10,
    ],
    target: [position[0], Math.round(Math.min(height * 0.45, 2.2) * 10) / 10, position[2]],
    durationMs: 900,
  };
}


/**
 * Street trees.
 *
 * Scattered down both pavements with varied kind, scale and angle. Kept off the
 * walking line and outside every trigger ring; anything that fails is dropped
 * rather than shipped.
 */
function streetTrees(cityId, stopPositions, geometry) {
  if (cityId !== 'istanbul') return [];
  const kinds = ['cypress', 'plane', 'shrub', 'plane', 'cypress'];
  const trees = [];
  for (let i = 0; i < 22; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 2 - i * 3.9 - (i % 3) * 1.7;
    const x = side * (11 + ((i * 7) % 5) * 1.6);
    const kind = kinds[i % kinds.length];
    trees.push({
      kind,
      position: [Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10],
      scale: Math.round((0.85 + ((i * 13) % 7) * 0.06) * 100) / 100,
      rotationY: Math.round(((i * 2.399963) % (Math.PI * 2)) * 100) / 100,
    });
  }
  return trees.filter(
    (tree) =>
      Math.abs(tree.position[0]) > 8 &&
      stopPositions.every((stop, index) => {
        const gap = Math.hypot(tree.position[0] - stop[0], tree.position[2] - stop[2]);
        return gap > geometry[index].triggerRadius + 1.5;
      }),
  );
}

/**
 * Featured NPCs, placed by the owner: a soldier at the tower gate, a traveller
 * at the bazaar entrance, a craftsman beside the simit cart.
 *
 * Each stands to the side of its stop. Standing at a gate is the point;
 * standing on the pavement in front of it would turn a person into an obstacle
 * a child tries to walk through.
 */
function featuredNpcs(cityId, stopPositions, routePoints) {
  if (cityId !== 'istanbul') return [];

  const candidates = [
    { npcId: 'featured_soldier', at: 1, offset: [4.4, 2.6], note: 'beside the tower gate' },
    { npcId: 'featured_traveler', at: 2, offset: [4.8, 2.2], note: 'at the bazaar entrance' },
    { npcId: 'featured_craftsman_male', at: 3, offset: [4.0, 1.8], note: 'working beside the simit cart' },
  ];

  const distanceToRoute = (x, z) => {
    let closest = Infinity;
    for (let i = 0; i < routePoints.length - 1; i += 1) {
      const [ax, , az] = routePoints[i];
      const [bx, , bz] = routePoints[i + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const lengthSq = dx * dx + dz * dz;
      const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / lengthSq));
      closest = Math.min(closest, Math.hypot(ax + t * dx - x, az + t * dz - z));
    }
    return closest;
  };

  return candidates
    .map(({ npcId, at, offset, note }) => {
      const stop = stopPositions[at] ?? [0, 0, 0];
      const x = Math.round((stop[0] + offset[0]) * 10) / 10;
      const z = Math.round((stop[2] + offset[1]) * 10) / 10;
      return {
        npcId,
        position: [x, 0, z],
        // Turned back towards their stop, so an arriving child sees a face.
        rotationY: Math.round(Math.atan2(stop[0] - x, stop[2] - z) * 100) / 100,
        note,
      };
    })
    .filter((npc) => distanceToRoute(npc.position[0], npc.position[2]) > 2.5);
}

/** Deterministic S-curve layout; the same city always lays out identically. */
function layout(stopCount, approaches) {
  const spacing = STOP_SPACING;
  const stopPositions = [];
  for (let i = 0; i < stopCount; i += 1) {
    stopPositions.push([Math.round(Math.sin(i * 0.9) * 7 * 10) / 10, 0, FIRST_STOP_Z - i * spacing]);
  }
  const route = [
    [0, 0, 0],
    ...stopPositions.map(([x, , z], i) => [x, 0, Math.round((z + approaches[i]) * 100) / 100]),
  ];
  const minZ = FIRST_STOP_Z - (stopCount - 1) * spacing - 14;
  /**
   * Ground behind the child, not just in front.
   *
   * The play area used to end ten metres behind the spawn, so a child who
   * turned round saw the world stop. There is a square back there now, with
   * the mosque closing it and the tram waiting at its edge.
   */
  const maxZ = 42;
  return {
    stopPositions,
    route,
    bounds: [
      [-22, 0, maxZ],
      [22, 0, maxZ],
      [22, 0, minZ],
      [-22, 0, minZ],
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
      camera: stopCamera(position, footprintFor(assetId, artType)[1]),
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
    /**
     * The child appears at the head of the street, facing down it. This must
     * stay at the origin: a bulk shift of the dressing once moved it to within
     * a metre of Hagia Sophia's face, and the guide arrived inside a building.
     */
    spawn: { position: [0, 0, 0], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
    route: { mode: 'guided-loop', points: route, bounds },
    intro: { cameraSequenceId: null, skippable: true },
    hotspots,
    props: streetProps(canonical.id, stopPositions, geometry),
    /**
     * İstanbul is the only pilot city on the water. The sea starts past the
     * play boundary, so a child can see it and never walk into it.
     */
    water:
      canonical.id === 'istanbul'
        ? { centerX: 0, centerZ: -202, width: 320, depth: 180, color: '#2E7FA8' }
        : null,
    /**
     * Scenery beyond the play area. The Beyoğlu row stands behind the walk as
     * a skyline; the Maiden's Tower sits offshore, where it belongs.
     */
    backdrop:
      canonical.id === 'istanbul'
        ? [
            {
              assetId: 'city_istanbul_beyoglu_row',
              position: [-26, 0, -52],
              rotationY: Math.PI / 2,
              solid: false,
              note: 'facades behind the west pavement',
            },
            {
              assetId: 'city_istanbul_beyoglu_row',
              position: [27, 0, -74],
              rotationY: -Math.PI / 2,
              solid: false,
              note: 'facades behind the east pavement',
            },
            {
              assetId: 'city_istanbul_maidens_tower',
              position: [22, 0, -146],
              rotationY: -0.4,
              solid: false,
              note: 'offshore, seen from the quay',
            },
          ]
        : [],
    /**
     * Cats. Scattered along the whole walk rather than clustered, on both
     * sides, each with its own short beat — a child should keep meeting one
     * rather than find them all at once.
     */
    catRoutes: canonical.id === 'istanbul' ? catRoutes(stopPositions, geometry) : [],
    npcs: featuredNpcs(canonical.id, stopPositions, route),
    trees: streetTrees(canonical.id, stopPositions, geometry),
    /**
     * Featured people, one each, standing beside the stop that suits them.
     * Offset to the side rather than in front: the stop camera frames the
     * object, and a person standing in that shot is in the way of it.
     */
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
