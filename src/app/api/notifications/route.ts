import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("count")) {
    const unread = await db.notification.count({ where: { userId: user.id, isRead: false } });
    return NextResponse.json({ unread });
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, all } = await req.json();
  if (all) {
    await db.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  } else if (id) {
    await db.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
  }
  return NextResponse.json({ success: true });
}
