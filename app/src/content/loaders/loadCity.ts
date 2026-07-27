import {
  canonicalCitySchema,
  canonicalRegionsSchema,
  type CanonicalCity,
  type CanonicalRegion,
} from '@/content/schemas/canonical';
import { sceneSchema, type SceneDefinition } from '@/content/schemas/scene';
import { composeCity, type RuntimeCity } from '@/content/compose';

export class ContentError extends Error {
  readonly cityId: string;
  readonly issues: string[];

  constructor(cityId: string, message: string, issues: string[] = []) {
    super(message);
    this.name = 'ContentError';
    this.cityId = cityId;
    this.issues = issues;
  }
}

/** Canonical content and technical scenes are served from separate trees. */
const CANONICAL_CITY = (cityId: string) => `/content/canonical/cities/${cityId}.json`;
const SCENE = (cityId: string) => `/content/scenes/${cityId}.json`;
const REGIONS = '/content/canonical/regions.json';

/**
 * Cities open to the player.
 *
 * İstanbul is being finished end to end before any other city opens, so that a
 * single province proves the whole experience. Nevşehir and Gaziantep already
 * have canonical content and validated scenes — the tests keep checking them —
 * but they stay closed until İstanbul is done (owner decision, 27 Jul 2026).
 */
export const PLAYABLE_CITY_IDS = ['istanbul'] as const;
export const PILOT_CITY_IDS = ['istanbul', 'nevsehir', 'gaziantep'] as const;

async function fetchJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

export async function loadCanonicalCity(
  cityId: string,
  signal?: AbortSignal,
): Promise<CanonicalCity> {
  const raw = await fetchJson(CANONICAL_CITY(cityId), signal);
  const parsed = canonicalCitySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ContentError(
      cityId,
      'Canonical content failed validation',
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return parsed.data;
}

export async function loadScene(cityId: string, signal?: AbortSignal): Promise<SceneDefinition> {
  const raw = await fetchJson(SCENE(cityId), signal);
  const parsed = sceneSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ContentError(
      cityId,
      'Scene definition failed validation',
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return parsed.data;
}

/**
 * Loads both halves and joins them. A city is only playable when canonical
 * content and a scene both exist and every `contentRef` resolves.
 */
export async function loadCity(cityId: string, signal?: AbortSignal): Promise<RuntimeCity> {
  let canonical: CanonicalCity;
  let scene: SceneDefinition;

  try {
    [canonical, scene] = await Promise.all([
      loadCanonicalCity(cityId, signal),
      loadScene(cityId, signal),
    ]);
  } catch (error) {
    if (error instanceof ContentError) throw error;
    throw new ContentError(cityId, `City content unavailable: ${(error as Error).message}`);
  }

  try {
    return composeCity(canonical, scene);
  } catch (error) {
    throw new ContentError(cityId, (error as Error).message);
  }
}

export async function loadRegions(signal?: AbortSignal): Promise<CanonicalRegion[]> {
  const raw = await fetchJson(REGIONS, signal);
  const parsed = canonicalRegionsSchema.safeParse(raw);
  if (!parsed.success) throw new ContentError('regions', 'Region list failed validation');
  return parsed.data;
}
