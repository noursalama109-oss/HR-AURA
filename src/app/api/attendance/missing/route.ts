import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = startOfDay(new Date());
  const [employees, att, leaves] = await Promise.all([
    db.employee.findMany({ where: { status: { in: ["ACTIVE", "PROBATION"] } }, select: { id: true, firstName: true, lastName: true, code: true } }),
    db.attendance.findMany({ where: { date: today }, select: { employeeId: true } }),
    db.leaveRequest.findMany({ where: { status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } }, select: { employeeId: true } }),
  ]);
  const attIds = new Set(att.map(a => a.employeeId));
  const leaveIds = new Set(leaves.map(l => l.employeeId));
  const missing = employees.filter(e => !attIds.has(e.id) && !leaveIds.has(e.id));
  return NextResponse.json({ missing });
}
