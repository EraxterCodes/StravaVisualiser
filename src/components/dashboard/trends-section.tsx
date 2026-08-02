"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionHeading } from "@/components/dashboard/card";
import { formatDistanceKm, formatPace, formatShortDate } from "@/lib/format";
import { useTimeRange } from "@/lib/time-range-context";
import { useFetchJson } from "@/lib/use-fetch-json";
import type { TrendsResponse } from "@/types/api";

const GRIDLINE = "var(--gridline)";
const MUTED = "var(--text-muted)";

function TooltipCard({
  active,
  label,
  valueLabel,
  value,
  swatch,
}: {
  active?: boolean;
  label?: string;
  valueLabel: string;
  value: string;
  swatch: string;
}) {
  if (!active || !label) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-raised px-3 py-2 text-sm shadow-xl">
      <div className="mb-1 text-xs text-text-muted">{formatShortDate(label)}</div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: swatch }} />
        <span className="font-semibold text-text-primary">{value}</span>
        <span className="text-text-muted">{valueLabel}</span>
      </div>
    </div>
  );
}

export function TrendsSection() {
  const { range } = useTimeRange();
  const { data, loading, error } = useFetchJson<TrendsResponse>(
    `/api/trends?range=${range}`,
  );

  const dimClass = loading && data ? "opacity-50" : "opacity-100";
  const bucketLabel =
    range === "last-30-days" || range === "this-month" ? "weekly" : "monthly";

  if (error && !data) {
    return (
      <Card>
        <SectionHeading title="Trends" subtitle="Distance & pace over time" accent="yellow" />
        <p className="text-sm text-series-red">Couldn&apos;t load trends: {error}</p>
      </Card>
    );
  }

  const points = data ?? [];
  const isEmpty = !loading && points.length === 0;

  return (
    <div className={`grid grid-cols-1 gap-4 transition-opacity duration-200 lg:grid-cols-2 ${dimClass}`}>
      <Card>
        <SectionHeading
          title="Distance trend"
          subtitle={`Total distance per ${bucketLabel} bucket`}
          accent="blue"
        />
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatShortDate}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={{ stroke: GRIDLINE }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={({ active, label, payload }) => (
                    <TooltipCard
                      active={active}
                      label={label as string}
                      valueLabel="distance"
                      value={formatDistanceKm(Number(payload?.[0]?.value ?? 0))}
                      swatch="var(--series-blue)"
                    />
                  )}
                />
                <Bar
                  dataKey="distanceMeters"
                  fill="var(--series-blue)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeading
          title="Pace trend"
          subtitle={`Average pace per ${bucketLabel} bucket (lower is faster)`}
          accent="orange"
        />
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatShortDate}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={{ stroke: GRIDLINE }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(v: number) => formatPace(v).replace(" /km", "")}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  reversed
                />
                <Tooltip
                  cursor={{ stroke: GRIDLINE, strokeWidth: 1 }}
                  content={({ active, label, payload }) => (
                    <TooltipCard
                      active={active}
                      label={label as string}
                      valueLabel="pace"
                      value={formatPace(Number(payload?.[0]?.value ?? 0))}
                      swatch="var(--series-orange)"
                    />
                  )}
                />
                <Line
                  dataKey="averagePaceSecondsPerKm"
                  stroke="var(--series-orange)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--series-orange)", strokeWidth: 2, stroke: "var(--surface)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-text-muted">
      No activities in this range yet.
    </div>
  );
}
