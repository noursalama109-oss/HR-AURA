"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Eye, Pencil } from "lucide-react";

const statusLabels: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "نشط", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ON_LEAVE: { label: "في إجازة", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  SUSPENDED: { label: "موقوف", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  TERMINATED: { label: "منتهي", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  PROBATION: { label: "فترة اختبار", cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (search) params.set("search", search);
    if (departmentId) params.set("departmentId", departmentId);
    if (branchId) params.set("branchId", branchId);
    if (status) params.set("status", status);
    const res = await fetch(`/api/employees?${params}`);
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, departmentId, branchId, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/meta").then(r => r.json()).then(setMeta);
    fetch("/api/employees?pageSize=50").then(r => r.json()).then(d => setManagers(d.employees ?? []));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  function openEdit(emp: any) {
    setEditId(emp.id);
    setForm({ ...emp, hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : "", dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : "" });
    setShowModal(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError("");
    const res = await fetch(editId ? `/api/employees/${editId}` : "/api/employees", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setShowModal(false); setForm({}); setEditId(null); setPage(1); load(); }
    else setFormError(data.error ?? "حدث خطأ غير متوقع");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">الموظفين</h1>
          <p className="text-slate-500 mt-1">{total} موظف مسجل بالنظام</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({}); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-indigo-700 transition">
          <Plus className="w-5 h-5" /> إضافة موظف
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute top-3 right-3 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث بالاسم أو الكود..." className={`${inputCls} pr-9`} />
        </div>
        <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">كل الأقسام</option>
          {meta?.departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={branchId} onChange={e => { setBranchId(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">كل الفروع</option>
          {meta?.branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا يوجد موظفين</h3>
            <p className="text-slate-500 text-sm mb-4">ابدأ بإضافة أول موظف في النظام</p>
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white font-bold rounded-lg px-4 py-2">إضافة موظف</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["الموظف", "الكود", "الوظيفة", "القسم", "الفرع", "المدير المباشر", "تاريخ التعيين", "الحالة", ""].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-slate-400">{emp.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">{emp.code}</td>
                    <td className="px-4 py-3">{emp.position.title}</td>
                    <td className="px-4 py-3">{emp.department.name}</td>
                    <td className="px-4 py-3">{emp.branch.name}</td>
                    <td className="px-4 py-3">{emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : "—"}</td>
                    <td className="px-4 py-3">{new Date(emp.hireDate).toLocaleDateString("ar-EG")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${statusLabels[emp.status]?.cls}`}>
                        {statusLabels[emp.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/employees/${emp.id}`} className="text-indigo-600 hover:bg-indigo-50 rounded-lg p-2 inline-flex">
                        <Eye className="w-4 h-4" />
                      </Link>
                        <button onClick={() => openEdit(emp)} className="text-slate-500 hover:bg-slate-100 rounded-lg p-2 inline-flex"><Pencil className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-sm disabled:opacity-40">السابق</button>
          <span className="text-sm font-bold text-slate-600">صفحة {page} من {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-sm disabled:opacity-40">التالي</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">إضافة موظف جديد</h2>
            {formError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{formError}</div>}
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">كود الموظف *</label><input required value={form.code ?? ""} onChange={e => set("code", e.target.value)} placeholder="EMP-001" className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الرقم القومي</label><input value={form.nationalId ?? ""} onChange={e => set("nationalId", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الاسم الأول *</label><input required value={form.firstName ?? ""} onChange={e => set("firstName", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم العائلة *</label><input required value={form.lastName ?? ""} onChange={e => set("lastName", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الهاتف</label><input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label><input type="email" value={form.email ?? ""} onChange={e => set("email", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">النوع</label><select value={form.gender ?? ""} onChange={e => set("gender", e.target.value)} className={inputCls}><option value="">—</option><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الميلاد</label><input type="date" value={form.dateOfBirth ?? ""} onChange={e => set("dateOfBirth", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الفرع *</label><select required value={form.branchId ?? ""} onChange={e => set("branchId", e.target.value)} className={inputCls}><option value="">اختر الفرع</option>{meta?.branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">القسم *</label><select required value={form.departmentId ?? ""} onChange={e => set("departmentId", e.target.value)} className={inputCls}><option value="">اختر القسم</option>{meta?.departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الوظيفة *</label><select required value={form.positionId ?? ""} onChange={e => set("positionId", e.target.value)} className={inputCls}><option value="">اختر الوظيفة</option>{meta?.positions?.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">المدير المباشر</label><select value={form.managerId ?? ""} onChange={e => set("managerId", e.target.value)} className={inputCls}><option value="">—</option>{managers.map((m: any) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ التعيين *</label><input required type="date" value={form.hireDate ?? ""} onChange={e => set("hireDate", e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">نوع التوظيف</label><select value={form.employmentType ?? "FULL_TIME"} onChange={e => set("employmentType", e.target.value)} className={inputCls}><option value="FULL_TIME">دوام كامل</option><option value="PART_TIME">دوام جزئي</option><option value="CONTRACT">تعاقد</option><option value="INTERN">تدريب</option></select></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">نوع الوردية</label><select value={form.shiftType ?? "VARIABLE"} onChange={e => set("shiftType", e.target.value)} className={inputCls}><option value="VARIABLE">متغير</option><option value="FIXED">ثابت</option></select></div>
              {form.shiftType === "FIXED" && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">من الساعة</label><input type="time" value={form.shiftStart ?? ""} onChange={e => set("shiftStart", e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">إلى الساعة</label><input type="time" value={form.shiftEnd ?? ""} onChange={e => set("shiftEnd", e.target.value)} className={inputCls} /></div>
                </div>
              )}
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label><select value={form.status ?? "PROBATION"} onChange={e => set("status", e.target.value)} className={inputCls}><option value="PROBATION">فترة اختبار</option><option value="ACTIVE">نشط</option><option value="ON_LEAVE">في إجازة</option><option value="SUSPENDED">موقوف</option><option value="TERMINATED">منتهي</option></select></div>
              <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">العنوان</label><input value={form.address ?? ""} onChange={e => set("address", e.target.value)} className={inputCls} /></div>
              <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ الموظف"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
