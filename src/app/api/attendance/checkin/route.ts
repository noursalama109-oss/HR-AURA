import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSetting, haversine, hasApprovedLeaveOrMission, notifyHr } from "@/lib/attendance";
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
    if (employee.status === "TERMINATED") return NextResponse.json({ error: "الموظف منتهي الخدمة" }, { status: 403 });
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
      await notifyHr("device", "تسجيل جهاز جديد", `تم ربط جهاز جديد بالموظف ${employee.firstName} ${employee.lastName} (أول تسجيل)`, "/employees");
    } else {
      const match = trusted.find(dv => dv.deviceId === deviceId);
      if (!match) {
        await notifyHr("security", "محاولة تسجيل مرفوضة", `محاولة حضور مرفوضة للموظف ${employee.firstName} ${employee.lastName} من جهاز غير مسجل`, "/attendance");
        return NextResponse.json({ error: "تم الرفض — هذا الجهاز غير مسجل لك. استخدم هاتفك المعتاد" }, { status: 403 });
      }
      await db.trustedDevice.update({ where: { id: match.id }, data: { lastUsedAt: new Date(), ipAddress: ip } });
    }

    const now = new Date();
    const dayStart = startOfDay(now);

    if (await hasApprovedLeaveOrMission(employee.id, now))
      return NextResponse.json({ error: "لديك إجازة أو مأمورية معتمدة اليوم" }, { status: 400 });

    const existing = await db.attendance.findFirst({ where: { employeeId: employee.id, date: dayStart } });
    if (existing?.checkIn) return NextResponse.json({ error: "تم تسجيل الحضور بالفعل اليوم" }, { status: 400 });

    const attendance = await db.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: dayStart } },
      update: { checkIn: now, status: "PRESENT", lateMinutes: 0, branchId: branch.id },
      create: { employeeId: employee.id, date: dayStart, checkIn: now, status: "PRESENT", lateMinutes: 0, branchId: branch.id },
    });

    await db.attendanceEvent.create({
      data: {
        attendanceId: attendance.id, type: "CHECK_IN", timestamp: now,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        deviceId, ipAddress: ip, method: "QR+PIN", branchId: branch.id,
      },
    });

    await db.auditLog.create({ data: { action: "check_in", entity: "Attendance", entityId: attendance.id, ipAddress: ip } });

    return NextResponse.json({ success: true, status: "PRESENT", time: now, employeeName: `${employee.firstName} ${employee.lastName}` });
  } catch (e) {
    return NextResponse.json({ error: "خطأ: " + ((e as any)?.message ?? "غير معروف") }, { status: 500 });
  }
}
