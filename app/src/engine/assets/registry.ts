import { MANIFEST_ENTRIES, type ManifestEntry, type ManifestFallbackShape } from '@/engine/assets/generated-manifest';
import { assetUrl } from '@/engine/assets/assetHost';

export type QualityTier = 'low' | 'medium' | 'high';
export type PlaceholderShape = ManifestFallbackShape;

/**
 * Props delivered outside the Meshy pilot manifest.
 *
 * `asset-manifests/pilot-assets.csv` is the brief for the three pilot cities and
 * is not a record of what has shipped. Reusable street props live here, with
 * measurements taken from the delivered file rather than from its delivery note.
 */
export interface DeliveredProp {
  readonly id: string;
  readonly modelUrl: string;
  readonly checksum: string;
  readonly triangles: number;
  readonly transferBytes: number;
  /** Width, height, depth of the delivered model, in metres. */
  readonly dimensions: readonly [number, number, number];
  readonly label: string;
  readonly color: string;
  readonly placeholder: PlaceholderShape;
  /**
   * Footprint pieces, for an object that is solid in places and open in others.
   *
   * A collider is normally one rectangle covering the whole of `dimensions`,
   * which is right for anything you walk round and wrong for anything you walk
   * through. A gate is two piers with a gap; so is an archway, a colonnade, and
   * most of what is left standing at Ani.
   *
   * Offsets and half-extents are in the object's own metres, measured from its
   * centre, on the unrotated model. The scene builder turns them with the
   * object.
   */
  readonly colliderParts?: readonly ColliderPart[];
  readonly notes?: string;
}

/** One rectangle of a multi-part footprint, in object-local metres. */
export interface ColliderPart {
  readonly offsetX: number;
  readonly offsetZ: number;
  readonly halfWidth: number;
  readonly halfDepth: number;
}

/**
 * Whether a prop's own file is treated as delivered art rather than a stand-in.
 *
 * Not a statement about scale any more. Every mounted model is scaled to its
 * recorded height, delivered or not, because that number is what the layout was
 * built from (D-120). What still differs is that a delivered prop is drawn from
 * its file and a briefed one from a placeholder shape.
 */
export function trustsModelScale(entry: AssetEntry): boolean {
  return entry.manifest.status === 'delivered';
}

const DELIVERED_PROPS: readonly DeliveredProp[] = [
  {
    id: 'kit_street_lamp',
    modelUrl: '/assets/props/kit_street_lamp.glb',
    checksum: '0af61f66a9d80c92ed1bcbafd7d55f73877b0fc6027d041f1905c5c303677ff1',
    triangles: 1_834,
    transferBytes: 1_371_280,
    dimensions: [1.25, 5.0, 1.1],
    label: 'Street lamp',
    color: '#3B4A42',
    placeholder: 'cylinder',
    notes:
      'Optimised re-export: 8.36 MB to 1.31 MB at 1024 textures, and re-authored ' +
      'at 5 m. The mesh node carries a +2.5 m translation, so the root origin is ' +
      'already on the ground.',
  },
  {
    id: 'kit_anatolian_horse',
    modelUrl: '/assets/props/kit_anatolian_horse.glb',
    checksum: '7d705dc0a79764cdbf9ed8bbd1bda079bebefb3b20f995243bb84f2f41f33e77',
    triangles: 9_165,
    transferBytes: 753444,
    /**
     * Cappadocia is named for horses — *Katpatuka*, the land of beautiful
     * horses — so a Nevşehir street without them is missing the thing the place
     * is called after.
     *
     * Skinned, 27 joints, and authored with the same 0.01 armature scale as the
     * cat, so it renders about 1.6 cm tall until the engine measures it.
     */
    dimensions: [0.72, 2.4, 2.97],
    label: 'Anatolian horse',
    color: '#8B5A3C',
    placeholder: 'box',
    notes:
      'Delivered 4.93 MB at 10,311 triangles with a 2048 PNG; simplified to ' +
      '9,165 and 0.72 MB with the 27-joint rig and its walk clip intact.',
  },
  {
    id: 'kit_street_cat',
    modelUrl: '/assets/props/kit_street_cat_walking.glb',
    checksum: '590fcd80e91cddd6c91af9abfd4c326769e20f363618da921bd59f8b3dc40806',
    triangles: 7_199,
    transferBytes: 579884,
    dimensions: [0.45, 0.6, 1.05],
    label: 'Street cat',
    color: '#B8A48A',
    placeholder: 'box',
    notes:
      'Skinned, 27-joint quadruped with a 1 s Walking clip. Delivered at 19,303 ' +
      'triangles against a 800-1,500 brief. Five cats were 96,515 triangles — ' +
      'more than the guide — so it was simplified to 7,199. Dressing, so it has ' +
      'no collider.',
  },
  {
    id: 'city_istanbul_galata_tower',
    modelUrl: '/assets/city/city_istanbul_galata_tower.glb',
    checksum: '3800f6e11430182b74f1b5c74e7d8c837c4966ba200dd3cd53529d62c7f3e40c',
    triangles: 7_003,
    transferBytes: 2_814_596,
    // Authored at 14 m with its base on y = 0, so nothing is scaled or lifted.
    dimensions: [4.28, 14.0, 4.28],
    label: 'Galata Tower',
    color: '#C9BBA1',
    placeholder: 'cylinder',
    notes:
      'Third version. The first optimisation cut to 34,313 triangles with 448 px ' +
      'textures and welded across UV seams; the tower rendered white and lost its ' +
      'silhouette. This one carries its detail in texture instead of geometry: ' +
      '7,003 triangles with a 2048 colour map and 1024 for the rest, 23.09 MB ' +
      'down to 2.68 MB. Delivered already at the agreed 14 m and grounded.',
  },
  {
    id: 'city_nevsehir_fairy_chimney_cluster',
    modelUrl: '/assets/city/city_nevsehir_fairy_chimney_cluster.glb',
    checksum: 'bf6b6a224a3f3aecb144bff6c5ec29080b98d21a6fd315b8f10751f0c6c103e8',
    triangles: 10_391,
    transferBytes: 2409920,
    /**
     * Stop 1, so it is scaled to be walked up to rather than looked at across a
     * valley. Its own proportions at 6 m: the same file dressed larger becomes
     * the ridge on the horizon.
     */
    dimensions: [6.5, 4.5, 5.0],
    label: 'Fairy chimneys',
    color: '#D8C39C',
    placeholder: 'cylinder',
    notes: 'Delivered 21.18 MB with 4096 px maps; recompressed to 2.30 MB. Double-sided kept.',
  },
  {
    id: 'city_nevsehir_chimney_ridge',
    modelUrl: '/assets/city/city_nevsehir_chimney_ridge.glb',
    checksum: 'bf6b6a224a3f3aecb144bff6c5ec29080b98d21a6fd315b8f10751f0c6c103e8',
    triangles: 10_391,
    transferBytes: 2409920,
    /**
     * The same chimneys at 17 m, closing both sides of the street the way the
     * Beyoğlu rows close İstanbul's. One file, fetched once, drawn at two sizes.
     */
    dimensions: [24.7, 17.0, 19.0],
    label: 'Fairy chimney ridge',
    color: '#D8C39C',
    placeholder: 'box',
    notes: 'Same source as the stop-1 cluster, dressed as horizon.',
  },
  {
    id: 'city_nevsehir_underground_stone_door',
    modelUrl: '/assets/city/city_nevsehir_underground_stone_door.glb',
    checksum: 'f635ac91b1bdf0f4f811847b5177212037f621efc401ff7e6baa4e64d0305075',
    triangles: 10_333,
    transferBytes: 1697396,
    // Stop 3, so child-scale: something to walk up to and stand beside.
    dimensions: [3.9, 3.0, 3.82],
    label: 'Derinkuyu stone door',
    color: '#C6B393',
    placeholder: 'box',
    notes:
      'Delivered 19.70 MB with 4096 px maps; recompressed to 2.4 MB. Kept ' +
      'double-sided — the millstone disc has thin carved edges.',
  },
  {
    id: 'city_nevsehir_carpet_loom',
    modelUrl: '/assets/city/city_nevsehir_carpet_loom.glb',
    checksum: 'dec522e9a0ca8e0fe52d2798aba74444143cf7bfd1c1bf31eb205934b3f82638',
    triangles: 9_796,
    transferBytes: 2881920,
    dimensions: [2.06, 2.4, 1.27],
    label: 'Kilim loom',
    color: '#A8402F',
    placeholder: 'box',
    notes:
      'Double-sided matters here more than anywhere: the warp threads and the ' +
      'hanging kilim are single planes, and culling their back faces would draw ' +
      'half a carpet. 25.70 MB down to 2.4 MB.',
  },
  {
    id: 'city_nevsehir_pottery_wheel',
    modelUrl: '/assets/city/city_nevsehir_pottery_wheel.glb',
    checksum: 'a861dd2e6647c3f4798bfdcc728573d1cbcdab0007382b9484a6446726f1c34b',
    triangles: 10_173,
    transferBytes: 882432,
    // The smallest stop object in the project, and the one a child gets closest
    // to — which is why its colour map is 1024 and not 2048.
    dimensions: [1.38, 1.4, 1.35],
    label: 'Avanos pottery wheel',
    color: '#B4633C',
    placeholder: 'box',
    notes: 'Delivered 22.87 MB with 4096 px maps; recompressed to 0.9 MB.',
  },
  {
    id: 'city_gaziantep_stone_houses',
    modelUrl: '/assets/city/city_gaziantep_stone_houses.glb',
    checksum: 'f01bc372d81705aa7b2cf1f7d243a603e9ae5b3e4ebe87141ca23d9fed78f61f',
    triangles: 9_963,
    transferBytes: 2767072,
    dimensions: [20.7, 12.0, 12.0],
    label: 'Antep stone houses',
    color: '#CBB187',
    placeholder: 'box',
    notes: 'Backdrop. Delivered 25.85 MB; recompressed to 2.64 MB.',
  },
  {
    id: 'city_gaziantep_castle',
    modelUrl: '/assets/city/city_gaziantep_castle.glb',
    checksum: 'fd30cc479284a53df5529477a04bdaeae83b5eeca7e6b80484cc449759e5c06f',
    triangles: 10_200,
    transferBytes: 2678220,
    /**
     * What a child turns round to see, where İstanbul has Hagia Sophia and
     * Nevşehir has its valley. The mound is most of the silhouette.
     */
    dimensions: [36.8, 18.0, 37.0],
    label: 'Gaziantep Castle',
    color: '#C4B091',
    placeholder: 'box',
    notes: 'Backdrop. Delivered 23.93 MB; recompressed to 2.55 MB.',
  },
  {
    id: 'city_gaziantep_zeugma_mosaic_panel',
    modelUrl: '/assets/city/city_gaziantep_zeugma_mosaic_panel.glb',
    checksum: 'cc1ae0d452cfbf9c28963cc9a3f2fc1f90d3285ee68a1e09694a358e1505a3ff',
    triangles: 9_995,
    transferBytes: 2310484,
    /**
     * The one stop in the project whose colour map stays at 2048.
     *
     * Everywhere else resolution follows how much of the screen an object
     * covers, which would put a 2.2 m panel at 1024. A mosaic is different:
     * its subject is the tesserae, and at 1024 the individual stones stop
     * being stones and the face becomes a smear of colour.
     */
    dimensions: [1.82, 2.2, 0.69],
    label: 'Zeugma mosaic panel',
    color: '#C96A2B',
    placeholder: 'box',
    notes:
      'Delivered 26.17 MB at 4 m tall with four maps, two of them 4096. ' +
      'Re-authored to the agreed 2.2 m and recompressed to 2.20 MB.',
  },
  {
    id: 'city_gaziantep_baklava_counter',
    modelUrl: '/assets/city/city_gaziantep_baklava_counter.glb',
    checksum: 'c6938b6c0ea99e9663a8dca67cc11b30bc4ed63a9eee6c79cd15e0111a51fb42',
    triangles: 9_520,
    transferBytes: 813064,
    /**
     * A counter seen from the customer's side, so a child stands in front of
     * it rather than walking round it: 2.26 m of frontage against 0.86 m of
     * depth, which is what the trigger ring is sized from.
     */
    dimensions: [2.26, 1.3, 0.86],
    label: 'Baklava counter',
    color: '#4CAF7D',
    placeholder: 'box',
    notes:
      'Double-sided kept for the glass front, which is a single plane — ' +
      'culling its back face would draw half a display case. Delivered ' +
      '21.49 MB at 2 m tall; re-authored to 1.3 m and recompressed to 0.78 MB.',
  },
  {
    id: 'city_gaziantep_coppersmith_workbench',
    modelUrl: '/assets/city/city_gaziantep_coppersmith_workbench.glb',
    checksum: '8346079f7ff37c515ed24e2a1b6061167b8c80594c277df1ac929b719c6faac3',
    triangles: 10_007,
    transferBytes: 817128,
    /**
     * Deeper than the brief asked for — 1.65 m against 1.0 — because the wall
     * board of finished copper stands behind the bench rather than on it. The
     * footprint follows the file, so the ring and the camera clear the whole
     * workshop instead of only its front edge.
     */
    dimensions: [2.18, 1.9, 1.65],
    label: "Coppersmith's workbench",
    color: '#B87333',
    placeholder: 'box',
    notes:
      'Delivered 23.09 MB at 2 m tall, buried 1 m below the origin. ' +
      'Re-authored to 1.9 m standing on y = 0, recompressed to 0.78 MB.',
  },
  {
    id: 'city_gaziantep_bazaar_gate',
    modelUrl: '/assets/city/city_gaziantep_bazaar_gate.glb',
    checksum: '975f71257332d952385a46549fecbc9bed91816b6fe713d5883ffba3107e1c83',
    triangles: 10_007,
    transferBytes: 2169636,
    /**
     * Named for what is in the file, not for what the file is called.
     *
     * It was delivered as `Gateway to the Desert`. What it contains is a
     * limestone gate with a pointed arch, crenellations and wall lanterns, and
     * a covered bazaar behind the opening — awnings, steps, tables. There is no
     * desert in it. The owner's two renders are the evidence; measurement alone
     * would not have settled it, which is the whole lesson of D-078 and D-117.
     *
     * The archway runs along the model's Z axis: at doorway height the vertices
     * fall into two clusters either side of a gap in X, and are continuous
     * through Z. So at rotationY = 0 the opening faces down the street rather
     * than across it — the check the tram did not get (D-087).
     */
    dimensions: [6.72, 6.0, 5.9],
    label: 'Bazaar gate',
    color: '#D6C3A0',
    placeholder: 'box',
    /**
     * Two piers and the passage between them, measured rather than guessed.
     *
     * At the height a child walks through, the vertices fall into two dense
     * clusters with an empty band between them: stone from the west edge in to
     * x = -0.84, nothing across to x = +0.84, stone again out to the east edge.
     * So each pier is 2.52 m of the 6.72 m frontage and the opening is 1.68 m.
     *
     * Against a player radius of 0.45 m that leaves 0.78 m of walking room —
     * narrow, and deliberately so. A gate a child has to aim at is a gate; one
     * they drift through is a doorway-shaped decoration.
     */
    colliderParts: [
      { offsetX: -2.1, offsetZ: 0, halfWidth: 1.26, halfDepth: 2.95 },
      { offsetX: 2.1, offsetZ: 0, halfWidth: 1.26, halfDepth: 2.95 },
    ],
    notes:
      'Delivered 24.61 MB with two 4096 maps; recompressed to 2.07 MB. Left at ' +
      'the 6 m it arrived at: that is the exporter s number rather than an ' +
      'authored one, but a 6 m gate with a 2.4 m opening is what this should be ' +
      'beside a 1.45 m guide.',
  },
  {
    id: 'city_kars_ani_carved_doorway',
    modelUrl: '/assets/city/city_kars_ani_carved_doorway.glb',
    checksum: '44f266ecaf83f1938acce72e333e09f9085e39e24d38483c878bb10699da5745',
    triangles: 10_119,
    transferBytes: 1831524,
    /**
     * Stop one, and a doorway a child walks through rather than up to.
     *
     * Left at the 5 m it arrived at instead of the briefed 3.2. The brief was
     * written before anyone knew this would be walked through, and the opening
     * is a fixed 37.5% of the width: at 3.2 m tall it would be 0.86 m, which is
     * less than a child with a 0.45 m radius can fit through at all. Five
     * metres is also what a church portal at Ani is, and it stays inside the
     * one-to-five-metre rule for a stop object by exactly nothing.
     *
     * 2048 on the colour map despite the size, for the same reason the Zeugma
     * panel keeps it: the interlace carving is the subject, and at 1024 it
     * becomes a smudge.
     */
    dimensions: [3.57, 5.0, 1.06],
    label: 'Ani carved doorway',
    color: '#8A6248',
    placeholder: 'box',
    /**
     * Measured. At walking height the vertices leave the middle 37.5% of the
     * width empty, so each pier is 1.12 m of the 3.57 m frontage and the
     * opening is 1.34 m — 0.44 m of walking room, the same as the Kapalıçarşı.
     */
    colliderParts: [
      { offsetX: -1.23, offsetZ: 0, halfWidth: 0.56, halfDepth: 0.53 },
      { offsetX: 1.23, offsetZ: 0, halfWidth: 0.56, halfDepth: 0.53 },
    ],
    notes: 'Delivered 18.81 MB buried 2.5 m; re-authored on y = 0, 1.75 MB.',
  },
  {
    id: 'city_kars_eastern_express_platform',
    modelUrl: '/assets/city/city_kars_eastern_express_platform.glb',
    checksum: '517eae4f658900df6fe269f3353fabaaf24d7b284050ccf2773355568be91df6',
    triangles: 9_332,
    transferBytes: 802960,
    /**
     * Stop two. The platform stands still; the train is a separate object that
     * passes it, which is what a station is — the ferry terminal stood in for
     * the ferry the same way, except that here the ferry turned up too (D-068).
     */
    dimensions: [5.45, 3.4, 3.47],
    label: 'Eastern Express platform',
    color: '#5C6B78',
    placeholder: 'box',
    notes: 'Delivered 23.27 MB buried 2 m; re-authored to 3.4 m on y = 0, 0.77 MB.',
  },
  {
    id: 'city_kars_gravyer_stall',
    modelUrl: '/assets/city/city_kars_gravyer_stall.glb',
    checksum: '17693d1a047a4fbfdc13ef2a86cba713e487eacf693814520fdf18ee656ad880',
    triangles: 9_409,
    transferBytes: 811356,
    /**
     * Stop three. Raised to 2.2 m rather than the briefed 1.6: the brief
     * described a counter and what arrived is a stall with a canopy over it,
     * and 1.6 m would have put the awning at the guide's shoulder. The briefed
     * width of 2.2 m is what it comes out at.
     */
    dimensions: [2.21, 2.2, 1.19],
    label: 'Gravyer stall',
    color: '#C9A227',
    placeholder: 'box',
    notes: 'Delivered 21.95 MB buried 1.5 m; re-authored to 2.2 m on y = 0, 0.77 MB.',
  },
  {
    id: 'city_kars_eastern_express',
    modelUrl: '/assets/city/city_kars_eastern_express.glb',
    checksum: 'd1a971094165992ad42cf0f091af02391efe5fc57912b9caeefbb2eb87774a1a',
    triangles: 10_049,
    transferBytes: 912896,
    /**
     * The locomotive itself, which is not a stop and not scenery: it crosses
     * the city and leaves.
     *
     * Twenty metres long at 3.6 m tall. A real DE 33 000 is eighteen and a half
     * by four and a quarter, so this is a little long for its height — that is
     * the file's own proportion and it is left alone, because scaling to match
     * the real ratio would have meant squashing it on one axis.
     */
    dimensions: [20.01, 3.6, 2.96],
    label: 'Eastern Express locomotive',
    color: '#1F4E79',
    placeholder: 'box',
    notes: 'Delivered 24.42 MB buried 1.5 m; re-authored to 3.6 m on y = 0, 0.87 MB.',
  },
  {
    id: 'kit_van_cat',
    modelUrl: '/assets/props/kit_van_cat.glb',
    checksum: '71e435df94ad99948f9e034adc8d4bfee6d7ff1736a52d675b0d1c8457aff007',
    triangles: 10_418,
    transferBytes: 613552,
    /**
     * A Van cat: white, long-haired, one eye blue and one amber.
     *
     * No skin and no animation, like the four geese before it, so it is placed
     * as dressing rather than walked (D-129). That is not a compromise here —
     * the city's one question is *What makes the Van cat special?* and the
     * answer is the eyes, which a child reads standing still.
     *
     * 0.55 m tall against the street cat's 0.6: the same storybook scale, a
     * little smaller because this one stands rather than prowls.
     */
    dimensions: [0.2, 0.55, 0.76],
    label: 'Van cat',
    color: '#F4F1EA',
    placeholder: 'box',
    notes: 'Delivered 13.37 MB with a 2048 colour map; recompressed to 0.59 MB.',
  },
  {
    id: 'city_van_akdamar_jetty',
    modelUrl: '/assets/city/city_van_akdamar_jetty.glb',
    checksum: 'f0549fa32407481793213d9b036dcffaa1f5c8271d8769cea5c1daa5555d25e6',
    triangles: 9_999,
    transferBytes: 965216,
    /**
     * Stop two: a wooden dock with a mooring post, and the boarding point for
     * Akdamar.
     *
     * A lake is not child-scale, so the jetty stands in for it — the third time
     * this project has answered that problem the same way: the terminal for the
     * ferry (D-068), the platform for the Eastern Express (D-135), the dock for
     * the island.
     */
    dimensions: [3.96, 1.8, 2.23],
    label: 'Akdamar jetty',
    color: '#8C6742',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 0.5 m; re-authored to 1.8 m on y = 0, 0.92 MB.',
  },
  {
    id: 'city_van_citadel_ridge',
    modelUrl: '/assets/city/city_van_citadel_ridge.glb',
    checksum: 'acaf903dcdfe338123c8dd44d9558cf727c633e1451b9c2c2fc2f0407e297a55',
    triangles: 10_410,
    transferBytes: 2320572,
    /**
     * The rock spine, back from retirement and in the right job.
     *
     * It was briefed for Van's sides and dropped when the townhouses arrived
     * (D-151), because a street wants a town along it. Beside the castle is
     * where it belongs: the citadel stands on a spine, and the spine carrying
     * on past the walls is what makes the castle look like part of the rock
     * rather than a model placed on flat ground.
     */
    dimensions: [26.92, 9.0, 8.44],
    label: 'Citadel ridge',
    color: '#A89880',
    placeholder: 'box',
    notes: 'Delivered 22.23 MB at 5 m buried 2.5 m; re-authored to 9 m on y = 0, 2.21 MB.',
  },
  {
    id: 'kit_stone_footbridge',
    modelUrl: '/assets/props/kit_stone_footbridge.glb',
    checksum: 'a2fdd9444aa563c14fc2860eda2eff60812f58c80c91ce23a3f63d8f92e342ff',
    triangles: 9_975,
    transferBytes: 825192,
    /**
     * A low stone footbridge, four metres across.
     *
     * Delivered without a place named for it. It is too small to be a bridge
     * over anything and too built to be a step, so it is used for what it
     * actually is: a raised stone crossing at the lake end of Van's street,
     * where the ground would run down to the shore. Shared, so another province
     * with a stream can have it.
     */
    dimensions: [4.1, 1.2, 1.95],
    label: 'Stone footbridge',
    color: '#9A9186',
    placeholder: 'box',
    notes: 'Delivered 23.29 MB at 0.5 m buried 0.25 m; re-authored to 1.2 m on y = 0, 0.79 MB.',
  },
  {
    id: 'city_bolu_chairlift_chair',
    modelUrl: '/assets/city/city_bolu_chairlift_chair.glb',
    checksum: 'c4eb7b8683082e01b72b3d005ddf76cabf2cb0caaa60e0b93d8bae841dc12e76',
    triangles: 9_956,
    transferBytes: 762404,
    /**
     * The chair on Bolu's lift, and the thing that stops Ordu's red gondola
     * being borrowed for a ski hill.
     *
     * Ten of them ride the loop, one away every five seconds (D-184). The line
     * has been running and drawing nothing since the city opened.
     */
    dimensions: [1.54, 1.9, 0.9],
    label: 'Chairlift chair',
    color: '#3F5B70',
    placeholder: 'box',
    notes: 'Delivered 1 m buried 0.5 m; re-authored to 1.9 m on y = 0, 0.73 MB.',
  },
  {
    id: 'kit_bolu_leaf_fall',
    modelUrl: '/assets/props/kit_bolu_leaf_fall.glb',
    checksum: 'f770f4abb1070327f0b92795e1cd17f4d517ee74f5bece4980515698487648cb',
    triangles: 10_093,
    transferBytes: 1147748,
    /**
     * A patch of fallen leaves, scattered the length of the street.
     *
     * The forest floor texture already draws leaf litter, and a texture is flat.
     * These sit on top of it and catch the light from the side, which is what
     * makes a drift of leaves look like leaves rather than like a pattern —
     * the same reason the cobbles have a bench and a lamp standing on them.
     *
     * Fourteen centimetres tall and a metre and a third across: a drift, not a
     * leaf. Shared, so any province with an autumn can have it.
     */
    dimensions: [1.35, 0.14, 1.34],
    label: 'Fallen leaves',
    color: '#B4632A',
    placeholder: 'plane',
    notes: 'Delivered 0.12 m; re-authored to 0.14 m, 1.09 MB.',
  },
  {
    id: 'city_bolu_forest_row',
    modelUrl: '/assets/city/city_bolu_forest_row.glb',
    checksum: 'a9e654587693d3977f647b976ecd6980614f9a8e41eed39c47ae1bc25fc57c8d',
    triangles: 9_704,
    transferBytes: 2780456,
    /**
     * Bolu's sides: firs standing dark behind beech that has turned.
     *
     * Forty-two metres across at thirteen tall, which is much wider than the
     * briefed twenty-six — the file's own proportion is 3.2 wide for every one
     * high and squashing it to the brief would have made a hedge of it. Wide
     * suits a forest edge: four of these a side close the street with two
     * fewer pieces than a town would need.
     */
    dimensions: [41.9, 13.0, 20.43],
    label: 'Autumn forest',
    color: '#B4632A',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 2 m; re-authored to 13 m on y = 0, 2.65 MB.',
  },
  {
    id: 'kit_bolu_fir',
    modelUrl: '/assets/props/kit_bolu_fir.glb',
    checksum: '585056e97a4e93da8ad12d1f19376be0b6ad191838fae84104832bccb4abef5f',
    triangles: 10_411,
    transferBytes: 1040304,
    /**
     * A single fir: nine metres tall and under five across.
     *
     * Every other tree in the project is round-crowned. A fir that is not
     * conspicuously conical reads as one of them, and Bolu stops looking like
     * a conifer forest — which is most of what it is.
     *
     * A `kit_` asset, so its cost is paid wherever it is planted: 0.99 MB,
     * under the 2 MB shared budget (D-036).
     */
    dimensions: [4.65, 9.0, 4.66],
    label: 'Fir',
    color: '#2F5233',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 2 m; re-authored to 9 m on y = 0, 0.99 MB.',
  },
  {
    id: 'city_bolu_kartalkaya_peak',
    modelUrl: '/assets/city/city_bolu_kartalkaya_peak.glb',
    checksum: '32a4b65cfd02cc688627ef35b57ade3c13c5918e06842b1721154f7ef7953f77',
    triangles: 10_381,
    transferBytes: 2540868,
    /**
     * Kartalkaya, snow on it while the valley below is still turning.
     *
     * Both are true of Bolu at once, and together they are what stops the
     * project's mountains blurring: Ordu's Boztepe is green to the summit,
     * Kars's Sarıkamış is bare rock, Van's Erek is scree. Four provinces, four
     * mountains, no two the same colour.
     */
    dimensions: [72.29, 30.0, 68.5],
    label: 'Kartalkaya',
    color: '#8FA6B5',
    placeholder: 'box',
    notes: 'Delivered 10 m buried 5 m; re-authored to 30 m on y = 0, 2.42 MB.',
  },
  {
    id: 'city_bolu_yedigoller_jetty',
    modelUrl: '/assets/city/city_bolu_yedigoller_jetty.glb',
    checksum: 'a83afdbd89b33b7e3cdb039f08930c0fc7efb34c9305373f0d0b052355458dd2',
    triangles: 10_214,
    transferBytes: 1077700,
    /**
     * Stop one: a piece of Yedigöller, pines and water together.
     *
     * The brief asked for a jetty with a rowing boat, on the reasoning that a
     * lake is not child-scale. What arrived is a small lake carrying its own
     * shore — the same answer Ordu's beach gave, and a better one: the child
     * walks up to the lake rather than to a structure beside it.
     *
     * 2.6 m, so a child sees over it to the water beyond.
     */
    dimensions: [8.51, 2.6, 9.0],
    label: 'Yedigöller',
    color: '#4A7C6B',
    placeholder: 'box',
    notes: 'Delivered 3 m buried 1.5 m; re-authored to 2.6 m on y = 0, 1.03 MB.',
  },
  {
    id: 'city_bolu_mengen_kitchen',
    modelUrl: '/assets/city/city_bolu_mengen_kitchen.glb',
    checksum: '9b57ac424ce6d838d4139040d1161d3d50336ae2e4a8b130ce9cca6df1c13a06',
    triangles: 9_785,
    transferBytes: 940384,
    /**
     * Stop two: the copper kitchen of a town famous for its cooks.
     *
     * Came out at very nearly the briefed size, which has happened twice now.
     */
    dimensions: [2.57, 2.4, 2.0],
    label: 'Mengen kitchen',
    color: '#B87333',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m; re-authored to 2.4 m on y = 0, 0.90 MB.',
  },
  {
    id: 'city_bolu_ski_lift_station',
    modelUrl: '/assets/city/city_bolu_ski_lift_station.glb',
    checksum: '35e15b62668e55f35520d04aa9a0911af254d3c958059bb6fd8fe59d318dafb0',
    triangles: 8_875,
    transferBytes: 2125792,
    /**
     * Stop three: the bottom station of the chairlift up Kartalkaya, and the
     * building the chairs on the line leave from.
     */
    dimensions: [7.1, 4.2, 7.05],
    label: 'Chairlift station',
    color: '#7C8FA0',
    placeholder: 'box',
    notes: 'Delivered 3 m buried 1.5 m; re-authored to 4.2 m on y = 0, 2.03 MB.',
  },
  {
    id: 'kit_bolu_deer',
    modelUrl: '/assets/props/kit_bolu_deer.glb',
    checksum: 'e2a524cc1f46155c75eab461aa07b7bc18e122108fd8ff0716d545cb1f9b7ba8',
    triangles: 31_258,
    transferBytes: 1677880,
    /**
     * A deer, rigged and walking on the first delivery — the third animal to
     * arrive that way after the two street dogs.
     *
     * **Three times the triangles of any other animal**: 31,258 against the
     * dogs' 10,300 and the geese's 10,000. Three of them cost 94,000, which is
     * more resident geometry than İstanbul's entire horizon. It is accepted for
     * now because the guides came down to 8,400 (D-168) and there is room, but
     * it is the single heaviest thing in Bolu and worth reducing if a lighter
     * export is ever cheap to ask for.
     *
     * Its clip is `Armature|Unreal Take|baselayer`, not `Walking`. There is only
     * one, so the fallback to the first clip is unambiguous — the same
     * situation as the dogs (D-133).
     */
    /**
     * Doubled from the briefed 1.4 m to 2.8 at the owner's word.
     *
     * A roe deer is 1.1 m at the shoulder and at that size it was a speck on a
     * forest street — the guide is 1.45 m and the trees are nine. This is a red
     * deer's height rather than a roe's, and the street reads better for it: at
     * child scale everything in this project is a little larger than life, and
     * an animal you cannot pick out is an animal that may as well not be there.
     */
    dimensions: [1.2, 2.8, 3.4],
    label: 'Deer',
    color: '#6B4A2F',
    placeholder: 'box',
    notes: 'Delivered 5.62 MB at armature scale; recompressed to 1.60 MB.',
  },
  {
    id: 'city_ordu_timber_houses',
    modelUrl: '/assets/city/city_ordu_timber_houses.glb',
    checksum: 'a95af8828b1989cb4c30b3ca9b372eb09057ca5b9081649d310e0706b260d9f9',
    triangles: 9_875,
    transferBytes: 2882420,
    /**
     * Ordu's sides: Black Sea houses, timber over stone, with the deep eaves
     * that coast builds against the rain.
     *
     * **Delivered one centimetre cubed** — 0.01 m on every axis, a Meshy
     * armature exported at centimetre scale. Nothing about the file said so
     * except the measurement, which is the whole reason every delivery is
     * measured before it is placed.
     */
    dimensions: [24.13, 11.0, 15.23],
    label: 'Ordu timber houses',
    color: '#8A6B47',
    placeholder: 'box',
    notes: 'Delivered 31.54 MB at 0.01 m; re-authored to 11 m, 2.75 MB.',
  },
  {
    id: 'city_ordu_boztepe_hill',
    modelUrl: '/assets/city/city_ordu_boztepe_hill.glb',
    checksum: '654db332aed1d9157b483e4d83f8f271f609a009811b7f1c4e9c5c3edf5209c7',
    triangles: 10_402,
    transferBytes: 2438080,
    /**
     * Boztepe, and green to the summit.
     *
     * Narrower than briefed — 44 m across rather than 78 — so it stands as a
     * pair rather than one plate, which suits it: Boztepe is a headland with a
     * shoulder, not a wall. Its palette confirms what it is without a look:
     * green outweighs red in the colour map, where Sarıkamış and Erek both run
     * the other way.
     */
    dimensions: [43.57, 26.0, 45.09],
    label: 'Boztepe',
    color: '#5E7A4A',
    placeholder: 'box',
    notes: 'Delivered 27.27 MB at 20 m buried 10 m; re-authored to 26 m on y = 0, 2.33 MB.',
  },
  {
    id: 'city_ordu_hazelnut_stall',
    modelUrl: '/assets/city/city_ordu_hazelnut_stall.glb',
    checksum: '792b6642d05ba238c4ad09fdfc3402c69549800e1c942b8dc37f5cb8cfc671f4',
    triangles: 9_563,
    transferBytes: 991264,
    /**
     * Stop one. More hazelnuts grow around Ordu than anywhere on the planet,
     * and this is the stall that says so.
     *
     * Two metres, which came out exactly as briefed for once — the delivered
     * file needed only lifting on to y = 0.
     */
    dimensions: [2.49, 2.0, 1.93],
    label: 'Hazelnut stall',
    color: '#8B6A3F',
    placeholder: 'box',
    notes: 'Delivered 25.94 MB at 2 m buried 1 m; re-authored on y = 0, 0.95 MB.',
  },
  {
    id: 'city_ordu_paraglider',
    modelUrl: '/assets/city/city_ordu_paraglider.glb',
    checksum: '853b3ddea165a78705a874b74984eb205d8f97cb1aa0144a5b6266f1549128ff',
    triangles: 10_053,
    transferBytes: 917040,
    /**
     * A paraglider, and Ordu's second moving thing.
     *
     * Boztepe is a launch site — people run off the top of it and circle down
     * over the town, which is the other half of what that hill is for. The
     * cable car takes them up and this is what comes back down.
     *
     * 4.5 m tall against a 2.4 m cable car: a canopy is large, and one drawn at
     * a person's size reads as a bird.
     */
    dimensions: [5.55, 4.5, 3.03],
    label: 'Paraglider',
    color: '#D95C34',
    placeholder: 'box',
    notes: 'Delivered 21.71 MB at 1.5 m buried 0.75 m; re-authored to 4.5 m on y = 0, 0.87 MB.',
  },
  {
    id: 'city_ordu_beach_front',
    modelUrl: '/assets/city/city_ordu_beach_front.glb',
    checksum: '19bdf58ab45aecd5f45e703ba904c0e7c719776261c98e0bb0e2b65f7a4039b6',
    triangles: 10_210,
    transferBytes: 913132,
    /**
     * Stop three: a strip of Ordu's Blue Flag coast, sand and water and all.
     *
     * This model has had four jobs and this is the one it was drawn for. It was
     * registered as stop three and swapped out for a wooden deck; became the
     * Altınordu seafront across the bay; went when the sea did (D-173); and was
     * re-registered as scenery — an entry that was then overwritten by the
     * plateau's, so for three turns the stop pointed at an id that did not
     * exist and a child got a red placeholder cube.
     *
     * Nine metres and a bit, which is large for a stop and right for this one:
     * it is a piece of coast, and the trigger ring is derived from the
     * footprint so it gets a wide one.
     */
    dimensions: [9.43, 2.6, 9.23],
    label: 'Ordu beach',
    color: '#C9BE96',
    placeholder: 'box',
    notes: 'Delivered 22.44 MB at 2 m; re-authored to 2.6 m, 0.87 MB.',
  },
  {
    id: 'city_ordu_beach_deck',
    modelUrl: '/assets/city/city_ordu_beach_deck.glb',
    checksum: '66fb7dcadc5c1c5572293cc8f7936a129dde1749990fee0572ff62af8a6feccf',
    triangles: 9_063,
    transferBytes: 941492,
    /**
     * Stop three, the Blue Flag beach.
     *
     * This id first pointed at the seaside diorama, which was the wrong file
     * for it: a twenty metre stretch of coast is scenery, not something a child
     * walks up to. That model is now `city_ordu_altinordu_seafront` and this is
     * the deck it was always supposed to be.
     *
     * Left at 1.6 m — a child has to see the sea over it, and anything taller
     * stands in front of the thing the stop is about.
     */
    dimensions: [4.29, 1.6, 4.44],
    label: 'Blue Flag beach',
    color: '#D9C9A3',
    placeholder: 'box',
    notes: 'Delivered 24.05 MB at 2 m buried 1 m; re-authored to 1.6 m on y = 0, 0.90 MB.',
  },
  {
    id: 'city_ordu_cable_station',
    modelUrl: '/assets/city/city_ordu_cable_station.glb',
    checksum: '1fdb26dd6a334d7a247298e7c7db845216e22074faf985cffd0320efc4a3ffc6',
    triangles: 8_639,
    transferBytes: 2214264,
    /**
     * Stop two: the bottom station of the cable car, standing at the shore end
     * of the street with the line running from it up to Boztepe.
     *
     * Nine metres across, which is the widest stop object in the project — a
     * station is a building rather than a piece of furniture, and the layout
     * derives its trigger ring from the footprint, so it gets a wide one.
     */
    dimensions: [9.01, 4.4, 8.91],
    label: 'Cable car station',
    color: '#7E8B93',
    placeholder: 'box',
    notes: 'Delivered 25.95 MB at 3 m buried 1.5 m; re-authored to 4.4 m on y = 0, 2.11 MB.',
  },
  {
    id: 'city_ordu_persembe_plateau',
    modelUrl: '/assets/city/city_ordu_persembe_plateau.glb',
    checksum: '84c964a75029e80f51e2186d3e025b58517a0d9efd12029cde7ef807855fab83',
    triangles: 10_366,
    transferBytes: 1623528,
    /**
     * Perşembe Yaylası, and Ordu no longer has a sea.
     *
     * The city ran out to water with the Altınordu seafront across the bay,
     * which was correct and read badly: a twenty-two metre plate on an infinite
     * blue plane floated like a raft, and the owner's screenshot shows exactly
     * that. The plateau replaces both. Ordu is a coast *and* a highland, and
     * the highland is the half a child can walk out into.
     *
     * A hundred and twenty-nine metres across at twenty-two tall. It was
     * eighty-two and it read as a floating disc: tilted, its near *top* corner
     * stood ten metres above eye level, so the child saw an object hanging in
     * the sky rather than land rising away. Half again as large, tipped less
     * and set into the ground, it becomes the horizon instead of a thing on it.
     */
    dimensions: [129.13, 22.0, 141.9],
    label: 'Perşembe plateau',
    color: '#6E8A52',
    placeholder: 'box',
    notes: 'Delivered 18.10 MB at 8 m buried 4 m; re-authored to 14 m on y = 0, 1.55 MB.',
  },
  {
    id: 'kit_ordu_hazelnut_grove',
    modelUrl: '/assets/props/kit_ordu_hazelnut_grove.glb',
    checksum: '254f2c073ca343b4bbc54a0f3d6bb5917ccf5ebb7ee18397a4f3a0d5d0e24d9e',
    triangles: 7_637,
    transferBytes: 1071668,
    /**
     * Hazelnut, and drawn as the multi-stemmed shrub it is rather than as a
     * round-crowned tree — which is what keeps Ordu's planting from becoming
     * generic greenery in the one city that is world champion at this.
     *
     * A `kit_` asset, so its cost is paid in every province that plants it:
     * under the 2 MB shared budget at 1.02 (D-036).
     */
    dimensions: [7.63, 4.4, 7.86],
    label: 'Hazelnut grove',
    color: '#6E8B4A',
    placeholder: 'box',
    notes: 'Delivered 28.99 MB at 1 m buried 0.5 m; re-authored to 4.4 m on y = 0, 1.02 MB.',
  },
  {
    id: 'city_ordu_cable_car',
    modelUrl: '/assets/city/city_ordu_cable_car.glb',
    checksum: '0d65a89175f56911b0b685c648793d29483443b7fbbe7d12c844c6cffe6aea12',
    triangles: 9_917,
    transferBytes: 821332,
    /**
     * The red cabin, and Ordu's one moving thing that is not an animal.
     *
     * Every city has one — İstanbul's tram and ferry, Kars's train, Van's
     * canoes, Cappadocia's balloons — and this one was already in the canonical
     * text: the cars glide from the seaside up to Boztepe. It runs the tram's
     * motion, which goes out, pauses and comes back, because that is what a
     * cable car does.
     */
    dimensions: [2.4, 2.4, 2.26],
    label: 'Cable car cabin',
    color: '#C4302B',
    placeholder: 'box',
    notes: 'Delivered 23.58 MB at 2 m; re-authored to 2.4 m, 0.78 MB.',
  },
  {
    id: 'city_van_canoe',
    modelUrl: '/assets/city/city_van_canoe.glb',
    checksum: '9714a4de5d2181ace518d98a68f7c34ec1a627980039e560ff1626b09dbb9a98',
    triangles: 9_953,
    transferBytes: 763404,
    /**
     * A wooden canoe, three of them out on the lake and all three moving.
     *
     * Left at the 5.07 m it arrived at, which is what a canoe is — the first
     * delivery in this project whose own scale needed no argument.
     *
     * They exist to say the lake is a lake you can be *on*. A flat blue plane
     * with an island on it is scenery; three boats crossing it is a place
     * something happens.
     */
    dimensions: [5.07, 1.0, 1.24],
    label: 'Canoe',
    color: '#9C6B43',
    placeholder: 'box',
    notes: 'Delivered 18.45 MB; recompressed to 0.73 MB. Scale as delivered.',
  },
  {
    id: 'kit_van_orchard',
    modelUrl: '/assets/props/kit_van_orchard.glb',
    checksum: 'afcacc1b4e5a38c3dc7637df4db39ac8b62c0d9fe9a476d724f9e5e264d03892',
    triangles: 6_974,
    transferBytes: 1094804,
    /**
     * Fruit trees, filling the ground between the townhouses.
     *
     * A `kit_` asset, so it is shared and its cost is paid in every province
     * that plants it — which is why it keeps a 1024 colour map and comes in
     * under the 2 MB shared budget (D-036).
     */
    dimensions: [9.85, 4.2, 9.79],
    label: 'Orchard',
    color: '#6E8B4A',
    placeholder: 'box',
    notes: 'Delivered 28.32 MB at 3 m; re-authored to 4.2 m, 1.05 MB.',
  },
  {
    id: 'city_van_townhouses',
    modelUrl: '/assets/city/city_van_townhouses.glb',
    checksum: '92bf3a7d66b83dfdee26d7fbfc3dcd24562b367012eabd3f6267447de4a22686',
    triangles: 10_059,
    transferBytes: 2332496,
    /**
     * Van's sides: mudbrick and stone townhouses with a bastion at one end.
     *
     * This replaced the citadel ridge the brief asked for. The ridge is the
     * right idea for Tushpa and the wrong one for a street — Van's walk is a
     * town, and the rock is what the town is built against rather than what it
     * is walled with.
     */
    dimensions: [26.7, 12.0, 15.34],
    label: 'Van townhouses',
    color: '#B49678',
    placeholder: 'box',
  },
  {
    id: 'city_van_castle',
    modelUrl: '/assets/city/city_van_castle.glb',
    checksum: '8f4bf028f12be6c09ec984c6230a16b5937112ec4bf1559e40d5e4ce75e9c9fd',
    triangles: 10_402,
    transferBytes: 2418704,
    /**
     * Van Kalesi, closing the back, with Erek behind and above it so the two
     * read as rock in front of mountain rather than as two walls.
     *
     * Fifty-nine metres across at sixteen tall: a citadel on a spine is long
     * rather than high, and one drawn tall and narrow would be a keep.
     */
    dimensions: [59.09, 16.0, 32.77],
    label: 'Van castle',
    color: '#B0A08C',
    placeholder: 'box',
  },
  {
    id: 'city_van_akdamar_island',
    modelUrl: '/assets/city/city_van_akdamar_island.glb',
    checksum: 'ed8767332527e0263ab022c6e5479bde602fe58ed681646651eb82557f876ad2',
    triangles: 10_239,
    transferBytes: 1920236,
    /**
     * Akdamar, and the piece of lake it came with.
     *
     * It stands past where the paving runs out, which is further than it looks:
     * the ground is drawn 44 m beyond the boundary and the water plane is drawn
     * below the ground, so anything nearer is an island in a car park. That is
     * why the lake looked missing — it was there, under the paving.
     */
    dimensions: [23.19, 11.0, 23.18],
    label: 'Akdamar island',
    color: '#4E7C86',
    placeholder: 'box',
  },
  {
    id: 'city_van_odd_eyed_cat',
    modelUrl: '/assets/city/city_van_odd_eyed_cat.glb',
    checksum: 'aaee758696487a3838b358c09818751ccf4ac5d382d2fa0ae0c96b862ecc6c0c',
    triangles: 10_418,
    transferBytes: 1112984,
    /**
     * Stop one: a white long-haired cat, one eye blue and one amber.
     *
     * 2048 on the colour map for an 80 cm object, for one reason — the city's
     * single question is *What makes the Van cat special?* and the answer is
     * those two eyes. They have to read from two metres. A basket is coming to
     * go under it; it stands on its own until then.
     */
    dimensions: [0.29, 0.8, 1.11],
    label: 'Van cat',
    color: '#F2F0EA',
    placeholder: 'box',
  },
  {
    id: 'city_van_breakfast_table',
    modelUrl: '/assets/city/city_van_breakfast_table.glb',
    checksum: '5ea69a0181f83b10bb1de2bc3f693f35a39bb3fad6eb3dcca65af7beebeaa799',
    triangles: 10_034,
    transferBytes: 1054212,
    /**
     * Stop three: a round tray table nearly three metres across.
     *
     * A Van breakfast is famous for the number of dishes on it, so this is wide
     * and low rather than tall — 1.3 m puts the tea glasses at about the height
     * of a child's chin.
     */
    dimensions: [2.93, 1.3, 2.92],
    label: 'Van breakfast',
    color: '#D9A441',
    placeholder: 'box',
  },
  {
    id: 'city_van_urartu_stele',
    modelUrl: '/assets/city/city_van_urartu_stele.glb',
    checksum: '5c4c6a2c45ff256580c91e9d25ed8c0a717dd3899aa95a588200ebb67c2edbff',
    triangles: 9_211,
    transferBytes: 2039060,
    /**
     * An Urartian stele, dressing the street rather than being a stop.
     *
     * None of Van's three stops is about Urartu: the second is Akdamar, whose
     * text is a 1,100-year-old island church and whose reward is a boat ticket.
     * Making this one would have a child read about a church and collect a boat
     * ticket in front of a cuneiform stone. Tushpa is everywhere underfoot in
     * Van and nowhere in the canonical stops, and dressing is where it belongs.
     */
    dimensions: [1.4, 2.6, 0.96],
    label: 'Urartian stele',
    color: '#8C8378',
    placeholder: 'box',
  },
  {
    id: 'city_kars_sarikamis_mountain',
    modelUrl: '/assets/city/city_kars_sarikamis_mountain.glb',
    checksum: '161248aa536fb19a42c0204b2528bdb95230591e1e5cebdd2e831f520bfab9fa',
    triangles: 10_445,
    transferBytes: 2486116,
    /**
     * Sarıkamış, standing behind the walls and closing the sky.
     *
     * The largest thing in the project: 109 m across and 34 m tall, against
     * walls of 14 and a cathedral of 15. That ratio is the point — the back of
     * Kars was pale blue nothing above the ruins, and a mountain that does not
     * tower over the buildings in front of it is a hill.
     *
     * Aligned by its near edge like every other landscape plate. It is 113 m
     * deep, so centring it on the boundary would put the whole city inside a
     * mountain (D-101).
     */
    dimensions: [109.36, 34.0, 113.46],
    label: 'Sarıkamış mountain',
    color: '#6E7B63',
    placeholder: 'box',
    notes: 'Delivered 25.94 MB at 15 m, buried 7.5 m; re-authored to 34 m on y = 0, 2.37 MB.',
  },
  {
    id: 'city_kars_ani_chapel',
    modelUrl: '/assets/city/city_kars_ani_chapel.glb',
    checksum: 'da32004c9ac737e2cd7ca6dca4bf570652c188fe11bb672770dbb954a567a8ab',
    triangles: 10_217,
    transferBytes: 979744,
    /**
     * The smallest of Ani's three ruins, and the one there are most of.
     *
     * Ani is not a skyline and its sides are not a wall. İstanbul closes its
     * street with rows of facades and Gaziantep with rows of houses because
     * those are streets; Ani has not had a street for eight hundred years, so
     * these stand apart with the plateau visible between them.
     */
    dimensions: [7.95, 9.0, 8.7],
    label: 'Ani chapel ruin',
    color: '#9E6A4E',
    placeholder: 'box',
    notes: 'Delivered 24.84 MB at 8 m, buried 4 m; re-authored to 9 m on y = 0, 0.93 MB.',
  },
  {
    id: 'city_kars_ani_church',
    modelUrl: '/assets/city/city_kars_ani_church.glb',
    checksum: '6ddabe75f579779b38d6167f8fc03333f71d4d050d46f7179268cc6756ba7ef4',
    triangles: 9_852,
    transferBytes: 1046344,
    /**
     * The second ruin, two metres taller than the chapel and a different
     * shape. Three distinct buildings turned out to be worth more than one
     * building rotated six ways, which is what the brief asked for.
     */
    dimensions: [8.8, 11.0, 11.78],
    label: 'Ani church ruin',
    color: '#A2745A',
    placeholder: 'box',
    notes: 'Delivered 26.42 MB at 8 m, buried 4 m; re-authored to 11 m on y = 0, 1.00 MB.',
  },
  {
    id: 'city_kars_ani_cathedral',
    modelUrl: '/assets/city/city_kars_ani_cathedral.glb',
    checksum: '75a81fd3a079b3a4698534862b5e0210c2b2b9795b8d4040294d3036887a6a38',
    triangles: 10_231,
    transferBytes: 2178408,
    /**
     * The one building at Ani larger than the rest, and the only one that
     * reads from anywhere on the site. Fifteen metres, so it stands over the
     * chapels by two thirds again — the delivered file was the widest of the
     * three in plan, which is why it is this one and not either of the others.
     */
    dimensions: [20.23, 15.0, 22.15],
    label: 'Ani cathedral',
    color: '#A67B5B',
    placeholder: 'box',
    notes: 'Delivered 25.01 MB at 8 m, buried 4 m; re-authored to 15 m on y = 0, 2.08 MB.',
  },
  {
    id: 'city_kars_ani_walls',
    modelUrl: '/assets/city/city_kars_ani_walls.glb',
    checksum: 'aa93cd4571095939503d1172dea2692eac75c08ac931de232da1f7adf60400f0',
    triangles: 9_486,
    transferBytes: 2057760,
    /**
     * What a child turns round to see, and the way in — where İstanbul has
     * Hagia Sophia, Nevşehir its valley rim and Gaziantep its castle.
     *
     * The first delivery of this arrived at **1,996,651 triangles and 78.61
     * MB**: ten times the guide, for a wall. It was not simplified in-project
     * and it was not integrated; it was sent back. This one is the same
     * building at 9,486.
     */
    dimensions: [30.96, 14.0, 20.71],
    label: 'Ani city walls',
    color: '#9C6B4F',
    placeholder: 'box',
    notes: 'Delivered 23.88 MB at 8 m, buried 4 m; re-authored to 14 m on y = 0, 1.96 MB.',
  },
  {
    id: 'city_kars_ani_gorge',
    modelUrl: '/assets/city/city_kars_ani_gorge.glb',
    checksum: 'd65a0da3843aaf818f582dda2221f4f0b82a106955ab630c70051a77d3de07f0',
    triangles: 10_402,
    transferBytes: 2298972,
    /**
     * Where the ground stops. The front, which İstanbul answers with sea and
     * Nevşehir with a valley.
     *
     * Sixty-four metres deep against forty-eight wide, so it is aligned by its
     * near edge and never by its centre — a plate this size centred on the
     * boundary puts the child inside the ravine, which is the mistake the
     * Nevşehir valley made first (D-101).
     */
    dimensions: [47.87, 12.0, 63.66],
    label: 'Arpaçay gorge',
    color: '#6E6A5C',
    placeholder: 'box',
    notes: 'Delivered 23.80 MB at 8 m, buried 4 m; re-authored to 12 m on y = 0, 2.19 MB.',
  },
  {
    id: 'kit_street_dog_tan',
    modelUrl: '/assets/props/kit_street_dog_tan.glb',
    checksum: 'dc3d56636e63d8a20dfc5eaa267641578a280ec2e2fa5b03319b8590f6300a7b',
    triangles: 10_297,
    transferBytes: 939440,
    /**
     * A tan street dog, and the first animal in the project that arrived
     * rigged and walking on the first delivery.
     *
     * Skinned with 27 joints, the same armature family as the cat and the
     * horse, and authored at armature scale — it measures nothing in bind pose
     * and is scaled to this height on mount, exactly as they are.
     *
     * Its one clip is named `Armature|Unreal Take|baselayer`, not `Walking`.
     * `StreetCat` prefers `Walking` and falls back to the first clip in the
     * file, which is right here because there is exactly one and no ambiguity
     * about which walk is meant. A second clip would make that fallback a
     * guess, and the file would need renaming before it arrived.
     */
    dimensions: [0.45, 0.83, 1.43],
    label: 'Street dog, tan',
    color: '#A67B4E',
    placeholder: 'box',
    notes: 'Delivered 5.46 MB with a 2048 colour map; recompressed to 0.90 MB.',
  },
  {
    id: 'kit_street_dog_dark',
    modelUrl: '/assets/props/kit_street_dog_dark.glb',
    checksum: '0afc645a079c3bf2484ec65891e9781d171ce8c589d4eada978f7a79b7263b7e',
    triangles: 10_448,
    transferBytes: 691132,
    /**
     * The second dog, nearly black where the first is caramel — mean colour
     * 37,30,25 against 98,73,54. Two of a kind read as a pair; four of one
     * would read as one dog copied.
     */
    dimensions: [0.45, 0.83, 1.43],
    label: 'Street dog, dark',
    color: '#3B322A',
    placeholder: 'box',
    notes: 'Delivered 3.90 MB with a 2048 colour map; recompressed to 0.66 MB.',
  },
  {
    id: 'kit_goose_standing_a',
    modelUrl: '/assets/props/kit_goose_standing_a.glb',
    checksum: 'd681db3b6338b76c0df3f48d86eb63b0e25602a73ca0c68c499d2811c856763a',
    triangles: 10_426,
    transferBytes: 626708,
    /**
     * A goose that stands, and does not walk.
     *
     * Kars's geese were going to wait for a rig. Then three more arrived, none
     * of them rigged either, and between them they had different poses — which
     * turned out to be worth more than one bird with a walk cycle. A flock is
     * several animals each doing something slightly different, and that is a
     * modelling problem before it is an animation one.
     *
     * Placed as dressing rather than as the city's animal, so nothing here has
     * to move. `kit_kars_goose` still exists, still has its routes, and still
     * draws nothing until it is rigged — at which point walking birds join
     * these rather than replacing them.
     */
    dimensions: [0.33, 0.85, 0.84],
    label: 'Goose, standing',
    color: '#F2EFE6',
    placeholder: 'box',
    notes:
      'Delivered 17.96 MB at 0.6 m; re-authored to 0.85 m, which is a grown ' +
      'Embden, and recompressed to 0.60 MB.',
  },
  {
    id: 'kit_goose_standing_b',
    modelUrl: '/assets/props/kit_goose_standing_b.glb',
    checksum: '30ec40269ae52c8996f1afad8f0de16a06990aee8539b3be6b487003246787c4',
    triangles: 8_610,
    transferBytes: 774732,
    /**
     * The second upright bird, and it is nearly the first: both measure 0.98
     * long for every unit tall with their heads at the same end. The difference
     * is 6 cm across the body. Two of them beside each other still reads better
     * than one of them twice, which is the same reason the sky over Cappadocia
     * uses one balloon at ten sizes.
     */
    dimensions: [0.39, 0.85, 0.83],
    label: 'Goose, standing',
    color: '#F4F1E8',
    placeholder: 'box',
    notes: 'Delivered 27.60 MB at 0.6 m; re-authored to 0.85 m, recompressed to 0.74 MB.',
  },
  {
    id: 'kit_goose_foraging',
    modelUrl: '/assets/props/kit_goose_foraging.glb',
    checksum: 'c877d2721d61fed07ae0d7c8b82fce22d19c3c0d46f5709ea9c93b088ed0ece0',
    triangles: 10_395,
    transferBytes: 729508,
    /**
     * Head down, neck stretched out along the ground: 1.73 units long for every
     * one tall, against 0.98 for the two upright birds, with the top of it a
     * third of the way along rather than at the end.
     *
     * **Left at 0.6 m and not raised to 0.85 like the others.** A goose is
     * 0.85 m tall when its neck is up; the same bird with its head down is
     * shorter and longer, which is what this file is. Scaling it to match the
     * uprights would have produced a goose the size of a sheep — the height is
     * a pose, not a species.
     */
    dimensions: [0.4, 0.6, 1.04],
    label: 'Goose, foraging',
    color: '#EFEADF',
    placeholder: 'box',
    notes:
      'Delivered 18.41 MB; recompressed to 0.70 MB. Scale left as delivered, ' +
      'because 1.04 m long and 0.6 m tall is what a goose with its head down is.',
  },
  {
    id: 'kit_olive_grove',
    modelUrl: '/assets/props/kit_olive_grove.glb',
    checksum: 'cc261c1b70888a9d6ff1af090492cca68b634ed5fe38891cd39231a4aca5bfc5',
    triangles: 10_139,
    transferBytes: 1372048,
    /**
     * An olive grove, and named as one.
     *
     * The brief asked for pistachios, which is what Gaziantep's plain grows.
     * What arrived is olives. Registering it under the name it was asked for
     * would repeat the mistake that put a ferry in the scene as a row of
     * Beyoğlu facades — so it is an olive grove, and olives grow across the
     * south and west, which makes it a `kit_` asset rather than a Gaziantep one.
     */
    dimensions: [13.4, 5.0, 13.8],
    label: 'Olive grove',
    color: '#6F7A4B',
    placeholder: 'box',
    notes: 'Delivered 31.64 MB; recompressed to 1.31 MB.',
  },
  {
    id: 'city_nevsehir_valley',
    modelUrl: '/assets/city/city_nevsehir_valley.glb',
    checksum: 'cc2b0d511773abd308a0aa6c7ce5ad8ddf5f4b5029680714699f10bb26e25820',
    triangles: 10_422,
    transferBytes: 2724448,
    // Nearly square in plan: a terrain plate, not a wall. It closes the back.
    dimensions: [79.4, 12.0, 78.2],
    label: 'Cappadocian valley',
    color: '#D3B48C',
    placeholder: 'box',
    notes: 'Backdrop. Delivered 21.62 MB; recompressed to 2.60 MB.',
  },
  {
    id: 'city_istanbul_iznik_tile_panel',
    modelUrl: '/assets/city/city_istanbul_iznik_tile_panel.glb',
    checksum: '5ace139839828ea0d6b32a0586b2bba36617e13ea9072ded8b8eaf4bd13a7c65',
    triangles: 5_778,
    transferBytes: 603424,
    // Child height: the stop is something to walk up to and look at closely.
    dimensions: [1.51, 2.2, 1.06],
    label: 'İznik tile panel',
    color: '#1B7FA8',
    placeholder: 'plane',
    notes: 'Delivered 20.31 MB with 4096 px maps on 5,778 triangles; recompressed to 0.7 MB.',
  },
  {
    id: 'city_istanbul_hagia_sophia',
    modelUrl: '/assets/city/city_istanbul_hagia_sophia.glb',
    checksum: 'f0752049fd0b71b256e9031e9b63301af2aff380f4721a8ab2a947cb0559d402',
    triangles: 10_094,
    transferBytes: 3_081_336,
    /**
     * Not a stop. As a stop object it had to fit a trigger ring between two
     * neighbours 18.8 m apart, which held it to 8 m and still left it looming
     * over a child who had just arrived. It stands on the square behind the
     * spawn instead, where 10 m closes the space without crowding it.
     */
    dimensions: [16.9, 10.0, 17.9],
    label: 'Hagia Sophia',
    color: '#C9B79A',
    placeholder: 'box',
    notes:
      'Second delivery. The first read poorly once the mosque stood on the ' +
      'square at close range: 6,053 triangles and a 1024 colour map are enough ' +
      'for something glimpsed over rooftops and not for something walked up to. ' +
      'This one is 10,094 triangles with a 2048 colour map. 70.27 MB down to ' +
      '2.94 MB.',
  },
  {
    id: 'city_istanbul_beyoglu_row',
    modelUrl: '/assets/city/city_istanbul_beyoglu_row.glb',
    checksum: '27957de7fb9d98e02087b81efcab60786503cb9b59a7a2276f5b5493ca29bf2c',
    triangles: 9_452,
    transferBytes: 2672016,
    // Deeper than the 0.3 the brief asked for, which does not matter: it stands
    // beyond the play boundary where only its front is ever seen.
    dimensions: [30.7, 14.0, 12.3],
    label: 'Beyoğlu facades',
    color: '#C9A46E',
    placeholder: 'box',
    notes: 'Backdrop only. Delivered 25.01 MB; recompressed to 2.55 MB.',
  },
  {
    id: 'city_istanbul_ferry_boat',
    modelUrl: '/assets/city/city_istanbul_ferry_boat.glb',
    checksum: 'eecab180735468a971892e483d45446a7a9805446daf9cc111093893cdaba447',
    triangles: 5_776,
    transferBytes: 2_604_380,
    /**
     * A Şehir Hatları ferry, moored off the quay. It was registered as a row of
     * Beyoğlu facades: the file is 2.24 : 1 : 0.50, wide and shallow, which is
     * what a street front measures like, and the name on the delivery said
     * Beyoğlu. It is a boat. Measurement narrowed it down and did not settle it,
     * and it was not checked on screen.
     *
     * 9 m tall including masts gives a 20 m hull — the length the ferry was
     * briefed at, and a match for the 13.9 m terminal it sits beside.
     */
    dimensions: [20.2, 9.0, 4.5],
    label: 'Bosphorus ferry',
    color: '#C8CBD0',
    placeholder: 'box',
    notes:
      'Delivered 58.27 MB; recompressed to 2.48 MB. One instance, on the water. ' +
      'Kept double-sided for the flags on its masts.',
  },

  {
    id: 'city_istanbul_maidens_tower',
    modelUrl: '/assets/city/city_istanbul_maidens_tower.glb',
    checksum: '890da45e8153dc09c284ce486fd01627e729a1e99a88711a46a234a65d0f5c1d',
    triangles: 9_018,
    transferBytes: 2490828,
    dimensions: [7.7, 10.0, 7.6],
    label: "Maiden's Tower",
    color: '#D8CFC0',
    placeholder: 'cylinder',
    notes:
      'Stands offshore, so it needs the water plane. Kept double-sided: the flag ' +
      'on its roof is a single plane, and culling its back face tore it in half. ' +
      'Delivered 23.90 MB; recompressed to 2.38 MB.',
  },
  {
    id: 'city_istanbul_ferry_terminal',
    modelUrl: '/assets/city/city_istanbul_ferry_terminal.glb',
    checksum: 'ce52736a3c5df76c8455fe9c2525c1cc5cad52a7633868c775d6136c6f307b89',
    triangles: 12_168,
    transferBytes: 1994936,
    dimensions: [13.9, 8.0, 8.9],
    label: 'Ferry terminal',
    color: '#B7A98F',
    placeholder: 'box',
    notes:
      'Stands in for the ferry itself at the last stop. The boat was briefed as ' +
      'city_istanbul_ferry and never delivered; a terminal is where a child ' +
      'would board one, and it sits on the quay rather than on grass. ' +
      'Delivered 50.82 MB with four 4096 px maps; recompressed to 2.6 MB.',
  },
  {
    id: 'city_istanbul_grand_bazaar',
    modelUrl: '/assets/city/city_istanbul_grand_bazaar.glb',
    checksum: '1870169a8cf0b8aaec70e03918a05f9e7b95524fba9d219da8c74ae716f1356e',
    triangles: 7_793,
    transferBytes: 1_988_796,
    // The file is authored tiny; these are its own proportions at 6 m.
    dimensions: [5.37, 6.0, 3.6],
    label: 'Grand Bazaar gateway',
    color: '#A8763F',
    placeholder: 'box',
    /**
     * The Kapalıçarşı gate is a gate, and a child should walk through it.
     *
     * Measured rather than chosen. At walking height the vertices form two
     * clusters either side of an empty band running from 37.5% to 62.5% of the
     * width — and the same gap appears across the depth, because this is a deep
     * gateway with an arch at the front and another behind it, hollow between.
     *
     * At the recorded 5.37 m that makes each pier 2.01 m and the opening
     * 1.34 m. Against a 0.45 m player radius that is **0.44 m of walking
     * room**, which is tighter than Gaziantep's 0.78 and tight enough to be
     * worth saying: the wooden doors stand open inside the arch and take up
     * part of it, which is what a real gateway does. Pull the piers apart here
     * if it turns out to be fiddly for a child on a tablet.
     */
    colliderParts: [
      { offsetX: -1.68, offsetZ: 0, halfWidth: 1.01, halfDepth: 1.8 },
      { offsetX: 1.68, offsetZ: 0, halfWidth: 1.01, halfDepth: 1.8 },
    ],
    notes:
      'Delivered at 52.08 MB with four 4096 px PNG maps on 7,793 triangles. ' +
      'Recompressed to a 2048 colour map and 1024 for the rest: 1.90 MB.',
  },
  {
    id: 'kit_wall_fountain',
    modelUrl: '/assets/props/kit_wall_fountain.glb',
    checksum: '2f4f515981692eef849624232a09f1149705eec8285acccde7d790e152c2d018',
    triangles: 4_100,
    transferBytes: 510_376,
    dimensions: [2.0, 3.0, 1.7],
    label: 'Wall fountain',
    color: '#B9AE97',
    placeholder: 'box',
    notes: 'Shared kit prop: 7.85 MB down to 0.49 MB.',
  },
  {
    id: 'city_istanbul_streetcar',
    modelUrl: '/assets/city/city_istanbul_streetcar.glb',
    checksum: '41ebf496be094b2422febcb37896ed15c1a33b7a429d715a84cf2fb3e8e66741',
    triangles: 5_339,
    transferBytes: 768_228,
    dimensions: [4.8, 3.4, 1.9],
    label: 'Nostalgic streetcar',
    color: '#B03A2E',
    placeholder: 'box',
    notes: 'The red tram is Beyoğlu. 8.87 MB down to 0.73 MB.',
  },
  {
    id: 'city_istanbul_stone_dock',
    modelUrl: '/assets/city/city_istanbul_stone_dock.glb',
    checksum: '7734a0aaf45a5b64d227ecd88ad3035d8c7304cc04f50e080c61a33ee1161a9d',
    triangles: 6_411,
    transferBytes: 678_060,
    dimensions: [4.0, 1.2, 6.6],
    label: 'Stone dock',
    color: '#9E9382',
    placeholder: 'box',
    notes: 'Stands at the quay, where the street meets the water. 9.65 MB down to 0.65 MB.',
  },
  {
    id: 'kit_turkish_flag',
    modelUrl: '/assets/props/kit_turkish_flag.glb',
    checksum: '606137d144b3d1f5199c11254c8cc44ba8e79fbb3d35c3e57149d12acb5b778c',
    triangles: 3_008,
    transferBytes: 470696,
    dimensions: [3.5, 6.0, 1.0],
    label: 'Turkish flag',
    color: '#E30A17',
    placeholder: 'cylinder',
    notes:
      'Stands at the same place in every one of the 81 cities, so a child ' +
      'arriving anywhere sees the same thing first. Double-sided: a flag is a ' +
      'plane, and culling its back face tears it in half. 14.59 MB down to 0.45 MB.',
  },
  {
    id: 'kit_hot_air_balloon',
    modelUrl: '/assets/props/kit_hot_air_balloon.glb',
    checksum: '19495897885065e3c28fc45758b82bab752ad8c2d551a938e34fb83d8d36b9c5',
    triangles: 10_175,
    transferBytes: 1038368,
    /**
     * Registered at the size a child stands next to: stop 2 is a tethered
     * balloon, not one overhead. The sky multiplies this — the same file doing
     * both jobs, as the fairy chimneys do.
     *
     * Sizing it at flying height instead gave stop 2 an eleven metre object and
     * a seven metre trigger ring, which pushed the whole street back out to
     * İstanbul's length.
     */
    dimensions: [3.1, 5.0, 3.1],
    label: 'Hot air balloon',
    color: '#D9532C',
    placeholder: 'cylinder',
    notes: 'Kept double-sided: the envelope is thin where it meets the crown.',
  },
  {
    id: 'kit_crates',
    modelUrl: '/assets/props/kit_crates.glb',
    checksum: '7f181f1cd132f16e1f23d1ac0cf2599b91a730b5fb805790f6645f5e562e240e',
    triangles: 3_755,
    transferBytes: 648_088,
    dimensions: [1.29, 1.0, 1.19],
    label: 'Crates and barrel',
    color: '#9A7B4F',
    placeholder: 'box',
    notes: 'Shared kit prop: 8.49 MB down to 0.62 MB at a 1024 colour map and 512 for the rest.',
  },
  {
    id: 'kit_market_stall',
    modelUrl: '/assets/props/kit_market_stall.glb',
    checksum: 'c7357ded22641d7d10f7e6a1ec1ff4f30bc39e7b0a3b80d4d0580a022ea3e896',
    triangles: 3_851,
    transferBytes: 482780,
    dimensions: [2.25, 2.5, 1.61],
    label: 'Market stall',
    color: '#B5563C',
    placeholder: 'box',
    notes:
      'Shared kit prop, delivered empty on purpose: the same stall becomes a ' +
      'spice stall in Gaziantep and a pottery stall in Nevşehir by what is ' +
      'placed on it. Double-sided for the canvas awning. 6.74 MB down to 0.46 MB.',
  },
  {
    id: 'kit_planter_cypress',
    modelUrl: '/assets/props/kit_planter_cypress.glb',
    checksum: 'ee62dec6b98177caae46b6417bcca99ae0e64c500a9ffc6014ca0b1bf52a86e9',
    triangles: 3_747,
    transferBytes: 679_572,
    dimensions: [0.91, 2.5, 0.91],
    label: 'Cypress planter',
    color: '#3E6B4A',
    placeholder: 'cylinder',
    notes:
      'Shared kit prop, so it carries the under-2 MB rule: 8.40 MB down to ' +
      '0.65 MB at a 1024 colour map and 512 for the rest.',
  },
  {
    id: 'city_istanbul_simit_cart',
    modelUrl: '/assets/city/city_istanbul_simit_cart.glb',
    checksum: '9ac7be8e4a487c68ea5f55ebeaade1eb1c6afbec939af94a4a53a12ba0e24d49',
    triangles: 20_182,
    transferBytes: 1_521_132,
    dimensions: [2.05, 2.19, 0.96],
    label: 'Simit cart',
    color: '#C0392B',
    placeholder: 'box',
    notes:
      'Delivered at 969,492 triangles and 31.33 MB, which would have taken the ' +
      'scene from 50 fps to roughly 12. Simplified in-project to 20,182 ' +
      'triangles and 1.45 MB; see scripts/simplify-model.mjs.',
  },
  {
    id: 'kit_bench',
    modelUrl: '/assets/props/kit_bench.glb',
    checksum: '3a36913072da66782987cb06ad0e1b501fa4a2d22b4ac7f707dc9d1d5d4ce767',
    triangles: 1_586,
    transferBytes: 980_160,
    dimensions: [1.82, 0.9, 0.7],
    label: 'Street bench',
    color: '#7A5A38',
    placeholder: 'box',
    notes: 'Root scale 0.9, origin already on the ground.',
  },
  {
    id: 'city_trabzon_tea_slope',
    modelUrl: '/assets/city/city_trabzon_tea_slope.glb',
    checksum: 'f6288e5ab0f367f9679883f9be6c367884b1d73dfcce1b7b105c56ee0642add5',
    triangles: 10_406,
    transferBytes: 860_156,
    /**
     * Trabzon's sides: tea terraced into a green slope.
     *
     * Deeper than it is wide — 15.7 across for 21.2 back — which is the file's
     * own proportion and the opposite of what a side piece usually wants. Bolu's
     * forest row is 3.2 wide for every one high and closes a street in four
     * pieces; this is 1.2, so it takes six a side. Kept anyway, because the
     * depth is what a hillside has: the terraces run back away from the street
     * instead of standing against it like a fence.
     *
     * It also tapers hard — full width at the base, a third of it at the top —
     * so the instances are spaced closer than their width to overlap at height.
     * A cone-shaped side piece spaced by its own width leaves sky between the
     * shoulders, which is the hole the elevation sweep looks for.
     */
    dimensions: [15.74, 13.0, 21.16],
    label: 'Tea terraces',
    color: '#5E8046',
    placeholder: 'box',
    notes: 'Delivered 12 m buried 6 m, 23.32 MB; re-authored to 13 m on y = 0, 0.82 MB.',
  },
  {
    id: 'city_trabzon_sumela_cliff',
    modelUrl: '/assets/city/city_trabzon_sumela_cliff.glb',
    checksum: '2817f830eb629620028be254ae5738f5b9368c6e74ba4e47dde0ed99bfdd7069',
    triangles: 10_343,
    transferBytes: 2_679_536,
    /**
     * The rock ahead, and the monastery is in it.
     *
     * It went in as three of these shoulder to shoulder, on the reading that a
     * crag standing alone would be the project's fifth rounded mountain. That
     * was wrong in the way a plan reading usually is: three copies of one file
     * side by side read as three copies of one file, and the monastery — which
     * is the whole subject — was a third of the size it could have been in each
     * of them.
     *
     * One piece at 26 m, and the base colour went back up to 2048 with it. The
     * texture budget was set when this was one of three pieces of scenery; it
     * is now the only thing at the end of the street and the only place a child
     * sees Sümela at all, so it is a stop object in everything but name.
     *
     * Twenty-six is the tallest it can be and still show its buildings from the
     * square: they sit between two fifths and three quarters of its height, so
     * their top is at 19.5 m against a ceiling of 23.8 m from the spawn (D-183).
     * Walking up to it crops the upper half, which is the right way round —
     * a child ends up standing under it.
     */
    dimensions: [36.34, 26.0, 26.03],
    label: 'Sümela',
    color: '#8A8578',
    placeholder: 'box',
    notes: 'Delivered 10 m buried 5 m, 29.15 MB; re-authored to 26 m on y = 0 at 2048 base colour, 2.56 MB.',
  },
  {
    id: 'city_mardin_stone_doorway',
    modelUrl: '/assets/city/city_mardin_stone_doorway.glb',
    checksum: '0fe401c6aea3cab2cf55934853c409497aff160af973274f91c292f0705cbf6a',
    triangles: 9_914,
    transferBytes: 2_275_432,
    /**
     * Stop one: the carved doorway.
     *
     * The climbing houses are the whole north flank at 14 m; this is the piece
     * of that a child can stand nose to nose with, which in Mardin is always
     * the door — the carving is what the city is known for close up.
     *
     * A panel rather than a porch: 0.82 m deep against 2.59 wide, and it holds
     * full width at every height, so there is no reveal to walk into. Turned
     * square to the street for that reason.
     *
     * Its colour census came back three quarters warm red-brown rather than the
     * honey limestone the brief described. That may be an ornate arch reading
     * warm, or it may be the wrong stone for a city whose whole subject is
     * golden light — worth a look on the first screenshot, because a red arch
     * is Gaziantep's colour and this city is fighting to not be Gaziantep.
     */
    dimensions: [2.59, 3.6, 0.82],
    label: 'Carved doorway',
    color: '#B98A5C',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 24.94 MB; re-authored to 3.6 m on y = 0, 2.17 MB.',
  },
  {
    id: 'city_mardin_telkari_bench',
    modelUrl: '/assets/city/city_mardin_telkari_bench.glb',
    checksum: '60d44f53c9788ea9d104dade02c79f79244444aca98c97b936615a79651be920',
    triangles: 9_988,
    transferBytes: 2_026_944,
    /**
     * Stop two: the silversmith's bench.
     *
     * The closest of the three to its brief — 1.1 wide for every one high
     * against a briefed 1.09 — and the one that had the most riding on being
     * different, because Gaziantep eighty kilometres away has a coppersmith's
     * bench and the two provinces share a region table.
     *
     * The measurements say they are different objects: this is timber and
     * bright metal with the widest part at three quarters height, where the
     * copper bench is red through and heaviest at the middle. The silver is
     * only 6% of the surface and all of it in the top band, which is right —
     * filigree is small, and that is the point of it.
     *
     * 2048, because the Zeugma mosaic taught that fine work at 1024 becomes a
     * smear (D-057), and telkâri is the finest work in the project.
     */
    dimensions: [2.43, 2.2, 1.95],
    label: 'Telkâri bench',
    color: '#8A7350',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 25.59 MB; re-authored to 2.2 m on y = 0, 1.93 MB.',
  },
  {
    id: 'city_mardin_minaret_courtyard',
    modelUrl: '/assets/city/city_mardin_minaret_courtyard.glb',
    checksum: 'a36377a7aaf7c12ec5493bb96ebdad7948ee34586c9a45a29b611d259fc9aff5',
    triangles: 9_663,
    transferBytes: 2_391_216,
    /**
     * Stop three: the courtyard, and **it may only have one tower in it.**
     *
     * The canonical line is that mosques, churches and the monastery have stood
     * side by side for centuries, and the brief asked for two towers of equal
     * height for exactly that reason — a minaret and a bell tower, neither
     * bigger than the other, because squashing either one tells a different
     * story.
     *
     * The delivered silhouette does not obviously carry that. Sliced into ten
     * bands it is full width up to 30%, thin to 50%, **empty between 50 and
     * 70%**, and then one slender shaft at 11–16% width from 70% to the top.
     * That reads as a courtyard with a single minaret rising out of it. If
     * there is a bell tower it is short and it is down among the walls, which
     * is not side by side.
     *
     * Kept and integrated, because it is plainly a minaret courtyard and the
     * stop works. But this is the one thing in Mardin that a screenshot has to
     * settle: if there is one tower, the fact card says something the street
     * does not.
     *
     * The largest stop in the project — 4.28 by 5.32 on the ground, which gives
     * it a 6.7 m trigger ring. The spacing check in `layout` has the last word
     * on that (D-100).
     */
    dimensions: [4.28, 4.6, 5.32],
    label: 'Minaret courtyard',
    color: '#C3AC80',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 24.69 MB; re-authored to 4.6 m on y = 0, 2.28 MB.',
  },
  {
    id: 'city_erzurum_stone_houses',
    modelUrl: '/assets/city/city_erzurum_stone_houses.glb',
    checksum: '6a924dbfcbc3478e3e16c13dcf462933b82999b9c776cc33b5364f6e0781efb4',
    triangles: 10_275,
    transferBytes: 986_708,
    /**
     * Both flanks: black volcanic stone under a load of snow.
     *
     * Erzurum builds in dark basalt, and against snow that is the strongest
     * contrast in the project — everywhere else in eighty-one provinces the
     * buildings are lighter than the ground they stand on.
     *
     * Delivered at 2.5 wide for every one high against a briefed 2.15, so at
     * 13 m it runs 33 m — three a side covers the street where the brief
     * planned four.
     */
    dimensions: [32.99, 13.0, 13.92],
    label: 'Erzurum townhouses',
    color: '#5C5A57',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 2 m, 26.64 MB; re-authored to 13 m on y = 0, 0.94 MB.',
  },
  {
    id: 'city_erzurum_palandoken',
    modelUrl: '/assets/city/city_erzurum_palandoken.glb',
    checksum: 'ebec910331173b32c5aa8cd1f95e52e86fd73493024ced10fd4037e715da610c',
    triangles: 10_192,
    transferBytes: 2_084_804,
    /**
     * Palandöken. The tenth tall thing in the project and the first that is
     * white from base to summit.
     *
     * Boztepe is a bare green headland, Kartalkaya has snow *on* it and is a
     * distant peak, Sarıkamış is bare rock, Erek is scree, Sümela is vertical,
     * Kaz Dağları is forest to the top, and the citadel above Mardin is
     * bleached limestone. This one fills the end of the street and is a ski
     * mountain rather than a view.
     *
     * Thirty-two metres against a 24.7 m ceiling from the square (D-183), so
     * its summit is out of frame from the start and stays out. A mountain whose
     * top you cannot see is the only kind that feels like one.
     *
     * Delivered on 2.32 wide for every one high against a briefed 2.44 — the
     * closest match of any horizon piece so far.
     */
    dimensions: [74.21, 32.0, 77.65],
    label: 'Palandöken',
    color: '#DDE4EA',
    placeholder: 'box',
    notes: 'Delivered 6 m buried 3 m, 21.71 MB; re-authored to 32 m on y = 0 at 2048 base colour, 1.99 MB.',
  },
  {
    id: 'city_erzurum_cifte_minareli',
    modelUrl: '/assets/city/city_erzurum_cifte_minareli.glb',
    checksum: '1b964668fed996cf6b5d1c841e2c0f749217725de3ee2ce356daa502bd8f0b9b',
    triangles: 9_665,
    transferBytes: 2_785_932,
    /**
     * The Çifte Minareli Medrese, behind the spawn.
     *
     * **The one model in this city that must not be cropped.** Palandöken loses
     * its summit on purpose; a minaret with its finial out of frame is a
     * chimney. Sixteen metres was a ceiling in the brief rather than a
     * preference — at 58 m back the frame stops at 16.8 m — and the delivery is
     * held to it.
     *
     * It came back narrow: 1.16 wide for every one high against a briefed 1.88,
     * so it is 18.6 m across rather than 30 and cannot close the direction on
     * its own. The townhouses run a piece past the spawn on both sides to carry
     * the shoulders.
     */
    dimensions: [18.6, 16.0, 10.13],
    label: 'Çifte Minareli Medrese',
    color: '#A9906B',
    placeholder: 'box',
    notes: 'Delivered 6 m buried 3 m, 28.24 MB; re-authored to 16 m on y = 0 at 2048 base colour, 2.66 MB.',
  },
  {
    id: 'kit_mardin_sweets_cart',
    modelUrl: '/assets/props/kit_mardin_sweets_cart.glb',
    checksum: '2b20fbcde259fdc17dd022056366c73a9ac4d75b27a87ac1e403c612237b7a2c',
    triangles: 9_713,
    transferBytes: 1_074_616,
    /**
     * A sweets pedlar's cart, working the street.
     *
     * Mardin had no moving thing on the ground: gulls turn over the escarpment
     * and two doves stand still on plinths, and everything else in the city is
     * stone. A cart being pushed up and down is the one kind of motion a street
     * has that a horizon cannot supply.
     *
     * Nearly twice as wide as it is deep, so `Tram` reads its footprint and
     * turns it to run lengthwise down the street rather than sideways — the
     * same fix İstanbul's streetcar needed.
     *
     * One point nine metres, which is the cart with its canopy. It runs at
     * 0.9 m/s: a person pushing something heavy, not a vehicle.
     *
     * Base colour 1024, not 2048. It went in at 2048 like a stop object and the
     * budget test refused it at 2.29 MB — a `kit_` asset is one whose cost is
     * paid in every province that uses it, so the cap is two megabytes and not
     * four (D-036 / D-055). The test was right and the reasoning behind it is
     * too: a stop is walked up to and this passes at ten metres.
     */
    dimensions: [1.91, 1.9, 1.08],
    label: 'Sweets cart',
    color: '#9C5A2E',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 27.23 MB; re-authored to 1.9 m on y = 0 at 1024 base colour, 1.02 MB.',
  },
  {
    id: 'kit_mardin_dove_flight',
    modelUrl: '/assets/props/kit_mardin_dove_flight.glb',
    checksum: '4ce4e5b5cb96d66c9f7db3e2764440c66fc2a953a9164d1fb9d902eda864567b',
    triangles: 10_325,
    transferBytes: 731_380,
    /**
     * A dove with its wings open, on a plinth at the head of the street.
     *
     * Not the flying bird the brief asked for — unrigged, so it cannot be
     * flown, and it is a statue instead. That is the better idea anyway:
     * canonical gives Mardin a peace dove as its third reward and a city of
     * three faiths standing side by side, and a monument says that where a bird
     * crossing the sky does not.
     *
     * Two doves came, and they are genuinely different: this one is 1.5 m deep
     * with its wings out in three dimensions, the other is 0.45 m deep and
     * almost a relief. One at each end of the street, so a child meets a
     * different bird coming and going.
     */
    dimensions: [2.14, 1.6, 2.42],
    label: 'Dove statue, wings open',
    color: '#DCD8CE',
    placeholder: 'box',
    notes: 'Delivered 1 m buried 0.5 m, 18.15 MB; re-authored to 1.6 m on y = 0, 0.70 MB.',
  },
  {
    id: 'kit_mardin_dove_perched',
    modelUrl: '/assets/props/kit_mardin_dove_perched.glb',
    checksum: '208ee8eb89bc81939f303b6a08df4c3b1a25dd56d0d157490627f8111bff5e7e',
    triangles: 10_187,
    transferBytes: 801_956,
    /**
     * The second dove, at the other end of the street.
     *
     * Half a metre deep against the other's metre and a half — a carved panel
     * rather than a bird in the round. It is turned to face along the street
     * for that reason: seen from the side it is thin, and seen from the front
     * it reads.
     */
    dimensions: [2.04, 1.6, 0.71],
    label: 'Dove statue, carved',
    color: '#D8CDBA',
    placeholder: 'box',
    notes: 'Delivered 1 m buried 0.5 m, 49.28 MB; re-authored to 1.6 m on y = 0, 0.76 MB.',
  },
  {
    id: 'city_mardin_terrace_houses',
    modelUrl: '/assets/city/city_mardin_terrace_houses.glb',
    checksum: '0f95e849f056c3cff90db80e8d7320b11f9f297bb5e69879f4b3cf1097472136',
    triangles: 9_447,
    transferBytes: 1_087_196,
    /**
     * The north flank: houses stepped up a hillside.
     *
     * Briefed 30 m across on a 2.1 aspect and delivered near cubic, so at 14 m
     * tall it is 15 wide rather than 30 — eight a side instead of five. The
     * height is what matters and it is kept: anything under about ten metres on
     * a flank is sky, and this flank has to hold up the whole city.
     *
     * Twenty-one degrees from the middle of the street, which is the hardest
     * any flank in the project closes. That is deliberate — the other side has
     * nothing at all on it.
     */
    dimensions: [15.17, 14.0, 16.11],
    label: 'Terrace houses',
    color: '#C9A870',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 2 m, 25.59 MB; re-authored to 14 m on y = 0, 1.04 MB.',
  },
  {
    id: 'city_mardin_parapet',
    modelUrl: '/assets/city/city_mardin_parapet.glb',
    checksum: '2c7a986fc21c1f003edbce175136d5ca3ded88ab54f4d795b82aa21e4920750f',
    triangles: 9_436,
    transferBytes: 830_620,
    /**
     * The south edge of the street, and the height is a sightline rather than a
     * taste.
     *
     * A child's camera is 2.3 m up and 16.5 m in from this wall, so the wall
     * decides where the plain starts being visible: the eye line grazing its
     * top hits the plain's surface at `(2.3 + 1.5) / ((2.3 − h) / 16.5)` metres
     * out. At 1.1 m that is 57 m, at 1.4 m it is 70, at 1.6 m it is 90 and at
     * 2 m the plain is gone entirely.
     *
     * One point four. High enough to say *there is a drop here*, low enough
     * that two thirds of Mesopotamia is still in the frame.
     *
     * Delivered on a 2.5 aspect against a briefed 10.9, so it is 3.5 m long
     * rather than 12 and takes twenty pieces to run the street. That is twenty
     * draw calls for a wall, which is worth watching after the duplicate prop
     * pass just gave some back.
     */
    dimensions: [3.54, 1.4, 0.55],
    label: 'Terrace parapet',
    color: '#C4B18A',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 22.06 MB; re-authored to 1.4 m on y = 0, 0.79 MB.',
  },
  {
    id: 'city_mardin_plain',
    modelUrl: '/assets/city/city_mardin_plain.glb',
    checksum: '9a97a708ce18b647ee4e2d56dc9ea8106b817b2d1fc66f85637d83a65f1983ec',
    triangles: 10_227,
    transferBytes: 548_544,
    /**
     * Mesopotamia. The lightest file in the project and the most important
     * model in the city.
     *
     * **It is not flat.** Measured: the up-facing surface spans 92% of the
     * model's own height, so the relief is a fixed 8.7% of its width whatever
     * scale it is drawn at — 13 m of rise across 149 m. That is rolling country
     * rather than a table, and at seventy metres and below eye level it reads
     * as flat enough. It would not at close range, which is why the parapet
     * hides everything nearer than 70 m.
     *
     * Its surface sits at 30% of its height, not at its base, so grounding it
     * normally would put the fields 4.2 m above the street. It is sunk instead
     * (D-185): the one horizon piece in the project that lives under y = 0.
     *
     * Three of them end to end. The far edge lands at 184 m, inside the 220 m
     * far clip, so the plain ends at the horizon rather than at a cut line.
     */
    dimensions: [148.72, 14.0, 139.14],
    label: 'Mesopotamian plain',
    color: '#C6BB8E',
    placeholder: 'box',
    notes: 'Delivered 0.5 m buried 0.25 m, 13.26 MB; re-authored to 14 m on y = 0, 0.52 MB.',
  },
  {
    id: 'city_mardin_citadel_rock',
    modelUrl: '/assets/city/city_mardin_citadel_rock.glb',
    checksum: '9606f254d509c7238d5e8795ca1daafec638b5b3d87be4628a90df44c0e391d6',
    triangles: 10_388,
    transferBytes: 900_016,
    /**
     * The citadel above the town, behind the spawn.
     *
     * Twenty-four metres with its near face 60 m from the square, where the
     * camera can see 16.2 (D-183) — so its top eight metres are out of frame
     * from the start and stay out. Cropped on purpose: that is what standing
     * under a citadel looks like, and it is the same reasoning Sümela and
     * Kartalkaya are placed on.
     *
     * Eighth tall thing in the project and the eighth colour: bleached
     * limestone, not the red-brown of Gaziantep's castle mound eighty
     * kilometres away.
     */
    dimensions: [75.92, 24.0, 79.67],
    label: 'Citadel rock',
    color: '#B8AD8E',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 2 m, 21.94 MB; re-authored to 24 m on y = 0, 0.86 MB.',
  },
  {
    id: 'city_mardin_deyrulzafaran',
    modelUrl: '/assets/city/city_mardin_deyrulzafaran.glb',
    checksum: '7ec0ae563e0155aae46c08700db573466094b5f5f8bad72ed26905aeabf50c7b',
    triangles: 9_919,
    transferBytes: 2_436_452,
    /**
     * The Saffron Monastery, at the head of the street.
     *
     * Eighteen metres against a ceiling of 27.7 m from the spawn, so it stands
     * whole from the square and is cropped as a child walks up to it. One
     * piece at 2048, because it is the only thing at the end of the street and
     * three copies of one file read as three copies of one file — which is what
     * Sümela's crag did before it was made single.
     *
     * Delivered at 1.9 wide for every one high against a briefed 2.6, so it is
     * 34 across rather than 46 and does not fill the front on its own. The
     * terrace houses run two pieces further forward than the street needs for
     * exactly that reason.
     */
    dimensions: [33.77, 18.0, 33.92],
    label: 'Deyrulzafaran',
    color: '#C79B52',
    placeholder: 'box',
    notes: 'Delivered 4 m buried 2 m, 24.86 MB; re-authored to 18 m on y = 0 at 2048 base colour, 2.32 MB.',
  },
  {
    id: 'city_balikesir_mossy_cascade',
    modelUrl: '/assets/city/city_balikesir_mossy_cascade.glb',
    checksum: 'de52a4f922f6a8d2adb48cbf5cd5c7aa8a676c2cd4369eddf041a5b1d0ffb485',
    triangles: 10_130,
    transferBytes: 2_404_228,
    /**
     * Stop one: water over mossy rock on Kaz Dağları.
     *
     * The mountain itself is 32 m tall at the head of the valley, because a
     * child cannot climb one and a stop is something to walk up to (D-066).
     * This is the half of it that can be stood in front of, and the canonical
     * line is about air and water rather than rock — so a cascade rather than a
     * summit is the right small object.
     *
     * Briefed as a spring at 2.6 across; what arrived is 2 wide for every one
     * high and spreads to 4.9 × 5.2 at 2.4 m tall. Named for what it is rather
     * than what was asked for, the way the olive grove briefed as pistachio was
     * (D-117). It carries a little flat water of its own — twenty-two
     * upward-facing vertices sampling blue — which nothing else in this city
     * does.
     *
     * The footprint is the largest of any stop in the project, so its trigger
     * ring is wide; the spacing check in `layout` has the last word on that
     * (D-100) and it passes at fourteen metres.
     */
    dimensions: [4.9, 2.4, 5.2],
    label: 'Mossy cascade',
    color: '#5B7A46',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 27.06 MB; re-authored to 2.4 m on y = 0, 2.29 MB.',
  },
  {
    id: 'city_balikesir_olive_press',
    modelUrl: '/assets/city/city_balikesir_olive_press.glb',
    checksum: 'e51b0f3d43052c43247115851b8380697756acbf661bf4e6d1704ef60cfb81c4',
    triangles: 10_273,
    transferBytes: 2_278_460,
    /**
     * Stop two: the press where the olives become oil.
     *
     * The groves are the west side of the street and the terraces behind them;
     * this is the part of it a child can stand at. Two thirds timber and stone
     * with a grey band that reads as the millstone — measured, not taken from
     * the file name.
     *
     * The closest of the three to its brief: 1.33 wide for every one high
     * against a briefed 1.08.
     */
    dimensions: [3.44, 2.6, 3.3],
    label: 'Olive press',
    color: '#7A6242',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 26.47 MB; re-authored to 2.6 m on y = 0, 2.17 MB.',
  },
  {
    id: 'city_balikesir_hosmerim_counter',
    modelUrl: '/assets/city/city_balikesir_hosmerim_counter.glb',
    checksum: '4754d24421aa894c9e3915ffc0a652548561c0a1249ba85184d0218a34ada25e',
    triangles: 9_441,
    transferBytes: 1_872_736,
    /**
     * Stop three: höşmerim over a copper pan.
     *
     * Over a third of its surface samples copper, which is the thing the
     * dessert is made in and the thing that identifies the model without a
     * look. Shallow — 1.35 m deep against 2.9 wide — which is what a counter is
     * and why its trigger ring is the tightest of the three.
     *
     * Canonical names the sign but nothing in the game draws text on a model.
     * The words are the fact card's job.
     */
    dimensions: [2.9, 2.4, 1.35],
    label: 'Höşmerim counter',
    color: '#A2643A',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 23.06 MB; re-authored to 2.4 m on y = 0, 1.79 MB.',
  },
  {
    id: 'city_balikesir_kaz_daglari',
    modelUrl: '/assets/city/city_balikesir_kaz_daglari.glb',
    checksum: '026db27be5287cd27d930c070aad691c7e63af7591c4476f2f7735cc5abe6904',
    triangles: 10_376,
    transferBytes: 2_406_988,
    /**
     * Kaz Dağları, and it is the first mountain in the project that is forest
     * to the summit.
     *
     * Ninety per cent of its surface samples green — measured, not taken from
     * the file name — where Boztepe is a bare green headland, Kartalkaya has
     * snow, Sarıkamış is rock, Erek is scree and Sümela is a vertical crag.
     * Six provinces, six mountains, no two alike.
     *
     * Briefed 90 m across on a 3:1 aspect and delivered on 2.2:1, so at 32 m
     * tall it is 71 across rather than 90. One piece, not three: three of
     * Sümela's crag went in side by side and read as three copies of one file.
     * The olive terraces close the corners it leaves instead.
     */
    dimensions: [71.39, 32.0, 71.11],
    label: 'Kaz Dağları',
    color: '#4A6B3C',
    placeholder: 'box',
    notes: 'Delivered 6 m buried 3 m, 27.14 MB; re-authored to 32 m on y = 0 at 2048 base colour, 2.30 MB.',
  },
  {
    id: 'city_balikesir_olive_terrace',
    modelUrl: '/assets/city/city_balikesir_olive_terrace.glb',
    checksum: '0bd92a33d1f562df995437f2d0a4d401946256735963305fc38525914486b349',
    triangles: 10_336,
    transferBytes: 1_036_568,
    /**
     * The sides: olives on stony terraces.
     *
     * Nearly as deep as it is wide — 35 across for 34.7 back — which is a lot
     * of flank for one piece and means four a side rather than the six the
     * brief planned for. Kept: the depth is what a hillside has, and it lets
     * the terraces run back away from the street instead of standing against it.
     *
     * Its colour census came back almost entirely earth, with the olive leaves
     * reading as the grey between. That is what an olive terrace is from thirty
     * metres — stone, dust and a silver haze — but it is the one delivery here
     * whose look should be checked on a screenshot before more are ordered.
     */
    dimensions: [34.99, 12.0, 34.74],
    label: 'Olive terraces',
    color: '#8A8259',
    placeholder: 'box',
    notes: 'Delivered 6 m buried 3 m, 26.86 MB; re-authored to 12 m on y = 0, 0.99 MB.',
  },
  {
    id: 'city_balikesir_cunda_island',
    modelUrl: '/assets/city/city_balikesir_cunda_island.glb',
    checksum: '950a8051514beeaa589baf06c08c747f40e86b29ae63f20b57d3dfe461fbd3d8',
    triangles: 10_264,
    transferBytes: 1_027_380,
    /**
     * Cunda, across the water.
     *
     * Three quarters of it samples as terracotta and stone with a tenth green —
     * a town on a hill, which is what Cunda is. **No water in it**, like every
     * other delivery for this city, so the lake it stands in is a plane.
     *
     * It arrived normalised into a box 14 cm across. That number means nothing
     * (D-124); sixteen metres is what the recorded height says and what draws
     * it, against a ceiling of 21.5 m from the spawn.
     */
    dimensions: [37.68, 16.0, 28.77],
    label: 'Cunda',
    color: '#A9825E',
    placeholder: 'box',
    notes: 'Delivered 0.06 m tall, 25.46 MB; re-authored to 16 m on y = 0, 0.98 MB.',
  },
  {
    id: 'city_balikesir_manyas_reeds',
    modelUrl: '/assets/city/city_balikesir_manyas_reeds.glb',
    checksum: '46c0c0f2db60bb7b84766177a3c052217b05226591f78ffd4717d8acb313cbd0',
    triangles: 8_832,
    transferBytes: 1_159_204,
    /**
     * Cattails at the waterline.
     *
     * Briefed 11 m tall because reeds on a *flank* would be open sky above
     * them. Manyas went behind instead, where the height that closes the
     * direction is Cunda's, so these went back down to four and a half — which
     * is what a reed is. They stand in clumps with water between them rather
     * than as a bank, because a continuous reed wall at the near edge would
     * hide the lake it is supposed to be the edge of.
     */
    dimensions: [13.24, 4.5, 7.24],
    label: 'Cattails',
    color: '#7F8B4A',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 35.74 MB; re-authored to 4.5 m on y = 0, 1.11 MB.',
  },
  {
    id: 'city_balikesir_manyas_islet',
    modelUrl: '/assets/city/city_balikesir_manyas_islet.glb',
    checksum: '1444979214956216ba83640427fa53a9f1fbdd12604a1fce20a52193683e1b13',
    triangles: 10_089,
    transferBytes: 968_584,
    /**
     * A green islet in the lake.
     *
     * Delivered as "Isle of Still Waters" and three quarters green with no blue
     * anywhere in it — so it is the isle and not the still water, which is the
     * kind of thing a file name will tell you wrongly (D-078). Five metres and
     * 26 across on a 5.3:1 aspect: flat, which is right for something a child
     * sees across water rather than over.
     */
    dimensions: [26.52, 5.0, 24.34],
    label: 'Lake islet',
    color: '#5E7F45',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 23.50 MB; re-authored to 5 m on y = 0, 0.92 MB.',
  },
  {
    id: 'kit_balikesir_olive_tree',
    modelUrl: '/assets/props/kit_balikesir_olive_tree.glb',
    checksum: 'b4ad7a74bae3caf29d2b961052da681aee55de77a8583fd49225c23e727ed737',
    triangles: 5_850,
    transferBytes: 1_154_408,
    /**
     * Balıkesir's street tree: an old olive.
     *
     * The street was lined with the procedural shapes — instanced boxes for a
     * trunk and a canopy — and they were the third thing wrong in every
     * screenshot of this city: bright flat green blobs standing in front of
     * delivered stone terraces and a hand-painted town. That is the split
     * `CITY_STREET_TREE` exists to close, and it has now closed for Bolu, Ordu
     * and here.
     *
     * Five and a half metres and as broad as it is tall, which is what an olive
     * is — Bolu's nine metre fir and Ordu's four and a half metre hazelnut are
     * the other two points on that scale, and none of the three would pass for
     * another.
     *
     * The lightest model in the project at 5,850 triangles: an olive is mostly
     * one thick trunk and a few masses of leaf, so there is nothing to spend
     * geometry on.
     */
    dimensions: [5.65, 5.5, 5.51],
    label: 'Ancient olive',
    color: '#6B7A4E',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 34.51 MB; re-authored to 5.5 m on y = 0, 1.10 MB.',
  },
  {
    id: 'kit_balikesir_pelican',
    modelUrl: '/assets/props/kit_balikesir_pelican.glb',
    checksum: '1bb4e0b914905fcf446a63e8b60dabf09aadff290fa04bb368ffbbce7aeab40e',
    triangles: 9_851,
    transferBytes: 779_780,
    /**
     * A pelican for Manyas. White, with black wingtips and an orange bill —
     * measured, not assumed: white runs through every height band, black sits
     * in the middle where the wingtips are and orange in the band above it.
     *
     * **Not rigged, and not the flying bird the brief asked for.** Its box is
     * near cubic, so the wings are folded rather than out; what arrived is a
     * bird at rest, which is the right thing for a lake and the wrong thing for
     * the sky. It floats.
     *
     * **Registered and not yet placed.** Manyas has no water until the lake
     * model arrives, and a pelican standing on grass is worse than no pelican —
     * the way Kars's geese and Bolu's deer were held (D-129).
     *
     * One metre high on the water. A great white pelican is a big bird and this
     * is the part of it above the waterline, which is why the number looks
     * small for something that stands over a metre and a half on land.
     */
    dimensions: [1.08, 1.0, 1.0],
    label: 'Pelican',
    color: '#E4E2DC',
    placeholder: 'box',
    notes: 'Delivered 10.35 MB at 0.7 m; re-authored to 1.0 m on y = 0, 0.74 MB. Three files uploaded, one distinct mesh.',
  },
  {
    id: 'kit_ordu_hazelnut_tree',
    modelUrl: '/assets/props/kit_ordu_hazelnut_tree.glb',
    checksum: 'ae4d9b9d202f15b39fc86bca0107b7239fdbf94b35c1e52846e8174434ce8371',
    triangles: 8_447,
    transferBytes: 1_162_396,
    /**
     * Ordu's own street tree: a hazelnut.
     *
     * The street was lined with the procedural shapes — instanced boxes for a
     * trunk and a canopy — which are cheap and look like exactly what they are.
     * That was fine while every city used them and stopped being fine the day
     * Bolu got a delivered fir, because a green blob beside a drawn forest
     * reads as two games in one shot (the reason `CITY_STREET_TREE` exists).
     *
     * Ordu is the province hazelnut is named for in this country, and it had
     * hazelnut groves on its horizon and boxes on its pavement. Four and a half
     * metres: a hazelnut is a many-stemmed bush that grows to about that, not a
     * shade tree, and Bolu's nine metre fir would be absurd here.
     */
    dimensions: [4.3, 4.5, 4.4],
    label: 'Hazelnut tree',
    color: '#4E7A3A',
    placeholder: 'box',
    notes: 'Delivered 3 m buried 1.5 m, 30.92 MB; re-authored to 4.5 m on y = 0, 1.11 MB.',
  },
  {
    id: 'kit_trabzon_trabzonspor_crest',
    modelUrl: '/assets/props/kit_trabzon_trabzonspor_crest.glb',
    checksum: '28226d4463347e81dbb4f6cf87b73c5a91c633c339f48fccc2e670a46fa0716e',
    triangles: 9_907,
    transferBytes: 1_850_396,
    /**
     * The Trabzonspor crest, one each side of the street.
     *
     * Both faces measure the same claret and blue to within a few points of
     * saturation, so it is very likely printed on both — but that is an
     * inference from colour and not a look at it, and if the back turns out to
     * be blank it is a half turn on two backdrop entries.
     */
    dimensions: [1.87, 3.5, 0.89],
    label: 'Trabzonspor crest',
    color: '#7B1E3C',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 24.61 MB; re-authored to 3.5 m on y = 0, 1.76 MB.',
  },
  {
    id: 'kit_gull',
    modelUrl: '/assets/props/kit_gull.glb',
    checksum: '69604e1a8ef57e104354c80c72415b419b1858b7600bf354ea063cdd634c9156',
    triangles: 10_504,
    transferBytes: 1_125_364,
    /**
     * Birds over the city. Skinned, with one 2.62 s flap.
     *
     * **The triple below is armature scale and draws nothing.** It is the box
     * around the skeleton in bind pose, which is what the file measures and
     * what the aspect test reads; the mesh inside it is a bird 0.53 m across
     * the wings. Height is a useless key for a shape held flat with its wings
     * out — the same trap as three geese at one height in different poses
     * (D-129), taken to its limit.
     *
     * So this one is not mounted by `AssetInstance` at all. `Birds` scales it
     * off the wingspan it measures on load and flies it, the way the heroes
     * are handled. The file is the delivery untouched, which is why the
     * checksum is the one the download had.
     *
     * Renamed from `kit_trabzon_bird` when Balıkesir asked for the same birds.
     * A `kit_` asset is one whose cost is paid in every province that uses it
     * (D-036), and a province name inside one is a promise the file cannot
     * keep — this is a gull, and gulls are not Trabzon's.
     */
    dimensions: [3.07, 10.65, 27.19],
    label: 'Bird',
    color: '#5A5148',
    placeholder: 'box',
    notes: 'Delivered unmodified. Armature at 0.01; the mesh is 0.53 m across the wings and Birds scales it to 1.6.',
  },
  {
    id: 'city_trabzon_harbour',
    modelUrl: '/assets/city/city_trabzon_harbour.glb',
    checksum: '7e9db31fef113e69b27b6de4b315f2d5730dcb9b5ad4f1acf4d1adb21d99a96c',
    triangles: 10_159,
    transferBytes: 932_252,
    /**
     * The wharf, standing on the shoreline with the sea behind it.
     *
     * The same mesh as the delivery that was pulled: identical triangle count
     * and an identical colour profile band for band, re-exported into a
     * different normalising box. What changed is not the model — it is that
     * there is now water behind it. It failed the first time because it stood
     * on the edge of a ground plane with sky underneath, which no amount of
     * detail survives.
     *
     * Still no water in it, and that is now correct: Trabzon's sea is a plane
     * and the shoreline is one constant everything is measured off (D-163).
     */
    dimensions: [10.51, 5.0, 8.01],
    label: 'Fishing wharf',
    color: '#8C8071',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 24.35 MB; re-authored to 5 m on y = 0, 0.89 MB.',
  },
  {
    id: 'city_trabzon_sumela_fresco_door',
    modelUrl: '/assets/city/city_trabzon_sumela_fresco_door.glb',
    checksum: 'b3fb6028d5391a90486389d85b5d9764de9f2e775f507689f9083b423423cda1',
    triangles: 10_105,
    transferBytes: 2_094_524,
    /**
     * Stop one: the rock-cut doorway, painted.
     *
     * Sümela itself is 88 m up the valley and 26 m tall, because a child cannot
     * climb 300 m and a stop object is something to walk up to (D-066). This is
     * the half of it that can be stood in front of.
     *
     * **It is hollow.** Gridding the lower half of the mesh shows two solid
     * piers with a void between them and a recess behind — an arch, not a slab.
     * The recorded footprint is the file's own and the collider is a single box
     * over the whole of it, which is right while the doorway is something a
     * child looks at. If it should be something they can step *into*, that is
     * `colliderParts` with two piers and a passage, the way both the Gaziantep
     * and Kapalıçarşı gates are built (D-121 / D-125 / D-134).
     */
    dimensions: [2.92, 4.2, 2.41],
    label: 'Frescoed doorway',
    color: '#8C7355',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 23.77 MB; re-authored to 4.2 m on y = 0, 2.00 MB.',
  },
  {
    id: 'city_trabzon_kemence_stand',
    modelUrl: '/assets/city/city_trabzon_kemence_stand.glb',
    checksum: '82d3f6c6daf7bb18a85360a65ab7f63c5943fed874e0f33c40264d20a6d798d1',
    triangles: 9_711,
    transferBytes: 1_623_376,
    /**
     * Stop two: the kemençe, upright on its stand.
     *
     * Briefed as a village bandstand 2.4 m across. What arrived is 0.46 wide
     * for every one high and holds that width at every height — one tall narrow
     * object rather than a platform with things on it. So it is the instrument
     * on a stand and not the stage, which is the smaller idea but the clearer
     * one: a child walks up to the thing that makes the sound.
     *
     * Two point two metres is above a real one and that is deliberate — it is
     * a stop, and the stop camera pulls back off the recorded height (D-050 /
     * D-051), so an instrument at its true size would be framed from a metre
     * away and read as a prop the guide happened to drop.
     */
    dimensions: [1.01, 2.2, 1.12],
    label: 'Kemençe',
    color: '#93552C',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 19.71 MB; re-authored to 2.2 m on y = 0, 1.55 MB.',
  },
  {
    id: 'city_trabzon_hamsi_stall',
    modelUrl: '/assets/city/city_trabzon_hamsi_stall.glb',
    checksum: '246ee9a4e97ad5fa5c38ea1fad6369c198ba60547917dc4d33b874b9dde2ebaa',
    triangles: 9_649,
    transferBytes: 2_375_352,
    /**
     * Stop three: hamsi and kuymak under an awning.
     *
     * The only one of the three whose proportion came back close to what was
     * asked for — 1.18 wide for every one high against a briefed 1.08 — and its
     * colour bands say it is what the brief described without needing a look:
     * blue through the awning at two thirds height, white on the tray at half,
     * timber everywhere else.
     */
    dimensions: [2.83, 2.4, 2.36],
    label: 'Hamsi stall',
    color: '#7E5C3A',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 27.42 MB; re-authored to 2.4 m on y = 0, 2.27 MB.',
  },
  {
    id: 'kit_trabzon_fishing_boat',
    modelUrl: '/assets/props/kit_trabzon_fishing_boat.glb',
    checksum: '8622cf60d8fb9ad9f052f3845b1b0e5bc52a891fa70ea0f98d0f2637110d64b3',
    triangles: 9_801,
    transferBytes: 993_276,
    /**
     * A hamsi boat, and the only one of the five whose measurements match what
     * was asked for: 6.05 long against a briefed 7, on a 1.78 aspect.
     *
     * Its colour profile reads as a boat without a look — blue through the hull
     * bands, bare timber in the bottom fifth where a keel is, and a narrow top
     * tenth that is the wheelhouse. It is the one delivery here that is not
     * resting on its file name.
     *
     * Not placed yet. It has nothing to float on until the lake arrives, and a
     * boat sitting on grass is worse than no boat — the way Kars's geese and
     * Bolu's deer were held until they had somewhere to be (D-129).
     */
    dimensions: [8.0, 4.5, 3.22],
    label: 'Hamsi boat',
    color: '#2E6E9E',
    placeholder: 'box',
    notes: 'Delivered 2 m buried 1 m, 24.28 MB; re-authored to 4.5 m on y = 0, 0.95 MB.',
  },
];

export function deliveredProps(): readonly DeliveredProp[] {
  return DELIVERED_PROPS;
}

export interface AssetEntry {
  /** Logical id used by content. Components never reference file paths directly. */
  readonly id: string;
  /** Final GLB path per quality tier. Empty while the asset is still briefed. */
  readonly models?: Partial<Record<QualityTier, string>>;
  /** Geometry drawn until a real GLB arrives (CLAUDE.md rule 10, D-008). */
  readonly placeholder: PlaceholderShape;
  /** Width, height, depth in metres, straight from the manifest. */
  readonly dimensions: readonly [number, number, number];
  readonly color: string;
  readonly label: string;
  /**
   * Lift the model so its lowest point rests on y = 0.
   *
   * Meshy centres a model's origin as often as it grounds it. Measuring the
   * mounted model is more reliable than trusting the export or a hand-written
   * offset, and it costs nothing when the pivot is already correct.
   */
  readonly groundAlign: boolean;
  /** Present when the object is solid in places and open in others. */
  readonly colliderParts?: readonly ColliderPart[];
  readonly manifest: ManifestEntry;
}

/**
 * Model delivery table.
 *
 * Keyed by manifest asset id; every value is a GLB path served from /public.
 * This is the ONLY place a file path may appear — an ESLint rule rejects
 * `.glb` strings in components. All 25 manifest rows are still `briefed` or
 * `placeholder`, so this table is empty and every asset resolves to primitive
 * geometry (D-008).
 */
const MODELS: Readonly<Record<string, Partial<Record<QualityTier, string>>>> = {};

/**
 * Presentation overlay: graybox colour and human-readable label.
 * Not in the CSV because these are engineering scaffolding, not art direction.
 * Anything missing here falls back to a tier-derived default, so a new
 * manifest row never breaks the build.
 */
const PRESENTATION: Readonly<Record<string, { color: string; label: string }>> = {
  character_nasreddin_hoca_base: { color: '#F2B233', label: 'Nasreddin Hoca' },
  character_keloglan_base: { color: '#E0322F', label: 'Keloğlan' },
  shared_route_marker: { color: '#3EC6C9', label: 'Rota işareti' },
  shared_interaction_highlight: { color: '#F2B233', label: 'Etkileşim vurgusu' },
  kit_marmara_urban_coastal: { color: '#8FA6B8', label: 'Marmara kenti kiti' },
  kit_central_anatolia_cappadocia: { color: '#D8C3A5', label: 'Kapadokya kiti' },
  kit_southeastern_yellow_stone_bazaar: { color: '#D9B471', label: 'Sarı taş çarşı kiti' },
  city_istanbul_iznik_tile_panel: { color: '#1B7FA8', label: 'İznik çini paneli' },
  city_istanbul_galata_tower: { color: '#C9BBA1', label: 'Galata Kulesi' },
  city_istanbul_ferry: { color: '#FFF8E7', label: 'Şehir hattı vapuru' },
  city_nevsehir_fairy_chimney_cluster: { color: '#D8C3A5', label: 'Peri bacaları' },
  city_nevsehir_pottery_wheel: { color: '#8C5A3B', label: 'Çömlekçi çarkı' },
  city_nevsehir_underground_stone_door: { color: '#9A8E7A', label: 'Yeraltı taş kapısı' },
  city_gaziantep_zeugma_mosaic_panel: { color: '#C96A2B', label: 'Zeugma mozaik paneli' },
  city_gaziantep_baklava_counter: { color: '#4CAF7D', label: 'Baklava tezgâhı' },
  city_gaziantep_coppersmith_workbench: { color: '#B87333', label: 'Bakırcı tezgâhı' },
  collectible_istanbul_iznik_tile: { color: '#1B7FA8', label: 'İznik çinisi' },
  collectible_istanbul_legend_wings: { color: '#F2B233', label: 'Efsane kanatları' },
  collectible_istanbul_ferry_token: { color: '#16324F', label: 'Vapur jetonu' },
  collectible_nevsehir_fairy_chimney: { color: '#D8C3A5', label: 'Peri bacası minyatürü' },
  collectible_nevsehir_clay_pot: { color: '#8C5A3B', label: 'Toprak testi' },
  collectible_nevsehir_lantern: { color: '#F2B233', label: 'Yeraltı feneri' },
  collectible_gaziantep_mosaic_piece: { color: '#C96A2B', label: 'Mozaik parçası' },
  collectible_gaziantep_baklava: { color: '#4CAF7D', label: 'Baklava dilimi' },
  collectible_gaziantep_copper_pot: { color: '#B87333', label: 'Bakır cezve' },
};

const TIER_COLOR: Readonly<Record<string, string>> = {
  hero: '#C9BBA1',
  midground: '#A8907A',
  background: '#B8B0A2',
  collectible: '#F2B233',
  system: '#3EC6C9',
};

function propToEntry(prop: DeliveredProp): AssetEntry {
  return {
    id: prop.id,
    models: { low: prop.modelUrl, medium: prop.modelUrl, high: prop.modelUrl },
    placeholder: prop.placeholder,
    dimensions: prop.dimensions,
    color: prop.color,
    label: prop.label,
    groundAlign: true,
    colliderParts: prop.colliderParts,
    manifest: {
      id: prop.id,
      kind: 'model',
      tier: 'midground',
      status: 'delivered',
      dimensions: prop.dimensions,
      triangleBudget: prop.triangles,
      textureBudget: null,
      fallbackShape: prop.placeholder,
      notes: prop.notes ?? '',
    },
  };
}

function toAssetEntry(manifest: ManifestEntry): AssetEntry {
  const presentation = PRESENTATION[manifest.id];
  const models = MODELS[manifest.id];
  return {
    id: manifest.id,
    ...(models ? { models } : {}),
    placeholder: manifest.fallbackShape,
    dimensions: manifest.dimensions,
    color: presentation?.color ?? TIER_COLOR[manifest.tier] ?? '#9AA5B1',
    label: presentation?.label ?? manifest.id,
    groundAlign: false,
    manifest,
  };
}

const DELIVERED_BY_ID = new Map(DELIVERED_PROPS.map((prop) => [prop.id, prop]));

/**
 * A delivered model attaches to its manifest row rather than replacing it.
 *
 * Galata Tower is both: a commissioned row in the pilot manifest, which carries
 * its tier and triangle budget, and now a delivered file. Registering it only as
 * a delivered prop silently dropped the budget it was commissioned against —
 * exactly the record you want when asking whether a delivery met its brief.
 */
function withDeliveredModel(entry: AssetEntry, prop: DeliveredProp): AssetEntry {
  return {
    ...entry,
    models: { low: prop.modelUrl, medium: prop.modelUrl, high: prop.modelUrl },
    dimensions: prop.dimensions,
    groundAlign: true,
    manifest: { ...entry.manifest, status: 'delivered' },
  };
}

const BY_ID = new Map<string, AssetEntry>([
  ...MANIFEST_ENTRIES.map((entry): [string, AssetEntry] => {
    const base = toAssetEntry(entry);
    const delivered = DELIVERED_BY_ID.get(entry.id);
    return [entry.id, delivered ? withDeliveredModel(base, delivered) : base];
  }),
  // Kit props and city props that were never briefed as manifest rows.
  ...DELIVERED_PROPS.filter((prop) => !MANIFEST_ENTRIES.some((entry) => entry.id === prop.id)).map(
    (prop): [string, AssetEntry] => [prop.id, propToEntry(prop)],
  ),
]);

/**
 * Environment kits are referenced by content as `marmara-urban-coastal` while
 * the manifest ids them as `kit_marmara_urban_coastal`. This is a documented
 * deterministic rule, not a rename of either side (Gate A finding A-01).
 */
export function kitAssetId(kitId: string): string {
  return kitId.startsWith('kit_') ? kitId : `kit_${kitId.replace(/-/g, '_')}`;
}

/**
 * Province stars are UI awards, not 3D assets, so they are intentionally
 * absent from the manifest and must not be resolved through this registry.
 */
export function isModelAsset(assetId: string): boolean {
  return !assetId.startsWith('star_');
}

export interface ResolvedAsset {
  readonly entry: AssetEntry;
  readonly modelUrl: string | null;
  /** True when no GLB exists yet and placeholder geometry is drawn. */
  readonly isPlaceholder: boolean;
  /** True when the id is absent from the manifest — a content bug. */
  readonly isUnknown: boolean;
}

/**
 * Graybox stand-ins for migrated content.
 *
 * The prototype has 53 distinct art types across 81 provinces; the Meshy
 * manifest only commissions art for the three pilot cities. Rather than let
 * every other stop resolve as "unknown" — which would bury real content bugs
 * in noise — migrated stops resolve to a documented stand-in. These are NOT
 * commissioned art: `docs/MIGRATION_GAPS.md` lists every one that still needs
 * a brief.
 */
const GRAYBOX_SHAPES: Readonly<Record<string, { shape: PlaceholderShape; dimensions: readonly [number, number, number] }>> = {
  bazaar: { shape: 'box', dimensions: [8, 5, 8] },
  simit: { shape: 'box', dimensions: [1.6, 1.4, 0.9] },
  balloon: { shape: 'sphere', dimensions: [6, 8, 6] },
  loom: { shape: 'box', dimensions: [2.2, 1.8, 1.2] },
  chimneys: { shape: 'cylinder', dimensions: [10, 14, 10] },
  cave: { shape: 'cylinder', dimensions: [2.4, 2.4, 0.6] },
  mosque: { shape: 'box', dimensions: [12, 14, 12] },
  theatre: { shape: 'cylinder', dimensions: [14, 5, 14] },
  gol: { shape: 'box', dimensions: [16, 0.2, 16] },
  selale: { shape: 'box', dimensions: [6, 10, 3] },
};

const DEFAULT_GRAYBOX = { shape: 'box' as PlaceholderShape, dimensions: [2.4, 2.4, 2.4] as const };

function grayboxEntry(id: string): AssetEntry {
  const key = id.replace(/^graybox_/, '');
  const shape = GRAYBOX_SHAPES[key] ?? DEFAULT_GRAYBOX;
  const isCollectible = id.startsWith('collectible_');
  return {
    id,
    placeholder: isCollectible ? 'box' : shape.shape,
    dimensions: isCollectible ? [0.22, 0.22, 0.22] : shape.dimensions,
    color: isCollectible ? '#F2B233' : '#A89880',
    label: key.replace(/_/g, ' '),
    groundAlign: false,
    manifest: {
      id,
      kind: 'model',
      tier: isCollectible ? 'collectible' : 'midground',
      status: 'graybox',
      dimensions: isCollectible ? [0.22, 0.22, 0.22] : shape.dimensions,
      triangleBudget: null,
      textureBudget: null,
      fallbackShape: isCollectible ? 'box' : shape.shape,
      notes: 'Graybox stand-in for migrated content; needs a Meshy brief.',
    },
  };
}

/** True when an id resolves to a stand-in rather than commissioned art. */
export function isGraybox(assetId: string): boolean {
  return assetId.startsWith('graybox_') || assetId.startsWith('collectible_');
}

function unknownEntry(id: string): AssetEntry {
  return {
    id,
    placeholder: 'box',
    dimensions: [1, 1, 1],
    color: '#E0322F',
    label: `Eksik varlık: ${id}`,
    groundAlign: false,
    manifest: {
      id,
      kind: 'unknown',
      tier: 'unknown',
      status: 'missing',
      dimensions: [1, 1, 1],
      triangleBudget: null,
      textureBudget: null,
      fallbackShape: 'box',
      notes: 'Not present in asset-manifests/pilot-assets.csv',
    },
  };
}

/**
 * Resolves a logical asset id. Never throws: a missing asset renders a named
 * diagnostic placeholder so one bad id cannot break a city
 * (TECHNICAL_ARCHITECTURE, error strategy).
 */
export function resolveAsset(assetId: string, quality: QualityTier): ResolvedAsset {
  const entry = BY_ID.get(assetId);
  if (!entry) {
    if (isGraybox(assetId)) {
      return { entry: grayboxEntry(assetId), modelUrl: null, isPlaceholder: true, isUnknown: false };
    }
    return { entry: unknownEntry(assetId), modelUrl: null, isPlaceholder: true, isUnknown: true };
  }
  const path = entry.models?.[quality] ?? entry.models?.medium ?? entry.models?.low ?? null;
  const modelUrl = assetUrl(path);
  return { entry, modelUrl, isPlaceholder: modelUrl === null, isUnknown: false };
}

export function knownAssetIds(): readonly string[] {
  return [...BY_ID.keys()];
}

export function manifestEntries(): readonly ManifestEntry[] {
  return MANIFEST_ENTRIES;
}
