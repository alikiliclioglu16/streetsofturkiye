import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { citySchema, meetsQuizStandard, regionsSchema, REQUIRED_QUIZ_ITEMS } from '@/content/schemas/city';
import { t, isFallback } from '@/content/i18n';

const readJson = (relative: string) =>
  JSON.parse(readFileSync(path.resolve(process.cwd(), relative), 'utf8')) as unknown;

describe('city content', () => {
  it('accepts every shipped pilot city', () => {
    for (const cityId of ['istanbul', 'nevsehir', 'gaziantep']) {
      const result = citySchema.safeParse(readJson(`public/content/pilot/${cityId}.json`));
      expect(result.success, `${cityId} failed validation`).toBe(true);
    }
  });

  it('accepts the region list', () => {
    expect(regionsSchema.safeParse(readJson('public/content/regions.json')).success).toBe(true);
  });

  it('rejects a city whose hotspot awards an undeclared collectible', () => {
    const city = readJson('public/content/pilot/istanbul.json') as Record<string, unknown>;
    const broken = {
      ...city,
      rewards: { cityStarId: 'star_istanbul', collectibleIds: [] },
    };
    const result = citySchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate hotspot ids', () => {
    const city = citySchema.parse(readJson('public/content/pilot/istanbul.json'));
    const first = city.hotspots[0];
    expect(first).toBeDefined();
    const result = citySchema.safeParse({ ...city, hotspots: [first, first, ...city.hotspots.slice(1)] });
    expect(result.success).toBe(false);
  });

  it('ships two recall questions for every playable city', () => {
    const city = citySchema.parse(readJson('public/content/pilot/istanbul.json'));
    expect(city.quiz).toHaveLength(REQUIRED_QUIZ_ITEMS);
    expect(meetsQuizStandard(city)).toBe(true);
    expect(new Set(city.quiz.map((item) => item.id)).size).toBe(city.quiz.length);
  });

  it('carries the prototype quiz counts, and flags the one city below standard', () => {
    // Straight from the prototype: İstanbul and Nevşehir have two questions,
    // Gaziantep has one. The shortfall is content work, not a code defect.
    const counts = Object.fromEntries(
      ['istanbul', 'nevsehir', 'gaziantep'].map((cityId) => [
        cityId,
        citySchema.parse(readJson(`public/content/pilot/${cityId}.json`)).quiz.length,
      ]),
    );
    expect(counts).toEqual({ istanbul: 2, nevsehir: 2, gaziantep: 1 });

    const gaziantep = citySchema.parse(readJson('public/content/pilot/gaziantep.json'));
    expect(meetsQuizStandard(gaziantep)).toBe(false);
  });

  it('migrates prototype facts verbatim and marks them unverified', () => {
    const city = citySchema.parse(readJson('public/content/pilot/istanbul.json'));
    expect(city.hotspots).toHaveLength(5);
    expect(city.hotspots.map((hotspot) => hotspot.fact.title.en)).toEqual([
      'Hagia Sophia & the Blue Mosque',
      'Galata Tower',
      'The Grand Bazaar',
      'The Simit Cart',
      'Ferry on the Bosphorus',
    ]);
    expect(
      city.hotspots.every((hotspot) => hotspot.fact.editorialStatus === 'legacy-unverified'),
    ).toBe(true);
  });

  it('rejects a quiz item with no correct option', () => {
    const city = citySchema.parse(readJson('public/content/pilot/istanbul.json'));
    const item = city.quiz[0];
    expect(item).toBeDefined();
    const broken = {
      ...city,
      quiz: [{ ...item!, options: item!.options.map((option) => ({ ...option, correct: false })) }],
    };
    expect(citySchema.safeParse(broken).success).toBe(false);
  });
});

describe('localization fallback', () => {
  it('returns the requested locale when present', () => {
    expect(t({ tr: 'Lale', en: 'Tulip' }, 'tr')).toBe('Lale');
  });

  it('falls back to English when Turkish is missing, as in the legacy dataset', () => {
    expect(t({ tr: null, en: 'Tulip' }, 'tr')).toBe('Tulip');
    expect(isFallback({ tr: null, en: 'Tulip' }, 'tr')).toBe(true);
  });

  it('never returns null to the UI', () => {
    expect(t({ tr: null, en: null }, 'tr')).toBe('');
    expect(t(undefined, 'en')).toBe('');
  });
});
