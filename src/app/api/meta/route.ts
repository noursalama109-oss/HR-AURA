import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [branches, departments, positions, shifts, leaveTypes] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { level: "asc" } }),
    db.shift.findMany({ where: { isActive: true } }),
    db.leaveType.findMany(),
  ]);

  return NextResponse.json({ branches, departments, positions, shifts, leaveTypes });
}
