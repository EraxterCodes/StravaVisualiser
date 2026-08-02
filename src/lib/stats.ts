import type {
  HeatmapResponse,
  StatsResponse,
  TimeRangePreset,
  TrendPoint,
  TrendsResponse,
} from "@/types/api";
import type { FixtureActivity } from "@/fixtures/activities";
import { isWithinRange } from "@/lib/time-range";

const EARTH_CIRCUMFERENCE_METERS = 40_075_000;
const EVEREST_HEIGHT_METERS = 8_849;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function filterActivitiesByRange(
  activities: FixtureActivity[],
  range: TimeRangePreset,
): FixtureActivity[] {
  return activities.filter((a) => isWithinRange(a.date, range));
}

function longestStreakDays(activities: FixtureActivity[]): number {
  const uniqueDays = Array.from(new Set(activities.map((a) => a.date))).sort();
  if (uniqueDays.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function mostActiveDayOfWeek(
  activities: FixtureActivity[],
): StatsResponse["mostActiveDayOfWeek"] {
  const counts = new Array(7).fill(0);
  for (const a of activities) {
    counts[new Date(a.date).getUTCDay()]++;
  }
  const maxIndex = counts.indexOf(Math.max(...counts));
  return DAY_NAMES[maxIndex] as StatsResponse["mostActiveDayOfWeek"];
}

export function computeStats(
  activities: FixtureActivity[],
  range: TimeRangePreset,
): StatsResponse {
  const totalDistanceMeters = activities.reduce((sum, a) => sum + a.distanceMeters, 0);
  const totalElevationGainMeters = activities.reduce(
    (sum, a) => sum + a.totalElevationGainMeters,
    0,
  );
  const totalMovingTimeSeconds = activities.reduce(
    (sum, a) => sum + a.movingTimeSeconds,
    0,
  );
  const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);

  const longestActivity = activities.reduce<FixtureActivity | null>((longest, a) => {
    if (!longest || a.distanceMeters > longest.distanceMeters) return a;
    return longest;
  }, null);

  const activityCountBySportType: StatsResponse["activityCountBySportType"] = {};
  for (const a of activities) {
    activityCountBySportType[a.sportType] =
      (activityCountBySportType[a.sportType] ?? 0) + 1;
  }

  return {
    range,
    totalDistanceMeters,
    totalElevationGainMeters,
    totalMovingTimeSeconds,
    activityCount: activities.length,
    totalCalories,
    distanceEquivalence: `${(totalDistanceMeters / EARTH_CIRCUMFERENCE_METERS).toFixed(2)}x around the Earth`,
    elevationEquivalence: `${(totalElevationGainMeters / EVEREST_HEIGHT_METERS).toFixed(1)}x the height of Everest`,
    longestActivity: longestActivity
      ? {
          id: longestActivity.id,
          name: longestActivity.name,
          sportType: longestActivity.sportType,
          distanceMeters: longestActivity.distanceMeters,
          movingTimeSeconds: longestActivity.movingTimeSeconds,
          date: longestActivity.date,
        }
      : null,
    longestStreakDays: longestStreakDays(activities),
    mostActiveDayOfWeek: mostActiveDayOfWeek(activities),
    mostActiveTimeOfDay: "Morning",
    activityCountBySportType,
  };
}

export function computeHeatmap(activities: FixtureActivity[]): HeatmapResponse {
  const byDate = new Map<string, number>();
  for (const a of activities) {
    byDate.set(a.date, (byDate.get(a.date) ?? 0) + a.distanceMeters);
  }
  return Array.from(byDate.entries())
    .map(([date, distanceMeters]) => ({ date, distanceMeters }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeTrends(
  activities: FixtureActivity[],
  range: TimeRangePreset,
): TrendsResponse {
  const bucketByWeek = range === "last-30-days" || range === "this-month";

  const buckets = new Map<string, { distanceMeters: number; movingTimeSeconds: number }>();
  for (const a of activities) {
    const date = new Date(a.date);
    let key: string;
    if (bucketByWeek) {
      const dayOfWeek = date.getUTCDay();
      const weekStart = new Date(date);
      weekStart.setUTCDate(date.getUTCDate() - dayOfWeek);
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
    }

    const existing = buckets.get(key) ?? { distanceMeters: 0, movingTimeSeconds: 0 };
    existing.distanceMeters += a.distanceMeters;
    existing.movingTimeSeconds += a.movingTimeSeconds;
    buckets.set(key, existing);
  }

  const points: TrendPoint[] = Array.from(buckets.entries())
    .map(([period, { distanceMeters, movingTimeSeconds }]) => ({
      period,
      distanceMeters,
      averagePaceSecondsPerKm:
        distanceMeters > 0 ? movingTimeSeconds / (distanceMeters / 1000) : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return points;
}
