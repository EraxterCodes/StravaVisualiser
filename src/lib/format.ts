/** Formatting helpers shared across dashboard components. */

export function formatDistanceKm(meters: number): string {
  return `${(meters / 1000).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

export function formatElevationM(meters: number): string {
  return `${Math.round(meters).toLocaleString()} m`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours.toLocaleString()}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatPace(secondsPerKm: number): string {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "—";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

export function formatCalories(calories: number): string {
  return `${Math.round(calories).toLocaleString()} kcal`;
}

export function formatCount(count: number): string {
  return count.toLocaleString();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const RANGE_LABELS: Record<string, string> = {
  "all-time": "All-time",
  "this-year": "This year",
  "this-month": "This month",
  "last-30-days": "Last 30 days",
};

export function formatRangeLabel(range: string): string {
  return RANGE_LABELS[range] ?? range;
}
