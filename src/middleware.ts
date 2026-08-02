import { NextResponse } from "next/server";

/**
 * EMERGENCY LOCKDOWN (2026-08-02): the dashboard was exposing GPS route data
 * that reveals the owner's home address. Blocks every request on every URL
 * (including raw Vercel deployment URLs, not just the aliased domain) until
 * real access control is built. Remove/relax once that's in place.
 */
export function middleware() {
  return new NextResponse("Temporarily offline for maintenance.", { status: 503 });
}

export const config = {
  matcher: "/:path*",
};
