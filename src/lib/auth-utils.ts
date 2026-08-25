import bcrypt from "bcryptjs";
import { db } from "./db";

export async function verifyPassword(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email }, include: { role: { include: { permissions: true } } } });
  if (!user || !user.isActive) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export function hasPermission(permissions: { resource: string; action: string }[], resource: string, action: string): boolean {
  return permissions.some(p => p.resource === resource && p.action === action);
}
