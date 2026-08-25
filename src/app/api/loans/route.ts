import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { notifyHr } from "@/lib/attendance";
import { addMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "loans", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const loans = await db.loan.findMany({
    include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } }, installments: { orderBy: { month: "asc" } } },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json({ loans });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "loans", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية الإضافة" }, { status: 403 });

  const body = await req.json();
  const { employeeId, amount, installmentsCount, startDeductionMonth } = body;
  const amt = Number(amount);
  const count = Number(installmentsCount);
  if (!employeeId || !amt || amt <= 0 || !count || count < 1 || !startDeductionMonth)
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });

  const installmentValue = Math.round((amt / count) * 100) / 100;
  const start = new Date(startDeductionMonth);

  const loan = await db.loan.create({
    data: {
      employeeId,
      amount: amt,
      installmentsCount: count,
      installmentValue,
      startDeductionMonth: start,
      remainingAmount: amt,
      paidAmount: 0,
      status: "ACTIVE",
      installments: {
        create: Array.from({ length: count }, (_, i) => ({
          month: addMonths(start, i),
          amount: installmentValue,
        })),
      },
    },
    include: { installments: true },
  });

  await db.auditLog.create({
    data: { userId: user.id, action: "create", entity: "Loan", entityId: loan.id, newValue: body, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });
  await notifyHr("loan", "سلفة جديدة", `تم إنشاء سلفة بقيمة ${amt} على ${count} قسط`, "/loans");

  return NextResponse.json({ loan }, { status: 201 });
}
