"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Plus } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "—"; }
function scoreCls(s: number) {
  return s >= 85 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : s >= 70 ? "bg-blue-50 text-blue-700 border-blue-200" : s >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200";
}

export default function ReviewsPage() {
  const [data, setData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showCycle, setShowCycle] = useState(false);
  const [form, setForm] = useState<any>({});
  const [cycleForm, setCycleForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/reviews");
    setData(await res.json());
  }, []);
  useEffect(() => {
    load();
    fetch("/api/employees?pageSize=50").then(r => r.json()).then(x => setEmployees(x.employees ?? []));
  }, [load]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }
  function setC(k: string, v: any) { setCycleForm((f: any) => ({ ...f, [k]: v })); }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowReview(false); setForm({}); setMsg("تم حفظ التقييم ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function submitCycle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/reviews/cycles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cycleForm) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowCycle(false); setCycleForm({}); setMsg("تم إنشاء دورة التقييم ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">تقييمات الموظفين</h1>
          <p className="text-slate-500 mt-1">دورات تقييم الأداء والدرجات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCycle(true)} className="flex items-center gap-2 bg-slate-700 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-slate-800 transition">
            <Plus className="w-5 h-5" /> دورة تقييم
          </button>
          <button onClick={() => setShowReview(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
            <Plus className="w-5 h-5" /> تقييم موظف
          </button>
        </div>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data?.cycles ?? []).map((c: any) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900">{c.name}</h3>
            </div>
            <p className="text-sm text-slate-500">{d(c.startDate)} → {d(c.endDate)}</p>
          </div>
        ))}
        {data && data.cycles.length === 0 && (
          <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 font-semibold">لا توجد دورات تقييم — أنشئ دورة أولاً</div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900">سجل التقييمات</div>
        {!data ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : data.reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">لا توجد تقييمات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "الدورة", "الدرجة", "التقدير", "التاريخ", "تعليقات"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.reviews.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.employee.firstName} {r.employee.lastName}</td>
                    <td className="px-4 py-3">{r.cycle.name}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-extrabold border rounded-full px-3 py-1 ${scoreCls(Number(r.score))}`}>{Number(r.score).toLocaleString("ar-EG")}</span></td>
                    <td className="px-4 py-3 font-bold">{Number(r.score) >= 85 ? "ممتاز" : Number(r.score) >= 70 ? "جيد جداً" : Number(r.score) >= 50 ? "مقبول" : "ضعيف"}</td>
                    <td className="px-4 py-3">{d(r.reviewedAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.comments ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCycle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">دورة تقييم جديدة</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submitCycle} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم الدورة *</label><input required value={cycleForm.name ?? ""} onChange={e => setC("name", e.target.value)} placeholder="تقييم النصف الأول 2026" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">البداية *</label><input required type="date" value={cycleForm.startDate ?? ""} onChange={e => setC("startDate", e.target.value)} className={inputCls} /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">النهاية *</label><input required type="date" value={cycleForm.endDate ?? ""} onChange={e => setC("endDate", e.target.value)} className={inputCls} /></div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCycle(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">تقييم موظف</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submitReview} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">دورة التقييم *</label>
                <select required value={form.cycleId ?? ""} onChange={e => set("cycleId", e.target.value)} className={inputCls}>
                  <option value="">اختر الدورة</option>
                  {(data?.cycles ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الدرجة (0-100) *</label><input required type="number" min="0" max="100" value={form.score ?? ""} onChange={e => set("score", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">تعليقات</label><textarea value={form.comments ?? ""} onChange={e => set("comments", e.target.value)} className={inputCls} rows={2} /></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowReview(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
