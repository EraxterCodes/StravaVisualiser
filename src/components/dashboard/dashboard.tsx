"use client";

import { ActivitiesSection } from "@/components/dashboard/activities-section";
import { HeatmapSection } from "@/components/dashboard/heatmap-section";
import { StatsSection } from "@/components/dashboard/stats-section";
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector";
import { TrendsSection } from "@/components/dashboard/trends-section";
import { TimeRangeProvider } from "@/lib/time-range-context";

export function Dashboard() {
  return (
    <TimeRangeProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-series-blue">
              Strava Visualiser
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              Training dashboard
            </h1>
          </div>
          <TimeRangeSelector />
        </header>

        <StatsSection />
        <HeatmapSection />
        <TrendsSection />
        <ActivitiesSection />

        <footer className="mt-4 border-t border-white/10 pt-6 text-center text-xs text-text-muted">
          Data pulled from Strava. Built with Next.js, Recharts, react-calendar-heatmap and Leaflet.
        </footer>
      </div>
    </TimeRangeProvider>
  );
}
