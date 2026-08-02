import { TIME_RANGE_PRESETS, type TimeRangePreset } from "@/types/api";

export function parseTimeRange(searchParams: URLSearchParams): TimeRangePreset {
  const raw = searchParams.get("range");
  if (raw && (TIME_RANGE_PRESETS as string[]).includes(raw)) {
    return raw as TimeRangePreset;
  }
  return "all-time";
}

export function isWithinRange(
  dateStr: string,
  range: TimeRangePreset,
  now: Date = new Date(),
): boolean {
  const date = new Date(dateStr);

  switch (range) {
    case "all-time":
      return true;
    case "this-year":
      return date.getUTCFullYear() === now.getUTCFullYear();
    case "this-month":
      return (
        date.getUTCFullYear() === now.getUTCFullYear() &&
        date.getUTCMonth() === now.getUTCMonth()
      );
    case "last-30-days": {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
      return date >= thirtyDaysAgo && date <= now;
    }
  }
}
