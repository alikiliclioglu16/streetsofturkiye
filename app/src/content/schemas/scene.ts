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
  /** False for dressing the player walks through, like a stray cat. */
  solid: z.boolean().default(true),
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
      })
      .nullable()
      .default(null),
    /** The city's theme, or null where none has been chosen yet. */
    musicUrl: z.string().nullable().default(null),
    /** Which ground surface this region has. */
    groundSurface: z.enum(['cobblestone', 'redsand', 'steppe', 'rock']).default('cobblestone'),
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
    canoeLines: z
      .array(
        z.object({
          from: z.tuple([z.number(), z.number()]),
          to: z.tuple([z.number(), z.number()]),
          speed: z.number().positive(),
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
    animal: z.enum(['cat', 'horse', 'goose', 'dog', 'vancat', 'none']).default('cat'),
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
