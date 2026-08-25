import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const settings: [string, string][] = [
    ["attendance.require_trusted_device", "false"],
    ["attendance.require_geofence", "false"],
    ["attendance.require_shift", "false"],
    ["attendance.grace_minutes", "15"],
    ["contracts.alert_days", "30,15,7"],
    ["payroll.insurance_rate", "0.11"],
    ["payroll.tax_rate", "0.10"],
  ];
  for (const [key, value] of settings) {
    const existing = await prisma.setting.findFirst({ where: { key } });
    if (existing) {
      await prisma.setting.update({ where: { id: existing.id }, data: { value } });
    } else {
      await prisma.setting.create({ data: { companyId: null, key, value } });
    }
  }
  console.log("✅ Settings seeded");
}
main().finally(() => prisma.$disconnect());
