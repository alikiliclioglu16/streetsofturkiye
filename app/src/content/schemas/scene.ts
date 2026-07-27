import { z } from 'zod';
import { localizedTextSchema } from '@/content/schemas/canonical';

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
  triggerRadius: z.number().positive(),
  camera: z.object({
    position: vec3Schema,
    target: vec3Schema,
    durationMs: z.number().nonnegative(),
  }),
  interaction: z.object({
    type: interactionTypeSchema,
    mechanics: z.object({
      targetId: z.string(),
      hintAfterAttempts: z.number().int().positive().optional(),
      /** Wrong answers are canonical rewards from other stops, referenced by id. */
      decoyStopIds: z.array(z.string()).default([]),
    }),
    /**
     * Gameplay instructions only. `{reward}` is substituted at runtime with the
     * canonical reward label; canonical prose is never stored here.
     */
    gameplayCopy: z.object({ instruction: localizedTextSchema }).optional(),
  }),
  rewardAssetId: z.string(),
  audio: z.object({ onSuccessId: z.string().optional() }).optional(),
});
export type SceneHotspot = z.infer<typeof sceneHotspotSchema>;

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
