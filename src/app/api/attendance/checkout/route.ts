import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSetting, haversine } from "@/lib/attendance";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeCode, pin, qrSecret, latitude, longitude, deviceId } = body;
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const requirePin = (await getSetting("attendance.require_pin", "true")) === "true";
    if (!employeeCode || !qrSecret || (requirePin && !pin)) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

    const branch = await db.branch.findFirst({ where: { qrSecret } });
    if (!branch) return NextResponse.json({ error: "QR غير صالح لهذا الفرع" }, { status: 400 });

    const employee = await db.employee.findFirst({ where: { code: employeeCode } });
    if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    if (requirePin && (!employee.pin || employee.pin !== pin)) return NextResponse.json({ error: "PIN غير صحيح" }, { status: 401 });

    if (!deviceId) return NextResponse.json({ error: "معرف الجهاز مطلوب" }, { status: 400 });
    const trusted = await db.trustedDevice.findMany({ where: { employeeId: employee.id, isTrusted: true } });
    const isFirstTime = trusted.length === 0;
    const requireGeo = (await getSetting("attendance.require_geofence", "false")) === "true";

    if (isFirstTime || requireGeo) {
      if (latitude == null || longitude == null)
        return NextResponse.json({ error: isFirstTime ? "أول تسجيل: يجب السماح بالموقع لأخذ بصمة الجهاز" : "يجب السماح بالوصول للموقع" }, { status: 400 });
      if (requireGeo) {
        const dist = haversine(Number(branch.latitude), Number(branch.longitude), Number(latitude), Number(longitude));
        if (dist > branch.geofenceRadius) return NextResponse.json({ error: "خارج النطاق الجغرافي المسموح" }, { status: 403 });
      }
    }

    if (isFirstTime) {
      await db.trustedDevice.create({
        data: { employeeId: employee.id, deviceId, name: "هاتف الموظف", isTrusted: true, ipAddress: ip, latitude: Number(latitude), longitude: Number(longitude) },
      });
    } else {
      const match = trusted.find(dv => dv.deviceId === deviceId);
      if (!match) return NextResponse.json({ error: "تم الرفض — هذا الجهاز غير مسجل لك. استخدم هاتفك المعتاد" }, { status: 403 });
      await db.trustedDevice.update({ where: { id: match.id }, data: { lastUsedAt: new Date(), ipAddress: ip } });
    }

    const now = new Date();
    const dayStart = startOfDay(now);

    const existing = await db.attendance.findFirst({ where: { employeeId: employee.id, date: dayStart } });
    if (!existing?.checkIn) return NextResponse.json({ error: "لم يتم تسجيل الحضور بعد" }, { status: 400 });
    if (existing.checkOut) return NextResponse.json({ error: "تم تسجيل الانصراف بالفعل اليوم" }, { status: 400 });

    const workedMin = Math.floor((now.getTime() - new Date(existing.checkIn).getTime()) / 60000);
    const overtimeMin = Math.max(0, workedMin - 480);

    await db.attendance.update({ where: { id: existing.id }, data: { checkOut: now, overtimeMin } });

    await db.attendanceEvent.create({
      data: {
        attendanceId: existing.id, type: "CHECK_OUT", timestamp: now,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        deviceId, ipAddress: ip, method: "QR+PIN", branchId: branch.id,
      },
    });

    await db.auditLog.create({ data: { action: "check_out", entity: "Attendance", entityId: existing.id, ipAddress: ip } });

    return NextResponse.json({ success: true, time: now, overtimeMin, workedMin, employeeName: `${employee.firstName} ${employee.lastName}` });
  } catch (e) {
    return NextResponse.json({ error: "خطأ: " + ((e as any)?.message ?? "غير معروف") }, { status: 500 });
  }
}
