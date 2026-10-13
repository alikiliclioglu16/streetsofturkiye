import { cityTimeWindowsSchema, type CityTimeWindows, type TimeWindow } from '@/content/schemas/timewindow';

/**
 * Loading a city's Time Windows.
 *
 * Deliberately forgiving about absence and strict about content. A city with no
 * file is the normal case right now — one city out of nineteen has windows —
 * and every stop in it falls back to the fact card, which is the designed
 * behaviour rather than a degradation. A city whose file is malformed is a
 * different thing entirely and throws, because silently dropping a window would
 * leave the stop looking finished while doing nothing.
 */

const TIME_WINDOWS = (cityId: string) => `/content/timewindows/${cityId}.json`;

export class TimeWindowError extends Error {
  readonly cityId: string;
  readonly issues: string[];

  constructor(cityId: string, message: string, issues: string[] = []) {
    super(message);
    this.name = 'TimeWindowError';
    this.cityId = cityId;
    this.issues = issues;
  }
}

export async function loadTimeWindows(
  cityId: string,
  signal?: AbortSignal,
): Promise<CityTimeWindows | null> {
  const response = await fetch(TIME_WINDOWS(cityId), { signal });
  // No file is not an error: most cities do not have windows yet.
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new TimeWindowError(cityId, `time windows for ${cityId} failed: ${response.status}`);
  }

  const parsed = cityTimeWindowsSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new TimeWindowError(
      cityId,
      `time windows for ${cityId} did not validate`,
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return parsed.data;
}

export function windowForStop(
  windows: CityTimeWindows | null,
  stopId: string | null,
): TimeWindow | null {
  if (!windows || !stopId) return null;
  return windows.windows.find((window) => window.stopId === stopId) ?? null;
}
