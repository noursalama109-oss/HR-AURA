import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-utils";
import { createSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
    const user = await verifyPassword(email, password);
    if (!user) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await db.auditLog.create({ data: { userId: user.id, action: "login", entity: "User", entityId: user.id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" } });
    await createSession(user.id);
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role.code } });
  } catch (e) {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
