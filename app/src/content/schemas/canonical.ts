import { z } from 'zod';

/**
 * Canonical educational content.
 *
 * `content/canonical/` is derived deterministically from the source HTML and is
 * READ-ONLY authority (DECISION_LOG D-011). Nothing in the engine may rewrite,
 * shorten, translate or fact-check-edit these strings. Scene files reference
 * these records by id and must never copy their prose.
 */

export const localizedTextSchema = z.object({
  en: z.string().nullable(),
  tr: z.string().nullable(),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const canonicalCategorySchema = z.enum(['history', 'food', 'craft', 'nature']);
export type CanonicalCategory = z.infer<typeof canonicalCategorySchema>;

export const canonicalStopSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  sourceTupleIndex: z.number().int().nonnegative(),
  legacyArt: z.object({
    type: z.string(),
    params: z.record(z.string(), z.unknown()).default({}),
  }),
  category: canonicalCategorySchema,
  title: localizedTextSchema,
  description: localizedTextSchema,
  reward: z.object({
    emoji: z.string(),
    label: localizedTextSchema,
  }),
  guideLine: z.object({
    text: localizedTextSchema,
    source: z.string(),
  }),
});
export type CanonicalStop = z.infer<typeof canonicalStopSchema>;

export const canonicalQuizOptionSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  text: localizedTextSchema,
  correct: z.boolean(),
});
export type CanonicalQuizOption = z.infer<typeof canonicalQuizOptionSchema>;

export const canonicalQuizSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  question: localizedTextSchema,
  options: z.array(canonicalQuizOptionSchema).min(2),
  sourceRule: z.string().optional(),
});
export type CanonicalQuiz = z.infer<typeof canonicalQuizSchema>;

export const canonicalCitySchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    contentAuthority: z.literal('index-html-canonical'),
    source: z.object({
      file: z.string(),
      sha256: z.string().length(64),
      cityArray: z.string(),
      cityArrayIndex: z.number().int().nonnegative(),
    }),
    id: z.string(),
    order: z.number().int().min(1).max(81),
    name: localizedTextSchema,
    regionId: z.string(),
    sourceRegionIndex: z.number().int().min(0).max(6),
    coordinates: z.object({ longitude: z.number(), latitude: z.number() }),
    legacyGuideId: z.enum(['keloglan', 'nasreddin-hoca']),
    stops: z.array(canonicalStopSchema).min(1),
    /** Cardinality follows the source: 78 cities have one question, 3 have two. */
    quiz: z.array(canonicalQuizSchema).min(1),
  })
  .superRefine((city, ctx) => {
    for (const quiz of city.quiz) {
      const correct = quiz.options.filter((option) => option.correct).length;
      if (correct !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: `${quiz.id}: expected exactly one correct option, found ${correct}`,
          path: ['quiz'],
        });
      }
    }
  });
export type CanonicalCity = z.infer<typeof canonicalCitySchema>;

export const canonicalRegionSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  name: localizedTextSchema,
  sourceRegionIndex: z.number().int().min(0).max(6),
  sourceVisual: z.object({
    color: z.string(),
    sky: z.array(z.string()),
    ground: z.string(),
  }),
});
export type CanonicalRegion = z.infer<typeof canonicalRegionSchema>;

export const canonicalRegionsSchema = z.array(canonicalRegionSchema).length(7);

export const canonicalIndexEntrySchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  name: localizedTextSchema,
  regionId: z.string(),
  coordinates: z.object({ longitude: z.number(), latitude: z.number() }),
  legacyGuideId: z.string(),
  stopCount: z.number().int().positive(),
  quizQuestionCount: z.number().int().positive(),
  path: z.string(),
});
export type CanonicalIndexEntry = z.infer<typeof canonicalIndexEntrySchema>;

export const canonicalIndexSchema = z.object({
  schemaVersion: z.literal('1.0'),
  sourceSha256: z.string().length(64),
  cities: z.array(canonicalIndexEntrySchema).length(81),
});

export const canonicalManifestSchema = z.object({
  packageVersion: z.string(),
  sourceFile: z.string(),
  sourceSha256: z.string().length(64),
  sourceLanguage: z.literal('en'),
  counts: z.object({
    regions: z.literal(7),
    cities: z.literal(81),
    stops: z.literal(249),
    quizQuestions: z.literal(84),
    citiesWithOneQuestion: z.literal(78),
    citiesWithTwoQuestions: z.literal(3),
  }),
});
export type CanonicalManifest = z.infer<typeof canonicalManifestSchema>;
