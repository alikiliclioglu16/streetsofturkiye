import { z } from 'zod';
import { localizedTextSchema } from '@/content/schemas/city';

/**
 * Adapter for the 81-city legacy dataset.
 * `scripts/build-city-index.mjs` derives this index from
 * content/legacy/cities.normalized.json, so the map route never downloads the
 * full migration file.
 */
const cityIndexEntrySchema = z.object({
  id: z.string(),
  order: z.number().int().nonnegative(),
  name: localizedTextSchema,
  regionId: z.string(),
  coordinates: z.object({ longitude: z.number(), latitude: z.number() }),
  stopCount: z.number().int().nonnegative(),
  quizCount: z.number().int().nonnegative(),
  migrationStatus: z.string(),
});

export type CityIndexEntry = z.infer<typeof cityIndexEntrySchema>;

const cityIndexSchema = z.array(cityIndexEntrySchema).min(1);

export async function loadCityIndex(signal?: AbortSignal): Promise<CityIndexEntry[]> {
  const response = await fetch('/content/city-index.json', { signal });
  if (!response.ok) throw new Error(`City index unavailable: ${response.status}`);
  const parsed = cityIndexSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('City index failed validation');
  return parsed.data.sort((a, b) => a.order - b.order);
}
