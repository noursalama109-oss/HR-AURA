"use client";

import { LogOut } from "lucide-react";

const roleNames: Record<string, string> = {
  SUPER_ADMIN: "مدير النظام",
  HR_MANAGER: "مدير موارد بشرية",
  BRANCH_MANAGER: "مدير فرع",
  ACCOUNTANT: "محاسب",
  EMPLOYEE: "موظف",
};

export default function Topbar({ userName, role }: { userName: string; role: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="font-bold text-slate-700">مرحباً، {userName} 👋</div>
      <div className="flex items-center gap-3">
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
