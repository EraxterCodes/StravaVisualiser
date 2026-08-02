import type {
  HeatmapResponse,
  StatsResponse,
  TimeRangePreset,
  TrendPoint,
  TrendsResponse,
} from "@/types/api";
import type { StatsActivity } from "@/types/activity";
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
  activities: StatsActivity[],
  range: TimeRangePreset,
): StatsActivity[] {
  return activities.filter((a) => isWithinRange(a.date, range));
}

function longestStreakDays(activities: StatsActivity[]): number {
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
  activities: StatsActivity[],
): StatsResponse["mostActiveDayOfWeek"] {
  const counts = new Array(7).fill(0);
  for (const a of activities) {
    counts[new Date(a.date).getUTCDay()]++;
  }
  const maxIndex = counts.indexOf(Math.max(...counts));
  return DAY_NAMES[maxIndex] as StatsResponse["mostActiveDayOfWeek"];
}

const TIME_OF_DAY_BUCKETS: StatsResponse["mostActiveTimeOfDay"][] = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

/** Buckets a UTC hour into a time-of-day label. Activity timestamps are only
 * stored in UTC (Strava's `start_date`, not `start_date_local`), so this is a
 * UTC-based approximation rather than the athlete's true local time of day. */
function timeOfDayBucket(hourUtc: number): StatsResponse["mostActiveTimeOfDay"] {
  if (hourUtc < 6) return "Night";
  if (hourUtc < 9) return "Early Morning";
  if (hourUtc < 12) return "Morning";
  if (hourUtc < 17) return "Afternoon";
  if (hourUtc < 21) return "Evening";
  return "Night";
}

function mostActiveTimeOfDay(
  activities: StatsActivity[],
): StatsResponse["mostActiveTimeOfDay"] {
  const counts = new Map<StatsResponse["mostActiveTimeOfDay"], number>();
  for (const a of activities) {
    const bucket = timeOfDayBucket(new Date(a.startDateTime).getUTCHours());
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  let best: StatsResponse["mostActiveTimeOfDay"] = "Morning";
  let bestCount = -1;
  for (const bucket of TIME_OF_DAY_BUCKETS) {
    const count = counts.get(bucket) ?? 0;
    if (count > bestCount) {
      best = bucket;
      bestCount = count;
    }
  }
  return best;
}

export function computeStats(
  activities: StatsActivity[],
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

  const longestActivity = activities.reduce<StatsActivity | null>((longest, a) => {
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
    mostActiveTimeOfDay: mostActiveTimeOfDay(activities),
    activityCountBySportType,
  };
}

export function computeHeatmap(activities: StatsActivity[]): HeatmapResponse {
  const byDate = new Map<string, number>();
  for (const a of activities) {
    byDate.set(a.date, (byDate.get(a.date) ?? 0) + a.distanceMeters);
  }
  return Array.from(byDate.entries())
    .map(([date, distanceMeters]) => ({ date, distanceMeters }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeTrends(
  activities: StatsActivity[],
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
