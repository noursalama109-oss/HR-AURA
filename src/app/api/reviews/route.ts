import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "reviews", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const [cycles, reviews] = await Promise.all([
    db.reviewCycle.findMany({ orderBy: { startDate: "desc" } }),
    db.performanceReview.findMany({
      include: { employee: { select: { firstName: true, lastName: true, code: true } }, cycle: true },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);
  return NextResponse.json({ cycles, reviews });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "reviews", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { employeeId, cycleId, score, comments } = await req.json();
  const sc = Number(score);
  if (!employeeId || !cycleId || score == null || isNaN(sc) || sc < 0 || sc > 100)
    return NextResponse.json({ error: "الدرجة يجب أن تكون بين 0 و 100" }, { status: 400 });

  const review = await db.performanceReview.create({
    data: { employeeId, cycleId, reviewerId: user.id, score: sc, comments: comments ?? null },
  });
  return NextResponse.json({ review }, { status: 201 });
}
