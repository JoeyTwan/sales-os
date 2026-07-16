"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, X, UserPlus, ListTodo, CheckCircle, Edit3, Trash2 } from "lucide-react";

interface CustomerSuggestion {
  id?: string;
  name: string;
  company?: string;
  level: string;
  status: string;
  summary?: string;
  next_action?: string;
  next_action_date?: string;
}

interface TaskSuggestion {
  id?: string;
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
}

interface SuggestionJSON {
  customer_suggestions: CustomerSuggestion[];
  task_suggestions: TaskSuggestion[];
}

interface Suggestion {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  raw_content: string;
  suggestion_json: SuggestionJSON;
  created_at: string;
}

export default function SuggestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadSuggestion();
  }, [params.id]);

  const loadSuggestion = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/suggestions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestion(data);
        setCustomerSuggestions(data.suggestion_json?.customer_suggestions || []);
        setTaskSuggestions(data.suggestion_json?.task_suggestions || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!suggestion) return;
    setConfirming(true);
    try {
      await fetch(`/api/suggestions/${suggestion.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      router.push("/suggestions");
    } catch {}
    setConfirming(false);
  };

  const handleCancel = async () => {
    if (!suggestion) return;
    try {
      await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      router.push("/suggestions");
    } catch {}
  };

  const handleEditCustomer = (index: number) => {
    setEditingCustomer(index.toString());
  };

  const handleSaveCustomer = (index: number) => {
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (index: number) => {
    setCustomerSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditTask = (index: number) => {
    setEditingTask(index.toString());
  };

  const handleSaveTask = (index: number) => {
    setEditingTask(null);
  };

  const handleDeleteTask = (index: number) => {
    setTaskSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusLabel = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return "待确认";
      case "CONFIRMED":
        return "已确认";
      case "CANCELLED":
        return "已取消";
    }
  };

  const getStatusClass = (status: Suggestion["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-600";
      case "CONFIRMED":
        return "bg-green-500/10 text-green-600";
      case "CANCELLED":
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "HIGH":
        return "高";
      case "MEDIUM":
        return "中";
      case "LOW":
        return "低";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
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

  if (!suggestion) {
    return (
      <div className="py-8">
        <div className="bg-card rounded-xl shadow-sm p-12 text-center">
          <p className="text-muted-foreground">建议不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/suggestions")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">AI建议详情</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(suggestion.created_at).toLocaleString("zh-CN")}
          </p>
        </div>
        <span className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(suggestion.status)}`}>
          {getStatusLabel(suggestion.status)}
        </span>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-8 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">原始输入</h2>
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{suggestion.raw_content}</p>
      </div>

      {customerSuggestions.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <span>客户建议</span>
            <span className="text-xs text-muted-foreground ml-2">{customerSuggestions.length} 个</span>
          </h2>
          <div className="space-y-4">
            {customerSuggestions.map((customer, index) => (
              <div
                key={index}
                className="p-4 bg-muted/30 rounded-lg"
              >
                {editingCustomer === index.toString() ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => {
                        setCustomerSuggestions((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c))
                        );
                      }}
                      className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="text"
                      value={customer.company || ""}
                      onChange={(e) => {
                        setCustomerSuggestions((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, company: e.target.value || undefined } : c))
                        );
                      }}
                      placeholder="公司"
                      className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveCustomer(index)}
                        className="px-3 py-1 text-xs bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingCustomer(null)}
                        className="px-3 py-1 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.company && (
                        <p className="text-sm text-muted-foreground">{customer.company}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityClass(customer.level)}`}>
                          {getLevelLabel(customer.level)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {customer.status === "ACTIVE" ? "跟进中" : customer.status === "FOLLOWING" ? "重点推进" : "已暂停"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCustomer(index)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(index)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {taskSuggestions.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-amber-500" />
            <span>任务建议</span>
            <span className="text-xs text-muted-foreground ml-2">{taskSuggestions.length} 个</span>
          </h2>
          <div className="space-y-4">
            {taskSuggestions.map((task, index) => (
              <div
                key={index}
                className="p-4 bg-muted/30 rounded-lg"
              >
                {editingTask === index.toString() ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => {
                        setTaskSuggestions((prev) =>
                          prev.map((t, i) => (i === index ? { ...t, title: e.target.value } : t))
                        );
                      }}
                      className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <textarea
                      value={task.description || ""}
                      onChange={(e) => {
                        setTaskSuggestions((prev) =>
                          prev.map((t, i) => (i === index ? { ...t, description: e.target.value || undefined } : t))
                        );
                      }}
                      placeholder="任务描述"
                      className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      rows={2}
                    />
                    <div className="flex gap-3">
                      <select
                        value={task.priority}
                        onChange={(e) => {
                          setTaskSuggestions((prev) =>
                            prev.map((t, i) => (i === index ? { ...t, priority: e.target.value } : t))
                          );
                        }}
                        className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="HIGH">高优先级</option>
                        <option value="MEDIUM">中优先级</option>
                        <option value="LOW">低优先级</option>
                      </select>
                      <input
                        type="date"
                        value={task.due_date || ""}
                        onChange={(e) => {
                          setTaskSuggestions((prev) =>
                            prev.map((t, i) => (i === index ? { ...t, due_date: e.target.value || undefined } : t))
                          );
                        }}
                        className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveTask(index)}
                        className="px-3 py-1 text-xs bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingTask(null)}
                        className="px-3 py-1 text-xs text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.due_date && (
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(task.due_date)}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityClass(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <span className="text-xs text-muted-foreground">待办</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTask(index)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(index)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestion.status === "PENDING" && (
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">操作</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleConfirm}
              disabled={confirming || (customerSuggestions.length === 0 && taskSuggestions.length === 0)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{confirming ? "确认中..." : "确认创建"}</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 text-gray-600 rounded-lg hover:bg-gray-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>取消</span>
            </button>
          </div>
        </div>
      )}

      {suggestion.status === "CONFIRMED" && (
        <div className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">已确认创建，客户和任务已添加到系统</span>
          </div>
        </div>
      )}
    </div>
  );
}