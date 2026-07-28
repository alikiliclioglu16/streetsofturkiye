/**
 * Bumped whenever a saved city's shape changes.
 *
 * 1 → 2: İstanbul went from three hand-authored stops to five canonical ones,
 * with new hotspot ids. A version-1 save records a finished city that no longer
 * exists, and the player was shown a completion panel for a city they had not
 * played.
 */
export const CITY_PROGRESS_VERSION = 2;

export interface CityProgress {
  /** Absent in saves written before versioning; treated as 1. */
  schemaVersion?: number;
  cityId: string;
  completedHotspotIds: string[];
  collectedRewardIds: string[];
  quizCompleted: boolean;
  cityCompleted: boolean;
  updatedAt: number;
}

export interface PlayerProfile {
  schemaVersion: 1;
  displayName: string | null;
  visitedCityIds: string[];
  completedCityIds: string[];
  starIds: string[];
}

export interface ProgressRepository {
  loadProfile(): Promise<PlayerProfile>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  loadCityProgress(cityId: string): Promise<CityProgress | null>;
  saveCityProgress(progress: CityProgress): Promise<void>;
  clear(): Promise<void>;
}

export const emptyProfile = (): PlayerProfile => ({
  schemaVersion: 1,
  displayName: null,
  visitedCityIds: [],
  completedCityIds: [],
  starIds: [],
});

export const emptyCityProgress = (cityId: string): CityProgress => ({
  schemaVersion: CITY_PROGRESS_VERSION,
  cityId,
  completedHotspotIds: [],
  collectedRewardIds: [],
  quizCompleted: false,
  cityCompleted: false,
  updatedAt: 0,
});
