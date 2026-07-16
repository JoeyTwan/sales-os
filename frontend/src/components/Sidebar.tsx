"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ListTodo, BookOpen, Settings, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "工作台" },
  { path: "/customers", icon: Users, label: "客户管理" },
  { path: "/tasks", icon: ListTodo, label: "任务管理" },
  { path: "/knowledge", icon: BookOpen, label: "知识库" },
  { path: "/settings", icon: Settings, label: "系统设置" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "system":
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "浅色";
      case "dark":
        return "深色";
      case "system":
        return "跟随系统";
    }
  };

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
              <span className="flex-1 text-left">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          {getThemeIcon()}
          <span>{getThemeLabel()}</span>
        </button>
        <div className="text-xs text-muted-foreground">v0.6</div>
      </div>
    </aside>
  );
}
