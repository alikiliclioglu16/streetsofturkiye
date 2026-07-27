import {
  emptyCityProgress,
  emptyProfile,
  type CityProgress,
  type PlayerProfile,
  type ProgressRepository,
} from '@/engine/progress/types';

const PROFILE_KEY = 'sot.profile.v1';
const CITY_KEY = (cityId: string) => `sot.city.${cityId}.v1`;

/**
 * Local storage implementation behind the repository interface so a Supabase
 * implementation can replace it without touching gameplay (CLAUDE.md rule 7).
 * Write failures never throw: session state is kept and the UI shows a
 * non-blocking warning instead.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  private readonly memory = new Map<string, string>();
  private storageFailed = false;

  get degraded(): boolean {
    return this.storageFailed;
  }

  private read(key: string): string | null {
    try {
      if (typeof window === 'undefined') return this.memory.get(key) ?? null;
      return window.localStorage.getItem(key);
    } catch {
      this.storageFailed = true;
      return this.memory.get(key) ?? null;
    }
  }

  private write(key: string, value: string): void {
    this.memory.set(key, value);
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
    } catch {
      this.storageFailed = true;
    }
  }

  async loadProfile(): Promise<PlayerProfile> {
    const raw = this.read(PROFILE_KEY);
    if (!raw) return emptyProfile();
    try {
      const parsed = JSON.parse(raw) as PlayerProfile;
      if (parsed.schemaVersion !== 1) return emptyProfile();
      return { ...emptyProfile(), ...parsed };
    } catch {
      return emptyProfile();
    }
  }

  async saveProfile(profile: PlayerProfile): Promise<void> {
    this.write(PROFILE_KEY, JSON.stringify(profile));
  }

  async loadCityProgress(cityId: string): Promise<CityProgress | null> {
    const raw = this.read(CITY_KEY(cityId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CityProgress;
      return { ...emptyCityProgress(cityId), ...parsed, cityId };
    } catch {
      return null;
    }
  }

  async saveCityProgress(progress: CityProgress): Promise<void> {
    this.write(CITY_KEY(progress.cityId), JSON.stringify(progress));
  }

  async clear(): Promise<void> {
    this.memory.clear();
    try {
      if (typeof window === 'undefined') return;
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('sot.')) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      this.storageFailed = true;
    }
  }
}

export const progressRepository: ProgressRepository = new LocalStorageProgressRepository();
