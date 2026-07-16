"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X, CheckCircle, UserPlus, ListTodo, Edit3, Trash2 } from "lucide-react";

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

interface CustomerSuggestion {
  name: string;
  company?: string;
  level: string;
  status: string;
  summary?: string;
  next_action?: string;
  next_action_date?: string;
}

interface TaskSuggestion {
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
}

interface SuggestionJSON {
  customer_suggestions: CustomerSuggestion[];
  task_suggestions: TaskSuggestion[];
}

interface AnalyzeResult {
  suggestion_id: string;
  suggestions: SuggestionJSON;
}

export default function DashboardPage() {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    loadActivities();
    loadTasks();
    loadCustomers();
  }, []);

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
      const response = await fetch("/api/suggestions/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyzeResult(data);
        setCustomerSuggestions(data.suggestions.customer_suggestions || []);
        setTaskSuggestions(data.suggestions.task_suggestions || []);
        setContent("");
        setShowModal(true);
        textareaRef.current?.focus();
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    if (!analyzeResult) return;
    setConfirming(true);
    try {
      await fetch(`/api/suggestions/${analyzeResult.suggestion_id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_suggestions: customerSuggestions,
          task_suggestions: taskSuggestions,
        }),
      });
      setShowModal(false);
      setAnalyzeResult(null);
      loadActivities();
      loadTasks();
      loadCustomers();
    } catch {}
    setConfirming(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setAnalyzeResult(null);
    setCustomerSuggestions([]);
    setTaskSuggestions([]);
    setEditingCustomer(null);
    setEditingTask(null);
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

  const getLevelClass = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/10 text-red-600";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700";
      case "LOW":
        return "bg-gray-500/10 text-gray-600";
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

今天拜访了天昕电子，预算30万，下周二发方案"
            className="w-full bg-transparent border-none outline-none resize-none text-lg leading-relaxed placeholder:text-muted-foreground/40 h-[180px]"
          />
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">按 Enter 分析</span>
            <button
              type="submit"
              disabled={!content.trim() || sending}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "分析中..." : "分析"}
            </button>
          </div>
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

      {showModal && analyzeResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">AI分析结果</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-muted/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">原始输入</p>
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>

              {customerSuggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-500" />
                    <span>客户建议</span>
                    <span className="text-xs text-muted-foreground ml-2">{customerSuggestions.length} 个</span>
                  </h3>
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
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
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
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-amber-500" />
                    <span>任务建议</span>
                    <span className="text-xs text-muted-foreground ml-2">{taskSuggestions.length} 个</span>
                  </h3>
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
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getLevelClass(task.priority)}`}>
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

              {(customerSuggestions.length === 0 && taskSuggestions.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">未识别到可创建的客户或任务</p>
                  <p className="text-sm text-muted-foreground mt-2">请尝试输入包含客户名称、公司、预算、日期等关键词的内容</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500/10 text-gray-600 rounded-lg hover:bg-gray-500/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || (customerSuggestions.length === 0 && taskSuggestions.length === 0)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{confirming ? "确认中..." : "确认创建"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}