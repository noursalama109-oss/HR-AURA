import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const [byDept, byBranch, byStatus, attMonth, leaveMonth, payrollRuns, loansActive] = await Promise.all([
    db.employee.groupBy({ by: ["departmentId"], _count: { id: true } }),
    db.employee.groupBy({ by: ["branchId"], _count: { id: true } }),
    db.employee.groupBy({ by: ["status"], _count: { id: true } }),
    db.attendance.groupBy({ by: ["status"], _count: { id: true }, where: { date: { gte: mStart, lte: mEnd } } }),
    db.leaveRequest.groupBy({ by: ["status"], _sum: { days: true }, where: { startDate: { gte: mStart, lte: mEnd } } }),
    db.payrollRun.findMany({ include: { items: true }, orderBy: { period: "desc" }, take: 6 }),
    db.loan.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const departments = await db.department.findMany();
  const branches = await db.branch.findMany();
  const deptMap = new Map(departments.map(d => [d.id, d.name]));
  const branchMap = new Map(branches.map(b => [b.id, b.name]));

  return NextResponse.json({
    byDepartment: byDept.map(x => ({ name: deptMap.get(x.departmentId) ?? "غير محدد", value: x._count.id })),
    byBranch: byBranch.map(x => ({ name: branchMap.get(x.branchId) ?? "غير محدد", value: x._count.id })),
    byStatus: byStatus.map(x => ({ name: x.status, value: x._count.id })),
    attendanceMonth: attMonth.map(x => ({ name: x.status, value: x._count.id })),
    leavesMonth: leaveMonth.map(x => ({ name: x.status, value: x._sum.days ?? 0 })),
    payrollHistory: payrollRuns.map(r => ({
      period: r.period,
      status: r.status,
      employees: r.items.length,
      gross: r.items.reduce((s, i) => s + Number(i.gross), 0),
      net: r.items.reduce((s, i) => s + Number(i.net), 0),
    })),
    loansOutstanding: loansActive.reduce((s, l) => s + Number(l.remainingAmount), 0),
    loansCount: loansActive.length,
  });
}
