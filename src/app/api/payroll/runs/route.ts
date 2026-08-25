import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { buildRunItems } from "@/lib/payroll";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "payroll", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const runs = await db.payrollRun.findMany({
    include: { items: { include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } } } } },
    orderBy: { period: "desc" },
  });
  return NextResponse.json({ runs });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "payroll", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية الإنشاء" }, { status: 403 });

  const { period } = await req.json();
  if (!period) return NextResponse.json({ error: "الشهر مطلوب" }, { status: 400 });
  const p = startOfMonth(new Date(period));

  const existing = await db.payrollRun.findFirst({ where: { period: p } });
  if (existing) return NextResponse.json({ error: "يوجد كشف مرتبات لهذا الشهر بالفعل" }, { status: 400 });

  const run = await db.payrollRun.create({ data: { period: p, status: "CALCULATED", createdBy: user.id } });
  await buildRunItems(run.id, p);

  await db.auditLog.create({
    data: { userId: user.id, action: "create", entity: "PayrollRun", entityId: run.id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });

  const full = await db.payrollRun.findUnique({ where: { id: run.id }, include: { items: { include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } } } } } });
  return NextResponse.json({ run: full }, { status: 201 });
}
