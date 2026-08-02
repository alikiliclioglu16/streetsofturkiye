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

const PILOT = ['istanbul', 'nevsehir', 'gaziantep', 'kars', 'van', 'ordu', 'bolu', 'trabzon'];

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
  'nevsehir:loom': 'city_nevsehir_carpet_loom',
  'nevsehir:cave': 'city_nevsehir_underground_stone_door',
  'gaziantep:muze': 'city_gaziantep_zeugma_mosaic_panel',
  'gaziantep:tatli': 'city_gaziantep_baklava_counter',
  'gaziantep:craft': 'city_gaziantep_coppersmith_workbench',
  /**
   * Kars, briefed and not yet delivered. Naming them here rather than leaving
   * them graybox is what reserves each footprint and derives each camera, so
   * the street is laid out for the objects that are coming instead of for
   * 2.4 m cubes that will have to be laid out again.
   */
  'kars:antik': 'city_kars_ani_carved_doorway',
  'kars:tren': 'city_kars_eastern_express_platform',
  'kars:stall': 'city_kars_gravyer_stall',
  'van:vancat': 'city_van_odd_eyed_cat',
  'van:gol': 'city_van_akdamar_jetty',
  'van:stall': 'city_van_breakfast_table',
  'ordu:fruit': 'city_ordu_hazelnut_stall',
  'ordu:teleferik': 'city_ordu_cable_car',
  'ordu:sahil': 'city_ordu_beach_front',
  'bolu:gol': 'city_bolu_yedigoller_jetty',
  'bolu:stall': 'city_bolu_mengen_kitchen',
  'bolu:dag': 'city_bolu_ski_lift_station',
  'trabzon:manastir': 'city_trabzon_sumela_fresco_door',
  'trabzon:muzik': 'city_trabzon_kemence_stand',
  'trabzon:stall': 'city_trabzon_hamsi_stall',
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
  'kars-stop-01': 'collectible_kars_stone_rubbing',
  'kars-stop-02': 'collectible_kars_express_ticket',
  'kars-stop-03': 'collectible_kars_gravyer_wedge',
  'van-stop-01': 'collectible_van_cat_plush',
  'van-stop-02': 'collectible_van_boat_ticket',
  'van-stop-03': 'collectible_van_breakfast_plate',
  'ordu-stop-01': 'collectible_ordu_hazelnut_jar',
  'ordu-stop-02': 'collectible_ordu_cable_ticket',
  'ordu-stop-03': 'collectible_ordu_sunset_photo',
  'bolu-stop-01': 'collectible_bolu_autumn_leaf',
  'bolu-stop-02': 'collectible_bolu_chef_hat',
  'bolu-stop-03': 'collectible_bolu_snowboard_sticker',
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
/**
 * The animal that walks a region's streets.
 *
 * Cats belong to the coastal cities; horses to the plateau Cappadocia is named
 * after. Getting this wrong is the same class of mistake as planting plane trees
 * in Nevşehir, only it moves.
 */
const REGION_ANIMAL = {
  marmara: 'cat',
  aegean: 'cat',
  mediterranean: 'cat',
  'black-sea': 'cat',
  'central-anatolia': 'horse',
  'eastern-anatolia': 'goose',
  'southeastern-anatolia': 'cat',
};

/**
 * A city may overrule its region's surface.
 *
 * The region table is right for a region and wrong for a site. Ani is not the
 * eastern plateau in general — it is bare volcanic rock, cracked into plates,
 * and the ground there is as much of the ruin as the churches are. The other
 * thirteen eastern provinces keep the steppe until one of them says otherwise.
 */
/**
 * Where Van's lake begins, in metres from the spawn.
 *
 * One number, and the shore, the canoes and Akdamar are all measured off it.
 * It was typed into three places and changed four times in as many turns, which
 * is how the boats ended up on dry land twice — a shoreline and the things
 * floating on it cannot be maintained separately.
 *
 * Eighty metres: the side houses reach -74, so the ground runs out first.
 */
const VAN_SHORE_Z = -80;

/**
 * Where Bolu's street runs out and Yedigöller begins.
 *
 * One constant, and everything on the water is measured off it — the discipline
 * Van's four moved shorelines forced (D-163).
 */
const BOLU_SHORE_Z = -74;
const VAN_LAKE_DEPTH = 200;

/**
 * Trabzon's two distances, in metres from the spawn.
 *
 * Both are **near-edge** lines: the face of the thing that stands there, not
 * its centre. Every piece placed against them adds its own half-depth. A 78 m
 * valley centred on the boundary is what swallowed Nevşehir's spawn (D-101).
 *
 * They are typed once here because Van's shoreline was typed into three places
 * and moved four times in as many sittings (D-163).
 */
const TRABZON_ROCK_NEAR_Z = -88;

/**
 * Trabzon's shoreline, in metres from the spawn.
 *
 * One constant. The paving is drawn to it, the wharf stands on it and the sea
 * begins two metres short of it so there is never a seam to find. Van's
 * shoreline was typed into three places and moved four times in as many
 * sittings (D-163); this is that lesson.
 */
const TRABZON_SHORE_Z = 30;

/**
 * The sea, and why Trabzon is the second city to get a water plane.
 *
 * Every other city carries its water inside a model, and that was tried here
 * twice. The wharf that was supposed to bring its own sea had none. Uzungöl
 * brought a beautiful one and could not be made to work: it is a bowl, its own
 * rim hides its surface from a camera 2.3 m off the ground, and the tilt that
 * uncovers the water is also what showed the cut sides of the plate. On screen
 * it read as a model on a table, which is exactly what it is.
 *
 * A sea is not a bowl. It is flat, it runs to the horizon, and a plane is the
 * honest way to draw one — which is why İstanbul has had one all along (D-154).
 * Drawn *over* the ground rather than beside it, so the join is a join and not
 * a gap.
 *
 * Depth stops inside the camera's 220 m far plane; width is wide enough that
 * its sides are never in frame from anywhere on the street.
 */
const TRABZON_SEA = {
  centerX: 0,
  centerZ: TRABZON_SHORE_Z - 2 + 90,
  width: 420,
  depth: 180,
  /** Darker and greener than the Bosphorus. It is a different sea. */
  color: '#256B80',
};

/**
 * Two hamsi boats working the sea.
 *
 * Flat lines now, and much simpler for it: the sea is level, so a boat needs
 * one height and it is the waterline. The lifted line the lake needed is gone
 * with the lake.
 *
 * They cross rather than run out and back along the sightline — crossing keeps
 * them broadside and keeps their length on screen. `Tram` already does
 * out-pause-back, which is what a boat working a shore does, so there is still
 * no new motion here (D-136).
 *
 * Sunk 0.4 m so the hull sits *in* the water rather than on it. The sea plane
 * breathes a few centimetres and a boat resting exactly on zero skates across
 * the top of it.
 */
function trabzonBoatLines() {
  const y = -0.4;
  return [
    { from: [-34, TRABZON_SHORE_Z + 26], to: [32, TRABZON_SHORE_Z + 26], heights: [y, y], speed: 2.2 },
    { from: [30, TRABZON_SHORE_Z + 58], to: [-28, TRABZON_SHORE_Z + 58], heights: [y, y], speed: 1.5 },
  ];
}

/**
 * Cloud crossing the face of Sümela.
 *
 * The rock's near face is at z = -88 and its buildings sit between about ten
 * and twenty metres, so the bands hang just in front of it across that height.
 * The lowest is the widest and slowest, the highest thin and quick — which is
 * how cloud on a mountain behaves, and also stops the three reading as one
 * curtain being drawn.
 *
 * The opacities are low on purpose. Mist that hides the monastery defeats the
 * stop it belongs to; this is meant to pass across it, not cover it.
 */
/**
 * Five birds, five circles.
 *
 * Spread down the street rather than gathered over the square, so a child sees
 * one wherever they are on the walk, and none of the rings is concentric with
 * another — five circles about one centre is a fairground ride.
 *
 * **None of them circles overhead**, which is where they went first and where
 * they could never be seen. The follow camera's frame stops 13° above
 * horizontal (D-183), so a bird at ten metres is only in shot from 42 m away
 * and one directly above the child is out of frame however high it flies. The
 * rings are pushed out to the flanks and over the lake for that reason, not for
 * composition — measured, and between 86% and 100% of each lap is in frame from
 * somewhere on the street.
 *
 * Altitude and radius move together: the higher one flies the further out its
 * ring has to be, which is why the lowest bird has the smallest circle.
 */
const TRABZON_BIRDS = [
  { centre: [-52, 10, -18], radius: 24, rate: 0.042, phase: 0.0, bob: 1.2 },
  { centre: [50, 12, -36], radius: 26, rate: -0.031, phase: 1.9, bob: 1.6 },
  { centre: [-46, 11, -66], radius: 22, rate: 0.026, phase: 3.4, bob: 1.3 },
  { centre: [0, 13, 52], radius: 30, rate: -0.021, phase: 5.1, bob: 1.8 },
  { centre: [44, 9, 16], radius: 20, rate: 0.035, phase: 2.6, bob: 1.1 },
];

const TRABZON_MIST = [
  { centre: [0, 9, -85.5], width: 40, height: 7.5, drift: 1.3, opacity: 0.42 },
  { centre: [-4, 14.5, -83.5], width: 34, height: 6, drift: -0.85, opacity: 0.3 },
  { centre: [3, 19, -86.5], width: 28, height: 5, drift: 2.0, opacity: 0.22 },
];


const CITY_SURFACE = {
  /**
   * Bolu and Ordu are both Black Sea and could not look less alike: a coast
   * under hazelnut, and deep inland forest that turns red and gold. Cobbles in
   * both would make the region read as one place drawn twice.
   */
  bolu: 'forest',
  kars: 'rock',
};

/** Animals the project has assigned against the region default (D-133). */
/**
 * Where the railway lies in Kars, in metres from the spawn.
 *
 * Past the front boundary at z = -59, so the track is outside the play area
 * and the train crosses beyond everything a child can reach.
 */
const KARS_TRACK_Z = -66;

const ANIMAL_OVERRIDES = {
  gaziantep: 'dog',
  /**
   * Van walks İstanbul's cats, which are rigged and have a walk cycle.
   *
   * Its own white odd-eyed cat arrived unrigged, so it sits in the basket at
   * stop one where a child can look at it — and the tabbies do the walking
   * until a Van cat with a `Walking` clip exists. A cat that slides across the
   * ground with its feet still is worse than a cat of the wrong colour.
   */
  van: 'cat',
  /**
   * No animal in Ordu.
   *
   * The Black Sea row gives the region cats, which is there because İstanbul's
   * are famous and the table was filled in from the coast that had them. They
   * are not what Ordu is about, and borrowed street furniture reads as a city
   * nobody looked at — the same fault as a Bosphorus song over Cappadocia
   * (D-119). Its moving life is the cable cars and the paragliders.
   */
  ordu: 'none',
  /**
   * Deer in Bolu's forest. Briefed and not delivered, so the routes are
   * reserved and nothing is drawn until a model exists — the way Kars's geese
   * were held (D-129).
   */
  bolu: 'deer',
  /**
   * No animal in Trabzon.
   *
   * The Black Sea row gives the region cats, and they were walking here only
   * because the table said so. Three of the eight open cities would then walk
   * the same tabbies — İstanbul's, which are famous, Van's, which stand in for
   * a cat that arrived unrigged, and Trabzon's, which have no reason at all.
   * Borrowed street furniture reads as a city nobody looked at (D-119), and
   * Ordu was emptied for exactly this reason.
   *
   * Its moving life is the sea behind it: the hamsi boats working the shore.
   */
  trabzon: 'none',
};

/** Which surface each region's streets are laid with. */
const REGION_SURFACE = {
  marmara: 'cobblestone',
  aegean: 'cobblestone',
  mediterranean: 'cobblestone',
  'black-sea': 'cobblestone',
  'central-anatolia': 'redsand',
  'eastern-anatolia': 'steppe',
  'southeastern-anatolia': 'redsand',
};

/** Half the depth of the valley plate, from its registered dimensions. */
const VALLEY_HALF_DEPTH = 78.2 / 2;

/**
 * How far past the boundary the valley rim is set back.
 *
 * The plates were near-edge aligned exactly on the boundary, which was right
 * while they were being drawn at 6 m: their rim stood a storey high at the edge
 * of the street. D-124 gave them the 12 m the layout had always recorded, and a
 * twelve metre rim fifteen metres away subtends about forty degrees from a
 * child's eye — it leans over the street, and you can see under its lip.
 *
 * Twelve metres of setback puts the rim far enough back to read as the far side
 * of a valley rather than as a ceiling.
 */
const VALLEY_SETBACK = 12;

/** Guides the project has assigned against the source's own (D-132). */
const GUIDE_OVERRIDES = {
  kars: 'character_nasreddin_hoca_base',
};

/**
 * Palettes the project has brightened against the region's own.
 *
 * Canonical carries a `sourceVisual` per region and it is the default. The
 * Black Sea's is a muted olive under a pale sky, which is honest about the
 * weather there and wrong for a children's game: Ordu came out grey-green and
 * flat where the province is one of the greenest places in the country.
 *
 * Recorded here rather than by editing canonical, like the guide overrides
 * (D-132).
 */
const CITY_PALETTE = {
  ordu: { sky: ['#8FD3EC', '#DFF3F7'], ground: '#7FBF5A' },
  /**
   * Bolu in autumn: the leaf ground tinted amber and the sky the thin cold blue
   * you get over a forest in October. Same region as Ordu, opposite half of the
   * year — which is the cheapest way to make two provinces in one table look
   * like two places.
   */
  bolu: { sky: ['#A8D8E8', '#EDE4CE'], ground: '#C98A3C' },
  /**
   * Trabzon under cloud: a hazed sky over wet grey stone.
   *
   * Third city out of the one region table, so this is the third look it has to
   * produce. Ordu is high summer on a bright coast and Bolu is October inland;
   * Trabzon is the weather the Black Sea is actually known for.
   *
   * The ground colour is nearly neutral on purpose. `groundColor` multiplies the
   * surface albedo rather than painting the land beside it, so it is a cast over
   * the paving and not a colour of its own. The first value here was a saturated
   * mid-green at 45% lightness, which did not tint the cobbles — it replaced
   * them, and the street read as a cracked lawn. Anything below about 66%
   * lightness swallows the texture, so this sits at 66% with under 7% saturation:
   * wet stone with the green of the slopes cast onto it.
   *
   * The green in this city comes from the tea slopes and the pines on the cliff,
   * which is where a child would actually see it.
   *
   * Recorded here rather than by editing canonical, like the guide overrides
   * (D-132).
   */
  trabzon: { sky: ['#AFC8D2', '#E4EDE8'], ground: '#A2AEA3' },
};

const CITY_THEMES = {
  istanbul: '/assets/audio/istanbul_theme.webm',
  nevsehir: '/assets/audio/nevsehir_theme.webm',
  gaziantep: '/assets/audio/gaziantep_theme.webm',
  kars: '/assets/audio/kars_theme.webm',
  van: '/assets/audio/van_theme.webm',
  ordu: '/assets/audio/ordu_theme.webm',
  bolu: '/assets/audio/bolu_theme.webm',
  trabzon: '/assets/audio/trabzon_theme.webm',
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
/**
 * Fourteen, not eleven.
 *
 * Eleven gave Gaziantep a twenty-two metre street: a child could see all three
 * stops from where they appeared, and walking it took three seconds. A short
 * city should be short, not instant.
 */
const COMPACT_STOP_SPACING = 14;

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
  /**
   * Enough candidates that the ring filter can drop a few and still leave a lit
   * street. A compact city has bigger objects relative to its length, so more of
   * its placements land inside a trigger ring.
   */
  const lampCount = Math.max(5, Math.round(walkLength / 14));
  for (let i = 0; i < lampCount; i += 1) {
    const t = (i + 0.5) / lampCount;
    const z = firstZ - walkLength * t;
    const side = i % 2 === 0 ? -1 : 1;
    candidates.push(
      prop(
        'kit_street_lamp',
        // Further out than the benches, where the rings reach less often.
        side * (11 + (i % 3)),
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
   * Gaziantep's gate stands free, and a child can walk right round it.
   *
   * The square behind the spawn is the only part of this city with room for
   * that: the street is fifteen metres to a side and already carries lamps,
   * stalls and three trigger rings, and a 6.7 m structure dropped into it would
   * leave a corridor rather than something to circle. Here the nearest solid
   * thing is the flag, 4.7 m off its corner, and the castle's mound is eleven
   * metres behind.
   *
   * Twelve metres back rather than eight: it has to be far enough that a child
   * turning round at the spawn sees a gate, not a wall.
   *
   * The opening faces down the street, so the view through it from the far side
   * is the walk the child is about to take, and from the street it frames the
   * castle. It is solid, which means the arch cannot be walked through — the
   * collision test is a single axis-aligned rectangle per object and has no way
   * to say "solid here, open there". Walking round it is the whole of what it
   * offers until that changes.
   */
  if (cityId === 'gaziantep') {
    candidates.push(prop('city_gaziantep_bazaar_gate', 0, 12, 0, 'the bazaar gate, standing free in the square'));
  }

  /**
   * Kars's geese, standing.
   *
   * A flock, so they are close enough together to be one group and turned
   * differently enough not to be one bird copied — two upright, one with its
   * head down. Six metres across, which is about what a handful of geese on a
   * plateau occupy.
   *
   * They are dressing and not the city's animal, because none of them is
   * rigged. Nothing here moves, and nothing here has to: a goose standing on
   * grass is a goose. When the walk arrives, `kit_kars_goose` starts drawing on
   * its routes and joins these rather than replacing them.
   *
   * Not solid, like the cats — a child walks through them. Getting stuck on a
   * bird is worse than walking through one.
   */
  if (cityId === 'kars') {
    candidates.push(...gooseFlock(cityId, stopPositions).map((bird) => ({ ...bird, solid: false })));
  }

  /**
   * An Urartian stone beside Van's walk.
   *
   * Van was the Urartian capital and a cuneiform stele by the street is the
   * right piece of furniture for the town. It was delivered to be stop two and
   * it is not stop two: the canonical card for that stop is about Akdamar
   * island and hands over a boat ticket, so a child would have stood in front
   * of a stele and read about a church on the water (D-152).
   *
   * Off the walking line and not solid, like the rest of the dressing.
   */
  if (cityId === 'van') {
    candidates.push({
      ...prop('city_van_urartu_stele', -6.5, -22, 0.45, 'an Urartian stele'),
      solid: false,
    });
    /**
     * A stone footbridge at the lake end of the street, where the ground would
     * run down to the shore. It arrived without a place named for it and this
     * is the one it fits: too small to bridge anything, too built to be a step.
     */
    candidates.push({
      ...prop('kit_stone_footbridge', -8.5, -52, 0.12, 'a stone footbridge to the shore'),
      solid: false,
    });
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
/**
 * Where the animals walk.
 *
 * A cat and a horse want different streets. A cat picks its way between the
 * furniture in short tight beats near the pavement; a horse walks a long line
 * along the open edge and needs three metres of clearance to do it. Generating
 * one set of routes for both left the horses with almost nowhere to go once
 * they grew to their proper size.
 */
function animalRoutes(stopPositions, geometry, animal, metrics) {
  /**
   * Gaits, before anything else looks at the name.
   *
   * A Van cat is a different animal to look at and the same one to walk. A deer
   * crosses rather than patrols, which is a horse's route: few, long, out on
   * the open ground — a large animal picking its way between market stalls is
   * not a large animal.
   *
   * These used to sit further down, after the horse and goose branches, so a
   * deer fell past every one of them and came out with a cat's five short hops.
   */
  if (animal === 'vancat') animal = 'cat';
  if (animal === 'deer') animal = 'horse';

  const firstZ = stopPositions[0]?.[2] ?? -20;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -70;
  const span = Math.abs(lastZ - firstZ);
  const edge = metrics.halfWidth;

  const clearOfStops = (point, margin) =>
    stopPositions.every((stop, index) => {
      const gap = Math.hypot(point.x - stop[0], point.z - stop[2]);
      return gap > geometry[index].triggerRadius + margin;
    });

  if (animal === 'horse') {
    /**
     * Long runs down the outer edges, where a three metre animal has room.
     * Horses graze at the edge of a settlement, not between its market stalls.
     */
    const lane = edge - 3.5;
    const routes = [
      [
        { x: -lane, z: firstZ + 6 },
        { x: -lane + 2, z: firstZ - span * 0.45 },
        { x: -lane, z: firstZ - span * 0.9 },
      ],
      [
        { x: lane, z: firstZ - span * 0.25 },
        { x: lane - 2, z: lastZ - 10 },
      ],
      [
        { x: -lane + 1, z: lastZ - 6 },
        { x: lane - 4, z: lastZ - 18 },
      ],
    ];
    return routes.filter((route) => route.every((point) => clearOfStops(point, 3)));
  }

  if (animal === 'goose') {
    /**
     * Geese, for Kars, which is known for them.
     *
     * A third gait, and it is not a smaller horse or a larger cat. A cat picks
     * its way alone between the furniture; a horse walks a long line down the
     * open edge. Geese go in a flock, slowly, over short distances, and they
     * all go the same way — so these are three short runs close together across
     * the same piece of open ground rather than three animals each minding
     * their own business.
     *
     * Out on the grass, well off the walking line: a goose on the pavement is
     * something a child walks into, and there is nothing in a goose's character
     * that would make it stand aside.
     */
    const lane = edge - 4.5;
    const routes = [
      [
        { x: -lane, z: firstZ - span * 0.2 },
        { x: -lane + 3.5, z: firstZ - span * 0.34 },
      ],
      [
        { x: -lane + 1.5, z: firstZ - span * 0.28 },
        { x: -lane + 5, z: firstZ - span * 0.42 },
      ],
      [
        { x: lane - 1, z: lastZ - 8 },
        { x: lane - 4.5, z: lastZ - 15 },
      ],
    ];
    return routes.filter((route) => route.every((point) => clearOfStops(point, 2.5)));
  }

  if (animal === 'dog') {
    /**
     * Street dogs, for Gaziantep. Four of them, so two models split evenly.
     *
     * Not a cat's beat and not a horse's line. A cat threads the furniture in
     * short tight moves; a horse walks the open edge. A dog covers more ground
     * than a cat and less carefully — longer runs, further out, crossing the
     * open rather than hugging the pavement.
     *
     * Six candidates and the first four that clear every ring, rather than four
     * written out and hoped for. Gaziantep's stops sit right of the centre line
     * and its street is fifteen metres to a side, so a route drawn by eye on
     * that side lands inside a trigger ring more often than not — two of the
     * first four did, and a city that quietly ends up with two dogs instead of
     * four is the kind of thing nobody notices for a month.
     */
    const lane = edge - 2.5;
    const candidates = [
      [
        { x: -lane, z: firstZ - 4 },
        { x: -lane + 4, z: firstZ - span * 0.32 },
        { x: -lane + 0.5, z: firstZ - span * 0.58 },
      ],
      [
        { x: -lane + 1, z: lastZ - 14 },
        { x: -lane + 6, z: lastZ - 4 },
      ],
      [
        { x: lane, z: firstZ - span * 0.1 },
        { x: lane - 3.5, z: firstZ - span * 0.36 },
      ],
      [
        { x: lane - 1, z: lastZ - 2 },
        { x: lane - 5, z: lastZ - 13 },
      ],
      [
        { x: -lane + 2, z: firstZ + 6 },
        { x: -lane + 7, z: firstZ - 3 },
      ],
      [
        { x: lane - 2, z: firstZ - span * 0.72 },
        { x: lane - 6, z: lastZ - 9 },
      ],
      // The two gaps between stops, on the side the stops crowd.
      [
        { x: lane, z: firstZ - span * 0.25 },
        { x: lane - 3, z: firstZ - span * 0.3 },
      ],
      [
        { x: lane - 0.5, z: firstZ - span * 0.75 },
        { x: lane - 4, z: firstZ - span * 0.8 },
      ],
    ];
    return candidates
      .filter((route) => route.every((point) => clearOfStops(point, 2.5)))
      .slice(0, 4);
  }

  // Cats — İstanbul's tabbies and Van's odd-eyed whites alike: short beats,
  // tucked in near the pavement. A Van cat is a different animal to look at
  // and the same one to walk.
  animal = animal === 'vancat' ? 'cat' : animal;
  const candidates = [
    [
      { x: -11.5, z: firstZ - 11 },
      { x: -6.0, z: firstZ - 14.5 },
      { x: -10.0, z: firstZ - 19 },
    ],
    [
      { x: 12.0, z: firstZ - 7 },
      { x: 16.5, z: firstZ - 11.5 },
    ],
    [
      { x: -13.0, z: firstZ - 22 },
      { x: -7.5, z: firstZ - 26 },
      { x: -12.5, z: firstZ - 30.5 },
    ],
    [
      { x: 13.0, z: firstZ + 14 },
      { x: 17.0, z: firstZ + 9 },
    ],
    [
      { x: 13.0, z: lastZ + 7 },
      { x: 17.0, z: lastZ + 3 },
      { x: 12.5, z: lastZ - 1 },
    ],
  ];
  return candidates.filter((route) =>
    route.every((point) => Math.abs(point.x) > 4 && clearOfStops(point, 0)),
  );
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
  /**
   * No cypress on the Kars plateau. A cypress is a Mediterranean and Aegean
   * tree and it was in this row only because the table was filled in before any
   * eastern city was open. Poplars line the watercourses there and the rest is
   * scrub — which is also what makes Ani read as a ruin standing in open
   * country rather than a park.
   */
  'eastern-anatolia': ['shrub', 'poplar', 'shrub', 'shrub', 'poplar'],
  'southeastern-anatolia': ['shrub', 'cypress', 'shrub', 'shrub', 'poplar'],
};

/**
 * Cities whose street planting is a delivered model rather than the procedural
 * shapes, and the leaf litter that goes with it.
 *
 * `StreetTrees` builds trunks and canopy blobs from instanced boxes, which is
 * cheap and looks like what it is: a low-poly tree. That was fine while every
 * city used it. Bolu is a forest, and a forest street lined with green blobs
 * beside a delivered forest edge reads as two different games in one shot.
 *
 * So a city may name a model, and the generator emits props at the same
 * positions instead of tree specs. Nothing else changes: the spacing, the
 * clearance from trigger rings and the walking line are all still the tree
 * placer's.
 */
const CITY_STREET_TREE = {
  bolu: 'kit_bolu_fir',
};

/** Scatter laid along the street, on top of the ground texture. */
const CITY_STREET_SCATTER = {
  bolu: 'kit_bolu_leaf_fall',
};

function streetTrees(cityId, stopPositions, geometry, regionId) {
  // A city with a delivered tree gets props instead; see `streetTreeProps`.
  if (CITY_STREET_TREE[cityId]) return [];
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
 * The same placement as the street trees, emitted as delivered models.
 *
 * And leaf litter scattered between them: the ground texture already draws
 * fallen leaves, but a texture is flat. Drifts standing on it catch the light
 * from the side, which is what makes leaves read as leaves — the same reason
 * the cobbles have a bench and a lamp standing on them.
 */
function streetTreeProps(cityId, stopPositions, geometry) {
  const treeId = CITY_STREET_TREE[cityId];
  if (!treeId) return [];

  const firstZ = stopPositions[0]?.[2] ?? -26;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -100;
  const span = Math.abs(lastZ - firstZ) + 40;
  const out = [];

  const clearOfStops = (x, z, margin) =>
    stopPositions.every((stop, index) => {
      const gap = Math.hypot(x - stop[0], z - stop[2]);
      return gap > geometry[index].triggerRadius + margin;
    });

  const count = Math.max(12, Math.round(span / 7));
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = firstZ + 16 - (span * i) / count - ((i % 3) * 1.7);
    const x = side * (11 + ((i * 7) % 5) * 1.6);
    if (!clearOfStops(x, z, 1)) continue;
    out.push({
      assetId: treeId,
      position: [Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10],
      rotationY: Math.round(((i * 37) % 360) * (Math.PI / 180) * 1000) / 1000,
      solid: true,
      note: `street tree ${i + 1}`,
    });
  }

  const scatterId = CITY_STREET_SCATTER[cityId];
  if (scatterId) {
    // Down both sides of the walking line and never on it: a drift underfoot is
    // something a child walks through, and nothing stands where they walk
    // (D-070).
    const drifts = Math.max(14, Math.round(span / 5));
    for (let i = 0; i < drifts; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (4.5 + ((i * 11) % 7) * 1.1);
      const z = firstZ + 18 - (span * i) / drifts - ((i % 4) * 1.3);
      if (!clearOfStops(x, z, 0.5)) continue;
      out.push({
        assetId: scatterId,
        position: [Math.round(x * 10) / 10, 0, Math.round(z * 10) / 10],
        rotationY: Math.round(((i * 61) % 360) * (Math.PI / 180) * 1000) / 1000,
        solid: false,
        note: `leaf drift ${i + 1}`,
      });
    }
  }

  return out;
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
  /**
   * One person per stop, up to three.
   *
   * The first version required four stops and so gave Gaziantep nobody — a
   * three-stop city is not a lesser city, it is a shorter one. Seventy-eight of
   * the eighty-one have fewer than five stops.
   */
  if (stopPositions.length < 2) return [];

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

  /**
   * One person per stop, spread across whatever stops the city has.
   *
   * Two of them landing on the same stop is what happens when the plan names
   * fixed indices and the city is shorter than the plan expects.
   */
  const people = [
    { npcId: 'featured_soldier', side: -1, alongZ: 3.5, rotationY: 2.4 },
    { npcId: 'featured_traveler', side: 1, alongZ: -3.0, rotationY: -2.1 },
    { npcId: 'featured_craftsman_male', side: -1, alongZ: 2.6, rotationY: 1.9 },
  ];
  const stops = stopPositions.length;
  const plan = people.map((person, i) => ({
    ...person,
    at: Math.min(stops - 1, Math.round(((i + 1) * (stops - 1)) / people.length)),
  }));

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
      { x: 0, z: behind + half + VALLEY_SETBACK, rot: Math.PI, note: 'valley rim behind the square' },
      { x: 0, z: lastZ - 14 - half - VALLEY_SETBACK, rot: 0, note: 'valley rim the street runs down to' },
    );

    // Both sides, two plates each, overlapping along the length of the walk.
    const sideZs = [firstZ + 14, lastZ - 34];
    for (const side of [-1, 1]) {
      for (const [i, z] of sideZs.entries()) {
        ring.push({
          x: side * (inner + half + VALLEY_SETBACK),
          z,
          rot: side < 0 ? Math.PI / 2 : -Math.PI / 2,
          note: `valley rim ${side < 0 ? 'west' : 'east'} ${i + 1}`,
        });
      }
    }

    return [
      /**
       * Fairy chimneys stand between the street and the rim, so a child sees
       * chimneys close and a valley beyond them.
       *
       * Moved out from nineteen metres to twenty-seven. A ridge is 19 m deep
       * and turned side-on, so at nineteen its near edge stood at x = 9.5 —
       * four and a half metres *inside* the play area. It had swallowed the
       * dressing along the edges and closed the horses' routes, which is what
       * the owner's screenshots show.
       *
       * It got worse rather than started when the recorded height began to
       * draw the model (D-124): the ridges went from 10 m to the 17 m the
       * layout had always assumed, and grew in plan by the same half again.
       * The number was right; the position had been chosen against the smaller
       * thing that was actually on screen.
       *
       * At twenty-seven the near edge sits at 17.5 m, clear of the fifteen
       * metre boundary with a couple of metres to spare.
       */
      ...[-27, 27].flatMap((x) =>
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

  if (cityId === 'gaziantep') {
    /**
     * A walled stone city on a plain.
     *
     * Houses close both sides, the castle closes the back on its mound, and
     * olive groves run out in front — the direction İstanbul answers with sea
     * and Nevşehir with a valley.
     */
    const houseCount = 4;
    return [
      ...[-21, 21].flatMap((x) =>
        Array.from({ length: houseCount }, (_, i) => {
          const z = firstZ + 12 - ((span + 26) * i) / (houseCount - 1);
          return wall(
            'city_gaziantep_stone_houses',
            x,
            z,
            `stone houses ${x < 0 ? 'west' : 'east'} ${i + 1}`,
          );
        }),
      ),
      {
        /**
         * The castle stands at the end of the walk, not behind it.
         *
         * It was behind the square, which meant the one thing in Gaziantep a
         * child would cross a room to look at was over their shoulder from the
         * moment they arrived — and the street ran out towards olive groves.
         * Swapped: the castle now closes the far end and grows as they walk
         * towards it, and the groves fill the square they started in.
         *
         * Aligned by its near edge, as it always was: a thirty-seven metre
         * landscape centred on the boundary would swallow the last stop.
         */
        assetId: 'city_gaziantep_castle',
        position: [0, 0, Math.round((lastZ - 22 - 37 / 2) * 10) / 10],
        rotationY: 0,
        solid: true,
        note: 'the castle on its mound, closing the walk',
      },
      // Groves behind the square and at the far corners: low, spreading, and
      // never solid — an olive grove is somewhere you would walk into, not a
      // wall.
      ...[
        [-16, behind + 6],
        [15, behind + 14],
        [-4, behind + 26],
        [-30, firstZ - 4],
        [30, firstZ - span * 0.6],
      ].map(([x, z], i) => ({
        assetId: 'kit_olive_grove',
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: Math.round(i * 1.1 * 1000) / 1000,
        solid: false,
        note: `olive grove ${i + 1}`,
      })),
    ];
  }

  if (cityId === 'trabzon') {
    /**
     * A lake town with its back to the water, walking up a valley.
     *
     * The third province out of the Black Sea table and the one that had to try
     * hardest, because Ordu already used the coast. So the street runs the other
     * way: a child spawns with Uzungöl *behind* them and walks inland, and the
     * thing waiting at the far end is Sümela. Ordu walks toward its water with
     * its hill on the flank; this walks away from its water with the rock in
     * front.
     *
     * Sides: tea terraced into a slope, nine a side, closing in as the valley
     * narrows toward the rock. Ahead: Sümela, one piece and large. Behind: the
     * sea, with the wharf standing on the shoreline and hamsi boats crossing it.
     *
     * The sea is the third answer this direction has had. A wharf that carried
     * no water left the square backing on to sky; Uzungöl carried a beautiful
     * one and could not be stood up — a bowl hides its own surface from a child
     * standing on the ground. What was wanted here was never a lake.
     */
    const slopes = 9;
    return [
      /**
       * Nine a side, spaced fourteen metres for a piece that is 15.7 across.
       *
       * The overlap is deliberate. This slope tapers to a third of its width by
       * the top, so spacing it by its own width would close the street at knee
       * height and leave sky between the shoulders — plan coverage without
       * height, which is the hole the elevation sweep exists to find (D-149).
       *
       * Seven became nine when the three rocks ahead became one: a single 36 m
       * mass leaves the front corners open where 92 m of ridge did not, and the
       * last two a side are what the valley narrows to.
       */
      ...[-1, 1].flatMap((side) =>
        Array.from({ length: slopes }, (_, i) =>
          wall(
            'city_trabzon_tea_slope',
            side * 31,
            24 - i * 14,
            `tea slope ${side < 0 ? 'west' : 'east'} ${i + 1}`,
          ),
        ),
      ),
      /**
       * Two more a side flanking the lake, pushed out to x = ±36.
       *
       * The sweep found twenty-eight degrees of open sky behind the spawn: the
       * slopes stopped at z = +24 and the lake is only 55 m across, so the back
       * corners were the gap between them. Out at 36 rather than 31 because the
       * slope is 21 m deep and would otherwise sit seven metres inside the
       * lake's outer bank.
       *
       * It is also what the place looks like. Tea comes down to the water at
       * Uzungöl; that is the whole postcard.
       */
      ...[-1, 1].flatMap((side) =>
        [38, 52].map((z, i) =>
          wall('city_trabzon_tea_slope', side * 36, z, `lakeside tea ${side < 0 ? 'west' : 'east'} ${i + 1}`),
        ),
      ),
      /**
       * Sümela: one piece, near edge on TRABZON_ROCK_NEAR_Z.
       *
       * Aligned by its near face and not its centre (D-101), so its centre sits
       * 13 m further out than the line it is measured to.
       */
      {
        assetId: 'city_trabzon_sumela_cliff',
        position: [0, 0, TRABZON_ROCK_NEAR_Z - 13.02],
        rotationY: 0.06,
        solid: true,
        note: 'Sümela, at the head of the valley',
      },
      /**
       * The Trabzonspor crest, one each side of the street.
       *
       * Out at x = ±17, two metres past the play bounds, so it is roadside
       * furniture a child walks between rather than something they collide
       * with. Turned a quarter turn to face the street; if the crest is only
       * printed on one face and the wrong one is showing, this is where the
       * half turn goes.
       */
      ...[-1, 1].map((side) => ({
        assetId: 'kit_trabzon_trabzonspor_crest',
        position: [side * 17, 0, -24],
        rotationY: side * -(Math.PI / 2),
        solid: false,
        note: `Trabzonspor crest ${side < 0 ? 'west' : 'east'}`,
      })),
      /**
       * The wharf on the shoreline, four of them with the sea between.
       *
       * Not a wall. Ten and a half metres across at seventeen metre centres
       * leaves six metres of water showing between each pair, which is what
       * stops a row of sheds reading as a fence across the back of the square.
       *
       * Five metres tall against a ceiling of 10.7 m when a child turns round
       * at the spawn (D-183), so it closes the fourth direction without leaning
       * over them.
       */
      ...[-26, -9, 9, 26].map((x, i) => ({
        assetId: 'city_trabzon_harbour',
        position: [x, 0, TRABZON_SHORE_Z + 1],
        rotationY: [0.05, -0.03, 0.04, -0.06][i],
        solid: false,
        note: `wharf ${i + 1}`,
      })),
    ];
  }

  if (cityId === 'bolu') {
    /**
     * A forest town between a lake and a mountain.
     *
     * Bolu shares a region with Ordu and answers its four directions with
     * nothing Ordu uses. Sides: forest — pine standing dark against beech that
     * has turned. Ahead: Yedigöller, the seven lakes, which is where stop one
     * is and the only still water in the project. Behind: Kartalkaya under
     * snow, with the chairlift climbing it.
     *
     * Ordu is a coast in high summer and this is a forest in late October. Two
     * provinces from one region table, and the only way they read as two places
     * is if nothing at all is shared.
     */
    /**
     * Three stands a side rather than four: the delivered forest edge is forty-
     * two metres across where the brief asked for twenty-six, so three of them
     * close a street that would have taken four narrower pieces.
     */
    const stands = 3;
    return [
      ...[-1, 1].flatMap((side) =>
        Array.from({ length: stands }, (_, i) => {
          const z = firstZ + 14 - ((span + 30) * i) / (stands - 1);
          return wall(
            'city_bolu_forest_row',
            side * 31,
            z,
            `forest ${side < 0 ? 'west' : 'east'} ${i + 1}`,
          );
        }),
      ),
      // Single firs filling the ground between the stands and behind the square.
      ...[
        [-38, firstZ + 8],
        [37, firstZ - span * 0.28],
        [-40, firstZ - span * 0.66],
        [39, firstZ - span * 0.94],
        [-34, behind + 8],
        [33, behind + 12],
        [-42, 14],
        [42, 14],
      ].map(([x, z], i) => ({
        assetId: 'kit_bolu_fir',
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: Math.round(i * 0.9 * 1000) / 1000,
        solid: false,
        note: `fir ${i + 1}`,
      })),
      /**
       * The far shore of Yedigöller: forest coming down to the waterline.
       *
       * The brief asked for a separate shore plate and it is not needed — the
       * forest edge is what a Yedigöller shore *is*, so three more of the same
       * stand across the water do the job with a model that already exists.
       * One fewer thing to draw, and more honest than a purpose-made plate.
       */
      ...[-38, 2, 42].map((x, i) => ({
        assetId: 'city_bolu_forest_row',
        position: [x, 0, Math.round((BOLU_SHORE_Z - 34 - (i % 2) * 7) * 10) / 10],
        rotationY: Math.PI + (i - 1) * 0.16,
        solid: true,
        note: `the far shore of Yedigöller ${i + 1}`,
      })),
      {
        /**
         * Kartalkaya closes the back — Eagle Rock, and the reason stop three
         * exists. The chairlift climbs it.
         */
        assetId: 'city_bolu_kartalkaya_peak',
        position: [3, 0, Math.round((behind + 28) * 10) / 10],
        rotationY: Math.PI - 0.12,
        solid: true,
        note: 'Kartalkaya, behind the town',
      },
    ];
  }

  if (cityId === 'ordu') {
    /**
     * A green coast: houses under a hill, hazelnuts behind them, sea in front.
     *
     * Ordu's four directions are the wettest in the project and none of them is
     * borrowed. The sides are timber houses with deep eaves and the hazelnut
     * groves that start where the town stops — on the Black Sea the orchard
     * comes down to the back gardens. Ahead is the sea, and it is a beach
     * rather than a quay. Behind is Boztepe, the hill the cable car climbs.
     *
     * Nothing here looks like Van's lake shore: that is a bare plateau meeting
     * water, and this is a forest doing it.
     */
    const houses = 4;
    return [
      ...[-1, 1].flatMap((side) =>
        Array.from({ length: houses }, (_, i) => ({ i, z: firstZ + 10 - ((span + 24) * i) / (houses - 1) }))
          /**
           * The east row opens at its third house, and the beach stands in the
           * gap. A coastal town breaks where it meets the shore, and stop three
           * is about Ordu's Blue Flag beaches — the deck alone reads as a deck
           * on grass.
           */
          .filter(({ i }) => !(side > 0 && i === 2))
          .map(({ i, z }) =>
            wall(
              'city_ordu_timber_houses',
              side * 31,
              z,
              `timber houses ${side < 0 ? 'west' : 'east'} ${i + 1}`,
            ),
          ),
      ),
      // Groves behind the houses, climbing the slope. Never solid: a hazelnut
      // grove is somewhere you would walk into.
      /**
       * The back corners, where the house row stops and the hill has not begun.
       *
       * The rows run to the boundary and Boztepe starts twenty-two metres past
       * it, so the square behind the spawn had eleven metres of house on each
       * flank and then nothing but four-metre groves — plan coverage without
       * height, which is what the owner is looking at when they say it is
       * empty. Two more houses a side, turned in towards the square, because a
       * town under a hill wraps round rather than stopping in a line.
       */
      ...[-1, 1].flatMap((side) =>
        [
          /**
           * A third pair, level with the spawn.
           *
           * The rows start ahead of the child and the back corner sits behind
           * them, which left a slice due east and west with nothing in it — the
           * elevation sweep found 74° open above 3.8°, because the only thing
           * out there was a four metre orchard forty-four metres away. A house
           * at eleven metres covers it.
           */
          [-14, 0.2],
          [8, 0.55],
          [24, 1.0],
        ].map(([ahead, turn], i) => ({
          assetId: 'city_ordu_timber_houses',
          position: [side * (36 - i * 4), 0, Math.round((behind + ahead) * 10) / 10],
          rotationY: side * (Math.PI / 2 - turn),
          solid: true,
          note: `back corner houses ${side < 0 ? 'west' : 'east'} ${i + 1}`,
        })),
      ),
      /**
       * Groves along both sides and, especially, in the gap between the last
       * houses and the hill.
       *
       * The houses stop at the boundary and Boztepe starts twenty-two metres
       * behind it, which left bare ground either side of the square — the
       * owner's complaint, and on this coast the orchard is exactly what fills
       * it: hazelnut comes right down to the back gardens.
       */
      ...[
        [-36, firstZ + 4],
        [34, firstZ - span * 0.3],
        [-38, firstZ - span * 0.72],
        [37, firstZ - span * 0.95],
        // The gap between the houses and the hill, both sides.
        [-31, behind + 6],
        [-24, behind + 17],
        [-39, behind + 20],
        [30, behind + 5],
        [23, behind + 16],
        [38, behind + 19],
        /**
         * And the flanks themselves, now that the houses stand at thirty-one
         * rather than twenty-three. Moving the rows out to widen the street
         * opened seventy-four degrees of bare sky behind and to the side — the
         * elevation sweep found it at once (D-174). Orchard is what fills it
         * here, as it fills everything else on this coast.
         */
        [-44, firstZ + 12],
        [43, firstZ + 8],
        // Due east and west of the spawn: the row starts ahead of it and the
        // back corner sits behind it, so this slice had nothing in it at all.
        [-42, 12],
        [42, 12],
        [-40, 24],
        [40, 24],
        [-46, firstZ - span * 0.5],
        [45, firstZ - span * 0.62],
        [-42, behind + 30],
        [41, behind + 32],
      ].map(([x, z], i) => ({
        assetId: 'kit_ordu_hazelnut_grove',
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: Math.round(i * 1.1 * 1000) / 1000,
        solid: false,
        note: `hazelnut grove ${i + 1}`,
      })),
      {
        /**
         * The beach the Blue Flag deck stands on, in the gap in the east row.
         *
         * Stop three is about Ordu's Blue Flag shores and the deck alone reads
         * as a deck on grass. This is the shoreline it belongs to — the model
         * carries its own sand and water, so it works with no sea in the city.
         */
        assetId: 'city_ordu_beach_front',
        position: [24, 0, Math.round((firstZ - span * 0.88) * 10) / 10],
        rotationY: -1.3,
        solid: true,
        note: 'the beach beside stop three',
      },
      {
        /**
         * Perşembe Yaylası, closing the front where the sea used to be.
         *
         * Ordu ran out to water with a twenty-two metre seafront plate across
         * the bay. It floated: an infinite blue plane with an island on it, and
         * the owner's screenshot showed it plainly. Ordu is a coast *and* a
         * highland, and the highland is the half a child can walk out into.
         *
         * Near-edge aligned like every landscape plate — ninety metres of
         * plateau centred on the boundary would swallow the last stop (D-101).
         */
        assetId: 'city_ordu_persembe_plateau',
        /**
         * Tilted twenty-two degrees, and lifted so its lip clears the town.
         *
         * The plate is a disc seen from above — a river winding across it,
         * cart tracks, farmhouses, pines — and stood upright a child sees a rim
         * and nothing else. Tilting it towards them turns the top surface into
         * a hillside, which is also what a yayla is from the coast: a highland
         * whose flank you look up at.
         *
         * **The sign matters and I had it backwards.** A tilt about X turns the
         * top normal to (0, cos θ, sin θ); the child stands at greater z, so
         * the surface only faces them when θ is positive. At -0.38 they were
         * shown the underside, which is unlit — a black hole in the sky, which
         * is exactly what the owner's screenshot shows.
         *
         * **The near TOP corner is the one that matters**, not the near lip.
         * The lip was buried at -2.7 and the plate still floated, because the
         * corner above it stood at +10.3 — ten metres of rock hanging at eye
         * level with sky underneath. The pivot is below ground now, at -5, so
         * that corner lands at -2.5 and the land climbs out of the earth to
         * thirty-five at the far rim.
         *
         * Tipped less as well, 0.28 rather than 0.38: a plate this large no
         * longer needs a steep tilt to show its surface, and a gentler one
         * reads as a slope rather than as a ramp.
         */
        position: [-4, 2, Math.round((lastZ - 24 - (141.9 / 2) * 0.929) * 10) / 10],
        rotationY: 0.18,
        rotationX: 0.38,
        solid: true,
        note: 'Perşembe Yaylası, tilted so its surface reads',
      },
      {
        /**
         * The cable station, standing where the street meets the plateau.
         *
         * It was stop two and is scenery now: a nine metre building is a place
         * rather than a thing to walk up to, and the stop is better served by
         * the cabin itself. The line still starts here, so the child watches
         * the car leave the building it belongs to.
         */
        assetId: 'city_ordu_cable_station',
        position: [13, 0, Math.round((lastZ - 6) * 10) / 10],
        rotationY: -0.4,
        solid: true,
        note: 'the cable station at the foot of the plateau',
      },
      /**
       * The flank the plateau sits on.
       *
       * A yayla is the flat top of a mountain, and a tilted plate meeting flat
       * ground has a seam where the two touch however deep it is buried. Three
       * hills stand along that line — the same Boztepe plate, lower and
       * overlapping — so the ground climbs into the plateau instead of stopping
       * at it.
       */
      ...[-34, 0, 34].map((x, i) => ({
        assetId: 'city_ordu_boztepe_hill',
        /**
         * Well past the boundary, and square rather than fanned.
         *
         * They were twenty metres past the last stop and turned ±0.4 rad, which
         * widened their axis-aligned reach to twenty-nine metres — enough for
         * the west one to poke back into the street at x = -9 and z = -36,
         * inside the play area. Scenery that reaches into the walk is the
         * mistake Cappadocia's chimneys made (D-140), and the rotation is what
         * hid it: a turned box covers more ground than the box.
         */
        position: [x, 0, Math.round((lastZ - 50 + (i % 2) * 6) * 10) / 10],
        rotationY: Math.PI,
        solid: true,
        note: `the mountain flank under the plateau ${i + 1}`,
      })),
      /**
       * Boztepe closes the back — the hill the cable car goes up, and the
       * reason stop two exists.
       *
       * Three plates rather than one, because it arrived 44 m across where the
       * brief asked for 78. Two left thirteen degrees of sky open straight
       * behind the spawn and nine more to the left of it — found by sweeping
       * the circle rather than by looking, which is the method that should be
       * reached for first (D-149, D-160).
       *
       * Overlapping and at different angles, so the three read as a headland
       * with shoulders rather than as the same hill printed three times.
       *
       * Near-edge aligned, like every landscape plate: 45 m of hill centred on
       * the boundary would swallow the square (D-101).
       */
      ...[
        [-26, 0.3],
        [0, 0],
        [26, -0.3],
      ].map(([x, rot], i) => ({
        assetId: 'city_ordu_boztepe_hill',
        position: [x, 0, Math.round((behind + 45.09 / 2 + i * 4) * 10) / 10],
        rotationY: Math.PI + rot,
        solid: true,
        note: `Boztepe ${i + 1}`,
      })),
    ];
  }

  if (cityId === 'van') {
    /**
     * A city between a rock and a lake.
     *
     * Van's four directions are its own. The sides are the Urartian citadel
     * ridge — a long spine of bare rock with chambers cut into it, which is
     * what Tushpa is — and orchards where the rock gives out. Ahead is the
     * lake, and Akdamar on it. Behind is Erek, the mountain the town sits
     * under.
     *
     * Nothing here is borrowed. Ani's ruins are churches standing in grass and
     * these are galleries cut into a cliff; Kars's mountain closes a plateau
     * and this one stands over water.
     */
    /**
     * Townhouses down both sides, not a citadel ridge.
     *
     * The brief asked for the rock spine of Tushpa, which is the right idea for
     * the castle and the wrong one for a street: Van's walk is a town, and the
     * rock is what the town is built against rather than what it is walled
     * with. Mudbrick and stone houses with a bastion at one end, delivered.
     */
    const houses = 4;
    return [
      ...[-1, 1].flatMap((side) =>
        Array.from({ length: houses }, (_, i) => {
          const z = firstZ + 10 - ((span + 26) * i) / (houses - 1);
          return { side, z, i };
        })
          /**
           * The east side gives up two of its four houses to the citadel ridge.
           * A town built against a rock has a rock showing through it; a
           * continuous row of houses with a ridge behind them shows neither.
           */
          .filter(({ side: s2, i }) => !(s2 > 0 && (i === 1 || i === 2)))
          .map(({ side: s2, z, i }) =>
            wall(
              'city_van_townhouses',
              s2 * 24,
              z,
              `townhouses ${s2 < 0 ? 'west' : 'east'} ${i + 1}`,
            ),
          ),
      ),
      // Orchards fill the gaps between the spurs, low and never solid.
      ...[
        [-33, firstZ - span * 0.2],
        [32, firstZ - span * 0.42],
        [-31, lastZ - 12],
        [34, lastZ - 18],
      ].map(([x, z], i) => ({
        assetId: 'kit_van_orchard',
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: Math.round(i * 1.3 * 1000) / 1000,
        solid: false,
        note: `orchard ${i + 1}`,
      })),
      {
        /**
         * Akdamar at the end of the walk, on the water, and the thing the
         * street runs towards — as the sea is İstanbul's answer to that
         * direction and the gorge is Kars's.
         *
         * It arrived as one square plate with the island and its piece of lake
         * together — but it cannot stand as near as that suggests. The ground
         * is drawn 44 m past the boundary (D-082) and the water plane is drawn
         * *below* the ground, so anything closer than 103 m is an island in a
         * car park. That is why the lake looked missing: it was there and it
         * was under the paving.
         *
         * So the shore is where the paving runs out, and Akdamar sits just
         * beyond it — sixty-eight metres ahead of the last stop, filling the
         * view a child walks towards, which is how the sea and the Maiden's
         * Tower work in İstanbul.
         *
         * Solid, because the far side of an island is water.
         */
        assetId: 'city_van_akdamar_island',
        position: [-3, 0, VAN_SHORE_Z - 33],
        rotationY: 0.35,
        solid: true,
        note: 'Akdamar, at the end of the walk',
      },
      {
        /**
         * The rock spine, running down the east side of the street.
         *
         * It sat behind the castle across the back, where twenty-seven metres of
         * ridge is seen end-on and reads as a lump. A spine only looks like a
         * spine broadside, and the only place in this city with a long enough
         * broadside view is along the walk — so it takes the east side and the
         * townhouse that stood there has been dropped to let it show.
         *
         * That is also what Van is: the citadel rock runs beside the town, and
         * the town is built against it.
         */
        assetId: 'city_van_citadel_ridge',
        position: [24, 0, Math.round((firstZ - span * 0.28) * 10) / 10],
        // Long axis down the street.
        rotationY: -Math.PI / 2,
        solid: true,
        note: 'the citadel ridge, running beside the street',
      },
      /**
       * The ground either side of the castle, filled by measurement.
       *
       * One orchard at x = -33 was not enough: sweeping the circle from the
       * spawn left thirteen degrees open between 293 and 306, which is the
       * back-left quarter — exactly where the owner said it looked bare. Two
       * more further out and further round close it, and a second ridge
       * thickens the right so the two sides balance without matching.
       */
      ...[
        ['kit_van_orchard', -33, behind + 12, 0.7],
        ['kit_van_orchard', -42, behind - 4, -0.5],
        ['kit_van_orchard', -47, behind + 14, 1.4],
        ['city_van_citadel_ridge', 24, firstZ - span * 0.78, -Math.PI / 2],
      ].map(([assetId, x, z, rot]) => ({
        assetId,
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: rot,
        solid: assetId === 'city_van_citadel_ridge',
        note: `${assetId === 'kit_van_orchard' ? 'orchard' : 'ridge'} beside the castle`,
      })),
      {
        /**
         * Van Castle closes the back, on the boundary.
         *
         * Fifty-nine metres across: what a child turns round to, and the widest
         * thing in the city. Near edge on the boundary, as always — thirty-three
         * metres of rock centred there would swallow the square (D-101).
         */
        assetId: 'city_van_castle',
        position: [0, 0, Math.round((behind + 32.77 / 2) * 10) / 10],
        rotationY: Math.PI,
        solid: true,
        note: 'Van Castle on its rock, behind the town',
      },
      {
        /**
         * Erek behind the castle, and taller than it by nearly double, so the
         * two read as rock in front of mountain rather than as two walls.
         */
        assetId: 'city_van_erek_mountain',
        position: [8, 0, Math.round((behind + 52 + 90 / 2) * 10) / 10],
        rotationY: Math.PI - 0.2,
        solid: false,
        note: 'Erek, behind the castle',
      },
    ];
  }

  if (cityId === 'kars') {
    /**
     * A ruined city on a gorge, and the child walks through the middle of it.
     *
     * Ani is not a skyline. It is roofless churches standing apart in grass
     * with nothing between them and a ravine at the edge, and most of what a
     * child sees there is sky. So the sides are not a continuous run the way
     * İstanbul's facades and Antep's houses are — those are streets, and Ani
     * has not had one for eight hundred years.
     *
     * Three different buildings rather than one repeated. The brief asked for a
     * single shell turned six ways; three arrived instead, and three distinct
     * silhouettes is what makes a ruined city read as a place rather than as a
     * pattern. They alternate down each side so the same building never stands
     * twice in a row, and each is turned individually — a ruin has no frontage,
     * and squaring them to the street would rebuild the city rather than leave
     * it fallen.
     */
    /**
     * Twenty-one metres out at the closest, not eighteen.
     *
     * A chapel is 8.7 m deep and turned, so at eighteen its near edge stood at
     * 13.9 — a metre inside the fifteen metre boundary, where a child walking
     * to the edge of the street walks into a church. The same mistake as
     * Cappadocia's chimney ridges and found the same way, by a test that now
     * holds every city to it.
     */
    /**
     * Both sides, the whole length of the walk, with nothing left beside the
     * child at any point along it.
     *
     * The first six were spread between the stops and left holes exactly where
     * a child stands still: beside the spawn and beside the last stop there was
     * nothing within sixty degrees either side, so turning to look sideways
     * gave bare ground and sky. It took three rounds of guessing from
     * screenshots before the horizon was measured properly — a sweep from the
     * spawn and from each stop, every ten degrees, listing which bearings have
     * nothing in them. That audit is what these positions answer.
     *
     * Twenty-one metres out at the closest: a chapel is 8.7 m deep and turned,
     * so any nearer and its near edge crosses the fifteen metre boundary into
     * the street (D-140).
     */
    const shells = [
      ['city_kars_ani_chapel', -22, behind - 22, 0.22],
      ['city_kars_ani_church', -25, firstZ + 4, -0.35],
      ['city_kars_ani_chapel', -21, firstZ - span * 0.3, 0.5],
      ['city_kars_ani_church', -24, firstZ - span * 0.62, -0.9],
      ['city_kars_ani_chapel', -22, lastZ - 6, 1.4],
      ['city_kars_ani_church', 23, behind - 20, -0.28],
      ['city_kars_ani_chapel', 21, firstZ + 2, 0.42],
      ['city_kars_ani_church', 26, firstZ - span * 0.36, -0.16],
      ['city_kars_ani_chapel', 22, firstZ - span * 0.7, 1.05],
      ['city_kars_ani_church', 25, lastZ - 9, -1.3],
    ];

    return [
      /**
       * The corners, filled by repeating what is already there.
       *
       * Six shells down the sides left the four corners of the plateau empty,
       * and empty ground reads as unfinished rather than as open country — the
       * owner's screenshots show it plainly. Ani has dozens of ruins standing
       * about on it, so the honest way to fill them is more of the same
       * buildings, further out and turned differently, not a new asset.
       *
       * All of them behind, around the walls. They were spread down both ends
       * of the site, which put four of them alongside the railway — and the
       * ground by the track wants to stay open, because the gorge is already
       * doing the work there. The walls are what a child turns round to, so
       * that is the side that has to look inhabited.
       */
      ...[
        // Beyond the walls at the far edges, and short of them nearer in.
        // Nothing on the centre line: that is the mountain's.
        ['city_kars_ani_church', -52, behind + 16, 0.9],
        ['city_kars_ani_chapel', -45, behind + 1, -1.2],
        // A church, not a chapel: this one stands at the head of the western
        // row and the row alternates.
        ['city_kars_ani_church', -24, behind - 9, 2.1],
        ['city_kars_ani_church', 51, behind + 14, -0.75],
        ['city_kars_ani_chapel', 44, behind + 2, 1.35],
        ['city_kars_ani_chapel', 25, behind - 6, -2.35],
        ['city_kars_ani_church', -33, behind - 14, 0.35],
        ['city_kars_ani_chapel', 32, behind - 12, -0.55],
        /**
         * Due east and due west of the square, and this is the pair that kept
         * getting missed.
         *
         * The ring was closed everywhere except two windows either side at
         * roughly ninety degrees — the direction a child looks when they turn
         * to the side rather than round. Found by measuring the angular
         * coverage from the spawn instead of by looking at the numbers and
         * deciding they seemed full, which is what the previous three attempts
         * did.
         *
         * Two apiece and staggered in depth, because a single building at forty
         * metres subtends about twelve degrees and the western window is eight
         * wide, the eastern eighteen.
         */
        ['city_kars_ani_church', 41, -4, -1.5],
        ['city_kars_ani_chapel', 36, -16, 1.1],
        ['city_kars_ani_church', -42, -3, 1.5],
        ['city_kars_ani_chapel', -37, -15, -1.1],
      ].map(([assetId, x, z, rot], i) => ({
        assetId,
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: rot,
        solid: false,
        note: `corner ruin ${i + 1}`,
      })),
      ...shells.map(([assetId, x, z, rot], i) => ({
        assetId,
        position: [x, 0, Math.round(z * 10) / 10],
        rotationY: (x < 0 ? 1 : -1) * (Math.PI / 2) + rot,
        solid: false,
        note: `${assetId.endsWith('chapel') ? 'chapel' : 'church'} ${x < 0 ? 'west' : 'east'} ${i + 1}`,
      })),
      {
        /**
         * The cathedral stands alone and further out — the one building at Ani
         * bigger than the rest, and the only one that reads from anywhere on
         * the site. Off the axis, because Ani has no main street to put it at
         * the end of.
         */
        assetId: 'city_kars_ani_cathedral',
        position: [-33, 0, Math.round((firstZ - span * 0.55) * 10) / 10],
        rotationY: 1.15,
        solid: false,
        note: 'the cathedral, standing apart',
      },
      /**
       * The walls stand apart, one each side, and the middle is left open.
       *
       * They were centred and overlapping, which closed the back completely —
       * and closing the back is exactly what put a wall in front of the
       * mountain. A child turning round saw stonework across the whole view and
       * Sarıkamış only through a gate arch.
       *
       * So they flank instead: thirty-five metres out, angled in towards the
       * square, filling the two empty patches either side. Thirty metres of
       * open sky between them, which is the gap the mountain is for.
       *
       * Near edge on the boundary in depth, as always — a twenty metre deep
       * piece centred there would swallow the square (D-101).
       */
      ...[-1, 1].map((side) => ({
        assetId: 'city_kars_ani_walls',
        position: [side * 35, 0, Math.round((behind + 12) * 10) / 10],
        // Turned in towards the child rather than square to the street, so the
        // two read as two ends of one circuit rather than as two flat screens.
        rotationY: side < 0 ? Math.PI - 0.3 : 0.3,
        solid: true,
        note: `the city walls ${side < 0 ? 'west' : 'east'}`,
      })),
      {
        /**
         * Sarıkamış, seen between the walls rather than behind them.
         *
         * The largest thing in the project — 109 m across and 34 m tall,
         * against walls of 14 — because a mountain that does not tower over the
         * buildings in front of it is a hill. It is what fills the middle of
         * the back now that the stonework has moved aside.
         *
         * Aligned by its near edge, 113 m deep: centred on the boundary it
         * would put the whole city inside a mountain (D-101).
         */
        assetId: 'city_kars_sarikamis_mountain',
        position: [0, 0, Math.round((behind + 26 + 113.46 / 2) * 10) / 10],
        rotationY: Math.PI,
        solid: false,
        note: 'Sarıkamış, seen between the walls',
      },
      ...[
        [0, lastZ - 26, 0],
        [-40, lastZ - 20, 0.28],
        [39, lastZ - 24, -0.24],
      ].map(([x, z, rot], i) => ({
        assetId: 'city_kars_ani_gorge',
        /**
         * Near-edge aligned, never centred: sixty-four metres deep, and a plate
         * that size centred on the boundary puts the child inside the ravine
         * (D-101).
         */
        position: [x, 0, Math.round((z - 63.66 / 2) * 10) / 10],
        rotationY: rot,
        // Solid. A gorge is the one landscape a child must not walk into.
        solid: true,
        note: `the Arpaçay gorge ${i + 1}`,
      })),
    ];
  }
  return [];
}

/**
 * Kars's geese, standing.
 *
 * A flock: close enough together to be one group, turned differently enough not
 * to be one bird copied — two upright, one with its head down. None of them is
 * rigged and none of them needs to be. A goose standing on grass is a goose.
 *
 * Written once and read twice: the props place the birds, and the ground patch
 * puts grass under them. Two lists of coordinates would come apart the first
 * time one of them moved.
 */
function gooseFlock(cityId, stopPositions) {
  if (cityId !== 'kars') return [];
  const firstZ = stopPositions[0]?.[2] ?? -26;
  const lastZ = stopPositions[stopPositions.length - 1]?.[2] ?? -70;
  const flockZ = firstZ - Math.abs(lastZ - firstZ) * 0.62;
  return [
    ['kit_goose_standing_a', -12.4, flockZ, 2.35, 'goose, standing'],
    ['kit_goose_foraging', -10.1, flockZ - 2.4, 1.05, 'goose, head down'],
    ['kit_goose_standing_b', -13.6, flockZ - 4.1, -0.6, 'goose, standing'],
  ].map(([assetId, x, z, rotationY, note]) => ({
    assetId,
    position: [x, 0, Math.round(z * 10) / 10],
    rotationY,
    note,
  }));
}

/**
 * A sky of balloons, over Cappadocia and nowhere else.
 *
 * This used to run in every city, with Nevşehir merely getting more of them:
 * three balloons drifted over the Bosphorus and three over the Antep plain
 * because the density argument said `few` rather than `none`. A hot air balloon
 * is not weather, it is Cappadocia — the one place in the country where a
 * hundred of them go up at dawn — and putting a few anywhere else is the same
 * mistake as a Bosphorus song over Nevşehir or plane trees on the plateau.
 *
 * Deliberately not random: a child who leaves and comes back should find the
 * same morning. Size does the work — one model at ten scales, heights and
 * distances reads as a sky, where ten identical ones read as one copied.
 */
function balloonSky(cityId, stopPositions) {
  if (cityId !== 'nevsehir') return [];

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
    /**
     * Over the street, not out on the horizon.
     *
     * These used to start thirty-four metres past the last stop and run out to
     * a hundred and ninety-six, at heights up to sixty. From the street that is
     * a row of specks near the top of the sky, and the owner could not tell
     * what they were.
     *
     * They now begin *behind* the walk and cross above it: the first four are
     * within thirty metres of the street at twenty to thirty metres up, which
     * is close enough that a child looking straight ahead has one in view, and
     * near enough overhead to read as a basket with people in it. The far ones
     * stay to give the sky depth.
     *
     * x, distance ahead of the last stop, height, scale.
     */
    // The two lines that come in over the chimneys.
    [-31, -52, 19, 2.1], [-26, -20, 23, 1.95], [-16, 8, 26, 1.75], [-4, 34, 29, 1.5],
    [30, -38, 20, 2.0], [25, -6, 24, 1.8], [14, 22, 27, 1.55], [2, 52, 31, 1.3],
    /**
     * And a few still far out over the valley, small with distance.
     *
     * Without them the sky is eight balloons all the same size at the same
     * remove, which reads as one balloon copied — the exact fault the layout was
     * written to avoid. A Cappadocian morning has them at every distance; these
     * are the ones that have not arrived yet.
     */
    [-44, 96, 38, 0.8], [36, 128, 45, 0.62], [-12, 168, 52, 0.45], [22, 208, 58, 0.34],
  ];
  const specs = layout.map(([x, ahead, height, scale], i) => ({
    key: `balloon-${i}`,
    position: [x, height, Math.round((lastZ - ahead) * 10) / 10],
    scale,
    driftSpeed: 0.7 + ((i * 7) % 5) * 0.18,
    phase: Math.round(i * 1.37 * 100) / 100,
  }));

  // Two close enough to read as balloons rather than dots on the horizon.
  // Two low over the walk itself, close enough to look up at.
  specs.push(
    { key: 'balloon-near-a', position: [-11, 17, Math.round((firstZ - 8) * 10) / 10], scale: 2.4, driftSpeed: 0.62, phase: 0.4 },
    { key: 'balloon-near-b', position: [13, 19, Math.round((lastZ + 16) * 10) / 10], scale: 2.2, driftSpeed: 0.85, phase: 2.1 },
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
      skyPreset: CITY_PALETTE[canonical.id]?.sky ?? region.sourceVisual.sky,
      groundColor: CITY_PALETTE[canonical.id]?.ground ?? region.sourceVisual.ground,
    },
    guide: {
      /**
       * Which guide walks this city.
       *
       * Canonical carries a `legacyGuideId` and it is the default, because the
       * source assigned one to all eighty-one provinces. Where the project has
       * since decided otherwise, the decision is recorded here rather than by
       * editing canonical — the same reasoning that corrects a delivered
       * material in the registry instead of rewriting the GLB (D-019).
       *
       * Kars is the first: the source gives it Keloğlan and it gets the Hodja.
       * That also means the pilot is no longer three Keloğlan cities and one
       * Hodja city — two each, which is the first real test of the rule that a
       * city loads exactly one hero and never preloads the other.
       */
      assetId: GUIDE_OVERRIDES[canonical.id] ??
        (canonical.legacyGuideId === 'keloglan'
          ? 'character_keloglan_base'
          : 'character_nasreddin_hoca_base'),
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
    props: [
      ...streetProps(canonical.id, stopPositions, geometry),
      ...streetTreeProps(canonical.id, stopPositions, geometry),
    ],
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
    groundSurface: CITY_SURFACE[canonical.id] ?? REGION_SURFACE[canonical.regionId] ?? 'cobblestone',
    /**
     * Grass under the geese, and nowhere else.
     *
     * Derived from where the flock actually stands rather than written as a
     * coordinate, so the two cannot drift apart: move the birds and the grass
     * moves with them. Eight metres across, which covers three geese and a
     * little room around them.
     */
    /**
     * Grass under the geese, and bare rock everywhere else.
     *
     * Centred on the flock rather than written out by hand, so the turf follows
     * the birds if they move. A little wider than they are spread, so they
     * stand inside it instead of on its edge.
     */
    groundPatches: gooseFlock(canonical.id, stopPositions)
      .map((bird) => bird.position)
      .slice(0, 1)
      .map(([x, , z]) => ({
        position: [x, 0, Math.round((z - 2.2) * 10) / 10],
        radius: 7.5,
        surface: 'grass',
        color: '#8C9A5B',
      })),
    /**
     * Balloons cross the sky over every city, and crowd it over Cappadocia.
     *
     * They answer the front of a street the way the sea does in İstanbul: with
     * distance rather than a wall. Nevşehir gets the full sky because that is
     * the image of the place; elsewhere a few pass over, which is enough to make
     * a sky look like weather rather than paint.
     */
    balloons: balloonSky(canonical.id, stopPositions),
    /**
     * Three paragliders over Ordu, and they come off Boztepe.
     *
     * That hill is a launch site: people run off the top of it and circle down
     * over the town, which is the other half of what it is for — the cable car
     * takes them up and this is what comes back down.
     *
     * Three attempts and the lesson is about the camera, not about height.
     * 23 to 34 m put them among the rooftops. 42 to 58 over the street put them
     * out of frame — a child walking down a street does not look ninety degrees
     * up. Over Boztepe at 37 to 44 they were behind the child for the whole
     * walk.
     *
     * And the drift was what actually hid them. A balloon wanders forty-five
     * metres either side, which suits a valley and does not suit a street:
     * these were placed within thirty metres of the walk and carried ninety
     * across, so wherever they were put they spent most of the time outside the
     * frame. They wander eight to eleven metres now.
     *
     * And the angle that matters is not "shallow enough to be in shot" by
     * eye — it is measured off the camera. The follow camera sits 2.3 m up,
     * 5.2 m back, and looks at the guide's chest, so it tilts **down** by
     * twelve degrees; with a fifty degree vertical field that puts the top of
     * the frame just **thirteen degrees above horizontal**. Every placement so
     * far sat between 27° and 47°, which is to say above the picture.
     *
     * These fly between eight and eleven degrees and **down the middle of the
     * street**, between the two rows of houses rather than beside them. At ten
     * metres a canopy is level with an eleven metre roof: out over the rows it
     * would be tangled in them, and down the centre it is framed by them.
     *
     * A canopy is 6.4 m across at this scale and the street is 21.8 m between
     * the house fronts, so the wander is four metres rather than nine — three
     * of them abreast have to fit in a gap narrower than any of the earlier
     * placements assumed. These sit at twenty to
     * twenty-five metres, thirty to fifty out, ahead and to the sides — between
     * twenty-five and thirty-five degrees up, which is a glance rather than a
     * craned neck. They have come off Boztepe and are drifting out over the
     * town, which is what paragliders there actually do.
     *
     * They use the balloon's motion, which is already drift, lift and lean; a
     * canopy hanging in the air and a balloon hanging in the air are the same
     * problem.
     */
    paragliders:
      canonical.id === 'ordu'
        ? [
            { key: 'glider-0', position: [-4, 11, -44], scale: 1.2, driftSpeed: 1.3, phase: 0.4, driftAmplitude: 5 },
            { key: 'glider-1', position: [4, 12, -50], scale: 1.15, driftSpeed: 1.05, phase: 2.2, driftAmplitude: 5 },
            { key: 'glider-2', position: [-1, 10, -42], scale: 1.05, driftSpeed: 1.5, phase: 4.1, driftAmplitude: 5 },
          ]
        : [],
    /**
     * The tram runs the length of the street on the west side, clear of the
     * walk. İstanbul's nostalgic tram does one street, up and down, all day.
     */
    tramLine:
      canonical.id === 'istanbul' ? { from: [-15.5, 20], to: [-15.5, -100] } : null,
    /**
     * The Eastern Express runs past Kars and does not stop for long.
     *
     * On the east side at x = 16, just outside the fifteen metre play area, so
     * the child can watch it and never walk on to the track — the same place
     * İstanbul's tram sits on the other side of the country. Both ends of the
     * line are well off the map: it is never seen to appear or vanish, it
     * arrives from behind the child, crosses the whole city and is gone.
     *
     * A hundred and eighty metres end to end at eleven metres a second, so a
     * pass takes about sixteen seconds and the next one is fifteen seconds
     * after that.
     */
    /**
     * The Eastern Express crosses the plain behind the last stop.
     *
     * It used to run alongside the street at x = 16, parallel to the walk —
     * which put it beside and slightly behind the child the whole time, where
     * it was never once seen. Across is the answer: it now runs left to right
     * over the open ground past the gravyer stall, so it enters the view from
     * one edge, crosses everything the child is looking at, and leaves by the
     * other.
     *
     * Two hundred and eighty metres end to end, both ends far outside the map,
     * so it is never seen to appear or vanish.
     */
    /**
     * Three canoes on the lake, all crossing, none the same length or pace.
     *
     * A flat blue plane with an island on it is scenery. Boats moving across it
     * is a place where something happens, and that is the whole reason these
     * exist: a child should be able to see that the lake is something you go
     * *on*.
     *
     * Between the shore and Akdamar, so they cross the water *in front of* the
     * island rather than around and behind it: the church is the thing being
     * looked at and the boats are what is happening on the way to it.
     *
     * They cross the view rather than running along it — the lesson the Eastern
     * Express took two turns to learn (D-142).
     */
    /**
     * The ferry crosses the Bosphorus and goes, on the same clock as the
     * Eastern Express: in from off the map, across everything the child is
     * looking at, out the other side, fifteen seconds, again.
     *
     * It used to stand still on the water at z = -128 — a twenty metre boat
     * moored in the middle of a strait. Crossing is what a Bosphorus ferry
     * does, and it is the thing a child watching from the quay would see.
     */
    /**
     * Behind the Maiden's Tower, which stands at z = -146.
     *
     * The crossing was at -128, in front of it, so a twenty metre boat passed
     * between the child and the landmark. A ferry on the Bosphorus is seen
     * beyond the tower, not across it.
     */
    /**
     * The cable car, running from beside the street up the hill behind it.
     *
     * The tram's motion — out, pause, back — because that is what a cable car
     * does, and slower than a tram because it is climbing. It runs on the east
     * side clear of the walk, from the shore end up past the boundary towards
     * Boztepe.
     */
    /**
     * From the station to the hill, which is the journey the stop describes.
     *
     * It ran from nowhere to nowhere on the east verge before — a cabin sliding
     * along beside the street. Now it starts at the cable station at the shore
     * end of the walk and climbs to Boztepe behind the town, so a child
     * standing at stop two can watch the thing they have just read about leave
     * from the building in front of them and go where it says it goes.
     *
     * Started just off the station's east edge so the cabin is beside it and not inside it, and
     * it passes clear of the fifteen metre walking area on its way up.
     */
    /**
     * Bolu's chairlift is the same machine as Ordu's cable car and is doing a
     * different job: this one carries skiers up Kartalkaya, which is what stop
     * three is about. Ten chairs on the loop, one away every five seconds.
     */
    cableCarLine:
      canonical.id === 'bolu'
        ? { from: [21, -40], to: [27, 48] }
        : canonical.id === 'ordu' ? { from: [18, -54], to: [26, 44] } : null,
    ferryLine: canonical.id === 'istanbul' ? { from: [-190, -166], to: [190, -158] } : null,
    groundPad:
      canonical.id === 'trabzon'
        ? /**
           * Four at the back rather than two, so the paving reaches the
           * shoreline and the sea is drawn over its last two metres. The wide
           * pad Uzungöl needed went with it.
           */
          { x: 2, front: 2, back: 4 }
        : { x: 2, front: 2, back: 2 },
    boatLines: canonical.id === 'trabzon' ? trabzonBoatLines() : [],
    birdPaths: canonical.id === 'trabzon' ? TRABZON_BIRDS : [],
    mistBands: canonical.id === 'trabzon' ? TRABZON_MIST : [],
    canoeLines:
      canonical.id === 'van'
        ? [
            { from: [-46, VAN_SHORE_Z - 8], to: [30, VAN_SHORE_Z - 5], speed: 1.5 },
            { from: [38, VAN_SHORE_Z - 17], to: [-24, VAN_SHORE_Z - 21], speed: 1.1 },
            { from: [-52, VAN_SHORE_Z - 12], to: [46, VAN_SHORE_Z - 15], speed: 1.9 },
          ]
        : [],
    trainLine:
      canonical.id === 'kars'
        ? { from: [-140, KARS_TRACK_Z], to: [140, KARS_TRACK_Z] }
        : null,
    /**
     * Water starts past the play boundary, so a child can see it and never
     * walk into it. İstanbul opens on to the Bosphorus; Van opens on to the
     * lake, which is a different colour — Van is soda water and reads paler
     * and greener than the sea.
     */
    water:
      canonical.id === 'trabzon'
        ? TRABZON_SEA
        : canonical.id === 'istanbul'
        ? {
            centerX: 0,
            /**
             * The shoreline sits at the Maiden's Tower and stays there.
             *
             * Water is drawn over the ground now (D-154), so wherever its near
             * edge falls is where the sea appears to begin — and at z = -112,
             * the play boundary, it appeared to run up to the houses. The tower
             * stands at -146 and is an island: the shore belongs just in front
             * of it, at -142, which puts the tower in the water and the quay on
             * land.
             */
            centerZ: -232,
            width: 320,
            depth: 180,
            color: '#2E7FA8',
          }
        : canonical.id === 'van'
          ? {
            centerX: 0,
            /**
             * Derived from `VAN_SHORE_Z`, not typed in.
             *
             * This number has been changed by hand four times in as many turns
             * and the canoes were left on dry land twice by it. The shore, the
             * boats and the island now all come off the same constant, so they
             * cannot drift apart again.
             */
            centerZ: VAN_SHORE_Z - VAN_LAKE_DEPTH / 2,
            width: 420,
            depth: VAN_LAKE_DEPTH,
            color: '#3E93A0',
          }
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
    animal: ANIMAL_OVERRIDES[canonical.id] ?? REGION_ANIMAL[canonical.regionId] ?? 'cat',
    // The routes have to be generated for the animal that actually walks them:
    // a dog's run is not a cat's beat, and reading the region default here
    // would have given Gaziantep's dogs the cats' five short hops.
    catRoutes: animalRoutes(
      stopPositions,
      geometry,
      ANIMAL_OVERRIDES[canonical.id] ?? REGION_ANIMAL[canonical.regionId] ?? 'cat',
      metrics,
    ),
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
