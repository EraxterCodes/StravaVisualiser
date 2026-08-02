/**
 * Shared API contract between the frontend and backend tracks (spec ticket 02).
 * The backend implements routes returning these shapes for real; the frontend
 * builds against fixture data conforming to the same types.
 */

export type TimeRangePreset =
  | "all-time"
  | "this-year"
  | "this-month"
  | "last-30-days";

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  "all-time",
  "this-year",
  "this-month",
  "last-30-days",
];

export type SportType =
  | "Run"
  | "Ride"
  | "Swim"
  | "Hike"
  | "Walk"
  | "Other";

/** GET /api/stats?range=<preset> */
export interface StatsResponse {
  range: TimeRangePreset;
  totalDistanceMeters: number;
  totalElevationGainMeters: number;
  totalMovingTimeSeconds: number;
  activityCount: number;
  totalCalories: number;
  /** e.g. "3.2x around the Earth" */
  distanceEquivalence: string;
  /** e.g. "5.4x the height of Everest" */
  elevationEquivalence: string;
  longestActivity: {
    id: string;
    name: string;
    sportType: SportType;
    distanceMeters: number;
    movingTimeSeconds: number;
    date: string;
  } | null;
  longestStreakDays: number;
  mostActiveDayOfWeek:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  mostActiveTimeOfDay: "Early Morning" | "Morning" | "Afternoon" | "Evening" | "Night";
  activityCountBySportType: Partial<Record<SportType, number>>;
}

/** GET /api/heatmap?range=<preset> */
export interface HeatmapEntry {
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** Total distance in meters for that day, used to shade the cell */
  distanceMeters: number;
}
export type HeatmapResponse = HeatmapEntry[];

/** GET /api/trends?range=<preset> */
export interface TrendPoint {
  /** ISO date of the bucket start (week or month, depending on range) */
  period: string;
  distanceMeters: number;
  averagePaceSecondsPerKm: number;
}
export type TrendsResponse = TrendPoint[];

/** GET /api/activities?range=<preset> */
export interface ActivitySummary {
  id: string;
  name: string;
  sportType: SportType;
  date: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  averagePaceSecondsPerKm: number;
}
export type ActivitiesResponse = ActivitySummary[];

/** GET /api/activities/:id/route */
export interface ActivityRouteResponse {
  id: string;
  /** Decoded GPS route as [lat, lng] pairs, ready for Leaflet */
  coordinates: [number, number][];
}
