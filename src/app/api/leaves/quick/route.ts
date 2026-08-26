import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { startOfDay, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "leaves", "approve"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { employeeId, leaveTypeId } = await req.json();
  if (!employeeId || !leaveTypeId) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

  const type = await db.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!type) return NextResponse.json({ error: "نوع الإجازة غير موجود" }, { status: 404 });

  const now = new Date();
  if (type.monthly) {
    const used = await db.leaveRequest.aggregate({
      where: { employeeId, leaveTypeId, status: "APPROVED", startDate: { gte: startOfMonth(now) } },
      _sum: { days: true },
    });
    if ((used._sum.days ?? 0) >= (type.monthly ? parseInt(await getSetting("leaves.monthly_days", "4")) : type.defaultDays))
      return NextResponse.json({ error: "انتهى رصيد الإجازة الشهرية لهذا الشهر" }, { status: 400 });
  } else {
    const balance = await db.leaveBalance.findFirst({ where: { employeeId, leaveTypeId, year: now.getFullYear() } });
    if (balance && balance.remaining < 1) return NextResponse.json({ error: "الرصيد غير كافٍ" }, { status: 400 });
    if (balance) await db.leaveBalance.update({ where: { id: balance.id }, data: { used: balance.used + 1, remaining: balance.remaining - 1 } });
  }

  const today = startOfDay(now);
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  const request = await db.leaveRequest.create({
    data: {
      employeeId, leaveTypeId, startDate: today, endDate: today, days: 1,
      status: "APPROVED", reviewedById: user.id, reviewedAt: new Date(),
      reason: "تسجيل من نافذة الغيابين",
    },
  });
  return NextResponse.json({ request: { ...request, employeeName: employee ? employee.firstName + " " + employee.lastName : "" } });
}
