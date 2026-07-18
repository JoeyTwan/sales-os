import "@/styles/globals.css";
import type { Metadata } from "next";
import RootLayoutContent from "./RootLayoutContent";

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
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
