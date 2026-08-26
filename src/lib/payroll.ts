import { db } from "./db";
import { getSetting } from "./attendance";
import { startOfMonth, endOfMonth } from "date-fns";

export async function buildRunItems(runId: string, period: Date) {
  const p = startOfMonth(period);
  const pEnd = endOfMonth(period);

  const insuranceRate = parseFloat(await getSetting("payroll.insurance_rate", "0.11"));
  const taxRate = parseFloat(await getSetting("payroll.tax_rate", "0.10"));
  const otMult = parseFloat(await getSetting("payroll.overtime_multiplier", "1"));
  const monthlyType = await db.leaveType.findFirst({ where: { monthly: true } });

  const employees = await db.employee.findMany({ where: { status: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] } } });

  for (const emp of employees) {
    const contract = await db.contract.findFirst({ where: { employeeId: emp.id, status: "ACTIVE" }, orderBy: { startDate: "desc" } });
    const basic = contract ? Number(contract.salary) : 0;
    const daily = basic / 30;
    const hourly = daily / 8;

    const [attendances, attSum, rewardsSum, penaltiesSum, loanInsts, withdrawals, leaves] = await Promise.all([
      db.attendance.findMany({ where: { employeeId: emp.id, date: { gte: p, lte: pEnd }, checkIn: { not: null } }, select: { checkIn: true, checkOut: true } }),
      db.attendance.aggregate({ where: { employeeId: emp.id, date: { gte: p, lte: pEnd } }, _sum: { overtimeMin: true } }),
      db.reward.aggregate({ where: { employeeId: emp.id, issuedAt: { gte: p, lte: pEnd } }, _sum: { amount: true } }),
      db.penalty.aggregate({ where: { employeeId: emp.id, issuedAt: { gte: p, lte: pEnd } }, _sum: { amount: true } }),
      db.loanInstallment.findMany({ where: { loan: { employeeId: emp.id, status: "ACTIVE" }, isPaid: false, month: { gte: p, lte: pEnd } } }),
      db.withdrawal.findMany({ where: { employeeId: emp.id, status: "ACTIVE", date: { gte: p, lte: pEnd } } }),
      db.leaveRequest.findMany({ where: { employeeId: emp.id, status: "APPROVED", startDate: { gte: p, lte: pEnd } }, include: { leaveType: true } }),
    ]);

    let baseMin = 0;
    for (const a of attendances) {
      if (a.checkIn && a.checkOut) {
        const worked = Math.max(0, (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000);
        baseMin += Math.min(worked, 480);
      } else {
        baseMin += 480;
      }
    }
    const baseHours = baseMin / 60;

    const paidLeaveDays = leaves.filter(l => l.leaveType.isPaid).reduce((t, l) => t + l.days, 0);
    const monthlyUsed = monthlyType ? leaves.filter(l => l.leaveTypeId === monthlyType.id).reduce((t, l) => t + l.days, 0) : 0;

    const totalHours = Math.min(240, baseHours + paidLeaveDays * 8);
    const basicEarned = Math.round(hourly * totalHours);
    const workedDays = Math.round((baseHours / 8) * 100) / 100;
    const overtime = Math.round(((attSum._sum.overtimeMin ?? 0) / 60) * hourly * otMult);
    const bonuses = Number(rewardsSum._sum.amount ?? 0);
    const leaveAllowance = monthlyType ? Math.round(daily * Math.max(0, monthlyDays - monthlyUsed)) : 0;
    const loanDed = loanInsts.reduce((t, i) => t + Number(i.amount), 0);
    const withdrawalsDed = withdrawals.reduce((t, w) => t + Number(w.amount), 0);
    const penalties = Number(penaltiesSum._sum.amount ?? 0);
    const insurance = Math.round(basicEarned * insuranceRate);
    const gross = basicEarned + overtime + bonuses + leaveAllowance;
    const tax = Math.round(Math.max(0, gross - insurance) * taxRate);
    const net = gross - insurance - tax - loanDed - withdrawalsDed - penalties;

    await db.payrollItem.create({
      data: {
        payrollRunId: runId, employeeId: emp.id,
        basicSalary: basicEarned, allowances: leaveAllowance, overtime, bonuses,
        absencesDed: 0, lateDed: 0, loanDed, withdrawalsDed, penalties, insurance, tax,
        gross, net, workedDays, status: "calculated",
      },
    });
  }
}
