import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { getSetting } from "@/lib/attendance";
import { startOfMonth, endOfMonth } from "date-fns";

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
  const pEnd = endOfMonth(p);

  const existing = await db.payrollRun.findFirst({ where: { period: p } });
  if (existing) return NextResponse.json({ error: "يوجد كشف مرتبات لهذا الشهر بالفعل" }, { status: 400 });

  const insuranceRate = parseFloat(await getSetting("payroll.insurance_rate", "0.11"));
  const taxRate = parseFloat(await getSetting("payroll.tax_rate", "0.10"));

  const employees = await db.employee.findMany({ where: { status: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] } } });

  const run = await db.payrollRun.create({ data: { period: p, status: "CALCULATED", createdBy: user.id } });

  for (const emp of employees) {
    const contract = await db.contract.findFirst({ where: { employeeId: emp.id, status: "ACTIVE" }, orderBy: { startDate: "desc" } });
    const basic = contract ? Number(contract.salary) : 0;
    const daily = basic / 30;
    const hourly = basic / 240;

    const [absences, attSum, rewardsSum, penaltiesSum, loanInsts] = await Promise.all([
      db.attendance.count({ where: { employeeId: emp.id, date: { gte: p, lte: pEnd }, status: "ABSENT" } }),
      db.attendance.aggregate({ where: { employeeId: emp.id, date: { gte: p, lte: pEnd } }, _sum: { lateMinutes: true, overtimeMin: true } }),
      db.reward.aggregate({ where: { employeeId: emp.id, issuedAt: { gte: p, lte: pEnd } }, _sum: { amount: true } }),
      db.penalty.aggregate({ where: { employeeId: emp.id, issuedAt: { gte: p, lte: pEnd } }, _sum: { amount: true } }),
      db.loanInstallment.findMany({ where: { loan: { employeeId: emp.id, status: "ACTIVE" }, isPaid: false, month: { gte: p, lte: pEnd } } }),
    ]);

    const overtime = Math.round(((attSum._sum.overtimeMin ?? 0) / 60) * hourly * 1.5);
    const bonuses = Number(rewardsSum._sum.amount ?? 0);
    const absencesDed = Math.round(absences * daily);
    const lateDed = Math.round(((attSum._sum.lateMinutes ?? 0) / 60) * hourly);
    const loanDed = loanInsts.reduce((s, i) => s + Number(i.amount), 0);
    const penalties = Number(penaltiesSum._sum.amount ?? 0);
    const insurance = Math.round(basic * insuranceRate);
    const gross = basic + overtime + bonuses;
    const tax = Math.round(Math.max(0, gross - insurance) * taxRate);
    const net = gross - insurance - tax - absencesDed - lateDed - loanDed - penalties;

    await db.payrollItem.create({
      data: {
        payrollRunId: run.id, employeeId: emp.id,
        basicSalary: basic, allowances: 0, overtime, bonuses,
        absencesDed, lateDed, loanDed, penalties, insurance, tax,
        gross, net, status: "calculated",
      },
    });
  }

  await db.auditLog.create({
    data: { userId: user.id, action: "create", entity: "PayrollRun", entityId: run.id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });

  const full = await db.payrollRun.findUnique({ where: { id: run.id }, include: { items: { include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } } } } } });
  return NextResponse.json({ run: full }, { status: 201 });
}
