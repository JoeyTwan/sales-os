"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X, CheckCircle, User, Folder, ListTodo, Calendar, FileText } from "lucide-react";

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
}

interface ProjectSuggestion {
  name: string;
  description?: string;
  budget?: number;
  status: string;
}

interface TaskSuggestion {
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
}

interface MatchedCustomer {
  id: string;
  name: string;
  confidence: number;
}

interface AnalyzeResult {
  suggestion_id: string;
  raw_content: string;
  matched_customer: MatchedCustomer | null;
  customers: CustomerSuggestion[];
  contacts: any[];
  projects: ProjectSuggestion[];
  tasks: TaskSuggestion[];
}

export default function DashboardPage() {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
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
        setContent("");
        setShowModal(true);
        textareaRef.current?.focus();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    if (!analyzeResult) return;
    setConfirming(true);
    try {
      const payload: any = {};
      if (analyzeResult.customers.length > 0) {
        payload.customer = analyzeResult.customers[0];
      }
      if (analyzeResult.projects.length > 0) {
        payload.project = analyzeResult.projects[0];
      }
      if (analyzeResult.tasks.length > 0) {
        payload.tasks = analyzeResult.tasks;
      }

      await fetch(`/api/suggestions/${analyzeResult.suggestion_id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
    setExpandedContent(false);
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

  const formatBudget = (budget: number | undefined) => {
    if (!budget) return "";
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万`;
    }
    return `${budget}元`;
  };

  const hasData = () => {
    return analyzeResult && (
      analyzeResult.customers.length > 0 ||
      analyzeResult.projects.length > 0 ||
      analyzeResult.tasks.length > 0
    );
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">AI已识别以下内容</h2>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {analyzeResult.matched_customer && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/5 rounded-lg px-3 py-2 mb-5">
                  <CheckCircle className="w-4 h-4" />
                  <span>已匹配客户: {analyzeResult.matched_customer.name}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-5">
                  {analyzeResult.customers.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                        <User className="w-4 h-4" />
                        <span>客户</span>
                      </div>
                      <div className="space-y-2">
                        {analyzeResult.customers.map((customer, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{customer.name}</p>
                              {customer.company && (
                                <p className="text-sm text-muted-foreground">{customer.company}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelClass(customer.level)}`}>
                              {getLevelLabel(customer.level)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  {analyzeResult.projects.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                        <Folder className="w-4 h-4" />
                        <span>项目</span>
                      </div>
                      <div className="space-y-2">
                        {analyzeResult.projects.map((project, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                              )}
                            </div>
                            {project.budget && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600">
                                {formatBudget(project.budget)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analyzeResult.tasks.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                        <ListTodo className="w-4 h-4" />
                        <span>任务</span>
                      </div>
                      <div className="space-y-2">
                        {analyzeResult.tasks.map((task, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{task.title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.due_date && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelClass(task.priority)}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 mt-5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                  <FileText className="w-4 h-4" />
                  <span>活动记录</span>
                </div>
                {analyzeResult.raw_content.length > 200 ? (
                  <div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {expandedContent ? analyzeResult.raw_content : analyzeResult.raw_content.substring(0, 200) + "..."}
                    </p>
                    <button
                      onClick={() => setExpandedContent(!expandedContent)}
                      className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      {expandedContent ? "收起" : "展开"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {analyzeResult.raw_content}
                  </p>
                )}
              </div>

              {!hasData() && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">未识别到可创建的内容</p>
                  <p className="text-sm text-muted-foreground mt-2">请尝试输入包含客户名称、公司、预算、日期等关键词的内容</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border/50 bg-muted/20 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || !hasData()}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{confirming ? "写入中..." : "确认写入CRM"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}