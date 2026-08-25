"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Plus, BellRing } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "بدون انتهاء"; }

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.documents ?? []);
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
    const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({}); setMsg("تم حفظ المستند ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function processAlerts() {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch("/api/documents/process", { method: "POST" });
    const x = await res.json();
    setBusy(false);
    if (res.ok) setMsg(`تم الفحص — ${x.alerts} تنبيه جديد 🔔`);
    else setError(x.error ?? "حدث خطأ");
  }

  function expBadge(expiresAt: string | null) {
    if (!expiresAt) return <span className="text-xs font-bold text-slate-400">بدون انتهاء</span>;
    const days = differenceInCalendarDays(new Date(expiresAt), new Date());
    if (days < 0) return <span className="text-xs font-bold border rounded-full px-2.5 py-1 bg-rose-50 text-rose-700 border-rose-200">منتهي</span>;
    const cls = days <= 7 ? "bg-rose-50 text-rose-700 border-rose-200" : days <= 15 ? "bg-amber-50 text-amber-700 border-amber-200" : days <= 30 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
    return <span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${cls}`}>{days} يوم</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">المستندات</h1>
          <p className="text-slate-500 mt-1">إدارة مستندات الموظفين وتنبيهات الانتهاء</p>
        </div>
        <div className="flex gap-2">
          <button onClick={processAlerts} disabled={busy} className="flex items-center gap-2 bg-amber-500 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-amber-600 disabled:opacity-50 transition">
            <BellRing className="w-5 h-5" /> فحص التنبيهات
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
            <Plus className="w-5 h-5" /> إضافة مستند
          </button>
        </div>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا توجد مستندات</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "المستند", "النوع", "تاريخ الإصدار", "تاريخ الانتهاء", "الحالة"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{doc.employee.firstName} {doc.employee.lastName}</td>
                    <td className="px-4 py-3">{doc.name}</td>
                    <td className="px-4 py-3">{doc.type}</td>
                    <td className="px-4 py-3">{d(doc.issuedAt)}</td>
                    <td className="px-4 py-3">{d(doc.expiresAt)}</td>
                    <td className="px-4 py-3">{expBadge(doc.expiresAt)}</td>
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
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">إضافة مستند</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم المستند *</label>
                <input required value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="بطاقة الرقم القومي" className={inputCls} />
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">النوع *</label>
                <input required value={form.type ?? ""} onChange={e => set("type", e.target.value)} placeholder="بطاقة / عقد / شهادة" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الإصدار *</label><input required type="date" value={form.issuedAt ?? ""} onChange={e => set("issuedAt", e.target.value)} className={inputCls} /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الانتهاء</label><input type="date" value={form.expiresAt ?? ""} onChange={e => set("expiresAt", e.target.value)} className={inputCls} /></div>
              </div>
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
