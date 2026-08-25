"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clock, CalendarDays, FileText, HandCoins, Wallet, Inbox, FolderOpen, ShieldAlert, Star, BarChart3, Bell, Settings, Banknote } from "lucide-react";

const items = [
  { href: "/dashboard", label: "لوحة التحكم", Icon: LayoutDashboard },
  { href: "/employees", label: "الموظفين", Icon: Users },
  { href: "/attendance", label: "الحضور والانصراف", Icon: Clock },
  { href: "/leaves", label: "الإجازات", Icon: CalendarDays },
  { href: "/contracts", label: "العقود", Icon: FileText },
  { href: "/withdrawals", label: "المسحوبات", Icon: Banknote },
  { href: "/loans", label: "السلف", Icon: HandCoins },
  { href: "/payroll", label: "المرتبات", Icon: Wallet },
  { href: "/requests", label: "طلبات الموظفين", Icon: Inbox },
  { href: "/documents", label: "المستندات", Icon: FolderOpen },
  { href: "/penalties", label: "الجزاءات والمكافآت", Icon: ShieldAlert },
  { href: "/reviews", label: "تقييمات الموظفين", Icon: Star },
  { href: "/reports", label: "التقارير", Icon: BarChart3 },
  { href: "/notifications", label: "الإشعارات", Icon: Bell },
  { href: "/settings", label: "الإعدادات", Icon: Settings },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [isTouch] = useState(() => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0));

  return (
    <aside
      {...(isTouch
        ? { onClick: () => setOpen(o => !o) }
        : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) })}
      style={{ width: open ? 256 : 76 }}
      className="sidebar bg-slate-900 text-slate-100 flex flex-col shrink-0 overflow-hidden cursor-pointer"
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-orange-600 flex items-center justify-center font-extrabold text-white">HR</div>
        <div className="lbl whitespace-nowrap" style={{ opacity: open ? 1 : 0 }}>
          <div className="font-extrabold">HR AURA</div>
          <div className="text-[11px] text-slate-400">نظام الموارد البشرية</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                active
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-950/50"
                  : "text-slate-300 hover:bg-orange-600/20 hover:text-orange-400"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="lbl overflow-hidden" style={{ opacity: open ? 1 : 0 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="lbl text-[10px] text-slate-500 whitespace-nowrap" style={{ opacity: open ? 1 : 0 }}>
          HR AURA v1.0 — 2026
        </div>
      </div>
    </aside>
  );
}
