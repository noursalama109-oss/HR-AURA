"use client";

const names: Record<string, string> = {
  employees: "الموظفين", attendance: "الحضور والانصراف", leaves: "الإجازات", contracts: "العقود",
  loans: "السلف", payroll: "المرتبات", requests: "طلبات الموظفين", documents: "المستندات",
  penalties: "الجزاءات والمكافآت", reviews: "تقييمات الموظفين", reports: "التقارير",
  notifications: "الإشعارات", settings: "الإعدادات",
};

export default function Page() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">🚧</span>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{names["reports"]}</h1>
      <p className="text-slate-500">سيتم بناء هذا القسم في المرحلة القادمة</p>
    </div>
  );
}
