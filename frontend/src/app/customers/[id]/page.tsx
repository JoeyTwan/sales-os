"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  level: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST";
  summary: string;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  content: string;
  activity_date: string;
  created_at: string;
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadCustomer();
    loadActivities();
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch {}
  };

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activities/customer/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch {}
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/activities/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer_id: params.id, content: noteContent.trim() }),
      });

      if (response.ok) {
        setNoteContent("");
        textareaRef.current?.focus();
        loadActivities();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const getLevelClass = (level: Customer["level"]) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getLevelLabel = (level: Customer["level"]) => {
    switch (level) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
    }
  };

  const getStatusLabel = (status: Customer["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "跟进中";
      case "FOLLOWING":
        return "重点推进";
      case "PAUSED":
        return "已暂停";
      case "LOST":
        return "已丢失";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (!customer) {
    return (
      <div className="py-8">
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/customers"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 返回
        </Link>
        <h1 className="text-3xl font-semibold">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">客户概览</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">等级</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                    {getLevelLabel(customer.level)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">状态</span>
                  <span className="text-sm">{getStatusLabel(customer.status)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">基础信息</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">创建时间</span>
                  <span>{formatDate(customer.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">更新时间</span>
                  <span>{formatDate(customer.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {customer.summary && (
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">客户总结</h2>
              <p className="text-sm leading-relaxed">{customer.summary}</p>
            </div>
          )}

          <div className="bg-card rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">下一步动作</h2>
            <div className="space-y-4">
              {customer.next_action ? (
                <p className="text-lg">{customer.next_action}</p>
              ) : (
                <p className="text-sm text-muted-foreground">暂无下一步动作</p>
              )}
              {customer.next_action_date && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">下次跟进</span>
                  <span className="text-sm font-medium">{formatDate(customer.next_action_date)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">跟进记录</h2>
            {activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</span>
                        <p className="text-sm text-foreground/80 mt-1">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">暂无跟进记录</p>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">添加记录</h2>
            <form onSubmit={handleAddNote}>
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="输入跟进记录..."
                className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3}
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={!noteContent.trim() || sending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
