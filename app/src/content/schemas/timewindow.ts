import { z } from 'zod';

/**
 * Zaman Penceresi — the schema.
 *
 * A Time Window is 8–12 seconds in the 3D scene that replaces the fact card at
 * a stop: a camera move, one visual event, one sound, one sentence, then the
 * stop's existing collectible. `docs/TIME_WINDOW_DESIGN.md` has all 63 of them
 * designed; this file is what the runtime will accept.
 *
 * **Everything here is a closed union on purpose.** Left open, sixty-three
 * stops would invent sixty-three effect names and the system would stop being
 * reusable, which is the only reason to build it this way at all. An unknown
 * `do` or `preset` is a schema error, not a silently ignored key.
 *
 * This data lives in `content/timewindows/`, **beside canonical content and
 * never inside it**. Canonical is bound to the `index-html-canonical` authority
 * and verified by SHA; a Time Window is derived material written by this
 * project, and the two must not mix.
 */

/**
 * Both languages, from the first line.
 *
 * Canonical stop text carries `{ en, tr }` with `tr` empty everywhere, because
 * the source it came from was English. Time Window captions are written here
 * rather than migrated, so there is no reason to repeat that: both are
 * required, and a window cannot ship half-translated.
 */
export const captionTextSchema = z.object({
  tr: z.string().min(1),
  en: z.string().min(1),
});

/**
 * The caption standard, enforced rather than described.
 *
 * Ninety characters and one sentence, because the whole point of this system is
 * that a child looks at the scene instead of reading. A caption that grows past
 * this is the old fact card coming back in a smaller font.
 */
export const CAPTION_MAX_CHARS = 90;
/** The shortest a caption may be left on screen. */
export const CAPTION_MIN_SECONDS = 4;

const captionWithin = (text: string) => text.length <= CAPTION_MAX_CHARS;

export const captionSchema = captionTextSchema
  .refine((value) => captionWithin(value.tr), {
    message: `Turkish caption is longer than ${CAPTION_MAX_CHARS} characters`,
    path: ['tr'],
  })
  .refine((value) => captionWithin(value.en), {
    message: `English caption is longer than ${CAPTION_MAX_CHARS} characters`,
    path: ['en'],
  });

/**
 * What a window may do to the scene.
 *
 * Twelve commands, and the list does not grow without a decision. Each one is
 * something the engine already knows how to do or can do in a few lines; none
 * of them is a stop-specific behaviour.
 */
export const commandSchema = z.discriminatedUnion('do', [
  /** Ambient light down to a fraction of its normal strength, and back. */
  z.object({ do: z.literal('dim'), at: z.number().min(0), to: z.number().min(0).max(1) }),
  /** One sound cue, by name. Procedural by default (see `cues.ts`). */
  z.object({ do: z.literal('sound'), at: z.number().min(0), cue: z.string().min(1) }),
  /**
   * A temporary object, with an id.
   *
   * The id is required because cleanup runs off these ids. "Sweep the scene for
   * temporary objects" leaves a stray behind the first time two windows
   * overlap, and the stray is then someone else's bug.
   */
  z.object({
    do: z.literal('spawn'),
    at: z.number().min(0),
    id: z.string().min(1),
    /** A registry asset id. Validated against the scene before the window runs. */
    asset: z.string().min(1),
    from: z.tuple([z.number(), z.number(), z.number()]),
    scale: z.number().positive().default(1),
  }),
  z.object({ do: z.literal('despawn'), at: z.number().min(0), id: z.string().min(1) }),
  z.object({
    do: z.literal('move'),
    at: z.number().min(0),
    id: z.string().min(1),
    to: z.tuple([z.number(), z.number(), z.number()]),
    seconds: z.number().positive(),
    /** `arc` lifts through the middle of the path; `line` goes straight. */
    curve: z.enum(['line', 'arc']).default('line'),
  }),
  z.object({
    do: z.literal('rotate'),
    at: z.number().min(0),
    id: z.string().min(1),
    turns: z.number(),
    seconds: z.number().positive(),
  }),
  z.object({
    do: z.literal('scale'),
    at: z.number().min(0),
    id: z.string().min(1),
    to: z.number().positive(),
    seconds: z.number().positive(),
  }),
  z.object({
    do: z.literal('glow'),
    at: z.number().min(0),
    target: z.string().min(1),
    to: z.number().min(0),
    seconds: z.number().positive(),
  }),
  z.object({
    do: z.literal('particles'),
    at: z.number().min(0),
    id: z.string().min(1),
    kind: z.enum(['snow', 'leaves', 'confetti', 'blossom', 'dust', 'spray']),
    seconds: z.number().positive(),
  }),
  z.object({
    do: z.literal('color'),
    at: z.number().min(0),
    target: z.enum(['sky', 'water', 'ground']),
    to: z.string().min(4),
    seconds: z.number().positive(),
  }),
  z.object({ do: z.literal('caption'), at: z.number().min(0), seconds: z.number().min(CAPTION_MIN_SECONDS), text: captionSchema }),
  /** Wakes an existing scene system: the train, the ferry, the balloons. */
  z.object({ do: z.literal('trigger'), at: z.number().min(0), system: z.string().min(1) }),
  /**
   * Hide scene objects for the duration, by note prefix.
   *
   * Used where a window replaces something the scene already draws — the
   * walking pigeons give way to flying ones — so the two are never on screen
   * together. Restored from the snapshot like everything else.
   */
  z.object({ do: z.literal('hide'), at: z.number().min(0), notePrefix: z.string().min(1) }),
]);

export type TimeWindowCommand = z.infer<typeof commandSchema>;

/**
 * The camera move. Every window has exactly one.
 *
 * `target` names a thing in the scene rather than a position, so the camera
 * cannot be pointed at a coordinate that holds nothing — the failure that shows
 * up as a few seconds of empty sky with no clue why.
 */
export const cameraSchema = z.object({
  kind: z.enum(['reveal', 'pan', 'rise', 'orbit']),
  /** `hotspot:<order>` or `asset:<assetId>`. */
  target: z.string().regex(/^(hotspot:\d+|asset:[a-z0-9_]+)$/),
  /** Metres added to the target's position for the look-at point. */
  offset: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  /** How far back the camera sits from the target, in metres. */
  distance: z.number().positive().default(10),
  /** Height above the target. */
  height: z.number().default(3),
});

/**
 * What happens to the city's music while a window plays.
 *
 * `duck` is the default and will stay the default: a theme that vanishes and
 * returns draws more attention than one that steps back, which is the same
 * reasoning the guide's voice already uses (`DUCK_FACTOR`). `mute` is there for
 * the handful of stops whose sound is silence — Çanakkale's is designed that
 * way — and `keep` for a window whose own sound is the city's music.
 */
export const audioPolicySchema = z.enum(['duck', 'mute', 'keep']).default('duck');

export const MIN_WINDOW_SECONDS = 8;
export const MAX_WINDOW_SECONDS = 12;

export const timeWindowSchema = z
  .object({
    stopId: z.string().min(1),
    duration: z.number().min(MIN_WINDOW_SECONDS).max(MAX_WINDOW_SECONDS),
    camera: cameraSchema,
    audioPolicy: audioPolicySchema,
    /**
     * Assets this window needs in the scene before it may run.
     *
     * The graybox guard: a window is eligible only when every id here resolves
     * to a real delivered model. On a stop that is still a coloured box, the
     * camera would fly to a cube and a silhouette would rise out of it, which
     * teaches a child that the system is broken. Those stops fall back to the
     * fact card until their art arrives.
     */
    requires: z.array(z.string().min(1)).default([]),
    events: z.array(commandSchema).min(1),
    /** Must equal the stop's canonical reward; a test holds that. */
    reward: z.string().min(1),
  })
  .superRefine((window, ctx) => {
    /** Nothing may still be running when the window ends. */
    for (const event of window.events) {
      const ends =
        'seconds' in event && typeof event.seconds === 'number' ? event.at + event.seconds : event.at;
      if (ends > window.duration + 1e-6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `event "${event.do}" at ${event.at}s runs past the window's ${window.duration}s`,
          path: ['events'],
        });
      }
    }
    /** Exactly one sentence per window. The standard is one, not "at most". */
    const captions = window.events.filter((event) => event.do === 'caption');
    if (captions.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `a window carries exactly one caption, found ${captions.length}`,
        path: ['events'],
      });
    }
    /** Every spawn is cleaned up by name as well as by the runtime sweep. */
    const spawned = new Set(
      window.events.filter((event) => event.do === 'spawn').map((event) => event.id),
    );
    const despawned = new Set(
      window.events.filter((event) => event.do === 'despawn').map((event) => event.id),
    );
    for (const id of spawned) {
      if (!despawned.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${id}" is spawned but never despawned`,
          path: ['events'],
        });
      }
    }
    for (const id of despawned) {
      if (!spawned.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${id}" is despawned but never spawned`,
          path: ['events'],
        });
      }
    }
  });

export const cityTimeWindowsSchema = z.object({
  cityId: z.string().min(1),
  windows: z.array(timeWindowSchema),
});

export type TimeWindow = z.infer<typeof timeWindowSchema>;
export type CityTimeWindows = z.infer<typeof cityTimeWindowsSchema>;
export type TimeWindowCamera = z.infer<typeof cameraSchema>;
export type AudioPolicy = z.infer<typeof audioPolicySchema>;
