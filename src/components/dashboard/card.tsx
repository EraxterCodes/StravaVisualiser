import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-surface/80 p-5 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  accent = "blue",
}: {
  title: string;
  subtitle?: string;
  accent?: "blue" | "orange" | "aqua" | "yellow" | "magenta";
}) {
  const accentClass: Record<string, string> = {
    blue: "before:bg-series-blue",
    orange: "before:bg-series-orange",
    aqua: "before:bg-series-aqua",
    yellow: "before:bg-series-yellow",
    magenta: "before:bg-series-magenta",
  };

  return (
    <div className="mb-4 flex flex-col gap-1">
      <h2
        className={`relative pl-3 text-lg font-semibold tracking-tight text-text-primary before:absolute before:left-0 before:top-0.5 before:h-4 before:w-1 before:rounded-full ${accentClass[accent]}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="pl-3 text-sm text-text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
