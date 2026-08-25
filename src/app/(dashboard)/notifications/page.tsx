"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CalendarDays, FileText, HandCoins, Inbox } from "lucide-react";

const typeIcon: Record<string, any> = {
  absence: CalendarDays, leave: CalendarDays, contract_expiry: FileText, doc_expiry: FileText, loan: HandCoins, request: Inbox,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function markAll() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    load();
  }

  async function open(n: any) {
    if (!n.isRead) {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) });
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">الإشعارات</h1>
          <p className="text-slate-500 mt-1">تنبيهات الغياب والإجازات والعقود والمستندات والطلبات</p>
        </div>
        <button onClick={markAll} className="flex items-center gap-2 bg-slate-700 text-white font-bold rounded-lg px-4 py-2.5 hover:bg-slate-800 transition">
          <CheckCheck className="w-5 h-5" /> تحديد الكل كمقروء
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500 font-bold">جاري التحميل...</div> : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">لا توجد إشعارات</h3>
            <p className="text-slate-500 text-sm">ستصلك التنبيهات هنا تلقائياً</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => {
              const Icon = typeIcon[n.type] ?? Bell;
              return (
                <button key={n.id} onClick={() => open(n)} className={`w-full text-right px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition ${!n.isRead ? "bg-indigo-50/50" : ""}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.isRead ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${!n.isRead ? "text-slate-900" : "text-slate-600"}`}>{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("ar-EG")}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
