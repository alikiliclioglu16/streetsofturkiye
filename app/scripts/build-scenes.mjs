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

const CITY_THEMES = {
  istanbul: '/assets/audio/istanbul_theme.webm',
  nevsehir: '/assets/audio/nevsehir_theme.webm',
};

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

/**
 * The horizon, per city.
 *
 * Placed relative to the walk rather than at fixed coordinates, so a city with
 * a longer street gets a longer wall.
 */
function cityBackdrop(cityId, stopPositions) {
  const firstZ = stopPositions[0]?.[2] ?? -26;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -100;
  const span = Math.abs(lastZ - firstZ);

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
    // Ridges are 24.7 m wide, so five a side covers the walk with an overlap
    // that hides the joins.
    const ridgeCount = 5;
    return [
      ...[-32, 32].flatMap((x) =>
        Array.from({ length: ridgeCount }, (_, i) => {
          const z = firstZ + 24 - ((span + 48) * i) / (ridgeCount - 1);
          return wall(
            'city_nevsehir_chimney_ridge',
            x,
            z,
            `chimney ridge ${x < 0 ? 'west' : 'east'} ${i + 1}`,
          );
        }),
      ),
      {
        /**
         * The valley closes the back, where İstanbul has its mosque. A child who
         * turns round should see Cappadocia rather than the edge of the ground.
         */
        assetId: 'city_nevsehir_valley',
        position: [0, 0, 78],
        rotationY: Math.PI,
        solid: false,
        note: 'the valley, behind the square',
      },
    ];
  }

  return [];
}

/** Deterministic S-curve layout; the same city always lays out identically. */
function layout(stopCount, approaches, geometry) {
  const spacing = STOP_SPACING;
  const stopPositions = [];
  for (let i = 0; i < stopCount; i += 1) {
    stopPositions.push([Math.round(Math.sin(i * 0.9) * 7 * 10) / 10, 0, FIRST_STOP_Z - i * spacing]);
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
    geometry,
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
    backdrop: cityBackdrop(canonical.id, stopPositions),
    catRoutes: catRoutes(stopPositions, geometry),
    npcs: featuredNpcs(canonical.id, stopPositions, route),
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
