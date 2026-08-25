"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, LogOut, QrCode, Fingerprint } from "lucide-react";

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
      { timeout: 6000 }
    );
  });
}

function KioskInner() {
  const params = useSearchParams();
  const secret = params.get("b") ?? "";
  const [branch, setBranch] = useState<any>(null);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (secret) fetch(`/api/kiosk/info?b=${encodeURIComponent(secret)}`).then(r => r.json()).then(d => setBranch(d.branch));
  }, [secret]);

  async function act(type: "checkin" | "checkout") {
    setBusy(true); setError(""); setResult(null);
    const location = await getLocation();
    const res = await fetch(`/api/attendance/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeCode: code, pin, qrSecret: secret, deviceId: getDeviceId(), ...location }),
    });
    const d = await res.json();
    setBusy(false);
    if (res.ok) { setResult({ type, ...d }); setPin(""); }
    else setError(d.error ?? "حدث خطأ");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden slide-up">
          <div className="bg-indigo-600 p-6 text-center text-white">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <QrCode className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold">HR AURA</h1>
            <p className="text-indigo-200 text-sm mt-1">{branch ? branch.name : "كشك الحضور والانصراف"}</p>
          </div>

          <div className="p-6 space-y-4">
            {result ? (
              <div className="text-center py-6 slide-up">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${result.type === "checkin" ? "bg-emerald-100" : "bg-slate-200"}`}>
                  {result.type === "checkin" ? <LogIn className="w-10 h-10 text-emerald-600" /> : <LogOut className="w-10 h-10 text-slate-600" />}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{result.employeeName}</h2>
                <p className="text-slate-500 mt-2 font-bold">
                  {result.type === "checkin"
                    ? (result.status === "LATE" ? `تم تسجيل الحضور — متأخر ${result.lateMinutes} دقيقة` : "تم تسجيل الحضور بنجاح ✅")
                    : `تم تسجيل الانصراف ✅${result.overtimeMin ? ` (إضافي ${result.overtimeMin} دقيقة)` : ""}`}
                </p>
                <p className="text-3xl font-extrabold text-indigo-600 mt-3">
                  {new Date(result.time).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <button onClick={() => setResult(null)} className="mt-5 text-sm font-bold text-indigo-600 hover:underline">تسجيل موظف آخر</button>
              </div>
            ) : (
              <>
                {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 text-sm font-bold slide-up">{error}</div>}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">كود الموظف</label>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="EMP-001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">PIN</label>
                  <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => act("checkin")} disabled={busy}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-extrabold rounded-xl px-4 py-4 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition">
                    <LogIn className="w-5 h-5" /> حضور
                  </button>
                  <button onClick={() => act("checkout")} disabled={busy}
                    className="flex items-center justify-center gap-2 bg-slate-800 text-white font-extrabold rounded-xl px-4 py-4 hover:bg-slate-900 active:scale-95 disabled:opacity-50 transition">
                    <LogOut className="w-5 h-5" /> انصراف
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" /> أول تسجيل يأخذ بصمة الجهاز — أي جهاز آخر سيُرفض تلقائياً
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={null}>
      <KioskInner />
    </Suspense>
  );
}
