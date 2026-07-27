import { readFileSync } from 'node:fs';
import path from 'node:path';
import { canonicalCitySchema } from '@/content/schemas/canonical';
import { sceneSchema } from '@/content/schemas/scene';
import { composeCity, type RuntimeCity } from '@/content/compose';

export const REPO_ROOT = path.resolve(process.cwd(), '..');

export const readRepoJson = (relative: string): unknown =>
  JSON.parse(readFileSync(path.join(REPO_ROOT, relative), 'utf8'));

/** Loads a city the way the app does: canonical content joined with its scene. */
export function loadComposedCity(cityId: string): RuntimeCity {
  return composeCity(
    canonicalCitySchema.parse(readRepoJson(`content/canonical/cities/${cityId}.json`)),
    sceneSchema.parse(readRepoJson(`content/scenes/${cityId}.json`)),
  );
}
