import { randomBytes } from "crypto";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { extractBearerToken, isValidSharedSecret } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isValidSharedSecret(extractBearerToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(invites).orderBy(desc(invites.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!isValidSharedSecret(extractBearerToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const token = randomBytes(16).toString("hex");
  const [invite] = await db.insert(invites).values({ token, label }).returning();

  return NextResponse.json(invite, { status: 201 });
}
