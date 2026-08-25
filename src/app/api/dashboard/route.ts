import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, addDays, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const thirtyDaysFromNow = addDays(today, 30);

  const [
    totalEmployees,
    activeEmployees,
    todayAttendance,
    leavesToday,
    contractsExpiringSoon,
    docsExpiringSoon,
    activeLoans,
    totalPayrollThisMonth,
    pendingRequests,
    notifications,
  ] = await Promise.all([
    db.employee.count(),
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.attendance.count({ where: { date: todayStart } }),
    db.leaveRequest.count({ where: { status: "APPROVED", startDate: { lte: todayEnd }, endDate: { gte: todayStart } } }),
    db.contract.count({ where: { endDate: { lte: thirtyDaysFromNow, gte: today } } }),
    db.employeeDocument.count({ where: { expiresAt: { lte: thirtyDaysFromNow, gte: today } } }),
    db.loan.count({ where: { status: { in: ["ACTIVE", "APPROVED"] } } }),
    db.payrollItem.aggregate({ where: { payrollRun: { period: startOfMonth(today) } }, _sum: { net: true } }),
    db.employeeRequest.count({ where: { status: "PENDING" } }),
    db.notification.findMany({ where: { userId: user.id, isRead: false }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  // Department distribution
  const byDept = await db.employee.groupBy({
    by: ["departmentId"],
    _count: { id: true },
  });
  const depts = await db.department.findMany();
  const deptMap = new Map(depts.map(d => [d.id, d.name]));
  const departmentDistribution = byDept.map(d => ({
    name: deptMap.get(d.departmentId) ?? "غير محدد",
    value: d._count.id,
  }));

  // Branch distribution
  const byBranch = await db.employee.groupBy({
    by: ["branchId"],
    _count: { id: true },
  });
  const branches = await db.branch.findMany();
  const branchMap = new Map(branches.map(b => [b.id, b.name]));
  const branchDistribution = byBranch.map(b => ({
    name: branchMap.get(b.branchId) ?? "غير محدد",
    value: b._count.id,
  }));

  // Last 7 days attendance
  const last7Days: { date: string; present: number; absent: number; late: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(addDays(today, -i));
    const [present, absent, late] = await Promise.all([
      db.attendance.count({ where: { date: d, status: "PRESENT" } }),
      db.attendance.count({ where: { date: d, status: "ABSENT" } }),
      db.attendance.count({ where: { date: d, status: "LATE" } }),
    ]);
    last7Days.push({ date: d.toISOString().slice(0, 10), present, absent, late });
  }

  // Recent activity
  const recentActivity = await db.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    totalEmployees,
    activeEmployees,
    todayAttendance,
    leavesToday,
    contractsExpiringSoon,
    docsExpiringSoon,
    activeLoans,
    totalPayrollThisMonth: totalPayrollThisMonth._sum.net ?? 0,
    pendingRequests,
    notifications,
    departmentDistribution,
    branchDistribution,
    last7Days,
    recentActivity,
  });
}
