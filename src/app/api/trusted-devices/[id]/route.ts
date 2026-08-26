import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "employees", "edit"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { id } = await params;
  await db.trustedDevice.delete({ where: { id } });
  await db.auditLog.create({
    data: { userId: user.id, action: "unlink_device", entity: "TrustedDevice", entityId: id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
  });
  return NextResponse.json({ success: true });
}
