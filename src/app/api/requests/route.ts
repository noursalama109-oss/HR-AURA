import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { notifyHr } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "requests", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  const requests = await db.employeeRequest.findMany({
    include: { employee: { select: { id: true, firstName: true, lastName: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "requests", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { employeeId, type, title, details } = await req.json();
  if (!employeeId || !type || !title) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

  const request = await db.employeeRequest.create({
    data: { employeeId, type, title, details: details ? { note: details } : undefined },
  });
  await notifyHr("request", "طلب جديد من موظف", title, "/requests");
  return NextResponse.json({ request }, { status: 201 });
}
