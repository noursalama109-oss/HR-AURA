import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "penalties", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const [penalties, rewards] = await Promise.all([
    db.penalty.findMany({ include: { employee: { select: { firstName: true, lastName: true, code: true } } }, orderBy: { issuedAt: "desc" } }),
    db.reward.findMany({ include: { employee: { select: { firstName: true, lastName: true, code: true } } }, orderBy: { issuedAt: "desc" } }),
  ]);
  return NextResponse.json({ penalties, rewards });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "penalties", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { kind, employeeId, type, amount, reason } = await req.json();
  if (!employeeId || !type || !reason) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

  if (kind === "reward") {
    const reward = await db.reward.create({
      data: { employeeId, type, amount: amount ? Number(amount) : null, reason, issuedBy: user.id },
    });
    return NextResponse.json({ reward }, { status: 201 });
  }

  const penalty = await db.penalty.create({
    data: { employeeId, type, amount: amount ? Number(amount) : null, reason, issuedBy: user.id },
  });
  return NextResponse.json({ penalty }, { status: 201 });
}
