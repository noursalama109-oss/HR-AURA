import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const day = dateParam ? new Date(dateParam) : new Date();
  const dayStart = startOfDay(day);

  const [records, activeEmployees] = await Promise.all([
    db.attendance.findMany({
      where: { date: dayStart },
      include: { employee: { include: { position: true, department: true } }, shift: true },
      orderBy: { checkIn: "desc" },
    }),
    db.employee.findMany({
      where: { status: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] } },
      select: { id: true, firstName: true, lastName: true, code: true },
    }),
  ]);

  const recordedIds = new Set(records.map(r => r.employeeId));
  const unrecorded = activeEmployees.filter(e => !recordedIds.has(e.id));

  return NextResponse.json({ date: dayStart, records, unrecorded });
}
