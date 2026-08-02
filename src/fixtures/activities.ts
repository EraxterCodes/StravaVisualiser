import type { ActivitySummary, SportType } from "@/types/api";

export interface FixtureActivity extends ActivitySummary {
  totalElevationGainMeters: number;
  calories: number;
  /** Only populated for a couple of fixture activities, to exercise the route endpoint */
  coordinates?: [number, number][];
}

function pace(distanceMeters: number, movingTimeSeconds: number): number {
  return movingTimeSeconds / (distanceMeters / 1000);
}

const raw: Array<
  Omit<FixtureActivity, "averagePaceSecondsPerKm"> & { movingTimeSeconds: number }
> = [
  { id: "1", name: "Morning River Loop", sportType: "Run", date: "2026-08-02", distanceMeters: 8200, movingTimeSeconds: 2460, totalElevationGainMeters: 65, calories: 520,
    coordinates: [
      [55.6761, 12.5683],
      [55.6775, 12.5701],
      [55.6790, 12.5720],
      [55.6802, 12.5748],
      [55.6795, 12.5775],
      [55.6778, 12.5760],
      [55.6761, 12.5683],
    ] },
  { id: "2", name: "Sunset Coastal Ride", sportType: "Ride", date: "2026-08-01", distanceMeters: 42000, movingTimeSeconds: 5400, totalElevationGainMeters: 310, calories: 1180,
    coordinates: [
      [55.6900, 12.5900],
      [55.7020, 12.6100],
      [55.7150, 12.6300],
      [55.7300, 12.6550],
      [55.7150, 12.6300],
      [55.6900, 12.5900],
    ] },
  { id: "3", name: "Tempo Run", sportType: "Run", date: "2026-07-28", distanceMeters: 10000, movingTimeSeconds: 2700, totalElevationGainMeters: 40, calories: 640 },
  { id: "4", name: "Forest Trail Hike", sportType: "Hike", date: "2026-07-15", distanceMeters: 13500, movingTimeSeconds: 12600, totalElevationGainMeters: 640, calories: 1450 },
  { id: "5", name: "Easy Recovery Run", sportType: "Run", date: "2026-07-02", distanceMeters: 5200, movingTimeSeconds: 1740, totalElevationGainMeters: 20, calories: 340 },
  { id: "6", name: "Weekend Long Run", sportType: "Run", date: "2026-06-20", distanceMeters: 21100, movingTimeSeconds: 6300, totalElevationGainMeters: 180, calories: 1420 },
  { id: "7", name: "Hill Repeats Ride", sportType: "Ride", date: "2026-06-05", distanceMeters: 28000, movingTimeSeconds: 4500, totalElevationGainMeters: 520, calories: 980 },
  { id: "8", name: "5k Time Trial", sportType: "Run", date: "2026-05-18", distanceMeters: 5000, movingTimeSeconds: 1260, totalElevationGainMeters: 15, calories: 310 },
  { id: "9", name: "Lake Swim", sportType: "Swim", date: "2026-05-01", distanceMeters: 2000, movingTimeSeconds: 2100, totalElevationGainMeters: 0, calories: 480 },
  { id: "10", name: "Rainy Day Jog", sportType: "Run", date: "2026-04-10", distanceMeters: 7000, movingTimeSeconds: 2280, totalElevationGainMeters: 55, calories: 460 },
  { id: "11", name: "Countryside Century", sportType: "Ride", date: "2026-03-22", distanceMeters: 61000, movingTimeSeconds: 8700, totalElevationGainMeters: 690, calories: 1980 },
  { id: "12", name: "Spring Reset Run", sportType: "Run", date: "2026-03-01", distanceMeters: 9000, movingTimeSeconds: 2760, totalElevationGainMeters: 75, calories: 570 },
  { id: "13", name: "City Walk", sportType: "Walk", date: "2026-02-14", distanceMeters: 4500, movingTimeSeconds: 3300, totalElevationGainMeters: 25, calories: 240 },
  { id: "14", name: "Frosty Morning Run", sportType: "Run", date: "2026-01-20", distanceMeters: 8000, movingTimeSeconds: 2520, totalElevationGainMeters: 60, calories: 510 },
  { id: "15", name: "New Year Ride", sportType: "Ride", date: "2026-01-05", distanceMeters: 35000, movingTimeSeconds: 5100, totalElevationGainMeters: 410, calories: 1120 },
  { id: "16", name: "Holiday 10k", sportType: "Run", date: "2025-12-15", distanceMeters: 10000, movingTimeSeconds: 2940, totalElevationGainMeters: 45, calories: 630 },
  { id: "17", name: "Ridge Hike", sportType: "Hike", date: "2025-11-28", distanceMeters: 15200, movingTimeSeconds: 14400, totalElevationGainMeters: 890, calories: 1680 },
  { id: "18", name: "Foggy Loop", sportType: "Run", date: "2025-11-10", distanceMeters: 6200, movingTimeSeconds: 2040, totalElevationGainMeters: 35, calories: 390 },
  { id: "19", name: "Autumn Gravel Ride", sportType: "Ride", date: "2025-10-25", distanceMeters: 33000, movingTimeSeconds: 5700, totalElevationGainMeters: 460, calories: 1080 },
  { id: "20", name: "First Cool Morning Run", sportType: "Run", date: "2025-10-01", distanceMeters: 7500, movingTimeSeconds: 2400, totalElevationGainMeters: 50, calories: 480 },
];

export const FIXTURE_ACTIVITIES: FixtureActivity[] = raw.map((a) => ({
  ...a,
  averagePaceSecondsPerKm: pace(a.distanceMeters, a.movingTimeSeconds),
}));

export function fixtureActivitiesBySportType(): Partial<Record<SportType, number>> {
  const counts: Partial<Record<SportType, number>> = {};
  for (const activity of FIXTURE_ACTIVITIES) {
    counts[activity.sportType] = (counts[activity.sportType] ?? 0) + 1;
  }
  return counts;
}
