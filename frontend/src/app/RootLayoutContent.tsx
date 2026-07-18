"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <ThemeProvider>
      {!isLoginPage && <Sidebar />}
      <main className={isLoginPage ? "min-h-screen" : "ml-[220px] min-h-screen"}>
        <div className="mx-auto px-6 md:px-8 lg:px-12 max-w-[1400px]">{children}</div>
      </main>
    </ThemeProvider>
  );
}