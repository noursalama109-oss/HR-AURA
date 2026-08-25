import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { notifyHr } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "loans", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const withdrawals = await db.withdrawal.findMany({
    include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ withdrawals });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "loans", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية الإضافة" }, { status: 403 });

  const { employeeId, amount, date, reason } = await req.json();
  const amt = Number(amount);
  if (!employeeId || !amt || amt <= 0 || !date)
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });

  const withdrawal = await db.withdrawal.create({
    data: { employeeId, amount: amt, date: new Date(date), reason: reason ?? null, createdBy: user.id, status: "ACTIVE" },
  });

  await db.auditLog.create({
    data: { userId: user.id, action: "create", entity: "Withdrawal", entityId: withdrawal.id, newValue: { employeeId, amount, date }, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });
  await notifyHr("loan", "مسحوبات جديدة", `تم تسجيل مسحوبات بقيمة ${amt} — ستُخصم من مرتب الشهر`, "/withdrawals");

  return NextResponse.json({ withdrawal }, { status: 201 });
}
