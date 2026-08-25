import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getSetting } from "@/lib/attendance";
import { differenceInCalendarDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "documents", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const now = new Date();
  const thresholds = (await getSetting("contracts.alert_days", "30,15,7")).split(",").map(Number);
  const docs = await db.employeeDocument.findMany({
    where: { NOT: { expiresAt: null } },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });
  const hrUsers = await db.user.findMany({ where: { role: { code: { in: ["SUPER_ADMIN", "HR_MANAGER"] } } } });

  let alerts = 0;
  for (const doc of docs) {
    if (!doc.expiresAt) continue;
    const daysLeft = differenceInCalendarDays(doc.expiresAt, now);
    if (daysLeft < 0) continue;
    for (const t of thresholds) {
      if (daysLeft <= t) {
        const link = `/documents?alert=${doc.id}-${t}`;
        const exists = await db.notification.findFirst({ where: { type: "doc_expiry", link } });
        if (!exists) {
          for (const u of hrUsers) {
            await db.notification.create({
              data: {
                userId: u.id, type: "doc_expiry", link,
                title: "مستند ينتهي قريباً",
                message: `${doc.name} للموظف ${doc.employee.firstName} ${doc.employee.lastName} ينتهي خلال ${daysLeft} يوم`,
              },
            });
          }
          alerts++;
        }
        break;
      }
    }
  }
  return NextResponse.json({ success: true, alerts });
}
