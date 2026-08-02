import type { ActivitySummary } from "@/types/api";

/**
 * The internal shape the stats/heatmap/trends aggregation helpers (`@/lib/stats`)
 * operate on — a superset of the public `ActivitySummary` contract, plus fields
 * needed only for aggregation (elevation, calories, GPS route, exact timestamp).
 * Both the fixture data (`@/fixtures/activities`) and the real DB-backed query
 * layer (`@/lib/strava/query`) produce this same shape, so the aggregation logic
 * is shared between fixture-mode and real-data-mode.
 */
export interface StatsActivity extends ActivitySummary {
  totalElevationGainMeters: number;
  calories: number;
  /** Full ISO timestamp (unlike `date`, which is day-only) — used for
   * time-of-day aggregation. */
  startDateTime: string;
  /** Decoded GPS route, when the activity has one. */
  coordinates?: [number, number][];
}
