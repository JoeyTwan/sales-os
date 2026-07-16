"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, X, UserPlus, ListTodo, Archive } from "lucide-react";

interface InboxItem {
  id: string;
  content: string;
  status: "PENDING" | "CONFIRMED" | "ARCHIVED";
  created_at: string;
}

type ConvertMode = "customer" | "task" | null;

export default function InboxDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<InboxItem | null>(null);
  const [convertMode, setConvertMode] = useState<ConvertMode>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    company: "",
    position: "",
    phone: "",
    email: "",
    level: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    status: "ACTIVE" as "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST",
    summary: "",
    next_action: "",
    next_action_date: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    due_date: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [params.id]);

  const loadItem = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inbox/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
      }
    } catch {}
    setLoading(false);
  };

  const handleArchive = async () => {
    if (!item) return;
    try {
      await fetch(`/api/inbox/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      router.push("/inbox");
    } catch {}
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;

    try {
      await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerForm.name.trim(),
          company: customerForm.company.trim() || null,
          position: customerForm.position.trim() || null,
          phone: customerForm.phone.trim() || null,
          email: customerForm.email.trim() || null,
          level: customerForm.level,
          status: customerForm.status,
          summary: customerForm.summary.trim() || null,
          next_action: customerForm.next_action.trim() || null,
          next_action_date: customerForm.next_action_date || null,
        }),
      });
      await handleArchive();
    } catch {}
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          priority: taskForm.priority,
          due_date: taskForm.due_date || null,
        }),
      });
      await handleArchive();
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
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-8">
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">收件箱记录不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/inbox")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">收件箱详情</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(item.created_at)}</p>
        </div>
        <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(item.status)}`}>
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-8 mb-6">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{item.content}</p>
      </div>

      {item.status !== "ARCHIVED" && (
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">操作</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setConvertMode("customer")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>转为客户</span>
            </button>
            <button
              onClick={() => setConvertMode("task")}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              <ListTodo className="w-4 h-4" />
              <span>转为任务</span>
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>归档</span>
            </button>
          </div>
        </div>
      )}

      {convertMode === "customer" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">转为客户</h2>
              <button
                onClick={() => setConvertMode(null)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">客户名称</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="输入客户名称..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">公司</label>
                  <input
                    type="text"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="公司名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">职位</label>
                  <input
                    type="text"
                    value={customerForm.position}
                    onChange={(e) => setCustomerForm({ ...customerForm, position: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="职位"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">电话</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="联系电话"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">邮箱</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="邮箱地址"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">等级</label>
                  <select
                    value={customerForm.level}
                    onChange={(e) => setCustomerForm({ ...customerForm, level: e.target.value as "HIGH" | "MEDIUM" | "LOW" })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="HIGH">高</option>
                    <option value="MEDIUM">中</option>
                    <option value="LOW">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">状态</label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as "ACTIVE" | "FOLLOWING" | "PAUSED" | "LOST" })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ACTIVE">跟进中</option>
                    <option value="FOLLOWING">重点推进</option>
                    <option value="PAUSED">已暂停</option>
                    <option value="LOST">已丢失</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">摘要</label>
                <textarea
                  value={customerForm.summary}
                  onChange={(e) => setCustomerForm({ ...customerForm, summary: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="客户摘要信息..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">下一步动作</label>
                  <input
                    type="text"
                    value={customerForm.next_action}
                    onChange={(e) => setCustomerForm({ ...customerForm, next_action: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="下一步动作"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">跟进日期</label>
                  <input
                    type="date"
                    value={customerForm.next_action_date}
                    onChange={(e) => setCustomerForm({ ...customerForm, next_action_date: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setConvertMode(null)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!customerForm.name.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  创建客户
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {convertMode === "task" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">转为任务</h2>
              <button
                onClick={() => setConvertMode(null)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">任务标题</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="输入任务标题..."
                  defaultValue={item.content}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">任务描述</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="输入任务描述..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">优先级</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as "HIGH" | "MEDIUM" | "LOW" })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="HIGH">高</option>
                    <option value="MEDIUM">中</option>
                    <option value="LOW">低</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">截止日期</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setConvertMode(null)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!taskForm.title.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  创建任务
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}