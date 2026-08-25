import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getSetting } from "@/lib/attendance";
import { differenceInCalendarDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "contracts", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const now = new Date();
  const thresholds = (await getSetting("contracts.alert_days", "30,15,7")).split(",").map(Number);

  const contracts = await db.contract.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  let alerts = 0;
  const hrUsers = await db.user.findMany({ where: { role: { code: { in: ["SUPER_ADMIN", "HR_MANAGER"] } } } });

  for (const c of contracts) {
    if (differenceInCalendarDays(c.endDate, now) < 0) {
      await db.contract.update({ where: { id: c.id }, data: { status: "EXPIRED" } });
      continue;
    }
    const daysLeft = differenceInCalendarDays(c.endDate, now);
    for (const t of thresholds) {
      if (daysLeft <= t) {
        const link = `/contracts?alert=${c.id}-${t}`;
        const exists = await db.notification.findFirst({ where: { type: "contract_expiry", link } });
        if (!exists) {
          for (const u of hrUsers) {
            await db.notification.create({
              data: {
                userId: u.id, type: "contract_expiry", link,
                title: "عقد ينتهي قريباً",
                message: `عقد ${c.employee.firstName} ${c.employee.lastName} ينتهي خلال ${daysLeft} يوم (${c.type})`,
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
