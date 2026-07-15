"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Activity {
  id: string;
  content: string;
  activity_date: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "DOING" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  due_date: string;
}

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

export default function DashboardPage() {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    loadActivities();
    loadTasks();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadActivities = async () => {
    try {
      const response = await fetch("/api/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.slice(0, 10));
      }
    } catch {}
  };

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        const today = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);
        const upcomingTasks = data.filter((task: Task) => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate >= today && dueDate <= sevenDaysLater;
        });
        upcomingTasks.sort((a: Task, b: Task) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
        setTasks(upcomingTasks);
      }
    } catch {}
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        const activeCustomers = data.filter((c: Customer) => c.status !== "LOST");
        activeCustomers.sort((a: Customer, b: Customer) => {
          const dateA = a.next_action_date ? new Date(a.next_action_date).getTime() : Infinity;
          const dateB = b.next_action_date ? new Date(b.next_action_date).getTime() : Infinity;
          return dateA - dateB;
        });
        setCustomers(activeCustomers.slice(0, 5));
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        setContent("");
        setSuccess(true);
        textareaRef.current?.focus();
        loadActivities();
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasks();
    } catch {}
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "今天";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "明天";
    }
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const truncateContent = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "TODO":
        return "待办";
      case "DOING":
        return "进行中";
      case "DONE":
        return "已完成";
    }
  };

  const getStatusClass = (status: Task["status"]) => {
    switch (status) {
      case "TODO":
        return "bg-muted text-muted-foreground";
      case "DOING":
        return "bg-blue-500/10 text-blue-600";
      case "DONE":
        return "bg-green-500/10 text-green-600";
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

  const getStatusLabelCustomer = (status: Customer["status"]) => {
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

  return (
    <div className="py-8">
      <div className="mb-12">
        <h1 className="text-lg font-semibold text-muted-foreground mb-4">今天有什么需要记录？</h1>
        <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="例如：

周四晚上8点提交产品文案
下周二联系张总确认预算
记录航天客户测试进展"
            className="w-full bg-transparent border-none outline-none resize-none text-lg leading-relaxed placeholder:text-muted-foreground/40 h-[180px]"
          />
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">按 Enter 保存</span>
            <button
              type="submit"
              disabled={!content.trim() || sending}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "保存中..." : "保存"}
            </button>
          </div>
          {success && (
            <p className="text-sm text-green-600 mt-3">已保存</p>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span>🔥</span>
            <span>今日待办</span>
          </h2>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const nextStatus: Task["status"] = task.status === "TODO" ? "DOING" : task.status === "DOING" ? "DONE" : "TODO";
                    handleTaskStatusChange(task.id, nextStatus);
                  }}
                >
                  <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(task.due_date)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无待办任务</p>
          )}
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span>👥</span>
            <span>重点客户</span>
          </h2>
          {customers.length > 0 ? (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                      {getLevelLabel(customer.level)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{getStatusLabelCustomer(customer.status)}</p>
                    </div>
                  </div>
                  {customer.next_action_date && (
                    <p className="text-xs text-muted-foreground mt-2">下次跟进：{formatDate(customer.next_action_date)}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无重点客户</p>
          )}
        </div>
      </div>

      {activities.length > 0 && (
        <div className="mt-8 bg-card rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span>📝</span>
            <span>最近记录</span>
          </h2>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                  {formatDate(activity.activity_date)}
                </span>
                <p className="text-sm text-foreground/80 flex-1">
                  {truncateContent(activity.content)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
