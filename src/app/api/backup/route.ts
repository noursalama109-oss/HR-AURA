import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "settings", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const data = {
    exportedAt: new Date().toISOString(),
    company: await db.company.findMany(),
    branches: await db.branch.findMany(),
    departments: await db.department.findMany(),
    positions: await db.position.findMany(),
    employees: await db.employee.findMany(),
    attendance: await db.attendance.findMany(),
    leaveTypes: await db.leaveType.findMany(),
    leaveBalances: await db.leaveBalance.findMany(),
    leaveRequests: await db.leaveRequest.findMany(),
    contracts: await db.contract.findMany(),
    loans: await db.loan.findMany(),
    loanInstallments: await db.loanInstallment.findMany(),
    withdrawals: await db.withdrawal.findMany(),
    rewards: await db.reward.findMany(),
    penalties: await db.penalty.findMany(),
    payrollRuns: await db.payrollRun.findMany(),
    payrollItems: await db.payrollItem.findMany(),
    settings: await db.setting.findMany(),
    users: await db.user.findMany(),
  };
  return NextResponse.json(data);
}
