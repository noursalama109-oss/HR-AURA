import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "requests", "approve"))
    return NextResponse.json({ error: "ليس لديك صلاحية الموافقة" }, { status: 403 });

  const { requestId, action, notes } = await req.json();
  if (!["approve", "reject"].includes(action)) return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });

  const request = await db.employeeRequest.findUnique({ where: { id: requestId }, include: { employee: { include: { user: true } } } });
  if (!request) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (request.status !== "PENDING") return NextResponse.json({ error: "الطلب تمت معالجته بالفعل" }, { status: 400 });

  await db.employeeRequest.update({
    where: { id: requestId },
    data: { status: action === "approve" ? "APPROVED" : "REJECTED", reviewedById: user.id, reviewedAt: new Date(), notes: notes ?? null },
  });

  if (request.employee.user) {
    await db.notification.create({
      data: {
        userId: request.employee.user.id, type: "request",
        title: action === "approve" ? "تمت الموافقة على طلبك" : "تم رفض طلبك",
        message: request.title, link: "/requests",
      },
    });
  }
  return NextResponse.json({ success: true });
}
