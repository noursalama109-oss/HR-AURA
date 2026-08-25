"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444"];
const statusAr: Record<string, string> = {
  ACTIVE: "نشط", ON_LEAVE: "في إجازة", SUSPENDED: "موقوف", TERMINATED: "منتهي", PROBATION: "فترة اختبار",
  PRESENT: "حاضر", ABSENT: "غائب", LATE: "متأخر", LEAVE: "إجازة", MISSION: "مأمورية", PERMISSION: "إذن", HOLIDAY: "عطلة", WEEKEND: "أسبوعية",
  PENDING: "قيد الانتظار", APPROVED: "معتمد", REJECTED: "مرفوض", MANAGER_APPROVED: "موافقة مدير", CANCELLED: "ملغي",
};

function exportCSV(name: string, rows: any[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function ChartCard({ title, children, onExport }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-900">{title}</h3>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg px-2.5 py-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">جاري تحميل التقارير...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">التقارير</h1>
        <p className="text-slate-500 mt-1">تقارير شاملة مع إمكانية التصدير Excel/CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="الموظفون حسب الأقسام" onExport={() => exportCSV("by_department", data.byDepartment)}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.byDepartment} dataKey="value" nameKey="name" outerRadius={80} label>
                {data.byDepartment.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الموظفون حسب الفروع" onExport={() => exportCSV("by_branch", data.byBranch)}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.byBranch}>
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" name="موظف" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="حالات الموظفين" onExport={() => exportCSV("by_status", data.byStatus.map((x: any) => ({ name: statusAr[x.name] ?? x.name, value: x.value })))}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.byStatus.map((x: any) => ({ name: statusAr[x.name] ?? x.name, value: x.value }))} dataKey="value" nameKey="name" outerRadius={80} label>
                {data.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="حضور هذا الشهر" onExport={() => exportCSV("attendance_month", data.attendanceMonth.map((x: any) => ({ name: statusAr[x.name] ?? x.name, value: x.value })))}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.attendanceMonth.map((x: any) => ({ name: statusAr[x.name] ?? x.name, value: x.value }))}>
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" name="سجل" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="أيام الإجازات هذا الشهر" onExport={() => exportCSV("leaves_month", data.leavesMonth.map((x: any) => ({ name: statusAr[x.name] ?? x.name, value: x.value })))}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.leavesMonth.map((x: any) => ({ name: statusAr[x.name] ?? x.name, value: x.value }))}>
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" name="يوم" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="تاريخ المرتبات (صافي)" onExport={() => exportCSV("payroll_history", data.payrollHistory.map((p: any) => ({ period: new Date(p.period).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }), employees: p.employees, gross: p.gross, net: p.net })))}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.payrollHistory.map((p: any) => ({ name: new Date(p.period).toLocaleDateString("ar-EG", { month: "short", year: "2-digit" }), net: p.net }))}>
              <XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="net" name="الصافي" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> السلف القائمة</h3>
          <p className="text-sm text-slate-500 mt-1">{data.loansCount} سلفة نشطة</p>
        </div>
        <div className="text-2xl font-extrabold text-rose-600">{Number(data.loansOutstanding).toLocaleString("ar-EG")} ج.م</div>
      </div>
    </div>
  );
}
