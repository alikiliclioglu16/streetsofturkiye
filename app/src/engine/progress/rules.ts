import type { RuntimeCity as CityDefinition } from '@/content/compose';
import {
  CITY_PROGRESS_VERSION,
  emptyCityProgress,
  type CityProgress,
  type PlayerProfile,
} from '@/engine/progress/types';

/**
 * Progress rules are pure so they can be tested without React or WebGL.
 * The 3D scene never owns permanent progress (CLAUDE.md rule 6).
 */

/** Idempotent: re-entering a city must not duplicate rewards (QA gate). */
export function completeHotspot(
  progress: CityProgress,
  hotspotId: string,
  rewardId: string,
): CityProgress {
  const alreadyDone = progress.completedHotspotIds.includes(hotspotId);
  if (alreadyDone) return progress;

  return {
    ...progress,
    completedHotspotIds: [...progress.completedHotspotIds, hotspotId],
    collectedRewardIds: progress.collectedRewardIds.includes(rewardId)
      ? progress.collectedRewardIds
      : [...progress.collectedRewardIds, rewardId],
    updatedAt: Date.now(),
  };
}

export function allHotspotsComplete(city: CityDefinition, progress: CityProgress): boolean {
  return city.hotspots.every((hotspot) => progress.completedHotspotIds.includes(hotspot.id));
}

/** The quiz gate only opens once every hotspot has been performed. */
export function quizUnlocked(city: CityDefinition, progress: CityProgress): boolean {
  return allHotspotsComplete(city, progress);
}

export function completeQuiz(city: CityDefinition, progress: CityProgress): CityProgress {
  if (!quizUnlocked(city, progress)) return progress;
  if (progress.quizCompleted) return progress;
  return { ...progress, quizCompleted: true, cityCompleted: true, updatedAt: Date.now() };
}

export function hotspotProgressRatio(city: CityDefinition, progress: CityProgress): number {
  if (city.hotspots.length === 0) return 0;
  return progress.completedHotspotIds.length / city.hotspots.length;
}

export function recordVisit(profile: PlayerProfile, cityId: string): PlayerProfile {
  if (profile.visitedCityIds.includes(cityId)) return profile;
  return { ...profile, visitedCityIds: [...profile.visitedCityIds, cityId] };
}

export function recordCityCompletion(
  profile: PlayerProfile,
  city: CityDefinition,
): PlayerProfile {
  const completed = profile.completedCityIds.includes(city.id)
    ? profile.completedCityIds
    : [...profile.completedCityIds, city.id];
  const stars = profile.starIds.includes(city.rewards.cityStarId)
    ? profile.starIds
    : [...profile.starIds, city.rewards.cityStarId];
  return { ...profile, completedCityIds: completed, starIds: stars };
}

/**
 * Reconciles a saved city against the city as it exists now.
 *
 * Saves outlive content. A stop can be renamed, added or removed, and a save
 * that names hotspots which no longer exist must not be trusted — least of all
 * its `cityCompleted` flag, which is what decides whether the player is shown a
 * completion panel the moment they arrive.
 *
 * Anything the current city still recognises is kept, so a player who finished
 * three of five stops keeps those three. Everything else is dropped and the
 * completion flags are recomputed rather than believed.
 */
export function reconcileProgress(city: CityDefinition, stored: CityProgress | null): CityProgress {
  const fresh = emptyCityProgress(city.id);
  if (!stored) return fresh;

  const knownHotspots = new Set(city.hotspots.map((hotspot) => hotspot.id));
  const knownRewards = new Set(city.hotspots.map((hotspot) => hotspot.reward.assetId));

  const completedHotspotIds = stored.completedHotspotIds.filter((id) => knownHotspots.has(id));
  const collectedRewardIds = stored.collectedRewardIds.filter((id) => knownRewards.has(id));

  const everyStopDone = completedHotspotIds.length === city.hotspots.length;
  // A quiz cannot be finished if the stops that gate it are not.
  const quizCompleted = stored.quizCompleted && everyStopDone;

  return {
    schemaVersion: CITY_PROGRESS_VERSION,
    cityId: city.id,
    completedHotspotIds,
    collectedRewardIds,
    quizCompleted,
    cityCompleted: everyStopDone && quizCompleted,
    updatedAt: stored.updatedAt,
  };
}

/** True when the saved shape no longer matches what the engine writes today. */
export function needsMigration(stored: CityProgress | null): boolean {
  if (!stored) return false;
  return (stored.schemaVersion ?? 1) !== CITY_PROGRESS_VERSION;
}
