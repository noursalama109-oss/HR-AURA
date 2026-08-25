import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSetting, haversine, getTodayShift, getDefaultShift, computeOvertime } from "@/lib/attendance";
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

    if (!employee.pin || employee.pin !== pin) return NextResponse.json({ error: "PIN غير صحيح" }, { status: 401 });

    const requireGeo = (await getSetting("attendance.require_geofence", "false")) === "true";
    if (requireGeo) {
      if (latitude == null || longitude == null) return NextResponse.json({ error: "يجب السماح بالوصول للموقع" }, { status: 400 });
      const dist = haversine(Number(branch.latitude), Number(branch.longitude), Number(latitude), Number(longitude));
      if (dist > branch.geofenceRadius) return NextResponse.json({ error: "خارج النطاق الجغرافي المسموح" }, { status: 403 });
    }

    const now = new Date();
    const dayStart = startOfDay(now);

    const existing = await db.attendance.findFirst({ where: { employeeId: employee.id, date: dayStart }, include: { shift: true } });
    if (!existing?.checkIn) return NextResponse.json({ error: "لم يتم تسجيل الحضور بعد" }, { status: 400 });
    if (existing.checkOut) return NextResponse.json({ error: "تم تسجيل الانصراف بالفعل اليوم" }, { status: 400 });

    let shift = existing.shift;
    if (!shift) shift = await getTodayShift(employee.id, now);
    if (!shift) shift = await getDefaultShift(employee.branchId);

    const overtimeMin = shift ? computeOvertime(shift.endTime, now) : 0;

    await db.attendance.update({ where: { id: existing.id }, data: { checkOut: now, overtimeMin } });

    await db.attendanceEvent.create({
      data: {
        attendanceId: existing.id, type: "CHECK_OUT", timestamp: now,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        deviceId: deviceId ?? null,
        ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
        method: "QR+PIN", branchId: branch.id,
      },
    });

    await db.auditLog.create({
      data: { action: "check_out", entity: "Attendance", entityId: existing.id, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown" },
    });

    return NextResponse.json({ success: true, time: now, overtimeMin });
  } catch (e) {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
