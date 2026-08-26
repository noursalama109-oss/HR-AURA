import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const latest = await db.payrollRun.findFirst({ orderBy: { period: "desc" }, include: { items: true } });
  const items = latest?.items ?? [];
  const totalNet = items.reduce((t, i) => t + Number(i.net), 0);
  const totalGross = items.reduce((t, i) => t + Number(i.gross), 0);
  return NextResponse.json({ period: latest?.period ?? null, totalNet, totalGross, count: items.length });
}
