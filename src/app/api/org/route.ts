import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "settings", "edit"))
    return NextResponse.json({ error: "ليس لديك صلاحية التعديل" }, { status: 403 });

  const { kind, id, data } = await req.json();

  if (kind === "company") {
    const clean = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      logo: data.logo || null,
    };
    const existing = await db.company.findFirst();
    const company = existing
      ? await db.company.update({ where: { id: existing.id }, data: clean })
      : await db.company.create({ data: clean });
    return NextResponse.json({ company });
  }

  if (kind === "branch") {
    const company = await db.company.findFirst();
    const clean: any = {
      name: data.name,
      code: data.code,
      address: data.address || null,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      geofenceRadius: Number(data.geofenceRadius),
      isActive: data.isActive === true || data.isActive === "true",
      qrSecret: data.qrSecret || undefined,
    };
    if (id) {
      const branch = await db.branch.update({ where: { id }, data: clean });
      return NextResponse.json({ branch });
    }
    const branch = await db.branch.create({
      data: { ...clean, companyId: company?.id ?? null, qrSecret: clean.qrSecret ?? `QR-${Math.random().toString(36).slice(2, 10).toUpperCase()}` },
    });
    return NextResponse.json({ branch }, { status: 201 });
  }

  return NextResponse.json({ error: "نوع غير معروف" }, { status: 400 });
}
