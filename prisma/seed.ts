import { PrismaClient, RoleCode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const superAdminRole = await prisma.role.upsert({
    where: { code: RoleCode.SUPER_ADMIN },
    update: {},
    create: { code: RoleCode.SUPER_ADMIN, name: "مدير النظام", description: "كامل الصلاحيات" },
  });

  const resources = ["employees","attendance","leaves","contracts","loans","payroll","requests","documents","penalties","rewards","reviews","reports","notifications","settings","users"];
  const actions = ["view","create","edit","delete","approve","export"];
  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { resource_action_roleId: { resource, action, roleId: superAdminRole.id } },
        update: {},
        create: { resource, action, roleId: superAdminRole.id },
      });
    }
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@hr-aura.com" },
    update: {},
    create: { email: "admin@hr-aura.com", passwordHash, name: "مدير النظام", roleId: superAdminRole.id },
  });

  await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: { id: "default-company", name: "شركة النور", phone: "+20 100 000 0000", email: "info@hr-aura.com" },
  });

  await prisma.branch.upsert({
    where: { code: "MAIN" },
    update: {},
    create: {
      name: "الفرع الرئيسي", code: "MAIN", address: "القاهرة - مصر",
      latitude: 30.0444, longitude: 31.2357, geofenceRadius: 200,
      qrSecret: "MAIN-QR-SECRET-001", companyId: "default-company",
    },
  });

  for (const d of [{ code: "HR", name: "الموارد البشرية" },{ code: "FIN", name: "المالية والحسابات" },{ code: "IT", name: "تكنولوجيا المعلومات" }]) {
    await prisma.department.upsert({ where: { code: d.code }, update: {}, create: d });
  }

  for (const p of [{ code: "HR-MGR", title: "مدير موارد بشرية", level: 3 },{ code: "ACC", title: "محاسب", level: 2 },{ code: "DEV", title: "مطور برمجيات", level: 2 }]) {
    await prisma.position.upsert({ where: { code: p.code }, update: {}, create: p });
  }

  await prisma.shift.upsert({
    where: { code: "DAY" },
    update: {},
    create: { code: "DAY", name: "الوردية الصباحية", startTime: "09:00", endTime: "17:00", graceMinutes: 15, workHours: 8 },
  });

  for (const lt of [{ code: "ANNUAL", name: "سنوية", isPaid: true, defaultDays: 21 },{ code: "SICK", name: "مرضية", isPaid: true, defaultDays: 15 },{ code: "CASUAL", name: "عارضة", isPaid: true, defaultDays: 6 },{ code: "UNPAID", name: "بدون مرتب", isPaid: false, defaultDays: 0 }]) {
    await prisma.leaveType.upsert({ where: { code: lt.code }, update: {}, create: lt });
  }

  console.log("✅ Seed completed!");
  console.log("🔑 Login: admin@hr-aura.com / admin123");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());
