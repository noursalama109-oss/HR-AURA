"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, Building2, ShieldCheck, MapPin } from "lucide-react";

const labels: Record<string, string> = {
  "attendance.require_trusted_device": "فرض الجهاز الموثوق عند الحضور",
  "attendance.require_geofence": "فرض النطاق الجغرافي (GPS)",
  "attendance.require_shift": "فرض وجود وردية للحضور",
  "attendance.grace_minutes": "سماح التأخير (دقائق)",
  "contracts.alert_days": "تنبيهات انتهاء العقود/المستندات (أيام)",
  "payroll.insurance_rate": "نسبة التأمينات",
  "payroll.tax_rate": "نسبة الضرائب",
};
const booleans = ["attendance.require_trusted_device", "attendance.require_geofence", "attendance.require_shift"];

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const d = await res.json();
    setData(d);
    const v: Record<string, string> = {};
    for (const s of d.settings ?? []) v[s.key] = s.value;
    setValues(v);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(key: string) {
    setBusyKey(key); setMsg(""); setError("");
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value: values[key] }) });
    const x = await res.json();
    setBusyKey("");
    if (res.ok) setMsg(`تم حفظ "${labels[key] ?? key}" ✅`);
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">الإعدادات</h1>
        <p className="text-slate-500 mt-1">تحكم كامل في سلوك النظام — التغييرات تسري فوراً</p>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-600" /> إعدادات النظام
        </div>
        {!data ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : (
          <div className="divide-y divide-slate-100">
            {Object.keys(labels).map(key => (
              <div key={key} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="font-bold text-slate-800 text-sm">{labels[key]}</div>
                <div className="flex items-center gap-2">
                  {booleans.includes(key) ? (
                    <select value={values[key] ?? "false"} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">
                      <option value="false">معطل</option>
                      <option value="true">مفعل</option>
                    </select>
                  ) : (
                    <input value={values[key] ?? ""} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold w-32" />
                  )}
                  <button onClick={() => save(key)} disabled={busyKey === key}
                    className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold rounded-lg px-3 py-2 hover:bg-indigo-700 disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" /> حفظ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> الشركة والفروع
          </div>
          {!data ? <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div> : (
            <div className="p-5 space-y-4">
              {data.company && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                  <div className="font-extrabold text-indigo-900">{data.company.name}</div>
                  <div className="text-sm text-indigo-700 mt-1">{data.company.email} • {data.company.phone}</div>
                </div>
              )}
              {data.branches.map((b: any) => (
                <div key={b.id} className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{b.name}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> نطاق GPS: {b.geofenceRadius} متر
                    </div>
                  </div>
                  <span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${b.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {b.isActive ? "نشط" : "متوقف"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> الأدوار والصلاحيات
          </div>
          {!data ? <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div> : (
            <div className="divide-y divide-slate-100">
              {data.roles.map((r: any) => (
                <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-sm">{r.name}</div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1">
                    {r._count.permissions} صلاحية
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
