import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { notifyHr } from "@/lib/attendance";
import { differenceInCalendarDays, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "leaves", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const [requests, balances] = await Promise.all([
    db.leaveRequest.findMany({ include: { employee: true, leaveType: true }, orderBy: { createdAt: "desc" } }),
    db.leaveBalance.findMany({
      where: { year: new Date().getFullYear() },
      include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } }, leaveType: true },
    }),
  ]);
  const mDays = parseInt(await getSetting("leaves.monthly_days", "4"));
  const mS = startOfMonth(new Date());
  const mE = endOfMonth(new Date());
  for (const b of balances as any[]) {
    if (b.leaveType?.monthly) {
      const used = await db.leaveRequest.aggregate({
        where: { employeeId: b.employeeId, leaveTypeId: b.leaveTypeId, status: "APPROVED", startDate: { gte: mS, lte: mE } },
        _sum: { days: true },
      });
      b.used = used._sum.days ?? 0;
      b.total = mDays;
      b.remaining = Math.max(0, mDays - (used._sum.days ?? 0));
    }
  }
  const types = await db.leaveType.findMany();
  return NextResponse.json({ requests, balances, types });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "leaves", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const body = await req.json();
  const { employeeId, leaveTypeId, startDate, endDate, reason } = body;
  if (!employeeId || !leaveTypeId || !startDate || !endDate)
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = differenceInCalendarDays(end, start) + 1;
  if (days <= 0) return NextResponse.json({ error: "التواريخ غير صحيحة" }, { status: 400 });

  const leaveType = await db.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType) return NextResponse.json({ error: "نوع الإجازة غير موجود" }, { status: 404 });

  if (leaveType.defaultDays > 0) {
    const balance = await db.leaveBalance.findFirst({ where: { employeeId, leaveTypeId, year: start.getFullYear() } });
    const remaining = balance?.remaining ?? leaveType.defaultDays;
    if (days > remaining) return NextResponse.json({ error: `الرصيد غير كافٍ — المتبقي ${remaining} يوم` }, { status: 400 });
  }

  const request = await db.leaveRequest.create({
    data: { employeeId, leaveTypeId, startDate: start, endDate: end, days, reason: reason ?? null },
  });
  await notifyHr("leave_request", "طلب إجازة جديد", `طلب إجازة ${leaveType.name} لمدة ${days} يوم بانتظار الموافقة`, "/leaves");
  return NextResponse.json({ request }, { status: 201 });
}
