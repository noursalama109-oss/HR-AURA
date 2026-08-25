import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "HR AURA",
  description: "نظام إدارة شئون العاملين والموارد البشرية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>{children}</body>
    </html>
  );
}
