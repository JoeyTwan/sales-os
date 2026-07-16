"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, UserPlus, ListTodo, Archive } from "lucide-react";

interface InboxItem {
  id: string;
  content: string;
  status: "PENDING" | "CONFIRMED" | "ARCHIVED";
  created_at: string;
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await fetch("/api/inbox");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch {}
  };

  const handleArchive = async (id: string) => {
    try {
      await fetch(`/api/inbox/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      loadItems();
    } catch {}
  };

  const getStatusLabel = (status: InboxItem["status"]) => {
    switch (status) {
      case "PENDING":
        return "待处理";
      case "CONFIRMED":
        return "已确认";
      case "ARCHIVED":
        return "已归档";
    }
  };

  const getStatusClass = (status: InboxItem["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-600";
      case "CONFIRMED":
        return "bg-green-500/10 text-green-600";
      case "ARCHIVED":
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingItems = items.filter((item) => item.status === "PENDING");
  const confirmedItems = items.filter((item) => item.status === "CONFIRMED");
  const archivedItems = items.filter((item) => item.status === "ARCHIVED");

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">收件箱</h1>
        <span className="text-sm text-muted-foreground">共 {items.length} 条记录</span>
      </div>

      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">待处理</h2>
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link href={`/inbox/${item.id}`} className="block group">
                      <p className="text-lg leading-relaxed group-hover:text-primary transition-colors">{item.content}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <Link href={`/inbox/${item.id}`} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/inbox/${item.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>转为客户</span>
                  </Link>
                  <Link
                    href={`/inbox/${item.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-500/20 transition-colors"
                  >
                    <ListTodo className="w-3 h-3" />
                    <span>转为任务</span>
                  </Link>
                  <button
                    onClick={() => handleArchive(item.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Archive className="w-3 h-3" />
                    <span>归档</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">已确认</h2>
          <div className="space-y-4">
            {confirmedItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl shadow-sm p-6 opacity-70">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link href={`/inbox/${item.id}`} className="block group">
                      <p className="text-lg leading-relaxed group-hover:text-primary transition-colors">{item.content}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <Link href={`/inbox/${item.id}`} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {archivedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">已归档</h2>
          <div className="space-y-4">
            {archivedItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl shadow-sm p-6 opacity-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link href={`/inbox/${item.id}`} className="block group">
                      <p className="text-lg leading-relaxed group-hover:text-primary transition-colors">{item.content}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">{formatDate(item.created_at)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">暂无收件箱记录</p>
          <p className="text-sm text-muted-foreground mt-2">在工作台输入内容后会进入收件箱</p>
        </div>
      )}
    </div>
  );
}
