import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "employees", "view"))
    return NextResponse.json({ error: "ليس لديك صلاحية العرض" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const departmentId = searchParams.get("departmentId");
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "10"));

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }
  if (departmentId) where.departmentId = departmentId;
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;

  const [total, employees] = await Promise.all([
    db.employee.count({ where }),
    db.employee.findMany({
      where,
      include: {
        branch: true,
        department: true,
        position: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, employees });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role.permissions, "employees", "create"))
    return NextResponse.json({ error: "ليس لديك صلاحية الإضافة" }, { status: 403 });

  const body = await req.json();
  const required: [string, string][] = [
    ["code", "كود الموظف"], ["firstName", "الاسم الأول"], ["lastName", "اسم العائلة"],
    ["branchId", "الفرع"], ["departmentId", "القسم"], ["positionId", "الوظيفة"], ["hireDate", "تاريخ التعيين"],
  ];
  for (const [f, label] of required) {
    if (!body[f]) return NextResponse.json({ error: `${label} مطلوب` }, { status: 400 });
  }

  const exists = await db.employee.findUnique({ where: { code: body.code } });
  if (exists) return NextResponse.json({ error: "كود الموظف موجود بالفعل" }, { status: 400 });

  const employee = await db.employee.create({
    data: {
      code: body.code,
      pin: body.pin || "1234",
      firstName: body.firstName,
      lastName: body.lastName,
      nationalId: body.nationalId || null,
      email: body.email || null,
      phone: body.phone || null,
      gender: body.gender || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      address: body.address || null,
      emergencyName: body.emergencyName || null,
      emergencyPhone: body.emergencyPhone || null,
      hireDate: new Date(body.hireDate),
      employmentType: body.employmentType ?? "FULL_TIME",
      status: body.status ?? "PROBATION",
      branchId: body.branchId,
      departmentId: body.departmentId,
      positionId: body.positionId,
      managerId: body.managerId || null,
    },
    include: { branch: true, department: true, position: true },
  });

  const year = new Date().getFullYear();
  const leaveTypes = await db.leaveType.findMany();
  for (const lt of leaveTypes) {
    await db.leaveBalance.create({
      data: { employeeId: employee.id, leaveTypeId: lt.id, year, total: lt.defaultDays, used: 0, remaining: lt.defaultDays },
    });
  }

  await db.auditLog.create({
    data: {
      userId: user.id, action: "create", entity: "Employee", entityId: employee.id,
      newValue: body, ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
    },
  });

  return NextResponse.json({ employee }, { status: 201 });
}
