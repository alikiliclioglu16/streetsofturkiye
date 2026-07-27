export interface CityProgress {
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
  cityId,
  completedHotspotIds: [],
  collectedRewardIds: [],
  quizCompleted: false,
  cityCompleted: false,
  updatedAt: 0,
});
