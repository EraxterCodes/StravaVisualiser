import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  stravaId: bigint("strava_id", { mode: "bigint" }).notNull().unique(),
  name: text("name").notNull(),
  sportType: text("sport_type").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  distanceMeters: real("distance_meters").notNull(),
  movingTimeSeconds: integer("moving_time_seconds").notNull(),
  elapsedTimeSeconds: integer("elapsed_time_seconds").notNull(),
  totalElevationGainMeters: real("total_elevation_gain_meters").notNull(),
  calories: real("calories"),
  averageSpeedMetersPerSecond: real("average_speed_mps"),
  polyline: text("polyline"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const stravaCredentials = pgTable("strava_credentials", {
  id: serial("id").primaryKey(),
  athleteId: bigint("athlete_id", { mode: "bigint" }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Per-person invite links (owner-generated, individually revocable) that
 * gate access to the otherwise-public dashboard, since per-activity GPS
 * routes reveal the owner's home address. */
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});
