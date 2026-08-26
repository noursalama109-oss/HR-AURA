"use client";
import { X, Printer } from "lucide-react";

export default function PayslipModal({ item, onClose }: { item: any; onClose: () => void }) {
  const e = item.employee ?? {};
  const ded = Number(item.absencesDed) + Number(item.loanDed) + Number(item.withdrawalsDed) + Number(item.penalties);
  const rows: [string, string][] = [
    ["الأساسي (" + (item.workedDays ?? 0) + " يوم عمل)", Number(item.basicSalary).toLocaleString("ar-EG")],
    ["الأوفر تايم", Number(item.overtime).toLocaleString("ar-EG")],
    ["بدل إجازة", Number(item.allowances).toLocaleString("ar-EG")],
    ["مكافآت", Number(item.bonuses).toLocaleString("ar-EG")],
    ["الخصومات (غياب/سلف/مسحوبات/جزاءات)", "-" + ded.toLocaleString("ar-EG")],
    ["تأمينات", "-" + Number(item.insurance).toLocaleString("ar-EG")],
    ["ضرائب", "-" + Number(item.tax).toLocaleString("ar-EG")],
  ];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <style>{`@media print { body * { visibility: hidden; } #payslip, #payslip * { visibility: visible; } #payslip { position: absolute; inset: 0; width: 100%; border-radius: 0; } .no-print { display: none !important; } }`}</style>
      <div id="payslip" className="bg-white rounded-2xl w-full max-w-lg p-6">
        <div className="text-center border-b border-slate-200 pb-4 mb-4">
          <div className="text-xl font-extrabold text-slate-900">قسيمة مرتب</div>
          <div className="text-sm text-slate-500 mt-1">شهر: {item.payrollRun?.period ?? ""}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-slate-500">الموظف:</span> <span className="font-bold">{e.firstName} {e.lastName}</span></div>
          <div><span className="text-slate-500">الكود:</span> <span className="font-bold">{e.code}</span></div>
          <div><span className="text-slate-500">الوظيفة:</span> <span className="font-bold">{e.position?.title ?? "—"}</span></div>
          <div><span className="text-slate-500">الفرع:</span> <span className="font-bold">{e.branch?.name ?? "—"}</span></div>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {rows.map(([label, val]) => (
              <tr key={label}>
                <td className="py-2 text-slate-600">{label}</td>
                <td className="py-2 text-left font-bold">{val}</td>
              </tr>
            ))}
            <tr className="bg-emerald-50">
              <td className="py-3 font-extrabold text-emerald-900">صافي المستحق</td>
              <td className="py-3 text-left font-extrabold text-emerald-700 text-lg">{Number(item.net).toLocaleString("ar-EG")} ج.م</td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-between mt-10 text-sm font-bold text-slate-600">
          <div>توقيع الموظف: ............</div>
          <div>الموارد البشرية: ............</div>
        </div>
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 no-print">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-indigo-700"><Printer className="w-4 h-4" /> طباعة</button>
        <button onClick={onClose} className="flex items-center gap-2 bg-white border border-slate-300 font-bold rounded-lg px-5 py-2.5 hover:bg-slate-50"><X className="w-4 h-4" /> إغلاق</button>
      </div>
    </div>
  );
}
