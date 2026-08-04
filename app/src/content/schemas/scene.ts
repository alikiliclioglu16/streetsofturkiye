import { z } from 'zod';

/**
 * Technical scene data.
 *
 * Holds 3D and gameplay concerns only: environment, route, transforms, assets,
 * cameras, trigger radii, interaction mechanics and audio ids. Educational
 * strings live in content/canonical/ and are reached through `contentRef`.
 * `validate-content.mjs` fails the build if canonical prose appears here.
 */

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof vec3Schema>;

const transformSchema = z.object({
  position: vec3Schema,
  rotation: vec3Schema,
  scale: vec3Schema,
});
export type Transform = z.infer<typeof transformSchema>;

export const interactionTypeSchema = z.enum([
  'inspect-and-find',
  'sequence-select',
  'rhythm-repeat',
  'assemble',
  'observe-and-answer',
  'simple-choice',
]);
export type InteractionType = z.infer<typeof interactionTypeSchema>;

/** A hotspot with no scene yet still reports its canonical stop to the player. */
export const sceneStatusSchema = z.enum(['ready', 'pending']);
export type SceneStatus = z.infer<typeof sceneStatusSchema>;

export const sceneHotspotSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  contentRef: z.object({ stopId: z.string() }),
  sceneStatus: sceneStatusSchema,
  assetId: z.string(),
  assetStatus: z.enum(['commissioned', 'graybox']),
  transform: transformSchema,
  /**
   * Solid footprint on the ground plane, half-extents in metres. The player
   * walks around it. Derived from the asset manifest, so a stop's collider
   * always matches whatever will eventually stand there.
   */
  collider: z.object({
    halfWidth: z.number().positive(),
    halfDepth: z.number().positive(),
  }),
  triggerRadius: z.number().positive(),
  camera: z.object({
    position: vec3Schema,
    target: vec3Schema,
    durationMs: z.number().nonnegative(),
  }),
  /**
   * How the stop is presented. Stops present and hand over the collectible, so
   * there is no answer mechanic here — an earlier build invented one.
   */
  presentation: z.object({ style: z.literal('fact-card') }),
  rewardAssetId: z.string(),
  audio: z.object({ onSuccessId: z.string().optional() }).optional(),
});
export type SceneHotspot = z.infer<typeof sceneHotspotSchema>;

/** A static piece of set dressing. No content, no interaction, no state. */
export const scenePropSchema = z.object({
  assetId: z.string(),
  position: vec3Schema,
  rotationY: z.number().default(0),
  /**
   * Tilt about the X axis, in radians. Almost always zero.
   *
   * A landscape plate is a wall seen edge-on and that is right for a ridge, a
   * cliff or a row of houses. It is wrong for a plate whose subject is its
   * *top* — Perşembe Yaylası is a disc with a river, paths and farmhouses laid
   * across it, and stood upright a child sees only its rim.
   */
  rotationX: z.number().default(0),
  /** False for dressing the player walks through, like a stray cat. */
  solid: z.boolean().default(true),
  /**
   * What the generator called this piece, carried through rather than dropped.
   *
   * The generator has always written one and the schema has always thrown it
   * away, which meant the only way to ask "is this street planted" was to count
   * a list that six cities no longer use. Kept optional: it describes a piece,
   * it never drives one.
   */
  note: z.string().optional(),
});
export type SceneProp = z.infer<typeof scenePropSchema>;

/**
 * A static prop placed in the street. Reusable across cities, so it carries no
 * content of its own — only an asset id and where it stands.
 */

export const sceneSchema = z
  .object({
    schemaVersion: z.literal('2.0.0'),
    id: z.string(),
    contentRef: z.object({ cityId: z.string() }),
    canonicalSource: z.object({ sha256: z.string().length(64) }),
    environment: z.object({
      kitId: z.string(),
      timeOfDay: z.string(),
      ambientAudioId: z.string().optional(),
      skyPreset: z.array(z.string()).optional(),
      groundColor: z.string().optional(),
      /**
       * A second, shadowless light from where the child is standing.
       *
       * The city's one directional light comes from up and to the right, and
       * only 37% of it reaches a face turned towards the street. That is enough
       * on pale stone and not enough on dark wood or black stone: Bolu's
       * smokehouse and Erzurum's oltu bench both went dark on the side a child
       * looks at, which is the only side that has anything on it.
       *
       * Deliberately narrow in what it changes. It arrives almost horizontally
       * from the camera's side, so a vertical face takes nearly all of it and
       * the ground takes a third — Erzurum can have its bench lifted without
       * its snow blowing out. Raising the hemisphere light instead would have
       * done the opposite in both cities.
       *
       * Zero everywhere it is not asked for, so no finished city changes by
       * default (D-156).
       */
      fillLight: z.number().min(0).max(1.2).default(0),
    }),
    guide: z.object({ assetId: z.string() }),
    spawn: transformSchema,
    route: z.object({
      mode: z.string(),
      points: z.array(vec3Schema).min(2),
      bounds: z.array(vec3Schema).min(3),
    }),
    intro: z.object({
      cameraSequenceId: z.string().nullable(),
      skippable: z.boolean(),
    }),
    hotspots: z.array(sceneHotspotSchema).min(1),
    /** Street dressing, shared across cities; absent in older scene files. */
    props: z.array(scenePropSchema).default([]),
    /**
     * Walking routes for the street cats, in world metres. Two or three
     * waypoints each: these are animals crossing a pavement, not patrols.
     */
    /** People standing in the street. They carry no content and block nothing. */
    npcs: z
      .array(
        z.object({
          npcId: z.enum(['featured_soldier', 'featured_traveler', 'featured_craftsman_male']),
          position: vec3Schema,
          rotationY: z.number().default(0),
          /**
           * The far end of a short beat this person walks and returns along.
           * A person rooted to one spot for a whole visit reads as a statue of
           * a person.
           */
          walkTo: vec3Schema.nullable().default(null),
          note: z.string().optional(),
        }),
      )
      .default([]),
    /** Procedural street trees; geometry is generated, not delivered. */
    trees: z
      .array(
        z.object({
          kind: z.enum(['cypress', 'plane', 'shrub', 'poplar']),
          position: vec3Schema,
          scale: z.number().positive().default(1),
          rotationY: z.number().default(0),
        }),
      )
      .default([]),
    /**
     * The sea beyond the quay. Absent in landlocked cities, which is most of
     * them — Nevşehir has no shoreline and should not be given one.
     */
    water: z
      .object({
        centerX: z.number(),
        centerZ: z.number(),
        width: z.number().positive(),
        depth: z.number().positive(),
        color: z.string(),
        /**
         * Still water.
         *
         * The plane breathes a few centimetres by default, which reads as sea
         * at fifty metres and costs two triangles. It does not read as sea when
         * the whole surface is in frame at once and the far edge is 180 m out:
         * a plane that size moving as one slab is a lid lifting, not a swell.
         */
        still: z.boolean().default(false),
      })
      .nullable()
      .default(null),
    /** The city's theme, or null where none has been chosen yet. */
    musicUrl: z.string().nullable().default(null),
    /** Which ground surface this region has. */
    /**
     * How far the ground is drawn past the play bounds, in metres a side.
     *
     * Two everywhere, which is the four-metre overrun every city has had. Not a
     * style choice: paving is scenery and bounds are gameplay, and things placed
     * outside the play area used to float over sky (D-082).
     *
     * Trabzon needs much more of it. Uzungöl is 55 m across against a 30 m
     * street, and its rim has to be *under* the square for a child to see water
     * over the last cobble rather than a bank. Buried is only buried if there
     * is ground on top of it, so the paving reaches the waterline.
     */
    groundPad: z
      .object({
        x: z.number().nonnegative(),
        front: z.number().nonnegative(),
        back: z.number().nonnegative(),
      })
      .default({ x: 2, front: 2, back: 2 }),
    groundSurface: z.enum(['cobblestone', 'redsand', 'steppe', 'rock', 'forest', 'snow']).default('cobblestone'),
    /**
     * Patches of a different ground, laid over the city's own.
     *
     * One surface per city is right almost everywhere. Ani is the exception:
     * the site is bare rock and the geese need grass to stand on.
     */
    groundPatches: z
      .array(
        z.object({
          position: vec3Schema,
          radius: z.number().positive(),
          surface: z.enum(['grass']),
          color: z.string(),
        }),
      )
      .default([]),
    /** Balloons drifting over the city, if it is a city that has them. */
    balloons: z
      .array(
        z.object({
          key: z.string(),
          position: vec3Schema,
          scale: z.number().positive(),
          driftSpeed: z.number().positive(),
          phase: z.number(),
        }),
      )
      .default([]),
    /**
     * Paragliders circling over the city, if it is a city that has them.
     *
     * Same shape as a balloon because it is the same motion — something light
     * hanging in the air, drifting and turning. Only the model differs.
     */
    paragliders: z
      .array(
        z.object({
          key: z.string(),
          position: vec3Schema,
          scale: z.number().positive(),
          driftSpeed: z.number().positive(),
          phase: z.number(),
          driftAmplitude: z.number().positive().optional(),
        }),
      )
      .default([]),
    /** Both ends of the tram line, in world metres. Absent where there is no tram. */
    tramLine: z
      .object({ from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) })
      .nullable()
      .default(null),
    /**
     * A line something crosses the city on and leaves, rather than works.
     *
     * Both ends sit outside the play area on purpose: the train is never seen
     * to appear or vanish.
     */
    trainLine: z
      .object({ from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) })
      .nullable()
      .default(null),
    /**
     * Boats crossing the water, out and back. Three on Lake Van, so a child can
     * see that the lake is something you go *on* rather than something painted
     * at the end of the street.
     */
    /** A cable car working a line up a hill: out, pause, back. */
    cableCarLine: z
      .object({ from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) })
      .nullable()
      .default(null),
    /** A boat that crosses the water and leaves, on a clock. */
    ferryLine: z
      .object({ from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) })
      .nullable()
      .default(null),
    canoeLines: z
      .array(
        z.object({
          from: z.tuple([z.number(), z.number()]),
          to: z.tuple([z.number(), z.number()]),
          speed: z.number().positive(),
        }),
      )
      .default([]),
    /**
     * Bands of mist drifting across something, in world metres.
     *
     * Cloud on the face of Sümela is the one thing the canonical description
     * leans on that no model can carry: it is weather, and it has to move or it
     * is a grey smear painted on a rock.
     */
    /**
     * Birds circling over the city.
     *
     * A circle each rather than one flock on one path: five birds sharing a
     * ring fly as a bracelet, and the thing that reads as birds is that no two
     * of them are ever doing the same thing.
     */
    /**
     * Which bird flies here, and which craft works the water.
     *
     * Both used to be resolved from a hard-wired id, which was fine while one
     * city had birds and one city had boats and stopped being fine the moment a
     * second wanted either. A `kit_` asset is shared by definition; *which* one
     * a city uses is the city's business and belongs in its scene.
     */
    /**
     * Things that work a line: out, pause, back.
     *
     * One field, because it is one motion. It began as `boatLines` for
     * Trabzon's hamsi boats, was copied to carry Balıkesir's pelicans, and then
     * again as `cartLine` for Mardin's pedlar — three fields and two asset-id
     * fields for a single behaviour, and Erzurum's skiers would have made it
     * four. That is the drift a stale list has (D-127): every addition was
     * reasonable and the shape was wrong.
     *
     * D-136 still holds — different motions are different things, and the train
     * that crosses and leaves, the cable car that circles and the animals that
     * wander all stay separate. But a boat working a shore, a pelican paddling,
     * a pedlar pushing a cart and a skier running a street are all *this*, and
     * the asset is not the motion.
     *
     * `heights` carries the two ends' y, which is what a tilted lake needed and
     * a flat street does not.
     */
    shuttleLines: z
      .array(
        z.object({
          assetId: z.string(),
          from: z.tuple([z.number(), z.number()]),
          to: z.tuple([z.number(), z.number()]),
          heights: z.tuple([z.number(), z.number()]).default([0, 0]),
          speed: z.number().positive(),
        }),
      )
      .default([]),
    /**
     * Falling snow over the whole city.
     *
     * A flag rather than a shape: there is nothing to place and nothing to
     * measure, and a city either is in winter or is not.
     */
    /**
     * Which cabin rides the cable here.
     *
     * Resolved from a hard-wired pair until Erzurum wanted a chairlift too —
     * Bolu's chair or, failing that, Ordu's gondola, which would have hung a
     * Black Sea cable car over a ski piste. Same generalisation the birds and
     * the shuttles needed, and for the same reason: the asset is not the motion.
     */
    cableCarAssetId: z.string().nullable().default(null),
    snowfall: z.boolean().default(false),
    /**
     * Statues: a delivered model standing on a drawn plinth.
     *
     * The plinth is not an asset. A pedestal is a box with a lip on it, and
     * commissioning one would cost a registry entry and thirty megabytes of
     * baked texture to get a cuboid — the play bounds are drawn as primitives
     * for the same reason.
     */
    statues: z
      .array(
        z.object({
          assetId: z.string(),
          position: vec3Schema,
          rotationY: z.number(),
          plinthHeight: z.number().positive(),
          plinthWidth: z.number().positive(),
          stoneColor: z.string(),
        }),
      )
      .default([]),
    birdAssetId: z.string().nullable().default(null),
    birdPaths: z
      .array(
        z.object({
          centre: vec3Schema,
          radius: z.number().positive(),
          rate: z.number(),
          phase: z.number(),
          bob: z.number().nonnegative(),
        }),
      )
      .default([]),
    mistBands: z
      .array(
        z.object({
          centre: vec3Schema,
          width: z.number().positive(),
          height: z.number().positive(),
          drift: z.number(),
          opacity: z.number().min(0).max(1),
        }),
      )
      .default([]),
    /** Scenery beyond the play area: never reached, never collided with. */
    backdrop: z.array(scenePropSchema).default([]),
    catRoutes: z
      .array(z.array(z.object({ x: z.number(), z: z.number() })).min(2))
      .default([]),
    /**
     * Which animal walks this street.
     *
     * İstanbul's cats are one of the first things a child notices about the
     * city. Cappadocia is named for its horses — *Katpatuka*, the land of
     * beautiful horses — and has no street cats to speak of.
     */
    animal: z.enum(['cat', 'horse', 'goose', 'dog', 'vancat', 'deer', 'none']).default('cat'),
    quizPresentation: z.object({ shuffleOptions: z.boolean() }),
    rewards: z.object({
      cityStarId: z.string(),
      collectibleAssetIds: z.array(z.string()),
    }),
    estimatedMinutes: z.number().positive().optional(),
  })
  .superRefine((scene, ctx) => {
    const seen = new Set<string>();
    for (const hotspot of scene.hotspots) {
      if (seen.has(hotspot.id)) {
        ctx.addIssue({ code: 'custom', message: `Duplicate hotspot id: ${hotspot.id}`, path: ['hotspots'] });
      }
      seen.add(hotspot.id);
    }
    if (scene.id !== scene.contentRef.cityId) {
      ctx.addIssue({
        code: 'custom',
        message: `Scene id "${scene.id}" does not match contentRef "${scene.contentRef.cityId}"`,
        path: ['contentRef'],
      });
    }
  });
export type SceneDefinition = z.infer<typeof sceneSchema>;
