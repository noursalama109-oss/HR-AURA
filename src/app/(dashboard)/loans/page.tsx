"use client";

import { useCallback, useEffect, useState } from "react";
import { HandCoins, Plus, ChevronDown, ChevronUp } from "lucide-react";

const loanLabels: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "قيد الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "معتمدة", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ACTIVE: { label: "نشطة", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "مكتملة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  REJECTED: { label: "مرفوضة", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "—"; }

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/loans");
    const data = await res.json();
    setLoans(data.loans ?? []);
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
    const res = await fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setShowModal(false); setForm({}); setMsg("تم إنشاء السلفة وجدولة الأقساط ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">السلف</h1>
          <p className="text-slate-500 mt-1">إدارة السلف والأقساط — الخصم تلقائي من المرتبات</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
          <Plus className="w-5 h-5" /> إضافة سلفة
        </button>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : loans.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <HandCoins className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا توجد سلف</h3>
            <p className="text-slate-500 text-sm">ابدأ بإضافة أول سلفة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["", "الموظف", "المبلغ", "الأقساط", "قيمة القسط", "المدفوع", "المتبقي", "الحالة"].map((h, i) => <th key={i} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l: any) => (
                  <>
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-2 py-3">
                        <button onClick={() => setOpen(open === l.id ? null : l.id)} className="text-slate-400 hover:text-indigo-600 p-1">
                          {open === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{l.employee.firstName} {l.employee.lastName}</td>
                      <td className="px-4 py-3 font-bold">{Number(l.amount).toLocaleString("ar-EG")}</td>
                      <td className="px-4 py-3">{l.installmentsCount}</td>
                      <td className="px-4 py-3">{Number(l.installmentValue).toLocaleString("ar-EG")}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold">{Number(l.paidAmount).toLocaleString("ar-EG")}</td>
                      <td className="px-4 py-3 text-rose-600 font-bold">{Number(l.remainingAmount).toLocaleString("ar-EG")}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${loanLabels[l.status]?.cls}`}>{loanLabels[l.status]?.label}</span></td>
                    </tr>
                    {open === l.id && (
                      <tr key={l.id + "-inst"} className="bg-slate-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="font-bold text-slate-700 mb-2">جدول الأقساط:</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {l.installments.map((inst: any, i: number) => (
                              <div key={inst.id} className={`rounded-lg border px-3 py-2 text-xs font-bold ${inst.isPaid ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600"}`}>
                                قسط {i + 1} — {d(inst.month)}<br />{Number(inst.amount).toLocaleString("ar-EG")} {inst.isPaid ? "✅ مدفوع" : "⏳ مستحق"}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">إضافة سلفة جديدة</h2>
            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select required value={form.employeeId ?? ""} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                  <option value="">اختر الموظف</option>
                  {employees.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.code})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">قيمة السلفة *</label><input required type="number" min="1" value={form.amount ?? ""} onChange={e => set("amount", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">عدد الأقساط *</label><input required type="number" min="1" max="36" value={form.installmentsCount ?? ""} onChange={e => set("installmentsCount", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">بداية الخصم *</label><input required type="date" value={form.startDeductionMonth ?? ""} onChange={e => set("startDeductionMonth", e.target.value)} className={inputCls} /></div>
              {form.amount && form.installmentsCount && Number(form.installmentsCount) > 0 && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700">
                  قيمة القسط الشهري: {(Number(form.amount) / Number(form.installmentsCount)).toLocaleString("ar-EG", { maximumFractionDigits: 2 })}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={busy} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">{busy ? "جاري الحفظ..." : "حفظ السلفة"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
