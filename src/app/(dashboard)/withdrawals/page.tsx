"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Plus } from "lucide-react";

const statusLabels: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "قيد الخصم", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  DEDUCTED: { label: "تم الخصم", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "—"; }

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/withdrawals");
    const data = await res.json();
    setWithdrawals(data.withdrawals ?? []);
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
    const res = await fetch("/api/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({}); setMsg("تم تسجيل المسحوبات — ستُخصم تلقائياً من مرتب الشهر ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">المسحوبات</h1>
          <p className="text-slate-500 mt-1">مسحوبات الموظفين تُخصم تلقائياً من مرتب نفس الشهر</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
          <Plus className="w-5 h-5" /> تسجيل مسحوبات
        </button>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Banknote className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا توجد مسحوبات</h3>
            <p className="text-slate-500 text-sm">أي مسحوبات تسجلها هنا هتتخصم تلقائياً من المرتب</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "المبلغ", "التاريخ", "السبب", "الحالة"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{w.employee.firstName} {w.employee.lastName}</td>
                    <td className="px-4 py-3 font-extrabold text-rose-600">{Number(w.amount).toLocaleString("ar-EG")}</td>
                    <td className="px-4 py-3">{d(w.date)}</td>
                    <td className="px-4 py-3 text-slate-500">{w.reason ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${statusLabels[w.status]?.cls}`}>{statusLabels[w.status]?.label}</span></td>
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
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">تسجيل مسحوبات</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ *</label><input required type="number" min="1" value={form.amount ?? ""} onChange={e => set("amount", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">التاريخ *</label><input required type="date" value={form.date ?? ""} onChange={e => set("date", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">السبب</label><input value={form.reason ?? ""} onChange={e => set("reason", e.target.value)} className={inputCls} /></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">{busy ? "جاري الحفظ..." : "حفظ"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
