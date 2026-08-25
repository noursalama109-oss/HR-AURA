import Link from "next/link";
import { LayoutDashboard, Users, Clock, CalendarDays, FileText, HandCoins, Wallet, Inbox, FolderOpen, ShieldAlert, Star, BarChart3, Bell, Settings } from "lucide-react";

const items = [
  { href: "/dashboard", label: "لوحة التحكم", Icon: LayoutDashboard },
  { href: "/employees", label: "الموظفين", Icon: Users },
  { href: "/attendance", label: "الحضور والانصراف", Icon: Clock },
  { href: "/leaves", label: "الإجازات", Icon: CalendarDays },
  { href: "/contracts", label: "العقود", Icon: FileText },
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
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-extrabold text-white">HR</div>
        <div>
          <div className="font-extrabold">HR AURA</div>
          <div className="text-[11px] text-slate-400">نظام الموارد البشرية</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
