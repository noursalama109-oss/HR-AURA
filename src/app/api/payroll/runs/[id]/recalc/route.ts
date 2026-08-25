import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { buildRunItems } from "@/lib/payroll";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "payroll", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { id } = await params;
  const run = await db.payrollRun.findUnique({ where: { id } });
  if (!run) return NextResponse.json({ error: "الكشف غير موجود" }, { status: 404 });
  if (!["CALCULATED", "REVIEWED"].includes(run.status))
    return NextResponse.json({ error: "لا يمكن إعادة الحساب بعد الاعتماد" }, { status: 400 });

  await db.payrollItem.deleteMany({ where: { payrollRunId: id } });
  await buildRunItems(id, run.period);
  await db.payrollRun.update({ where: { id }, data: { status: "CALCULATED" } });

  return NextResponse.json({ success: true });
}
