import type { SportType } from "@/types/api";

/**
 * Strava returns many more granular `sport_type` strings (e.g. `VirtualRide`,
 * `TrailRun`, `GravelRide`) than the fixed set the frontend's categorical
 * color mapping supports (spec ticket 06). Real activities are normalized
 * into that fixed set here, at the query boundary, so the API contract
 * (`@/types/api`'s `SportType`) never has to grow to match Strava's full
 * vocabulary.
 */
const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun", "Treadmill"]);
const RIDE_TYPES = new Set([
  "Ride",
  "VirtualRide",
  "GravelRide",
  "MountainBikeRide",
  "EBikeRide",
  "EMountainBikeRide",
  "Velomobile",
  "Handcycle",
]);
const HIKE_TYPES = new Set(["Hike", "Snowshoe"]);
const WALK_TYPES = new Set(["Walk"]);
const SWIM_TYPES = new Set(["Swim"]);

export function normalizeSportType(raw: string): SportType {
  if (RUN_TYPES.has(raw)) return "Run";
  if (RIDE_TYPES.has(raw)) return "Ride";
  if (SWIM_TYPES.has(raw)) return "Swim";
  if (HIKE_TYPES.has(raw)) return "Hike";
  if (WALK_TYPES.has(raw)) return "Walk";
  return "Other";
}
