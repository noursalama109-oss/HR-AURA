"use client";

import { useEffect, useState } from "react";
import { UserX, CalendarCheck } from "lucide-react";

export default function MissingModal() {
  const [missing, setMissing] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [typeId, setTypeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [m, l] = await Promise.all([
          fetch("/api/attendance/missing").then(r => r.json()),
          fetch("/api/leaves").then(r => r.json()),
        ]);
        setMissing(m.missing ?? []);
        setTypes(l.types ?? []);
        if ((m.missing ?? []).length > 0) setOpen(true);
      } catch {}
    })();
  }, []);

  async function approve(employeeId: string) {
    if (!typeId) { setError("اختر نوع الإجازة أولاً"); return; }
    setBusy(true); setError(""); setMsg("");
    const res = await fetch("/api/leaves/quick", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, leaveTypeId: typeId }),
    });
    const x = await res.json();
    setBusy(false);
    if (res.ok) {
      setMsg("تم تسجيل الإجازة وخصمها من الرصيد ✅");
      setMissing(list => list.filter(e => e.id !== employeeId));
      setPicked(null); setTypeId("");
    } else setError(x.error ?? "حدث خطأ");
  }

  if (!open || missing.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">لم يسجلوا حضور اليوم</h2>
            <p className="text-xs text-slate-500">هل هم في إجازة؟ سجّلها وستُخصم تلقائياً من رصيدهم</p>
          </div>
        </div>

        {(msg || error) && (
          <div className={`mb-3 rounded-lg border px-4 py-2 text-sm font-bold ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            {error || msg}
          </div>
        )}

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {missing.map((e: any) => (
            <div key={e.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-slate-900 text-sm">{e.firstName} {e.lastName} <span className="text-xs text-slate-400">({e.code})</span></div>
                {picked !== e.id && (
                  <div className="flex gap-2">
                    <button onClick={() => { setPicked(e.id); setError(""); }}
                      className="flex items-center gap-1 bg-amber-600 text-white text-xs font-bold rounded-lg px-3 py-1.5 hover:bg-amber-700">
                      <CalendarCheck className="w-3.5 h-3.5" /> في إجازة
                    </button>
                    <button onClick={() => setMissing(l => l.filter(x => x.id !== e.id))}
                      className="text-xs font-bold text-slate-500 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                      تجاهل
                    </button>
                  </div>
                )}
              </div>
              {picked === e.id && (
                <div className="flex gap-2 mt-3">
                  <select value={typeId} onChange={ev => setTypeId(ev.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">
                    <option value="">اختر نوع الإجازة</option>
                    {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}{t.monthly ? " (4 أيام/شهر)" : ""}</option>)}
                  </select>
                  <button onClick={() => approve(e.id)} disabled={busy}
                    className="bg-emerald-600 text-white text-xs font-bold rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-50">
                    تأكيد
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
          لاحقاً
        </button>
      </div>
    </div>
  );
}
