import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "documents", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const documents = await db.employeeDocument.findMany({
    include: { employee: { select: { firstName: true, lastName: true, code: true } } },
    orderBy: { expiresAt: "asc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "documents", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { employeeId, name, type, issuedAt, expiresAt } = await req.json();
  if (!employeeId || !name || !type || !issuedAt)
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

  const doc = await db.employeeDocument.create({
    data: {
      employeeId, name, type,
      issuedAt: new Date(issuedAt),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      fileUrl: "", uploadedBy: user.id,
    },
  });
  return NextResponse.json({ doc }, { status: 201 });
}
