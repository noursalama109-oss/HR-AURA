import { db } from "./db";
import { startOfDay } from "date-fns";

export async function getSetting(key: string, fallback: string): Promise<string> {
  const s = await db.setting.findFirst({ where: { key } });
  return s?.value ?? fallback;
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function getTodayShift(employeeId: string, date: Date) {
  const assignments = await db.shiftAssignment.findMany({
    where: { employeeId, startDate: { lte: date }, OR: [{ endDate: null }, { endDate: { gte: date } }] },
    include: { shift: true },
  });
  const day = date.getDay();
  for (const a of assignments) {
    const days = a.weekdays.split(",").map(Number);
    if (days.includes(day)) return a.shift;
  }
  return null;
}

export async function getDefaultShift(branchId: string | null) {
  if (branchId) {
    const s = await db.shift.findFirst({ where: { branchId, isActive: true } });
    if (s) return s;
  }
  return db.shift.findFirst({ where: { isActive: true } });
}

export function computeLate(shiftStart: string, checkIn: Date, graceMinutes: number): number {
  const [h, m] = shiftStart.split(":").map(Number);
  const start = new Date(checkIn);
  start.setHours(h, m, 0, 0);
  const diff = Math.floor((checkIn.getTime() - start.getTime()) / 60000);
  const late = diff - graceMinutes;
  return late > 0 ? late : 0;
}

export function computeOvertime(shiftEnd: string, checkOut: Date): number {
  const [h, m] = shiftEnd.split(":").map(Number);
  const end = new Date(checkOut);
  end.setHours(h, m, 0, 0);
  const diff = Math.floor((checkOut.getTime() - end.getTime()) / 60000);
  return diff > 0 ? diff : 0;
}

export async function hasApprovedLeaveOrMission(employeeId: string, date: Date): Promise<boolean> {
  const dayStart = startOfDay(date);
  const [leave, att] = await Promise.all([
    db.leaveRequest.findFirst({ where: { employeeId, status: "APPROVED", startDate: { lte: dayStart }, endDate: { gte: dayStart } } }),
    db.attendance.findFirst({ where: { employeeId, date: dayStart, status: { in: ["LEAVE", "MISSION", "PERMISSION", "HOLIDAY", "WEEKEND"] } } }),
  ]);
  return !!leave || !!att;
}

export async function notifyHr(type: string, title: string, message: string, link?: string) {
  const users = await db.user.findMany({ where: { role: { code: { in: ["SUPER_ADMIN", "HR_MANAGER"] } } } });
  for (const u of users) {
    await db.notification.create({ data: { userId: u.id, type, title, message, link } });
  }
}
