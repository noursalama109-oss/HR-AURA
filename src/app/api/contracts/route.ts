import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "contracts", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const contracts = await db.contract.findMany({
    include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } } },
    orderBy: { endDate: "asc" },
  });
  return NextResponse.json({ contracts });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "contracts", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية الإضافة" }, { status: 403 });

  const body = await req.json();
  const { employeeId, type, startDate, endDate, salary, notes } = body;
  if (!employeeId || !type || !startDate || !endDate || salary == null)
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return NextResponse.json({ error: "تاريخ النهاية يجب أن يكون بعد البداية" }, { status: 400 });

  const now = new Date();
  const status = now >= start && now <= end ? "ACTIVE" : now < start ? "DRAFT" : "EXPIRED";

  const contract = await db.contract.create({
    data: { employeeId, type, startDate: start, endDate: end, salary: Number(salary), notes: notes ?? null, status },
  });

  await db.auditLog.create({
    data: { userId: user.id, action: "create", entity: "Contract", entityId: contract.id, newValue: body, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });

  return NextResponse.json({ contract }, { status: 201 });
}
