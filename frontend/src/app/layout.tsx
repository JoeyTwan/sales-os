import "@/styles/globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Sales OS",
  description: "A modern sales operations platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Sidebar />
        <main className="ml-[220px] min-h-screen">
          <div className="mx-auto px-6 md:px-8 lg:px-12 max-w-[1400px]">{children}</div>
        </main>
      </body>
    </html>
  );
}
