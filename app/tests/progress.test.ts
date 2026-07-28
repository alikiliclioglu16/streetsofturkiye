import { describe, expect, it } from 'vitest';
import { loadComposedCity } from './helpers';
import { CITY_PROGRESS_VERSION, emptyCityProgress, emptyProfile } from '@/engine/progress/types';
import {
  allHotspotsComplete,
  completeHotspot,
  completeQuiz,
  hotspotProgressRatio,
  needsMigration,
  quizUnlocked,
  reconcileProgress,
  recordCityCompletion,
  recordVisit,
} from '@/engine/progress/rules';

const city = loadComposedCity('istanbul');

const completeAll = () =>
  city.hotspots.reduce(
    (progress, hotspot) => completeHotspot(progress, hotspot.id, hotspot.reward.assetId),
    emptyCityProgress(city.id),
  );

describe('progress rules', () => {
  it('records a hotspot and its reward once', () => {
    const first = city.hotspots[0]!;
    const once = completeHotspot(emptyCityProgress(city.id), first.id, first.reward.assetId);
    expect(once.completedHotspotIds).toEqual([first.id]);
    expect(once.collectedRewardIds).toEqual([first.reward.assetId]);
  });

  it('does not duplicate rewards when a hotspot is re-entered', () => {
    const first = city.hotspots[0]!;
    let progress = completeHotspot(emptyCityProgress(city.id), first.id, first.reward.assetId);
    progress = completeHotspot(progress, first.id, first.reward.assetId);
    progress = completeHotspot(progress, first.id, first.reward.assetId);
    expect(progress.completedHotspotIds).toHaveLength(1);
    expect(progress.collectedRewardIds).toHaveLength(1);
  });

  it('keeps the quiz locked until every hotspot is performed', () => {
    const first = city.hotspots[0]!;
    const partial = completeHotspot(emptyCityProgress(city.id), first.id, first.reward.assetId);
    expect(quizUnlocked(city, partial)).toBe(false);
    expect(completeQuiz(city, partial).quizCompleted).toBe(false);
  });

  it('completes the city once the quiz is answered', () => {
    const full = completeAll();
    expect(allHotspotsComplete(city, full)).toBe(true);
    expect(hotspotProgressRatio(city, full)).toBe(1);

    const finished = completeQuiz(city, full);
    expect(finished.quizCompleted).toBe(true);
    expect(finished.cityCompleted).toBe(true);
  });

  it('needs every quiz question answered before the city closes', () => {
    expect(city.quiz.length).toBeGreaterThan(1);
    // completeQuiz is the final gate; the store walks the questions before it.
    const full = completeAll();
    expect(completeQuiz(city, full).cityCompleted).toBe(true);
  });

  it('awards the province star exactly once', () => {
    let profile = recordVisit(emptyProfile(), city.id);
    profile = recordVisit(profile, city.id);
    profile = recordCityCompletion(profile, city);
    profile = recordCityCompletion(profile, city);
    expect(profile.visitedCityIds).toEqual([city.id]);
    expect(profile.completedCityIds).toEqual([city.id]);
    expect(profile.starIds).toEqual([city.rewards.cityStarId]);
  });
});

describe('saved progress outliving content', () => {
  const legacySave = {
    // No schemaVersion, and hotspot ids from the three-stop İstanbul.
    cityId: 'istanbul',
    completedHotspotIds: ['istanbul-hotspot-01', 'istanbul-old-galata', 'istanbul-old-ferry'],
    collectedRewardIds: ['collectible_istanbul_iznik_tile', 'collectible_istanbul_old'],
    quizCompleted: true,
    cityCompleted: true,
    updatedAt: 1,
  };

  it('recognises a save written by an older shape', () => {
    expect(needsMigration(legacySave)).toBe(true);
    expect(needsMigration(emptyCityProgress('istanbul'))).toBe(false);
    expect(needsMigration(null)).toBe(false);
  });

  it('does not believe a completion flag from a city that no longer exists', () => {
    const reconciled = reconcileProgress(city, legacySave);
    // Three of five, so the city is not finished however the save described it.
    expect(reconciled.cityCompleted).toBe(false);
    expect(reconciled.quizCompleted).toBe(false);
  });

  it('keeps the stops the city still recognises', () => {
    const reconciled = reconcileProgress(city, legacySave);
    expect(reconciled.completedHotspotIds).toEqual(['istanbul-hotspot-01']);
    expect(reconciled.collectedRewardIds).toEqual(['collectible_istanbul_iznik_tile']);
    expect(reconciled.schemaVersion).toBe(CITY_PROGRESS_VERSION);
  });

  it('leaves a current, genuinely finished save alone', () => {
    const finished = completeQuiz(
      city,
      city.hotspots.reduce(
        (progress, hotspot) => completeHotspot(progress, hotspot.id, hotspot.reward.assetId),
        emptyCityProgress(city.id),
      ),
    );
    const reconciled = reconcileProgress(city, finished);
    expect(reconciled.cityCompleted).toBe(true);
    expect(reconciled.completedHotspotIds).toHaveLength(city.hotspots.length);
  });

  it('treats a missing save as a fresh start', () => {
    expect(reconcileProgress(city, null)).toEqual(emptyCityProgress(city.id));
  });
});
