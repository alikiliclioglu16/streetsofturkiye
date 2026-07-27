import { citySchema, regionsSchema, type CityDefinition, type Region } from '@/content/schemas/city';

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

/** Content lives under /public/content so cities are added without touching the engine. */
const CITY_PATH = (cityId: string) => `/content/pilot/${cityId}.json`;
const REGIONS_PATH = '/content/regions.json';

/** Cities shipped in the pilot. Phase 01 exposes İstanbul only. */
export const PILOT_CITY_IDS = ['istanbul', 'nevsehir', 'gaziantep'] as const;
export const PLAYABLE_CITY_IDS = ['istanbul'] as const;

async function fetchJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function loadCity(cityId: string, signal?: AbortSignal): Promise<CityDefinition> {
  let raw: unknown;
  try {
    raw = await fetchJson(CITY_PATH(cityId), signal);
  } catch (error) {
    throw new ContentError(cityId, `City definition unavailable: ${(error as Error).message}`);
  }

  const parsed = citySchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new ContentError(cityId, 'City definition failed validation', issues);
  }

  if (parsed.data.id !== cityId) {
    throw new ContentError(cityId, `City id mismatch: file declares "${parsed.data.id}"`);
  }

  return parsed.data;
}

export async function loadRegions(signal?: AbortSignal): Promise<Region[]> {
  const raw = await fetchJson(REGIONS_PATH, signal);
  const parsed = regionsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ContentError('regions', 'Region list failed validation');
  }
  return parsed.data;
}
