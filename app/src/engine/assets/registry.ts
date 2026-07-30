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
