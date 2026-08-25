"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Plus, BellRing } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";

const statusLabels: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "مسودة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  ACTIVE: { label: "نشط", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  EXPIRED: { label: "منتهي", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  TERMINATED: { label: "ملغي", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  RENEWED: { label: "مجدد", cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "—"; }

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/contracts");
    const data = await res.json();
    setContracts(data.contracts ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
    fetch("/api/employees?pageSize=50").then(r => r.json()).then(x => setEmployees(x.employees ?? []));
  }, [load]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({}); setMsg("تم إنشاء العقد ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function processAlerts() {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch("/api/contracts/process", { method: "POST" });
    const x = await res.json();
    setBusy(false);
    if (res.ok) setMsg(`تم الفحص — ${x.alerts} تنبيه جديد 🔔`);
    else setError(x.error ?? "حدث خطأ");
  }

  function daysBadge(end: string, status: string) {
    if (status === "EXPIRED") return <span className="text-xs font-bold text-rose-600">منتهي</span>;
    const days = differenceInCalendarDays(new Date(end), new Date());
    const cls = days <= 7 ? "bg-rose-50 text-rose-700 border-rose-200" : days <= 15 ? "bg-amber-50 text-amber-700 border-amber-200" : days <= 30 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
    return <span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${cls}`}>{days} يوم متبقي</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">العقود</h1>
          <p className="text-slate-500 mt-1">إدارة عقود الموظفين وتنبيهات الانتهاء</p>
        </div>
        <div className="flex gap-2">
          <button onClick={processAlerts} disabled={busy} className="flex items-center gap-2 bg-amber-500 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-amber-600 disabled:opacity-50 transition">
            <BellRing className="w-5 h-5" /> فحص التنبيهات
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
            <Plus className="w-5 h-5" /> إضافة عقد
          </button>
        </div>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : contracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا توجد عقود</h3>
            <p className="text-slate-500 text-sm">ابدأ بإضافة أول عقد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "نوع العقد", "البداية", "النهاية", "الراتب", "المتبقي", "الحالة"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{c.employee.firstName} {c.employee.lastName}</td>
                    <td className="px-4 py-3">{c.type}</td>
                    <td className="px-4 py-3">{d(c.startDate)}</td>
                    <td className="px-4 py-3">{d(c.endDate)}</td>
                    <td className="px-4 py-3 font-bold">{Number(c.salary).toLocaleString("ar-EG")}</td>
                    <td className="px-4 py-3">{daysBadge(c.endDate, c.status)}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${statusLabels[c.status]?.cls}`}>{statusLabels[c.status]?.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">إضافة عقد جديد</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">نوع العقد *</label>
                <input required value={form.type ?? ""} onChange={e => set("type", e.target.value)} placeholder="سنوي / دائم / مؤقت" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ البداية *</label><input required type="date" value={form.startDate ?? ""} onChange={e => set("startDate", e.target.value)} className={inputCls} /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ النهاية *</label><input required type="date" value={form.endDate ?? ""} onChange={e => set("endDate", e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الراتب *</label><input required type="number" min="0" value={form.salary ?? ""} onChange={e => set("salary", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات</label><textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} className={inputCls} rows={2} /></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">{busy ? "جاري الحفظ..." : "حفظ العقد"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
