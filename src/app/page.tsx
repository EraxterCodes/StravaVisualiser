import { sql } from "drizzle-orm";
import { db } from "@/db";

export default async function Home() {
  let dbStatus: "connected" | "error" = "connected";
  let errorMessage = "";

  try {
    await db.execute(sql`select 1`);
  } catch (err) {
    dbStatus = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Strava Visualiser
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Walking skeleton is up.
      </p>
      <p
        className={
          dbStatus === "connected"
            ? "rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
            : "rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
        }
      >
        Database: {dbStatus === "connected" ? "connected" : `error — ${errorMessage}`}
      </p>
    </div>
  );
}
