import { cookies } from "next/headers";
import { db } from "./db";

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { userId, token, expiresAt } });
  (await cookies()).set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60 });
  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token }, include: { user: { include: { role: { include: { permissions: true } } } } } });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  return session.user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  cookieStore.delete("session");
}
