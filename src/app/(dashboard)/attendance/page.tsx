"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, LogIn, LogOut, AlertTriangle } from "lucide-react";

const attLabels: Record<string, { label: string; cls: string }> = {
  PRESENT: { label: "حاضر", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ABSENT: { label: "غائب", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  LATE: { label: "متأخر", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  LEAVE: { label: "إجازة", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  MISSION: { label: "مأمورية", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  PERMISSION: { label: "إذن", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  HOLIDAY: { label: "عطلة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  WEEKEND: { label: "إجازة أسبوعية", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function getDeviceId() {
  let id = localStorage.getItem("hr_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("hr_device_id", id); }
  return id;
}

function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

function t(x: any) { return x ? new Date(x).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—"; }

export default function AttendancePage() {
  const [data, setData] = useState<any>(null);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [qr, setQr] = useState("MAIN-QR-SECRET-001");
  const [msg, setMsg] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/list");
    setData(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function doAction(type: "checkin" | "checkout") {
    setBusy(true); setMsg(null);
    const location = await getLocation();
    const res = await fetch(`/api/attendance/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeCode: code, pin, qrSecret: qr, deviceId: getDeviceId(), ...location }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ ok: true, text: type === "checkin"
        ? (d.status === "LATE" ? `تم تسجيل الحضور — متأخر ${d.lateMinutes} دقيقة` : "تم تسجيل الحضور بنجاح ✅")
        : "تم تسجيل الانصراف بنجاح ✅" });
      setPin("");
      load();
    } else {
      setMsg({ ok: false, text: d.error });
    }
    setBusy(false);
  }

  async function processAbsences() {
    setProcessing(true); setMsg(null);
    const res = await fetch("/api/attendance/process", { method: "POST" });
    const d = await res.json();
    setMsg(d.success ? { ok: true, text: `تمت معالجة الغياب التلقائي — ${d.marked} موظف` } : { ok: false, text: d.error });
    setProcessing(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">الحضور والانصراف</h1>
          <p className="text-slate-500 mt-1">{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button onClick={processAbsences} disabled={processing}
          className="flex items-center gap-2 bg-rose-600 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-rose-700 disabled:opacity-50 transition">
          <AlertTriangle className="w-5 h-5" />
          {processing ? "جاري المعالجة..." : "معالجة الغياب التلقائي"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" /> كشك تسجيل الحضور (QR + PIN + موقع + جهاز موثوق)
        </h3>
        {msg && (
          <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm font-bold ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {msg.text}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">كود الموظف</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="EMP-001" className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">PIN</label><input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="1234" className={inputCls} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رمز QR الفرع</label><input value={qr} onChange={e => setQr(e.target.value)} className={inputCls} /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => doAction("checkin")} disabled={busy} className="flex items-center gap-2 bg-emerald-600 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-emerald-700 disabled:opacity-50 transition">
            <LogIn className="w-5 h-5" /> تسجيل حضور
          </button>
          <button onClick={() => doAction("checkout")} disabled={busy} className="flex items-center gap-2 bg-slate-700 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-slate-800 disabled:opacity-50 transition">
            <LogOut className="w-5 h-5" /> تسجيل انصراف
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3">للاختبار: كود الموظف اللي عملته + PIN الافتراضي 1234</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 font-extrabold text-slate-900">سجل اليوم</div>
        {!data ? (
          <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div>
        ) : data.records.length === 0 && data.unrecorded.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">لا يوجد موظفون</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["الموظف", "الحضور", "الانصراف", "تأخير (د)", "إضافي (د)", "الحالة"].map(h => <th key={h} className="text-right px-4 py-3 font-bold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.employee.firstName} {r.employee.lastName}</td>
                    <td className="px-4 py-3">{t(r.checkIn)}</td>
                    <td className="px-4 py-3">{t(r.checkOut)}</td>
                    <td className="px-4 py-3">{r.lateMinutes}</td>
                    <td className="px-4 py-3">{r.overtimeMin}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold border rounded-full px-2.5 py-1 ${attLabels[r.status]?.cls}`}>{attLabels[r.status]?.label}</span></td>
                  </tr>
                ))}
                {data.unrecorded.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50 opacity-60">
                    <td className="px-4 py-3 font-bold text-slate-500">{e.firstName} {e.lastName}</td>
                    <td className="px-4 py-3" colSpan={4}>لم يسجل بعد</td>
                    <td className="px-4 py-3"><span className="text-xs font-bold border rounded-full px-2.5 py-1 bg-slate-100 text-slate-500 border-slate-200">بدون تسجيل</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
