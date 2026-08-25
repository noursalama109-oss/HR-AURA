import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { getTodayShift, getDefaultShift, hasApprovedLeaveOrMission, notifyHr } from "@/lib/attendance";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "attendance", "approve"))
    return NextResponse.json({ error: "ليس لديك صلاحية المعالجة" }, { status: 403 });

  const now = new Date();
  const dayStart = startOfDay(now);

  const employees = await db.employee.findMany({ where: { status: { in: ["ACTIVE", "PROBATION"] } } });
  let marked = 0;

  for (const emp of employees) {
    const existing = await db.attendance.findFirst({ where: { employeeId: emp.id, date: dayStart } });
    if (existing) continue;
    if (await hasApprovedLeaveOrMission(emp.id, now)) continue;

    const shift = (await getTodayShift(emp.id, now)) ?? (await getDefaultShift(emp.branchId));

    await db.attendance.create({
      data: { employeeId: emp.id, date: dayStart, status: "ABSENT", shiftId: shift?.id ?? null, branchId: emp.branchId },
    });
    await notifyHr("absence", "غياب موظف", `${emp.firstName} ${emp.lastName} لم يسجل الحضور اليوم`, "/attendance");
    marked++;
  }

  return NextResponse.json({ success: true, marked });
}
