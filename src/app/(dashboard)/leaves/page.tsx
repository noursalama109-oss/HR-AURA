"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Plus, CheckCircle2, XCircle, UserCheck } from "lucide-react";

const reqLabels: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "قيد الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  MANAGER_APPROVED: { label: "موافقة مدير", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED: { label: "معتمدة", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "مرفوضة", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  CANCELLED: { label: "ملغاة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "—"; }

export default function LeavesPage() {
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/leaves");
    setData(await res.json());
  }, []);
  useEffect(() => {
    load();
    fetch("/api/meta").then(r => r.json()).then(setMeta);
    fetch("/api/employees?pageSize=50").then(r => r.json()).then(x => setEmployees(x.employees ?? []));
  }, [load]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({}); setMsg("تم إرسال الطلب بنجاح ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function review(requestId: string, action: string) {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch("/api/leaves/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, action }) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setMsg("تم تحديث حالة الطلب ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">الإجازات</h1>
          <p className="text-slate-500 mt-1">إدارة طلبات الإجازات والأرصدة</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
          <Plus className="w-5 h-5" /> طلب إجازة
        </button>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900">طلبات الإجازات</div>
        {!data ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : data.requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">لا توجد طلبات إجازات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "النوع", "من", "إلى", "الأيام", "الحالة", "إجراءات"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.employee.firstName} {r.employee.lastName}</td>
                    <td className="px-4 py-3">{r.leaveType.name}</td>
                    <td className="px-4 py-3">{d(r.startDate)}</td>
                    <td className="px-4 py-3">{d(r.endDate)}</td>
                    <td className="px-4 py-3 font-bold">{r.days}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${reqLabels[r.status]?.cls}`}>{reqLabels[r.status]?.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {r.status === "PENDING" && (
                          <button onClick={() => review(r.id, "manager_approve")} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-blue-700 disabled:opacity-50">
                            <UserCheck className="w-3.5 h-3.5" /> موافقة مدير
                          </button>
                        )}
                        {(r.status === "PENDING" || r.status === "MANAGER_APPROVED") && (
                          <button onClick={() => review(r.id, "hr_approve")} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-emerald-700 disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> اعتماد HR
                          </button>
                        )}
                        {(r.status === "PENDING" || r.status === "MANAGER_APPROVED") && (
                          <button onClick={() => review(r.id, "reject")} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-rose-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-rose-700 disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> رفض
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900">أرصدة الإجازات ({new Date().getFullYear()})</div>
        {!data ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : data.balances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">لا توجد أرصدة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "نوع الإجازة", "الإجمالي", "المستخدم", "المتبقي"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.balances.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{b.employee.firstName} {b.employee.lastName}</td>
                    <td className="px-4 py-3">{b.leaveType.name}</td>
                    <td className="px-4 py-3">{b.total}</td>
                    <td className="px-4 py-3 text-rose-600 font-bold">{b.used}</td>
                    <td className="px-4 py-3 text-emerald-700 font-extrabold">{b.remaining}</td>
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
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">طلب إجازة جديد</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">نوع الإجازة *</label>
                <select required value={form.leaveTypeId ?? ""} onChange={e => set("leaveTypeId", e.target.value)} className={inputCls}>
                  <option value="">اختر النوع</option>
                  {meta?.leaveTypes?.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">من تاريخ *</label><input required type="date" value={form.startDate ?? ""} onChange={e => set("startDate", e.target.value)} className={inputCls} /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">إلى تاريخ *</label><input required type="date" value={form.endDate ?? ""} onChange={e => set("endDate", e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">السبب</label><textarea value={form.reason ?? ""} onChange={e => set("reason", e.target.value)} className={inputCls} rows={2} /></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">{busy ? "جاري الإرسال..." : "إرسال الطلب"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
