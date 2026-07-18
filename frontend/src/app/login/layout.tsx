import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales OS - Login",
  description: "Login to Sales OS",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
