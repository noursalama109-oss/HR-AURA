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

  const [settings, branches, company, roles] = await Promise.all([
    db.setting.findMany(),
    db.branch.findMany(),
    db.company.findFirst(),
    db.role.findMany({ include: { _count: { select: { permissions: true } } } }),
  ]);
  return NextResponse.json({ settings, branches, company, roles });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "settings", "edit"))
    return NextResponse.json({ error: "ليس لديك صلاحية التعديل" }, { status: 403 });

  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "مفتاح غير صحيح" }, { status: 400 });

  const existing = await db.setting.findFirst({ where: { key } });
  if (existing) {
    await db.setting.update({ where: { id: existing.id }, data: { value: String(value) } });
  } else {
    await db.setting.create({ data: { companyId: null, key, value: String(value) } });
  }

  await db.auditLog.create({
    data: { userId: user.id, action: "update", entity: "Setting", entityId: key, newValue: { value }, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });
  return NextResponse.json({ success: true });
}
