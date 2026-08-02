import {
  canonicalCitySchema,
  canonicalRegionsSchema,
  type CanonicalCity,
  type CanonicalRegion,
} from '@/content/schemas/canonical';
import { sceneSchema, type SceneDefinition } from '@/content/schemas/scene';
import { composeCity, type RuntimeCity } from '@/content/compose';
import { presentationSchema, type Presentation } from '@/content/schemas/presentation';

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
/**
 * Cities a child can walk into.
 *
 * All three pilot cities. İstanbul and Nevşehir are finished; Gaziantep opens
 * with its three stop objects still placeholders and the shared kit dressing
 * its street.
 *
 * Opening a city before its art is deliberate, and Gaziantep tests something
 * neither of the others could: it has three stops and one question where they
 * have five and two. A layout that only works for five-stop cities would fail
 * on seventy-eight of the eighty-one.
 */
export const PLAYABLE_CITY_IDS = ['istanbul', 'nevsehir', 'gaziantep', 'kars', 'van', 'ordu', 'bolu', 'trabzon', 'balikesir', 'mardin', 'erzurum', 'izmir'] as const;

/**
 * The pilot is still the three cities the vertical slice was scoped to.
 *
 * Kars is playable without being one of them. `PILOT_CITY_IDS` is what the
 * phase-02 acceptance criteria are written against and what the pilot asset
 * manifest covers; widening it to mean "every open city" would quietly move
 * the goalposts of a gate that has not been passed yet.
 */
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

const PRESENTATION = '/content/canonical/presentation.json';

export async function loadPresentation(signal?: AbortSignal): Promise<Presentation> {
  const raw = await fetchJson(PRESENTATION, signal);
  const parsed = presentationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ContentError(
      'presentation',
      'Presentation content failed validation',
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return parsed.data;
}
