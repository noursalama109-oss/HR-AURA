"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط", ON_LEAVE: "في إجازة", SUSPENDED: "موقوف", TERMINATED: "منتهي", PROBATION: "فترة اختبار",
};
const attLabels: Record<string, string> = {
  PRESENT: "حاضر", ABSENT: "غائب", LATE: "متأخر", LEAVE: "إجازة", MISSION: "مأمورية", PERMISSION: "إذن", HOLIDAY: "عطلة", WEEKEND: "إجازة أسبوعية",
};
const leaveLabels: Record<string, string> = {
  PENDING: "قيد الانتظار", MANAGER_APPROVED: "موافقة مدير", APPROVED: "معتمدة", REJECTED: "مرفوضة", CANCELLED: "ملغاة",
};
const contractLabels: Record<string, string> = { DRAFT: "مسودة", ACTIVE: "نشط", EXPIRED: "منتهي", TERMINATED: "ملغي", RENEWED: "مجدد" };
const loanLabels: Record<string, string> = { PENDING: "قيد الانتظار", APPROVED: "معتمدة", ACTIVE: "نشطة", COMPLETED: "مكتملة", REJECTED: "مرفوضة" };

const tabs = [
  { id: "personal", label: "البيانات الشخصية" },
  { id: "job", label: "البيانات الوظيفية" },
  { id: "devices", label: "الأجهزة الموثوقة" },
  { id: "attendance", label: "الحضور" },
  { id: "leaves", label: "الإجازات" },
  { id: "contracts", label: "العقود" },
  { id: "loans", label: "السلف" },
  { id: "withdrawals", label: "المسحوبات" },
  { id: "payroll", label: "المرتبات" },
  { id: "documents", label: "المستندات" },
  { id: "penalties", label: "الجزاءات والمكافآت" },
  { id: "reviews", label: "التقييمات" },
  { id: "activity", label: "سجل النشاط" },
];

function Card({ title, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-extrabold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Row({ label, value }: any) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 font-semibold text-sm">{label}</span>
      <span className="font-bold text-slate-900 text-sm">{value || "—"}</span>
    </div>
  );
}
function Empty({ msg }: any) {
  return <div className="text-center py-8 text-slate-400 text-sm font-semibold">{msg}</div>;
}
function d(x: any) { return x ? new Date(x).toLocaleDateString("ar-EG") : "—"; }
function t(x: any) { return x ? new Date(x).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—"; }

export default function EmployeeProfilePage() {
  const params = useParams();
  const [emp, setEmp] = useState<any>(null);
  const [tab, setTab] = useState("personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employees/${params.id}`)
      .then(r => r.json())
      .then(data => { setEmp(data.employee); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div>;
  if (!emp) return <div className="p-12 text-center text-red-600 font-bold">الموظف غير موجود</div>;


  async function unlinkDevice(id: string) {
    if (!confirm("فك ربط هذا الجهاز؟ سيسجل الموظف من الجديد كأول مرة.")) return;
    const res = await fetch(`/api/trusted-devices/${id}`, { method: "DELETE" });
    if (res.ok) setEmp((e: any) => ({ ...e, trustedDevices: (e.trustedDevices ?? []).filter((d: any) => d.id !== id) }));
  }
  return (
    <div className="space-y-6">
      <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline">
        <ArrowRight className="w-4 h-4" /> العودة للموظفين
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-wrap items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-extrabold">
          {emp.firstName[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-900">{emp.firstName} {emp.lastName}</h1>
          <p className="text-slate-500 text-sm mt-1">{emp.position.title} • {emp.department.name} • {emp.branch.name}</p>
        </div>
        <div className="text-left">
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1">{statusLabels[emp.status]}</span>
          <div className="text-xs text-slate-400 mt-2 font-mono">{emp.code}</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition ${tab === tb.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "personal" && (
        <Card title="البيانات الشخصية">
          <Row label="الاسم الكامل" value={`${emp.firstName} ${emp.lastName}`} />
          <Row label="الرقم القومي" value={emp.nationalId} />
          <Row label="تاريخ الميلاد" value={d(emp.dateOfBirth)} />
          <Row label="النوع" value={emp.gender === "male" ? "ذكر" : emp.gender === "female" ? "أنثى" : ""} />
          <Row label="الهاتف" value={emp.phone} />
          <Row label="البريد الإلكتروني" value={emp.email} />
          <Row label="العنوان" value={emp.address} />
          <Row label="جهة الطوارئ" value={emp.emergencyName} />
          <Row label="هاتف الطوارئ" value={emp.emergencyPhone} />
        </Card>
      )}

      {tab === "job" && (
        <Card title="البيانات الوظيفية">
          <div className="md:col-span-2 rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-sm font-bold text-indigo-900">الوردية: {emp.shiftType === "FIXED" ? "ثابتة من " + (emp.shiftStart ?? "—") + " إلى " + (emp.shiftEnd ?? "—") : "متغيرة"}</div>
          <Row label="كود الموظف" value={emp.code} />
          <Row label="الوظيفة" value={emp.position.title} />
          <Row label="القسم" value={emp.department.name} />
          <Row label="الفرع" value={emp.branch.name} />
          <Row label="المدير المباشر" value={emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : ""} />
          <Row label="تاريخ التعيين" value={d(emp.hireDate)} />
          <Row label="نوع التوظيف" value={emp.employmentType} />
          <Row label="الحالة" value={statusLabels[emp.status]} />
        </Card>
      )}

      {tab === "attendance" && (
        <Card title="سجل الحضور والانصراف">
          {emp.attendances.length === 0 ? <Empty msg="لا توجد سجلات حضور" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["التاريخ", "الحضور", "الانصراف", "تأخير (د)", "الحالة"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {emp.attendances.map((a: any) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 font-bold">{d(a.date)}</td>
                      <td className="px-3 py-2">{t(a.checkIn)}</td>
                      <td className="px-3 py-2">{t(a.checkOut)}</td>
                      <td className="px-3 py-2">{a.lateMinutes}</td>
                      <td className="px-3 py-2 font-bold">{attLabels[a.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "leaves" && (
        <div className="space-y-6">
          <Card title="أرصدة الإجازات">
            {emp.leaveBalances.length === 0 ? <Empty msg="لا توجد أرصدة" /> : emp.leaveBalances.map((b: any) => (
              <Row key={b.id} label={b.leaveType.name} value={`إجمالي ${b.total} • مستخدم ${b.used} • متبقي ${b.remaining}`} />
            ))}
          </Card>
          <Card title="طلبات الإجازات">
            {emp.leaveRequests.length === 0 ? <Empty msg="لا توجد طلبات" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50">{["النوع", "من", "إلى", "الأيام", "الحالة"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {emp.leaveRequests.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-bold">{r.leaveType.name}</td>
                        <td className="px-3 py-2">{d(r.startDate)}</td>
                        <td className="px-3 py-2">{d(r.endDate)}</td>
                        <td className="px-3 py-2">{r.days}</td>
                        <td className="px-3 py-2 font-bold">{leaveLabels[r.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "contracts" && (
        <Card title="العقود">
          {emp.contracts.length === 0 ? <Empty msg="لا توجد عقود" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["النوع", "البداية", "النهاية", "الراتب", "الحالة"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {emp.contracts.map((c: any) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-bold">{c.type}</td>
                      <td className="px-3 py-2">{d(c.startDate)}</td>
                      <td className="px-3 py-2">{d(c.endDate)}</td>
                      <td className="px-3 py-2">{Number(c.salary).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2 font-bold">{contractLabels[c.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "loans" && (
        <Card title="السلف">
          {emp.loans.length === 0 ? <Empty msg="لا توجد سلف" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["المبلغ", "الأقساط", "قيمة القسط", "المدفوع", "المتبقي", "الحالة"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {emp.loans.map((l: any) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2 font-bold">{Number(l.amount).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2">{l.installmentsCount}</td>
                      <td className="px-3 py-2">{Number(l.installmentValue).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2">{Number(l.paidAmount).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2">{Number(l.remainingAmount).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2 font-bold">{loanLabels[l.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "devices" && (
        <Card title="الأجهزة الموثوقة">
          {(emp.trustedDevices ?? []).length === 0 ? <Empty msg="لا توجد أجهزة مرتبطة — أول تسجيل حضور سيربط الجهاز تلقائياً" /> : (
            <div className="space-y-3">
              {emp.trustedDevices.map((dv: any) => (
                <div key={dv.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{dv.name || "هاتف الموظف"}</div>
                    <div className="text-xs text-slate-500 mt-1">آخر استخدام: {dv.lastUsedAt ? new Date(dv.lastUsedAt).toLocaleString("ar-EG") : "—"} • IP: {dv.ipAddress ?? "—"}</div>
                  </div>
                  <button onClick={() => unlinkDevice(dv.id)} className="bg-rose-600 text-white text-xs font-bold rounded-lg px-3 py-2 hover:bg-rose-700 shrink-0">فك الربط</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "withdrawals" && (
        <Card title="المسحوبات">
          {emp.withdrawals.length === 0 ? <Empty msg="لا توجد مسحوبات" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["التاريخ", "المبلغ", "السبب", "الحالة"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {emp.withdrawals.map((w: any) => (
                    <tr key={w.id}>
                      <td className="px-3 py-2 font-bold">{d(w.date)}</td>
                      <td className="px-3 py-2 text-rose-600 font-bold">{Number(w.amount).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2">{w.reason || "—"}</td>
                      <td className="px-3 py-2 font-bold">{w.status === "DEDUCTED" ? "تم الخصم" : "قيد الخصم"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

{tab === "payroll" && (
        <Card title="كشف المرتبات">
          {emp.payrollItems.length === 0 ? <Empty msg="لا توجد مرتبات" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["الشهر", "أيام العمل", "الأساسي", "البدلات", "الخصومات", "الصافي"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {emp.payrollItems.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-bold">{d(p.payrollRun.period)}</td>
                      <td className="px-3 py-2 font-bold text-indigo-600">{p.workedDays}</td>
                        <td className="px-3 py-2">{Number(p.basicSalary).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2">{Number(p.allowances).toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2">{Number(p.absencesDed) + Number(p.lateDed) + Number(p.loanDed) + Number(p.penalties) + Number(p.insurance) + Number(p.tax)}</td>
                      <td className="px-3 py-2 font-extrabold text-emerald-700">{Number(p.net).toLocaleString("ar-EG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "documents" && (
        <Card title="المستندات">
          {emp.documents.length === 0 ? <Empty msg="لا توجد مستندات" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">{["الاسم", "النوع", "تاريخ الإصدار", "تاريخ الانتهاء"].map(h => <th key={h} className="text-right px-3 py-2 font-bold text-slate-600">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {emp.documents.map((doc: any) => (
                    <tr key={doc.id}>
                      <td className="px-3 py-2 font-bold">{doc.name}</td>
                      <td className="px-3 py-2">{doc.type}</td>
                      <td className="px-3 py-2">{d(doc.issuedAt)}</td>
                      <td className="px-3 py-2">{d(doc.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "penalties" && (
        <div className="space-y-6">
          <Card title="الجزاءات">
            {emp.penalties.length === 0 ? <Empty msg="لا توجد جزاءات" /> : emp.penalties.map((p: any) => (
              <Row key={p.id} label={`${p.type} — ${d(p.issuedAt)}`} value={p.amount ? `${Number(p.amount).toLocaleString("ar-EG")} ج.م` : p.reason} />
            ))}
          </Card>
          <Card title="المكافآت">
            {emp.rewards.length === 0 ? <Empty msg="لا توجد مكافآت" /> : emp.rewards.map((r: any) => (
              <Row key={r.id} label={`${r.type} — ${d(r.issuedAt)}`} value={r.amount ? `${Number(r.amount).toLocaleString("ar-EG")} ج.م` : r.reason} />
            ))}
          </Card>
        </div>
      )}

      {tab === "reviews" && (
        <Card title="التقييمات">
          {emp.reviews.length === 0 ? <Empty msg="لا توجد تقييمات" /> : emp.reviews.map((r: any) => (
            <Row key={r.id} label={`${r.cycle.name} — ${d(r.reviewedAt)}`} value={`الدرجة: ${Number(r.score).toLocaleString("ar-EG")}`} />
          ))}
        </Card>
      )}

      {tab === "activity" && (
        <Card title="سجل النشاط">
          {emp.auditLogs.length === 0 ? <Empty msg="لا توجد نشاطات" /> : emp.auditLogs.map((a: any) => (
            <Row key={a.id} label={`${a.action} — ${new Date(a.createdAt).toLocaleString("ar-EG")}`} value={a.entity} />
          ))}
        </Card>
      )}
    </div>
  );
}
