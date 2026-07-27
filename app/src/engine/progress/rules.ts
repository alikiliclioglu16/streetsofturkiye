import type { CityDefinition } from '@/content/schemas/city';
import type { CityProgress, PlayerProfile } from '@/engine/progress/types';

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
