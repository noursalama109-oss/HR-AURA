"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import MapPicker from "./MapPicker";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function BranchModal({ initial, isNew, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(initial ?? { name: "", code: "", address: "", latitude: "30.0444", longitude: "31.2357", geofenceRadius: "100", isActive: "true", qrSecret: "" });
  const [error, setError] = useState("");

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/org", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "branch", id: isNew ? null : form.id, data: form }) });
    const x = await res.json();
    if (res.ok) onSaved();
    else setError(x.error ?? "حدث خطأ");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">{isNew ? "إضافة فرع جديد" : "تعديل الفرع"}</h2>
        {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-bold">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم الفرع *</label><input required value={form.name ?? ""} onChange={e => set("name", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">كود الفرع *</label><input required value={form.code ?? ""} onChange={e => set("code", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">العنوان</label><input value={form.address ?? ""} onChange={e => set("address", e.target.value)} className={inputCls} /></div>
          <MapPicker lat={Number(form.latitude)} lng={Number(form.longitude)}
            onChange={(la: number, ln: number) => setForm((f: any) => ({ ...f, latitude: String(la), longitude: String(ln) }))} />
          <div><label className="block text-sm font-bold text-slate-700 mb-1">نطاق GPS (متر)</label><input type="number" min="10" value={form.geofenceRadius ?? ""} onChange={e => set("geofenceRadius", e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رمز QR السري</label>
            <div className="flex gap-2">
              <input value={form.qrSecret ?? ""} onChange={e => set("qrSecret", e.target.value)} className={inputCls} />
              <button type="button" onClick={() => set("qrSecret", `QR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`)}
                className="flex items-center gap-1 bg-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2 hover:bg-slate-800 shrink-0">
                <RefreshCw className="w-3.5 h-3.5" /> توليد
              </button>
            </div>
          </div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label>
            <select value={form.isActive ?? "true"} onChange={e => set("isActive", e.target.value)} className={inputCls}>
              <option value="true">نشط</option>
              <option value="false">متوقف</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-600">إلغاء</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
