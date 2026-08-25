import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "reviews", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { name, startDate, endDate } = await req.json();
  if (!name || !startDate || !endDate) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
  if (new Date(endDate) <= new Date(startDate)) return NextResponse.json({ error: "التواريخ غير صحيحة" }, { status: 400 });

  const cycle = await db.reviewCycle.create({ data: { name, startDate: new Date(startDate), endDate: new Date(endDate) } });
  return NextResponse.json({ cycle }, { status: 201 });
}
