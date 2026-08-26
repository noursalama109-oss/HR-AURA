"use client";
import PayslipModal from "@/components/PayslipModal";
import { Printer, Download } from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { Wallet, Plus, CheckCircle2, Eye, Banknote, RefreshCw } from "lucide-react";

const runLabels: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "مسودة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  CALCULATED: { label: "محسوب", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  REVIEWED: { label: "تمت المراجعة", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "معتمد", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PAID: { label: "مدفوع", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "—"; }
function n(x: any) { return Number(x ?? 0).toLocaleString("ar-EG"); }

export default function PayrollPage() {
  const [slip, setSlip] = useState<any>(null);
  function exportCSV() {
    if (!run) return;
    const head = ["الموظف","أيام العمل","الأساسي","الإضافي","بدل إجازة","المكافآت","غياب","سلف","مسحوبات","جزاءات","تأمينات","ضرائب","الصافي"];
    const rows = run.items.map((i: any) => [i.employee.firstName + " " + i.employee.lastName, i.workedDays, i.basicSalary, i.overtime, i.allowances, i.bonuses, i.absencesDed, i.loanDed, i.withdrawalsDed, i.penalties, i.insurance, i.tax, i.net]);
    const csv = "\uFEFF" + [head, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "payroll.csv";
    a.click();
  }
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/payroll/runs");
    const data = await res.json();
    setRuns(data.runs ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function createRun() {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch("/api/payroll/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period: month + "-01" }) });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setMsg("تم حساب كشف المرتبات ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function recalc(runId: string) {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch(`/api/payroll/runs/${runId}/recalc`, { method: "POST" });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setMsg("تمت إعادة الحساب ✅"); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  async function advance(runId: string) {
    setBusy(true); setMsg(""); setError("");
    const res = await fetch(`/api/payroll/runs/${runId}/status`, { method: "POST" });
    const x = await res.json();
    setBusy(false);
    if (res.ok) { setMsg(`تم تحديث الحالة إلى ${runLabels[x.status]?.label ?? x.status} ✅`); load(); }
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="space-y-6">
      {slip && <PayslipModal item={slip} onClose={() => setSlip(null)} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">المرتبات</h1>
          <p className="text-slate-500 mt-1">أساسي + إضافي + مكافآت − غياب − تأخير − سلف − مسحوبات − جزاءات − تأمينات − ضرائب</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className={inputCls} />
          <button onClick={createRun} disabled={busy} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50 transition">
            <Plus className="w-5 h-5" /> إنشاء كشف الشهر
          </button>
        </div>
      </div>

      {(msg || error) && (
        <div className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || msg}
        </div>
      )}

      {loading ? <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-xl border border-slate-200">جاري التحميل...</div> : runs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="font-extrabold text-slate-900 mb-1">لا توجد كشوف مرتبات</h3>
          <p className="text-slate-500 text-sm">اختر الشهر واضغط "إنشاء كشف الشهر" — الحساب تلقائي بالكامل</p>
        </div>
      ) : runs.map((run: any) => {
        const totalNet = run.items.reduce((s: number, i: any) => s + Number(i.net), 0);
        return (
          <div key={run.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-slate-900">مرتبات {d(run.period)}</h3>
                <span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${runLabels[run.status]?.cls}`}>{runLabels[run.status]?.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-extrabold text-emerald-700">إجمالي الصافي: {n(totalNet)} ج.م</div>
                {(run.status === "CALCULATED" || run.status === "REVIEWED") && (
                  <button onClick={() => recalc(run.id)} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-slate-600 text-white rounded-lg px-3 py-2 hover:bg-slate-700 disabled:opacity-50">
                    <RefreshCw className="w-4 h-4" /> إعادة الحساب
                  </button>
                )}
                {run.status === "CALCULATED" && (
                  <button onClick={() => advance(run.id)} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-amber-600 text-white rounded-lg px-3 py-2 hover:bg-amber-700 disabled:opacity-50">
                    <Eye className="w-4 h-4" /> مراجعة
                  </button>
                )}
                {run.status === "REVIEWED" && (
                  <button onClick={() => advance(run.id)} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white rounded-lg px-3 py-2 hover:bg-emerald-700 disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" /> اعتماد (يخصم السلف والمسحوبات)
                  </button>
                )}
                {run.status === "APPROVED" && (
                  <button onClick={() => advance(run.id)} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-violet-600 text-white rounded-lg px-3 py-2 hover:bg-violet-700 disabled:opacity-50">
                    <Banknote className="w-4 h-4" /> صرف المرتبات
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{["الموظف", "أيام العمل", "الأساسي", "الإضافي", "بدل إجازة", "المكافآت", "غياب", "سلف", "مسحوبات", "جزاءات", "تأمينات", "ضرائب", "الصافي", "قسيمة"].map(h => <th key={h} className="text-right px-3 py-2.5 font-bold text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {run.items.map((i: any) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{i.employee.firstName} {i.employee.lastName}</td>
                      <td className="px-3 py-2.5 font-bold text-indigo-600">{i.workedDays}</td>
                      <td className="px-3 py-2.5 font-bold">{n(i.basicSalary)}</td>
                      <td className="px-3 py-2.5">{n(i.overtime)}</td>
                      <td className="px-3 py-2.5 text-teal-600 font-bold">{n(i.allowances)}</td>
                      <td className="px-3 py-2.5">{n(i.bonuses)}</td>
                      <td className="px-3 py-2.5 text-rose-600">{n(i.absencesDed)}</td>
                      <td className="px-3 py-2.5 text-rose-600">{n(i.loanDed)}</td>
                      <td className="px-3 py-2.5 text-rose-600">{n(i.withdrawalsDed)}</td>
                      <td className="px-3 py-2.5 text-rose-600">{n(i.penalties)}</td>
                      <td className="px-3 py-2.5 text-rose-600">{n(i.insurance)}</td>
                      <td className="px-3 py-2.5 text-rose-600">{n(i.tax)}</td>
                      <td className="px-3 py-2.5 font-extrabold text-emerald-700">{n(i.net)}</td>
                      <td className="px-3 py-2.5"><button onClick={() => setSlip(i)} className="text-slate-500 hover:bg-slate-100 rounded-lg p-2 inline-flex"><Printer className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
