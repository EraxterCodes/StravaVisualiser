import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, isValidSharedSecret } from "@/lib/auth";
import { syncActivities } from "@/lib/strava/sync";

/**
 * Protected sync/manual-refresh endpoint (ticket 04). The same route serves
 * two callers described in the spec: the hourly GitHub Actions workflow
 * (ticket 05) and the owner's on-demand "refresh now" trigger — both
 * authenticate identically with `Authorization: Bearer <SYNC_SECRET>`, so
 * there's nothing "thin wrapper"-shaped to add on top of this.
 */
export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!isValidSharedSecret(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncActivities();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Strava sync failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
