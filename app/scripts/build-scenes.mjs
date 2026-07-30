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
  'nevsehir:balloon': 'kit_hot_air_balloon',
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
/**
 * Ground by region.
 *
 * A cobbled street is the coast and the Marmara. The plateau and the south-east
 * are dust, and paving Nevşehir in İstanbul cobbles is the same mistake as
 * planting plane trees there — only louder, because the ground is the largest
 * thing on screen.
 */
const REGION_SURFACE = {
  marmara: 'cobblestone',
  aegean: 'cobblestone',
  mediterranean: 'cobblestone',
  'black-sea': 'cobblestone',
  'central-anatolia': 'redsand',
  'eastern-anatolia': 'redsand',
  'southeastern-anatolia': 'redsand',
};

/** Half the depth of the valley plate, from its registered dimensions. */
const VALLEY_HALF_DEPTH = 78.2 / 2;

const CITY_THEMES = {
  istanbul: '/assets/audio/istanbul_theme.webm',
  nevsehir: '/assets/audio/nevsehir_theme.webm',
};

/**
 * Stop spacing.
 *
 * İstanbul walks eighteen metres between stops because İstanbul has that much
 * to look at. Everywhere else is eleven: the same five stops, a street a child
 * crosses in half the time, and far less empty ground to fill.
 *
 * The owner's words: that was İstanbul, there was a lot that had to be seen.
 */
const STOP_SPACING = 18;
const COMPACT_STOP_SPACING = 11;

/**
 * How far the first stop sits from where the child appears.
 *
 * It was 8 m, which put the face of a 14 m-deep Hagia Sophia less than a metre
 * from the spawn: the guide arrived already touching a building. A child needs
 * to see where they are before they meet anything.
 */
const FIRST_STOP_Z = -26;
const COMPACT_FIRST_STOP_Z = -17;

function layoutMetrics(cityId) {
  return cityId === 'istanbul'
    ? { spacing: STOP_SPACING, firstZ: FIRST_STOP_Z, halfWidth: 22, behind: 42 }
    : { spacing: COMPACT_STOP_SPACING, firstZ: COMPACT_FIRST_STOP_Z, halfWidth: 15, behind: 26 };
}

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
/**
 * Dressing, derived from the walk rather than written per city.
 *
 * İstanbul's dressing was a list of hand-picked coordinates, which is fine for
 * one street and impossible for eighty-one. The kit is placed relative to the
 * stops instead: lamps and planters down both sides at a steady rhythm, benches
 * and market clutter where the walk widens, all of it filtered by the same
 * checks that always applied.
 *
 * A hand-placed list still wins where a city has something particular to say —
 * İstanbul's tram line, its dock, its mosque — so the two are added together.
 */
function streetProps(cityId, stopPositions, geometry) {
  const prop = (assetId, x, z, rotationY, note, solid = true) => ({
    assetId,
    position: [Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10],
    rotationY: Math.round(rotationY * 1000) / 1000,
    solid,
    note,
  });

  /**
   * The flag stands at the same place in every one of the 81 cities: beside the
   * spawn, to the child's right, facing the walk.
   */
  const candidates = [prop('kit_turkish_flag', 7.5, 4, -0.35, 'the flag, same place in every city')];

  const firstZ = stopPositions[0]?.[2] ?? -26;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -100;
  const walkLength = Math.abs(lastZ - firstZ);

  // A lamp every eighteen metres, alternating sides, angles nudged so the row
  // does not read as a fence.
  const lampCount = Math.max(3, Math.round(walkLength / 18));
  for (let i = 0; i < lampCount; i += 1) {
    const t = (i + 0.5) / lampCount;
    const z = firstZ - walkLength * t;
    const side = i % 2 === 0 ? -1 : 1;
    candidates.push(
      prop(
        'kit_street_lamp',
        side * (9 + (i % 3)),
        z,
        side * (Math.PI / 2) + (i % 2 ? 0.12 : -0.18),
        `street lamp ${i + 1}`,
      ),
    );
  }

  // Benches and planters face the walk, offset from the lamps so a child does
  // not pass a lamp and a bench at the same moment for the whole street.
  for (let i = 0; i < Math.max(2, Math.round(lampCount / 2)); i += 1) {
    const t = (i + 0.85) / Math.max(2, Math.round(lampCount / 2));
    const z = firstZ - walkLength * t;
    const side = i % 2 === 0 ? 1 : -1;
    candidates.push(prop('kit_bench', side * 8.2, z, side * (Math.PI / 2) - 0.22, `bench ${i + 1}`));
    candidates.push(
      prop('kit_planter_cypress', -side * 7.4, z - 5, side * 0.3, `planter ${i + 1}`),
    );
  }

  // A market cluster around the middle of the walk, where a bazaar would spill
  // out on to the street.
  const middle = firstZ - walkLength * 0.55;
  candidates.push(
    prop('kit_market_stall', -11, middle + 3, Math.PI / 2 - 0.35, 'stall, west'),
    prop('kit_market_stall', 12.5, middle - 4, -Math.PI / 2 + 0.28, 'stall, east'),
    prop('kit_crates', -9.2, middle - 1, 0.55, 'crates by the west stall'),
    prop('kit_crates', 11.2, middle - 7, -0.9, 'crates by the east stall'),
    prop('kit_wall_fountain', 9.5, firstZ - walkLength * 0.12, -Math.PI / 2 + 0.2, 'fountain, near the start'),
    prop('kit_wall_fountain', -10.5, firstZ - walkLength * 0.82, Math.PI / 2 - 0.15, 'fountain, near the end'),
  );

  if (cityId === 'istanbul') {
    candidates.push(
      prop('city_istanbul_hagia_sophia', 0, 28, Math.PI + 0.06, 'the mosque, closing the square'),
      prop('city_istanbul_stone_dock', 12, -106, -0.25, 'dock at the quay'),
    );
  }

  /**
   * The same checks that always applied: nothing inside a trigger ring, nothing
   * on the walk. Placements that fail are dropped rather than shipped.
   */
  const ROUTE_CLEARANCE = 3.5;
  return candidates.filter((item) => {
    const clearOfStops = stopPositions.every((stop, index) => {
      const gap = Math.hypot(item.position[0] - stop[0], item.position[2] - stop[2]);
      return gap > geometry[index].triggerRadius;
    });
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
/**
 * Planting, derived from the walk and from where the city is.
 *
 * Cappadocia is not İstanbul: a street in Nevşehir lined with plane trees would
 * be a picture of somewhere else. The mix comes from the region, the positions
 * from the length of the walk.
 */
const REGION_PLANTING = {
  'marmara': ['plane', 'cypress', 'plane', 'shrub', 'cypress'],
  'aegean': ['cypress', 'plane', 'shrub', 'cypress', 'plane'],
  'mediterranean': ['cypress', 'plane', 'cypress', 'shrub', 'plane'],
  'central-anatolia': ['shrub', 'cypress', 'shrub', 'poplar', 'shrub'],
  'black-sea': ['plane', 'plane', 'cypress', 'plane', 'shrub'],
  'eastern-anatolia': ['shrub', 'shrub', 'poplar', 'shrub', 'cypress'],
  'southeastern-anatolia': ['shrub', 'cypress', 'shrub', 'shrub', 'poplar'],
};

function streetTrees(cityId, stopPositions, geometry, regionId) {
  const kinds = REGION_PLANTING[regionId] ?? REGION_PLANTING['marmara'];
  const firstZ = stopPositions[0]?.[2] ?? -26;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -100;
  const span = Math.abs(lastZ - firstZ) + 40;

  const trees = [];
  const count = Math.max(12, Math.round(span / 7));
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = firstZ + 16 - (span * i) / count - (i % 3) * 1.7;
    const x = side * (11 + ((i * 7) % 5) * 1.6);
    const kind = kinds[i % kinds.length];

    const clear = stopPositions.every((stop, index) => {
      const gap = Math.hypot(x - stop[0], z - stop[2]);
      return gap > geometry[index].triggerRadius + 1;
    });
    if (!clear) continue;

    trees.push({
      key: `tree-${i}`,
      position: [Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10],
      kind,
      scale: Math.round((0.8 + ((i * 13) % 5) * 0.1) * 100) / 100,
      rotationY: Math.round(((i * 37) % 360) * (Math.PI / 180) * 1000) / 1000,
    });
  }
  return trees;
}

/**
 * Featured NPCs, placed by the owner: a soldier at the tower gate, a traveller
 * at the bazaar entrance, a craftsman beside the simit cart.
 *
 * Each stands to the side of its stop. Standing at a gate is the point;
 * standing on the pavement in front of it would turn a person into an obstacle
 * a child tries to walk through.
 */
/**
 * Where the three featured NPCs stand, and where they walk.
 *
 * Beside a stop rather than in front of it, off the camera axis so they appear
 * in the shot without covering the object. Each gets a short beat to walk: a
 * person rooted to one spot for a whole visit reads as a statue of a person.
 */
function featuredNpcs(cityId, stopPositions, geometry) {
  if (stopPositions.length < 4) return [];

  const beside = (index, side, alongZ) => {
    const [x, , z] = stopPositions[Math.min(index, stopPositions.length - 1)];
    /**
     * Beside their stop, pushed away from the walk.
     *
     * Two wrong answers came before this one. Offsetting from the stop's own x
     * put a person on the route when the stop sat near the middle; measuring
     * from the centreline instead put them on the far side of their own stop,
     * belonging to nothing.
     *
     * So: from the stop, outward. `side` decides which way only when the stop is
     * on the centreline; otherwise the outward direction is the one that already
     * leads away from the walk.
     */
    const outward = Math.abs(x) < 1 ? side : Math.sign(x);
    const reach = Math.max(geometry[index].triggerRadius + 1.2, 5);
    return [
      Math.round((x + outward * reach) * 10) / 10,
      0,
      Math.round((z + alongZ) * 10) / 10,
    ];
  };

  const plan = [
    { npcId: 'featured_soldier', at: 1, side: -1, alongZ: 3.5, rotationY: 2.4 },
    { npcId: 'featured_traveler', at: 2, side: 1, alongZ: -3.0, rotationY: -2.1 },
    { npcId: 'featured_craftsman_male', at: 3, side: -1, alongZ: 2.6, rotationY: 1.9 },
  ];

  return plan.map((entry) => {
    const position = beside(entry.at, entry.side, entry.alongZ);
    /**
     * A beat, not a patrol. Four metres along the pavement and back is enough
     * to read as a person going about their day; a long route turns them into
     * traffic the child has to watch out for.
     */
    const walkTo = [
      Math.round((position[0] + entry.side * 1.5) * 10) / 10,
      0,
      Math.round((position[2] - 4.2) * 10) / 10,
    ];
    return {
      npcId: entry.npcId,
      position,
      rotationY: Math.round(entry.rotationY * 1000) / 1000,
      walkTo,
    };
  });
}

/**
 * The horizon, per city.
 *
 * Placed relative to the walk rather than at fixed coordinates, so a city with
 * a longer street gets a longer wall.
 */
function cityBackdrop(cityId, stopPositions, metrics) {
  const firstZ = stopPositions[0]?.[2] ?? -26;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -100;
  const span = Math.abs(lastZ - firstZ);
  const behind = metrics.behind;
  const metricsHalfWidth = metrics.halfWidth;

  const wall = (assetId, x, z, note) => ({
    assetId,
    position: [x, 0, Math.round(z * 10) / 10],
    rotationY: (x < 0 ? 1 : -1) * (Math.PI / 2),
    solid: false,
    note,
  });

  if (cityId === 'istanbul') {
    return [
      ...[-30.5, 30.5].flatMap((x) =>
        [26, -6, -38, -70, -102].map((z, i) =>
          wall('city_istanbul_beyoglu_row', x, z, `facades ${x < 0 ? 'west' : 'east'} ${i + 1}`),
        ),
      ),
      {
        assetId: 'city_istanbul_ferry_boat',
        position: [-24, 0, -128],
        rotationY: 0.18,
        solid: false,
        note: 'moored off the quay',
      },
      {
        assetId: 'city_istanbul_maidens_tower',
        position: [22, 0, -146],
        rotationY: -0.4,
        solid: false,
        note: 'offshore, seen from the quay',
      },
    ];
  }

  if (cityId === 'nevsehir') {
    const ridgeCount = 5;

    /**
     * The valley is a rim, not a backdrop piece.
     *
     * One plate behind and one in front left the sides open and read as two
     * separate landmasses. Cappadocia is a valley a street sits in, so the
     * plates ring the whole play area with their near edges on the boundary and
     * a generous overlap, which is what makes a row of them look like one
     * landscape rather than several.
     */
    const half = VALLEY_HALF_DEPTH;
    const inner = metricsHalfWidth;
    const ring = [];

    // Behind and ahead.
    ring.push(
      { x: 0, z: behind + half, rot: Math.PI, note: 'valley rim behind the square' },
      { x: 0, z: lastZ - 14 - half, rot: 0, note: 'valley rim the street runs down to' },
    );

    // Both sides, two plates each, overlapping along the length of the walk.
    const sideZs = [firstZ + 14, lastZ - 34];
    for (const side of [-1, 1]) {
      for (const [i, z] of sideZs.entries()) {
        ring.push({
          x: side * (inner + half),
          z,
          rot: side < 0 ? Math.PI / 2 : -Math.PI / 2,
          note: `valley rim ${side < 0 ? 'west' : 'east'} ${i + 1}`,
        });
      }
    }

    return [
      // Fairy chimneys stand between the street and the rim, so a child sees
      // chimneys close and a valley beyond them.
      ...[-19, 19].flatMap((x) =>
        Array.from({ length: ridgeCount }, (_, i) => {
          const z = firstZ + 14 - ((span + 30) * i) / (ridgeCount - 1);
          return wall(
            'city_nevsehir_chimney_ridge',
            x,
            z,
            `chimney ridge ${x < 0 ? 'west' : 'east'} ${i + 1}`,
          );
        }),
      ),
      ...ring.map((entry) => ({
        assetId: 'city_nevsehir_valley',
        position: [entry.x, 0, Math.round(entry.z * 10) / 10],
        rotationY: Math.round(entry.rot * 1000) / 1000,
        // Solid: a child walks to the rim of a valley and stops there.
        solid: true,
        note: entry.note,
      })),
    ];
  }

  return [];
}

/**
 * A sky of balloons, laid out from the walk.
 *
 * Deliberately not random: a child who leaves and comes back should find the
 * same morning. Size does the work — one model at eleven scales, heights and
 * distances reads as a sky, where eleven identical ones read as one copied.
 */
function balloonSky(stopPositions, density) {
  const firstZ = stopPositions[0]?.[2] ?? -20;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -70;
  /**
   * x, distance ahead, height, scale.
   *
   * Scales are multiples of the tethered stop-2 balloon, which is five metres.
   * A balloon in the air is bigger than one you stand beside, and the near ones
   * have to be big enough to read as balloons rather than as dots.
   */
  const layout = [
    [-26, 34, 26, 2.2], [18, 58, 38, 1.7], [-8, 76, 31, 1.35], [34, 96, 47, 1.1],
    [-38, 118, 40, 0.92], [8, 140, 54, 0.75], [-18, 168, 46, 0.6], [26, 196, 60, 0.48],
  ];
  // A few cross the sky elsewhere; Cappadocia gets all of them.
  const chosen = density === 'many' ? layout : layout.filter((_, i) => i % 3 === 0);
  const specs = chosen.map(([x, ahead, height, scale], i) => ({
    key: `balloon-${i}`,
    position: [x, height, Math.round((lastZ - ahead) * 10) / 10],
    scale,
    driftSpeed: 0.7 + ((i * 7) % 5) * 0.18,
    phase: Math.round(i * 1.37 * 100) / 100,
  }));
  if (density !== 'many') return specs;

  // Two close enough to read as balloons rather than dots on the horizon.
  specs.push(
    { key: 'balloon-near-a', position: [-30, 19, Math.round((firstZ - 12) * 10) / 10], scale: 2.5, driftSpeed: 0.62, phase: 0.4 },
    { key: 'balloon-near-b', position: [28, 23, Math.round((lastZ + 14) * 10) / 10], scale: 2.1, driftSpeed: 0.85, phase: 2.1 },
  );
  return specs;
}

/** Deterministic S-curve layout; the same city always lays out identically. */
function layout(stopCount, approaches, geometry, metrics) {
  const { firstZ } = metrics;

  /**
   * Spacing is asked for, then checked against the objects.
   *
   * A compact street is the goal, but two stops closer together than their
   * trigger rings is a street where arriving at one opens the other. The
   * requested spacing is a floor to aim at; the geometry decides what it can
   * actually be, so no city can be authored into overlapping rings.
   */
  let needed = 0;
  for (let i = 1; i < stopCount; i += 1) {
    needed = Math.max(needed, geometry[i - 1].triggerRadius + geometry[i].triggerRadius + 1.5);
  }
  const spacing = Math.max(metrics.spacing, Math.ceil(needed));
  const stopPositions = [];
  // The S-curve narrows with the street, or a compact city zig-zags absurdly.
  const sway = spacing / STOP_SPACING * 7;
  for (let i = 0; i < stopCount; i += 1) {
    stopPositions.push([Math.round(Math.sin(i * 0.9) * sway * 10) / 10, 0, firstZ - i * spacing]);
  }
  /**
   * The route stops in front of each object, then steps round it.
   *
   * With a waypoint only in front of each stop, the leg to the next one ran
   * straight through the object standing at this one — the markers led a child
   * into Galata Tower. Each stop now contributes two points: where you stand to
   * look at it, and a point clear of its far side.
   *
   * The bypass goes towards the centre of the street, where there is always
   * room; the stops sit within seven metres of it and the street is forty-four
   * metres wide.
   */
  const route = [[0, 0, 0]];
  for (const [i, [x, , z]] of stopPositions.entries()) {
    const { halfWidth, halfDepth } = geometry[i];
    const round = (value) => Math.round(value * 100) / 100;
    route.push([x, 0, round(z + approaches[i])]);

    const side = x >= 0 ? -1 : 1;
    route.push([round(x + side * (halfWidth + 2.2)), 0, round(z - (halfDepth + 2.2))]);
  }
  const minZ = firstZ - (stopCount - 1) * spacing - 14;
  /**
   * Ground behind the child, not just in front.
   *
   * The play area used to end ten metres behind the spawn, so a child who
   * turned round saw the world stop. There is a square back there now, with
   * the mosque closing it and the tram waiting at its edge.
   */
  const maxZ = metrics.behind;
  return {
    stopPositions,
    route,
    bounds: [
      [-metrics.halfWidth, 0, maxZ],
      [metrics.halfWidth, 0, maxZ],
      [metrics.halfWidth, 0, minZ],
      [-metrics.halfWidth, 0, minZ],
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
  const metrics = layoutMetrics(canonical.id);
  const { stopPositions, route, bounds } = layout(
    canonical.stops.length,
    geometry.map((entry) => entry.approach),
    geometry,
    metrics,
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
    /**
     * A city's own theme. Silent where none has been chosen, rather than
     * borrowing a neighbour's — a Bosphorus song over Cappadocia would be the
     * audio equivalent of planting plane trees there.
     */
    musicUrl: CITY_THEMES[canonical.id] ?? null,
    groundSurface: REGION_SURFACE[canonical.regionId] ?? 'cobblestone',
    /**
     * Balloons cross the sky over every city, and crowd it over Cappadocia.
     *
     * They answer the front of a street the way the sea does in İstanbul: with
     * distance rather than a wall. Nevşehir gets the full sky because that is
     * the image of the place; elsewhere a few pass over, which is enough to make
     * a sky look like weather rather than paint.
     */
    balloons: balloonSky(stopPositions, canonical.id === 'nevsehir' ? 'many' : 'few'),
    /**
     * The tram runs the length of the street on the west side, clear of the
     * walk. İstanbul's nostalgic tram does one street, up and down, all day.
     */
    tramLine:
      canonical.id === 'istanbul' ? { from: [-15.5, 20], to: [-15.5, -100] } : null,
    water:
      canonical.id === 'istanbul'
        ? { centerX: 0, centerZ: -202, width: 320, depth: 180, color: '#2E7FA8' }
        : null,
    /**
     * Scenery beyond the play area. The Beyoğlu row stands behind the walk as
     * a skyline; the Maiden's Tower sits offshore, where it belongs.
     */
    /**
     * Scenery beyond the play area. Every city needs four answered directions:
     * walls to the sides, distance in front, something to turn round to. The
     * answers differ by region — İstanbul closes with facades and opens on to
     * the sea; Nevşehir closes with fairy chimneys and opens on to a valley.
     */
    backdrop: cityBackdrop(canonical.id, stopPositions, metrics),
    catRoutes: catRoutes(stopPositions, geometry),
    npcs: featuredNpcs(canonical.id, stopPositions, geometry),
    trees: streetTrees(canonical.id, stopPositions, geometry, canonical.regionId),
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
