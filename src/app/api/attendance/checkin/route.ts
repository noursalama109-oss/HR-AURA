import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSetting, haversine, getTodayShift, getDefaultShift, computeLate, hasApprovedLeaveOrMission } from "@/lib/attendance";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeCode, pin, qrSecret, latitude, longitude, deviceId } = body;
    if (!employeeCode || !pin || !qrSecret) return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });

    const branch = await db.branch.findFirst({ where: { qrSecret } });
    if (!branch) return NextResponse.json({ error: "QR غير صالح لهذا الفرع" }, { status: 400 });

    const employee = await db.employee.findFirst({ where: { code: employeeCode } });
    if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    if (employee.status === "TERMINATED") return NextResponse.json({ error: "الموظف منتهي الخدمة" }, { status: 403 });

    if (!employee.pin || employee.pin !== pin) return NextResponse.json({ error: "PIN غير صحيح" }, { status: 401 });

    const requireDevice = (await getSetting("attendance.require_trusted_device", "false")) === "true";
    if (deviceId) {
      const device = await db.trustedDevice.findFirst({ where: { employeeId: employee.id, deviceId } });
      if (requireDevice && (!device || !device.isTrusted)) {
        return NextResponse.json({ error: "الجهاز غير موثوق — راجع الموارد البشرية" }, { status: 403 });
      }
      await db.trustedDevice.upsert({
        where: { employeeId_deviceId: { employeeId: employee.id, deviceId } },
        update: { lastUsedAt: new Date() },
        create: { employeeId: employee.id, deviceId, name: "جهاز جديد", isTrusted: !requireDevice },
      });
    } else if (requireDevice) {
      return NextResponse.json({ error: "معرف الجهاز مطلوب" }, { status: 400 });
    }

    const requireGeo = (await getSetting("attendance.require_geofence", "false")) === "true";
    if (requireGeo) {
      if (latitude == null || longitude == null) return NextResponse.json({ error: "يجب السماح بالوصول للموقع" }, { status: 400 });
      const dist = haversine(Number(branch.latitude), Number(branch.longitude), Number(latitude), Number(longitude));
      if (dist > branch.geofenceRadius) return NextResponse.json({ error: "خارج النطاق الجغرافي المسموح" }, { status: 403 });
    }

    const now = new Date();
    const dayStart = startOfDay(now);

    if (await hasApprovedLeaveOrMission(employee.id, now)) {
      return NextResponse.json({ error: "لديك إجازة أو مأمورية معتمدة اليوم" }, { status: 400 });
    }

    const requireShift = (await getSetting("attendance.require_shift", "false")) === "true";
    let shift = await getTodayShift(employee.id, now);
    if (!shift) shift = await getDefaultShift(employee.branchId);
    if (!shift) return NextResponse.json({ error: "لا توجد وردية معرفة في النظام" }, { status: 400 });
    if (requireShift && !(await getTodayShift(employee.id, now))) {
      return NextResponse.json({ error: "لا توجد وردية مسجلة لك اليوم" }, { status: 400 });
    }

    const existing = await db.attendance.findFirst({ where: { employeeId: employee.id, date: dayStart } });
    if (existing?.checkIn) return NextResponse.json({ error: "تم تسجيل الحضور بالفعل اليوم" }, { status: 400 });

    const grace = parseInt(await getSetting("attendance.grace_minutes", "15"));
    const lateMinutes = computeLate(shift.startTime, now, grace);

    const attendance = await db.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: dayStart } },
      update: { checkIn: now, status: lateMinutes > 0 ? "LATE" : "PRESENT", lateMinutes, shiftId: shift.id, branchId: branch.id },
      create: { employeeId: employee.id, date: dayStart, checkIn: now, status: lateMinutes > 0 ? "LATE" : "PRESENT", lateMinutes, shiftId: shift.id, branchId: branch.id },
    });

    await db.attendanceEvent.create({
      data: {
        attendanceId: attendance.id, type: "CHECK_IN", timestamp: now,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        deviceId: deviceId ?? null,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        method: "QR+PIN", branchId: branch.id,
      },
    });

    await db.auditLog.create({
      data: { action: "check_in", entity: "Attendance", entityId: attendance.id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
    });

    return NextResponse.json({ success: true, status: attendance.status, lateMinutes, time: now });
  } catch (e) {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
