import { z } from 'zod';

/**
 * Runtime contract for city content.
 * Mirrors schemas/city.schema.json from the specification package.
 * External JSON is never trusted; every load goes through `citySchema`.
 */

export const localizedTextSchema = z.object({
  en: z.string().nullable(),
  tr: z.string().nullable(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;

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

const choiceOptionSchema = z.object({
  id: z.string(),
  text: localizedTextSchema,
  correct: z.boolean(),
});
export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

/**
 * Interaction config is intentionally permissive at the schema level and
 * narrowed per interaction type by the interaction registry. Phase 01
 * implements `inspect-and-find` fully; the rest resolve to the accessible
 * `simple-choice` fallback described in PRODUCT_REQUIREMENTS section 5.
 */
const interactionConfigSchema = z.object({
  targetId: z.string().optional(),
  instruction: localizedTextSchema.optional(),
  question: localizedTextSchema.optional(),
  hintAfterAttempts: z.number().int().positive().optional(),
  options: z.array(choiceOptionSchema).optional(),
});
export type InteractionConfig = z.infer<typeof interactionConfigSchema>;

const hotspotSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  assetId: z.string(),
  transform: transformSchema,
  triggerRadius: z.number().positive(),
  camera: z.object({
    position: vec3Schema,
    target: vec3Schema,
    durationMs: z.number().nonnegative(),
  }),
  interaction: z.object({
    type: interactionTypeSchema,
    config: interactionConfigSchema,
  }),
  fact: z.object({
    title: localizedTextSchema,
    body: localizedTextSchema,
    editorialStatus: z.string(),
  }),
  rewardId: z.string(),
});
export type HotspotDefinition = z.infer<typeof hotspotSchema>;

const quizItemSchema = z.object({
  id: z.string(),
  question: localizedTextSchema,
  options: z.array(choiceOptionSchema).min(2),
});
export type QuizItem = z.infer<typeof quizItemSchema>;

export const citySchema = z
  .object({
    schemaVersion: z.string(),
    id: z.string(),
    name: localizedTextSchema,
    regionId: z.string(),
    guideId: z.string(),
    estimatedMinutes: z.number().positive().optional(),
    coordinates: z.object({ longitude: z.number(), latitude: z.number() }),
    environment: z.object({
      kitId: z.string(),
      timeOfDay: z.string(),
      ambientAudioId: z.string().optional(),
      skyPreset: z.string().optional(),
      qualityNotes: z.array(z.string()).optional(),
    }),
    spawn: transformSchema,
    route: z.object({
      mode: z.string(),
      points: z.array(vec3Schema).min(2),
      bounds: z.array(vec3Schema).min(3),
    }),
    intro: z
      .object({
        title: localizedTextSchema,
        guideLine: localizedTextSchema,
        cameraSequenceId: z.string().optional(),
        skippable: z.boolean(),
      })
      .optional(),
    hotspots: z.array(hotspotSchema).min(1),
    /**
     * Production standard is two recall questions per city (owner decision,
     * 27 Jul 2026). One is still accepted so a city can be authored
     * incrementally; the content report flags the shortfall.
     */
    quiz: z.array(quizItemSchema).min(1),
    rewards: z.object({
      cityStarId: z.string(),
      collectibleIds: z.array(z.string()),
    }),
  })
  .superRefine((city, ctx) => {
    const hotspotIds = new Set<string>();
    for (const hotspot of city.hotspots) {
      if (hotspotIds.has(hotspot.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate hotspot id: ${hotspot.id}`,
          path: ['hotspots'],
        });
      }
      hotspotIds.add(hotspot.id);
    }

    const declared = new Set(city.rewards.collectibleIds);
    for (const hotspot of city.hotspots) {
      if (!declared.has(hotspot.rewardId)) {
        ctx.addIssue({
          code: 'custom',
          message: `Hotspot ${hotspot.id} awards ${hotspot.rewardId}, which is not listed in rewards.collectibleIds`,
          path: ['rewards', 'collectibleIds'],
        });
      }
    }

    for (const item of city.quiz) {
      if (!item.options.some((option) => option.correct)) {
        ctx.addIssue({
          code: 'custom',
          message: `Quiz item ${item.id} has no correct option`,
          path: ['quiz'],
        });
      }
    }
  });

export type CityDefinition = z.infer<typeof citySchema>;

/** Questions every finished city must ship with. */
export const REQUIRED_QUIZ_ITEMS = 2;

export function meetsQuizStandard(city: CityDefinition): boolean {
  return city.quiz.length >= REQUIRED_QUIZ_ITEMS;
}

export const regionSchema = z.object({
  id: z.string(),
  legacyIndex: z.number().int().nonnegative(),
  name: localizedTextSchema,
  color: z.string(),
});
export type Region = z.infer<typeof regionSchema>;

export const regionsSchema = z.array(regionSchema).min(1);
