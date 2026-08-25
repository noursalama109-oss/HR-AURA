"use client";

import { useState } from "react";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function CompanyModal({ initial, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(initial ?? { name: "", phone: "", email: "", address: "", logo: "" });
  const [error, setError] = useState("");

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "company", data: form }) });
    const x = await res.json();
    if (res.ok) onSaved();
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">بيانات الشركة</h2>
        {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم الشركة *</label><input required value={form.name ?? ""} onChange={e => set("name", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">الهاتف</label><input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label><input value={form.email ?? ""} onChange={e => set("email", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">العنوان</label><input value={form.address ?? ""} onChange={e => set("address", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رابط اللوجو</label><input value={form.logo ?? ""} onChange={e => set("logo", e.target.value)} className={inputCls} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
