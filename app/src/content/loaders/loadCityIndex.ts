import { canonicalIndexSchema, type CanonicalIndexEntry } from '@/content/schemas/canonical';

export type CityIndexEntry = CanonicalIndexEntry;

/**
 * The canonical package ships a light index for the map, so the 366 KB
 * cities.all.json never reaches the browser.
 */
export async function loadCityIndex(signal?: AbortSignal): Promise<CityIndexEntry[]> {
  const response = await fetch('/content/canonical/city-index.json', { signal });
  if (!response.ok) throw new Error(`City index unavailable: ${response.status}`);
  const parsed = canonicalIndexSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('City index failed validation');
  return [...parsed.data.cities].sort((a, b) => a.order - b.order);
}
