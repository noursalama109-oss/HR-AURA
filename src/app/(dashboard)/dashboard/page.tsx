"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, CalendarDays, FileText, FolderOpen, HandCoins, Wallet, Inbox, Bell, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

type Stats = {
  totalEmployees: number;
  activeEmployees: number;
  todayAttendance: number;
  leavesToday: number;
  contractsExpiringSoon: number;
  docsExpiringSoon: number;
  activeLoans: number;
  totalPayrollThisMonth: number;
  pendingRequests: number;
  notifications: any[];
  departmentDistribution: { name: string; value: number }[];
  branchDistribution: { name: string; value: number }[];
  last7Days: { date: string; present: number; absent: number; late: number }[];
};

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-sm text-slate-500 font-semibold">{label}</div>
        <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError("فشل تحميل البيانات"); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-bold">جاري تحميل لوحة التحكم...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-600 font-bold">{error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">لوحة التحكم</h1>
        <p className="text-slate-500 mt-1">نظرة عامة على نظام HR AURA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="إجمالي الموظفين" value={stats.totalEmployees} color="bg-indigo-600" />
        <StatCard icon={UserCheck} label="الموظفون النشطون" value={stats.activeEmployees} color="bg-emerald-600" />
        <StatCard icon={CalendarDays} label="الحاضرون اليوم" value={stats.todayAttendance} color="bg-blue-600" />
        <StatCard icon={TrendingUp} label="في إجازة اليوم" value={stats.leavesToday} color="bg-amber-600" />
        <StatCard icon={AlertCircle} label="عقود تنتهي قريباً" value={stats.contractsExpiringSoon} color="bg-rose-600" />
        <StatCard icon={FolderOpen} label="مستندات تنتهي قريباً" value={stats.docsExpiringSoon} color="bg-pink-600" />
        <StatCard icon={HandCoins} label="السلف النشطة" value={stats.activeLoans} color="bg-cyan-600" />
        <StatCard icon={Wallet} label="إجمالي رواتب الشهر" value={Number(stats.totalPayrollThisMonth).toLocaleString("ar-EG")} color="bg-violet-600" />
        <StatCard icon={Inbox} label="طلبات بانتظار الموافقة" value={stats.pendingRequests} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">الحضور آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.last7Days}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" name="حاضر" fill="#10b981" />
              <Bar dataKey="absent" name="غائب" fill="#ef4444" />
              <Bar dataKey="late" name="متأخر" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">توزيع الموظفين حسب الأقسام</h3>
          {stats.departmentDistribution.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-slate-400">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.departmentDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {stats.departmentDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" /> الإشعارات الأخيرة
        </h3>
        {stats.notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-400">لا توجد إشعارات جديدة</div>
        ) : (
          <ul className="space-y-2">
            {stats.notifications.map((n: any) => (
              <li key={n.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <div className="text-sm text-slate-500">{n.message}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
