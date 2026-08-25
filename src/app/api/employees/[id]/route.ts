import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "employees", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية العرض" }, { status: 403 });

  const { id } = await params;
  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      branch: true,
      department: true,
      position: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
      attendances: { orderBy: { date: "desc" }, take: 30 },
      leaveBalances: { include: { leaveType: true } },
      leaveRequests: { include: { leaveType: true }, orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { startDate: "desc" } },
      loans: { include: { installments: true }, orderBy: { requestedAt: "desc" } },
      payrollItems: { include: { payrollRun: true } },
      documents: { orderBy: { createdAt: "desc" } },
      penalties: { orderBy: { issuedAt: "desc" } },
      rewards: { orderBy: { issuedAt: "desc" } },
      reviews: { include: { cycle: true }, orderBy: { reviewedAt: "desc" } },
      requests: { orderBy: { createdAt: "desc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  return NextResponse.json({ employee });
}
