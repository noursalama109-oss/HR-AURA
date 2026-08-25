import { db } from "./db";
import { getSetting } from "./attendance";
import { startOfMonth, endOfMonth } from "date-fns";

export async function buildRunItems(runId: string, period: Date) {
  const p = startOfMonth(period);
  const pEnd = endOfMonth(period);

  const insuranceRate = parseFloat(await getSetting("payroll.insurance_rate", "0.11"));
  const taxRate = parseFloat(await getSetting("payroll.tax_rate", "0.10"));

  const employees = await db.employee.findMany({ where: { status: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] } } });

  for (const emp of employees) {
    const contract = await db.contract.findFirst({ where: { employeeId: emp.id, status: "ACTIVE" }, orderBy: { startDate: "desc" } });
    const basic = contract ? Number(contract.salary) : 0;
    const daily = basic / 30;
    const hourly = basic / 240;

    const [absences, attSum, rewardsSum, penaltiesSum, loanInsts, withdrawals] = await Promise.all([
      db.attendance.count({ where: { employeeId: emp.id, date: { gte: p, lte: pEnd }, status: "ABSENT" } }),
      db.attendance.aggregate({ where: { employeeId: emp.id, date: { gte: p, lte: pEnd } }, _sum: { lateMinutes: true, overtimeMin: true } }),
      db.reward.aggregate({ where: { employeeId: emp.id, issuedAt: { gte: p, lte: pEnd } }, _sum: { amount: true } }),
      db.penalty.aggregate({ where: { employeeId: emp.id, issuedAt: { gte: p, lte: pEnd } }, _sum: { amount: true } }),
      db.loanInstallment.findMany({ where: { loan: { employeeId: emp.id, status: "ACTIVE" }, isPaid: false, month: { gte: p, lte: pEnd } } }),
      db.withdrawal.findMany({ where: { employeeId: emp.id, status: "ACTIVE", date: { gte: p, lte: pEnd } } }),
    ]);

    const overtime = Math.round(((attSum._sum.overtimeMin ?? 0) / 60) * hourly * 1.5);
    const bonuses = Number(rewardsSum._sum.amount ?? 0);
    const absencesDed = Math.round(absences * daily);
    const lateDed = Math.round(((attSum._sum.lateMinutes ?? 0) / 60) * hourly);
    const loanDed = loanInsts.reduce((s, i) => s + Number(i.amount), 0);
    const withdrawalsDed = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const penalties = Number(penaltiesSum._sum.amount ?? 0);
    const insurance = Math.round(basic * insuranceRate);
    const gross = basic + overtime + bonuses;
    const tax = Math.round(Math.max(0, gross - insurance) * taxRate);
    const net = gross - insurance - tax - absencesDed - lateDed - loanDed - withdrawalsDed - penalties;

    await db.payrollItem.create({
      data: {
        payrollRunId: runId, employeeId: emp.id,
        basicSalary: basic, allowances: 0, overtime, bonuses,
        absencesDed, lateDed, loanDed, withdrawalsDed, penalties, insurance, tax,
        gross, net, status: "calculated",
      },
    });
  }
}
