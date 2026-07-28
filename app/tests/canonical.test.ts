import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalCitySchema,
  canonicalIndexSchema,
  canonicalManifestSchema,
  canonicalRegionsSchema,
} from '@/content/schemas/canonical';
import { sceneSchema } from '@/content/schemas/scene';
import { composeCity, shuffleOptions } from '@/content/compose';

const ROOT = path.resolve(process.cwd(), '..');
const readJson = (relative: string) =>
  JSON.parse(readFileSync(path.join(ROOT, relative), 'utf8')) as unknown;

const manifest = canonicalManifestSchema.parse(readJson('content/canonical/manifest.json'));
interface RawCity {
  id: string;
  stops: unknown[];
  quiz: { options: { correct: boolean }[] }[];
}
const allCities = readJson('content/canonical/cities.all.json') as RawCity[];
const sceneIds = readdirSync(path.join(ROOT, 'content/scenes'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''));

describe('canonical authority', () => {
  it('matches the source counts declared in the manifest', () => {
    expect(manifest.counts).toEqual({
      regions: 7,
      cities: 81,
      stops: 249,
      quizQuestions: 84,
      citiesWithOneQuestion: 78,
      citiesWithTwoQuestions: 3,
    });
  });

  it('validates all 81 canonical city records', () => {
    for (const entry of allCities) {
      const result = canonicalCitySchema.safeParse(readJson(`content/canonical/cities/${entry.id}.json`));
      expect(result.success, `${entry.id} failed canonical validation`).toBe(true);
    }
  });

  it('validates the region list and city index', () => {
    expect(canonicalRegionsSchema.safeParse(readJson('content/canonical/regions.json')).success).toBe(true);
    expect(canonicalIndexSchema.safeParse(readJson('content/canonical/city-index.json')).success).toBe(true);
  });

  it('keeps variable quiz cardinality rather than forcing two per city', () => {
    const counts = allCities.map((city) => city.quiz.length);
    expect(counts.filter((count) => count === 1)).toHaveLength(78);
    expect(counts.filter((count) => count === 2)).toHaveLength(3);
    expect(Math.max(...counts)).toBe(2);
  });

  it('carries the pilot counts the project owner signed off', () => {
    const counts = Object.fromEntries(
      ['istanbul', 'nevsehir', 'gaziantep'].map((cityId) => {
        const city = canonicalCitySchema.parse(readJson(`content/canonical/cities/${cityId}.json`));
        return [cityId, { stops: city.stops.length, quiz: city.quiz.length }];
      }),
    );
    expect(counts).toEqual({
      istanbul: { stops: 5, quiz: 2 },
      nevsehir: { stops: 5, quiz: 2 },
      gaziantep: { stops: 3, quiz: 1 },
    });
  });

  it('preserves the İstanbul stop titles exactly as authored', () => {
    const city = canonicalCitySchema.parse(readJson('content/canonical/cities/istanbul.json'));
    expect(city.stops.map((stop) => stop.title.en)).toEqual([
      'Hagia Sophia & the Blue Mosque',
      'Galata Tower',
      'The Grand Bazaar',
      'The Simit Cart',
      'Ferry on the Bosphorus',
    ]);
  });

  it('leaves Turkish unset across canonical content', () => {
    const city = canonicalCitySchema.parse(readJson('content/canonical/cities/istanbul.json'));
    expect(city.name.tr).toBeNull();
    expect(city.stops.every((stop) => stop.title.tr === null && stop.description.tr === null)).toBe(true);
    expect(city.quiz.every((item) => item.question.tr === null)).toBe(true);
  });

  it('puts the correct option first in every canonical question', () => {
    for (const city of allCities) {
      for (const quiz of city.quiz) {
        expect(quiz.options[0]?.correct, city.id).toBe(true);
        expect(quiz.options.filter((option) => option.correct)).toHaveLength(1);
      }
    }
  });
});

describe('scene / content separation', () => {
  it('validates every scene file', () => {
    for (const cityId of sceneIds) {
      const result = sceneSchema.safeParse(readJson(`content/scenes/${cityId}.json`));
      expect(result.success, `${cityId} scene failed validation`).toBe(true);
    }
  });

  it('stores no canonical prose inside scene files', () => {
    const city = canonicalCitySchema.parse(readJson('content/canonical/cities/istanbul.json'));
    const raw = readFileSync(path.join(ROOT, 'content/scenes/istanbul.json'), 'utf8');
    for (const stop of city.stops) {
      expect(raw).not.toContain(stop.description.en!);
      expect(raw).not.toContain(stop.title.en!);
      expect(raw).not.toContain(stop.reward.label.en!);
    }
    for (const item of city.quiz) expect(raw).not.toContain(item.question.en!);
  });

  it('pins each scene to the canonical source SHA', () => {
    for (const cityId of sceneIds) {
      const scene = sceneSchema.parse(readJson(`content/scenes/${cityId}.json`));
      expect(scene.canonicalSource.sha256, cityId).toBe(manifest.sourceSha256);
    }
  });
});

describe('composition', () => {
  const load = (cityId: string) => ({
    canonical: canonicalCitySchema.parse(readJson(`content/canonical/cities/${cityId}.json`)),
    scene: sceneSchema.parse(readJson(`content/scenes/${cityId}.json`)),
  });

  it('joins canonical text onto technical hotspots', () => {
    const { canonical, scene } = load('istanbul');
    const city = composeCity(canonical, scene);

    expect(city.hotspots).toHaveLength(5);
    expect(city.canonicalStopCount).toBe(5);
    expect(city.pendingStopIds).toEqual([]);
    expect(city.hotspots[0]!.fact.title.en).toBe('Hagia Sophia & the Blue Mosque');
    expect(city.hotspots[0]!.reward.label.en).toBe('a blue İznik tile');
    expect(city.hotspots[0]!.reward.emoji).toBe('💠');
    expect(city.quiz).toHaveLength(2);
  });

  it('presents a stop rather than questioning it', () => {
    const { canonical, scene } = load('istanbul');
    const city = composeCity(canonical, scene);
    const hotspot = city.hotspots[0]!;

    // Everything a stop needs to present itself, and nothing to answer.
    expect(hotspot.fact.title.en).toBe(canonical.stops[0]!.title.en);
    expect(hotspot.reward.label.en).toBe(canonical.stops[0]!.reward.label.en);
    expect('interaction' in hotspot).toBe(false);
    expect(scene.hotspots[0]!.presentation.style).toBe('fact-card');
  });

  it('reports a canonical stop that has no technical hotspot as pending', () => {
    const { canonical, scene } = load('istanbul');
    const trimmed = { ...scene, hotspots: scene.hotspots.slice(0, 3) };
    const city = composeCity(canonical, trimmed);
    expect(city.hotspots).toHaveLength(3);
    expect(city.canonicalStopCount).toBe(5);
    expect(city.pendingStopIds).toEqual(['istanbul-stop-04', 'istanbul-stop-05']);
  });

  it('refuses a scene that points at a missing canonical stop', () => {
    const { canonical, scene } = load('istanbul');
    const broken = {
      ...scene,
      hotspots: [{ ...scene.hotspots[0]!, contentRef: { stopId: 'istanbul-stop-99' } }],
    };
    expect(() => composeCity(canonical, broken)).toThrow(/missing canonical stop/);
  });

  it('refuses a scene bound to a different city', () => {
    const { canonical } = load('istanbul');
    const { scene } = load('gaziantep');
    expect(() => composeCity(canonical, scene)).toThrow(/does not match canonical city/);
  });

  it('shuffles display order deterministically without losing options', () => {
    const { canonical } = load('istanbul');
    const item = canonical.quiz[0]!;
    const once = shuffleOptions(item.options, item.id);
    const twice = shuffleOptions(item.options, item.id);
    expect(once.map((option) => option.id)).toEqual(twice.map((option) => option.id));
    expect(once).toHaveLength(item.options.length);
    expect(once.filter((option) => option.correct)).toHaveLength(1);
  });
});
