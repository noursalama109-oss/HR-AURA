import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import PageTransition from "@/components/layout/PageTransition";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-slate-100">
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userName={user.name ?? user.email} role={user.role.code} />
        <main className="flex-1 overflow-auto p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <Sidebar />
    </div>
  );
}
