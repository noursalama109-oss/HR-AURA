"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Bell } from "lucide-react";

const roleNames: Record<string, string> = {
  SUPER_ADMIN: "مدير النظام",
  HR_MANAGER: "مدير موارد بشرية",
  BRANCH_MANAGER: "مدير فرع",
  ACCOUNTANT: "محاسب",
  EMPLOYEE: "موظف",
};

export default function Topbar({ userName, role }: { userName: string; role: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const r = await fetch("/api/notifications?count=1");
        const d = await r.json();
        setUnread(d.unread ?? 0);
      } catch {}
    }
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="font-bold text-slate-700">مرحباً، {userName} 👋</div>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg p-2 transition">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 font-bold">
          {roleNames[role] ?? role}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition"
        >
          <LogOut className="w-4 h-4" />
          خروج
        </button>
      </div>
    </header>
  );
}
