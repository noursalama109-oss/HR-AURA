"use client";

import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function PrintModal({ branch, onClose }: any) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center print-area w-full max-w-sm">
        <h2 className="text-2xl font-extrabold text-slate-900">HR AURA</h2>
        <p className="font-bold text-slate-700 mt-1">{branch.name}</p>
        <div className="flex justify-center my-6">
          <QRCodeSVG value={`${origin}/kiosk?b=${branch.qrSecret}`} size={260} />
        </div>
        <p className="text-sm font-bold text-slate-600">امسح الكود بكاميرا هاتفك لتسجيل الحضور أو الانصراف</p>
        <div className="flex gap-3 justify-center mt-6 no-print">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-indigo-700">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-600">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
