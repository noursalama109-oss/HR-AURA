import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

const transitions: Record<string, string> = {
  CALCULATED: "REVIEWED",
  REVIEWED: "APPROVED",
  APPROVED: "PAID",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "payroll", "approve"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { id } = await params;
  const run = await db.payrollRun.findUnique({ where: { id }, include: { items: true } });
  if (!run) return NextResponse.json({ error: "الكشف غير موجود" }, { status: 404 });

  const next = transitions[run.status];
  if (!next) return NextResponse.json({ error: "لا يمكن تغيير الحالة الحالية" }, { status: 400 });

  if (next === "APPROVED") {
    const p = startOfMonth(run.period);
    const pEnd = endOfMonth(run.period);
    for (const item of run.items) {
      if (item.loanDed > 0) {
        const insts = await db.loanInstallment.findMany({
          where: { loan: { employeeId: item.employeeId, status: "ACTIVE" }, isPaid: false, month: { gte: p, lte: pEnd } },
          include: { loan: true },
        });
        for (const inst of insts) {
          await db.loanInstallment.update({ where: { id: inst.id }, data: { isPaid: true, paidAt: new Date(), payrollItemId: item.id } });
          const loan = await db.loan.findUnique({ where: { id: inst.loanId } });
          if (loan) {
            const paid = Number(loan.paidAmount) + Number(inst.amount);
            const remaining = Math.max(0, Number(loan.amount) - paid);
            await db.loan.update({ where: { id: loan.id }, data: { paidAmount: paid, remainingAmount: remaining, status: remaining <= 0 ? "COMPLETED" : loan.status } });
          }
        }
      }
    }
    await db.payrollRun.update({ where: { id }, data: { status: "APPROVED", approvedBy: user.id, approvedAt: new Date() } });
  } else if (next === "PAID") {
    await db.payrollRun.update({ where: { id }, data: { status: "PAID" } });
    await db.payrollItem.updateMany({ where: { payrollRunId: id }, data: { status: "paid", paidAt: new Date() } });
  } else {
    await db.payrollRun.update({ where: { id }, data: { status: next } });
  }

  await db.auditLog.create({
    data: { userId: user.id, action: `payroll_${next.toLowerCase()}`, entity: "PayrollRun", entityId: id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });

  return NextResponse.json({ success: true, status: next });
}
