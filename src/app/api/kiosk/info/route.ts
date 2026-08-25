import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const b = searchParams.get("b");
  if (!b) return NextResponse.json({ branch: null });
  const branch = await db.branch.findFirst({ where: { qrSecret: b }, select: { name: true } });
  return NextResponse.json({ branch });
}
