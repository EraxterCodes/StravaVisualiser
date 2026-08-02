import { timingSafeEqual } from "crypto";

/**
 * Constant-time comparison of a candidate secret against `SYNC_SECRET`. Used
 * to gate every owner-only route (OAuth setup, sync/refresh) per the spec's
 * single-shared-secret auth model.
 */
export function isValidSharedSecret(candidate: string | null | undefined): boolean {
  const expected = process.env.SYNC_SECRET;
  if (!expected || !candidate) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Extracts the token from an `Authorization: Bearer <token>` header. */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}
