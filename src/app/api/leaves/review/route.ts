import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { notifyHr } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "leaves", "approve"))
    return NextResponse.json({ error: "ليس لديك صلاحية الموافقة" }, { status: 403 });

  const { requestId, action, notes } = await req.json();
  const request = await db.leaveRequest.findUnique({
    where: { id: requestId },
    include: { employee: { include: { user: true } }, leaveType: true },
  });
  if (!request) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  async function notifyEmployee(title: string, message: string) {
    if (request!.employee.user) {
      await db.notification.create({ data: { userId: request!.employee.user!.id, type: "leave", title, message, link: "/leaves" } });
    }
  }

  if (action === "reject") {
    await db.leaveRequest.update({ where: { id: requestId }, data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), notes: notes ?? null } });
    await notifyEmployee("رفض طلب إجازة", `تم رفض طلب إجازة ${request.leaveType.name}`);
    return NextResponse.json({ success: true });
  }

  if (action === "manager_approve") {
    if (request.status !== "PENDING") return NextResponse.json({ error: "الطلب ليس قيد الانتظار" }, { status: 400 });
    await db.leaveRequest.update({ where: { id: requestId }, data: { status: "MANAGER_APPROVED", reviewedById: user.id, reviewedAt: new Date(), notes: notes ?? null } });
    await notifyHr("leave", "إجازة بانتظار موافقة HR", `طلب ${request.employee.firstName} ${request.employee.lastName} تمت موافقة المدير المباشر`, "/leaves");
    return NextResponse.json({ success: true });
  }

  if (action === "hr_approve") {
    if (!["PENDING", "MANAGER_APPROVED"].includes(request.status))
      return NextResponse.json({ error: "لا يمكن الاعتماد في الحالة الحالية" }, { status: 400 });

    if (request.leaveType.defaultDays > 0) {
      const year = new Date(request.startDate).getFullYear();
      let balance = await db.leaveBalance.findFirst({ where: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year } });
      if (!balance) {
        balance = await db.leaveBalance.create({
          data: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year, total: request.leaveType.defaultDays, used: 0, remaining: request.leaveType.defaultDays },
        });
      }
      if (balance.remaining < request.days)
        return NextResponse.json({ error: `الرصيد غير كافٍ — المتبقي ${balance.remaining} يوم` }, { status: 400 });
      await db.leaveBalance.update({ where: { id: balance.id }, data: { used: balance.used + request.days, remaining: balance.remaining - request.days } });
    }

    await db.leaveRequest.update({ where: { id: requestId }, data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date(), notes: notes ?? null } });
    await notifyEmployee("اعتماد إجازة", `تم اعتماد إجازة ${request.leaveType.name} (${request.days} يوم)`);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
