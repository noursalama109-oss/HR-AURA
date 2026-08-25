"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Star, Plus } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "—"; }

export default function PenaltiesPage() {
  const [data, setData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ kind: "penalty" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/penalties");
    setData(await res.json());
  }, []);
  useEffect(() => {
    load();
    fetch("/api/employees?pageSize=50").then(r => r.json()).then(x => setEmployees(x.employees ?? []));
  }, [load]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/penalties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({ kind: "penalty" }); setMsg("تم الحفظ ✅ — سيُخصم/يُضاف تلقائياً في مرتبات الشهر"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">الجزاءات والمكافآت</h1>
          <p className="text-slate-500 mt-1">تُخصم الجزاءات وتُضاف المكافآت تلقائياً في كشف المرتبات</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
          <Plus className="w-5 h-5" /> إضافة
        </button>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> الجزاءات
          </div>
          {!data ? <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div> : data.penalties.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-semibold">لا توجد جزاءات 🎉</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.penalties.map((p: any) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{p.employee.firstName} {p.employee.lastName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.type} — {p.reason}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-rose-600 text-sm">{p.amount ? `${Number(p.amount).toLocaleString("ar-EG")} ج.م` : "بدون خصم"}</div>
                    <div className="text-xs text-slate-400">{d(p.issuedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-emerald-700 flex items-center gap-2">
            <Star className="w-5 h-5" /> المكافآت
          </div>
          {!data ? <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div> : data.rewards.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-semibold">لا توجد مكافآت</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.rewards.map((r: any) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{r.employee.firstName} {r.employee.lastName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.type} — {r.reason}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-emerald-600 text-sm">{r.amount ? `${Number(r.amount).toLocaleString("ar-EG")} ج.م` : "معنوية"}</div>
                    <div className="text-xs text-slate-400">{d(r.issuedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">إضافة جزاء / مكافأة</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">النوع *</label>
                <select value={form.kind} onChange={e => set("kind", e.target.value)} className={inputCls}>
                  <option value="penalty">جزاء (خصم)</option>
                  <option value="reward">مكافأة (إضافة)</option>
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">التصنيف *</label>
                <input required value={form.type ?? ""} onChange={e => set("type", e.target.value)} placeholder={form.kind === "penalty" ? "إنذار / خصم / إيقاف" : "مكافأة تميز / إنتاجية"} className={inputCls} />
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ (اختياري)</label>
                <input type="number" min="0" value={form.amount ?? ""} onChange={e => set("amount", e.target.value)} className={inputCls} />
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">السبب *</label>
                <textarea required value={form.reason ?? ""} onChange={e => set("reason", e.target.value)} className={inputCls} rows={2} /></div>
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
