"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Plus, CheckCircle2, XCircle } from "lucide-react";

const typeLabels: Record<string, string> = {
  LEAVE: "إجازة", LOAN: "سلفة", ATTENDANCE_ADJUST: "تعديل حضور", PERMISSION: "إذن",
  MISSION: "مأمورية", CERTIFICATE: "شهادة", DATA_UPDATE: "تحديث بيانات", DOCUMENT_REQUEST: "طلب مستند",
};
const statusLabels: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "قيد الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "معتمد", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "مرفوض", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  CANCELLED: { label: "ملغي", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/requests");
    const data = await res.json();
    setRequests(data.requests ?? []);
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
    const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({}); setMsg("تم إرسال الطلب ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function review(requestId: string, action: string) {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch("/api/requests/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, action }) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setMsg("تمت معالجة الطلب ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">طلبات الموظفين</h1>
          <p className="text-slate-500 mt-1">جميع الطلبات بمسار موافقات موحد</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
          <Plus className="w-5 h-5" /> طلب جديد
        </button>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا توجد طلبات</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "النوع", "الطلب", "التاريخ", "الحالة", "إجراءات"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.employee.firstName} {r.employee.lastName}</td>
                    <td className="px-4 py-3">{typeLabels[r.type] ?? r.type}</td>
                    <td className="px-4 py-3">{r.title}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${statusLabels[r.status]?.cls}`}>{statusLabels[r.status]?.label}</span></td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={() => review(r.id, "approve")} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-emerald-700 disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> موافقة
                          </button>
                          <button onClick={() => review(r.id, "reject")} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-rose-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-rose-700 disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> رفض
                          </button>
                        </div>
                      )}
                    </td>
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
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">طلب جديد</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">نوع الطلب *</label>
                <select required value={form.type ?? ""} onChange={e => set("type", e.target.value)} className={inputCls}>
                  <option value="">اختر النوع</option>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">عنوان الطلب *</label>
                <input required value={form.title ?? ""} onChange={e => set("title", e.target.value)} className={inputCls} />
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">تفاصيل</label>
                <textarea value={form.details ?? ""} onChange={e => set("details", e.target.value)} className={inputCls} rows={3} /></div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">{busy ? "جاري الإرسال..." : "إرسال"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
