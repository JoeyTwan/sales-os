"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, Users, ListTodo, BookOpen, Settings } from "lucide-react";

const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "工作台" },
  { path: "/inbox", icon: Mail, label: "收件箱" },
  { path: "/customers", icon: Users, label: "客户管理" },
  { path: "/tasks", icon: ListTodo, label: "任务管理" },
  { path: "/knowledge", icon: BookOpen, label: "知识库" },
  { path: "/settings", icon: Settings, label: "系统设置" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-card border-r border-border flex flex-col z-50 shadow-sm">
      <div className="p-5 border-b border-border">
        <div className="text-xl font-semibold text-foreground">Sales OS</div>
        <div className="text-xs text-muted-foreground mt-1">个人销售操作系统</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">v0.4</div>
      </div>
    </aside>
  );
}
